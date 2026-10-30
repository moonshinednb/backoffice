"""Events, artists, advancing, files and the venue mail on Django models.

The rules (validation, completeness, PDFs, mail HTML) live in rules.py and
work on plain dicts; this module loads and saves them."""
import hashlib
import os
import re
import time
from pathlib import Path
from django.db import IntegrityError, models, transaction
from django.db.models import Q
from django.utils import timezone
from core.services import DATA, audit, safe_error, settings
from . import rules as R
from .models import Act, Artist, Asset, Booking, ChecklistItem, Event, EventNote, Release, ReleaseStep, Send

ASSETS = DATA / 'assets'
ASSETS.mkdir(parents=True, exist_ok=True)


def ts(value):
    return value.timestamp() if value else 0


# --- Dicts -----------------------------------------------------------------

def event_dict(e):
    return {'id': e.id, 'name': e.name, 'date': e.date, 'venue': e.venue, 'doors': e.doors, 'capacity': e.capacity,
            'status': e.status, 'venue_contact': e.venue_contact, 'venue_email': e.venue_email, 'venue_phone': e.venue_phone,
            'created': ts(e.created), 'updated': ts(e.updated)}


ARTIST_KEYS = tuple(R.ARTIST_FIELDS)


def artist_dict(a):
    return {'id': a.id, **{k: getattr(a, k) for k in ARTIST_KEYS}, 'contact_via': R.contact_via({k: getattr(a, k) for k in ARTIST_KEYS}),
            'on_label': a.on_label, 'created': ts(a.created), 'updated': ts(a.updated)}


def booking_dict(b):
    return {'id': b.id, 'event_id': b.event_id, 'artist_id': b.artist_id, 'status': b.status, 'fee': b.fee,
            'flight': b.flight, 'grounds': b.grounds, 'hotel': b.hotel, 'notes': b.notes, 'sort': b.sort,
            'showday_contact': b.showday_contact, 'showday_phone': b.showday_phone,
            'flight_info': R._structured_defaults(R.FLIGHT_FIELDS, b.flight_info or {}),
            'hotel_info': R._structured_defaults(R.HOTEL_FIELDS, b.hotel_info or {}),
            'ground_info': R._structured_defaults(R.GROUND_FIELDS, b.ground_info or {})}


def act_dict(a):
    return {'id': a.id, 'name': a.name, 'start': a.start, 'end': a.end, 'stage': a.stage, 'note': a.note,
            'artist_ids': [x for x in (a.artist_ids or []) if isinstance(x, str)], 'sort': a.sort}


def asset_dict(a):
    return {'id': a.id, 'owner_type': a.owner_type, 'owner_id': a.owner_id, 'kind': a.kind, 'name': a.name, 'mime': a.mime,
            'size': a.size, 'sha': a.sha, 'url': a.url, 'has_file': a.has_file, 'onedrive_id': a.onedrive_id,
            'onedrive_url': a.onedrive_url, 'sync_status': a.sync_status, 'error': a.error, 'created': ts(a.created)}


def check_dict(c):
    return {'id': c.id, 'key': c.key, 'label': c.label, 'status': c.status, 'sent_at': c.sent_at, 'sent_to': c.sent_to, 'notes': c.notes, 'sort': c.sort}


def send_dict(s):
    return {'id': s.id, 'recipients': s.recipients, 'subject': s.subject, 'items': s.items, 'attachments': s.attachments,
            'status': s.status, 'error': s.error, 'actor': s.actor, 'created': ts(s.created)}


def sorted_acts(event_id):
    acts = [act_dict(a) for a in Act.objects.filter(event_id=event_id)]
    acts.sort(key=lambda a: (R._minutes(a['start']), a['sort']))
    return acts


def asset_index(artist_ids=(), booking_ids=(), event_id=None):
    query = Q(owner_type='artist', owner_id__in=list(artist_ids)) | Q(owner_type='booking', owner_id__in=list(booking_ids))
    if event_id:
        query |= Q(owner_type='event', owner_id=event_id)
    index = {}
    for a in Asset.objects.filter(query).order_by('-created'):
        index.setdefault((a.owner_type, a.owner_id), []).append(asset_dict(a))
    return index


def summary(artist):
    keys = ('id', 'name', 'full_name', 'email', 'phone', 'agency', 'agent', 'agent_email', 'agent_phone', 'instagram')
    return {k: artist.get(k, '') for k in keys}


# --- Events ----------------------------------------------------------------

def event_create(payload, actor):
    name = R._text(payload.get('name'), 300)
    if not name:
        raise ValueError('Geef het evenement een naam.')
    e = Event.objects.create(name=name, date=R._date(payload.get('date'), 'Datum'), venue=R._text(payload.get('venue'), 300),
                             doors=R._time(payload.get('doors'), 'Deuren'), capacity=max(0, int(payload.get('capacity') or 0)),
                             status=payload.get('status') if payload.get('status') in dict(Event.STATUSES) else 'planning')
    seed_checklist(e.id)
    audit(actor, 'Evenement aangemaakt', e.id, name)
    return e


def event_update(event_id, payload, actor):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Onbekend evenement.')
    if 'name' in payload:
        e.name = R._text(payload['name'], 300)
        if not e.name:
            raise ValueError('Geef het evenement een naam.')
    if 'date' in payload:
        e.date = R._date(payload['date'], 'Datum')
    if 'doors' in payload:
        e.doors = R._time(payload['doors'], 'Deuren')
    for key in ('venue', 'venue_contact', 'venue_phone'):
        if key in payload:
            setattr(e, key, R._text(payload[key], 300))
    if 'venue_email' in payload:
        e.venue_email = ', '.join(R._recipients(payload['venue_email']))
    if 'capacity' in payload:
        try:
            e.capacity = max(0, int(payload['capacity'] or 0))
        except (TypeError, ValueError):
            raise ValueError('Capaciteit moet een getal zijn.') from None
    if 'status' in payload:
        if payload['status'] not in dict(Event.STATUSES):
            raise ValueError('Ongeldige status.')
        e.status = payload['status']
    e.save()
    audit(actor, 'Evenement bijgewerkt', event_id)
    return e


def event_remove(event_id, actor):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Onbekend evenement.')
    booking_ids = list(Booking.objects.filter(event_id=event_id).values_list('id', flat=True))
    files = list(Asset.objects.filter(Q(owner_type='booking', owner_id__in=booking_ids) | Q(owner_type='event', owner_id=event_id)).values_list('id', flat=True))
    with transaction.atomic():
        Asset.objects.filter(id__in=files).delete()
        e.delete()
    for ident in files:
        (ASSETS / ident).unlink(missing_ok=True)
    audit(actor, 'Evenement verwijderd', event_id, e.name)


def event_progress(event_ids=None):
    bookings = Booking.objects.exclude(status='cancelled').select_related('artist')
    if event_ids is not None:
        bookings = bookings.filter(event_id__in=list(event_ids))
    bookings = list(bookings)
    artists = {b.artist_id: artist_dict(b.artist) for b in bookings}
    acts = {}
    for a in Act.objects.filter(event_id__in={b.event_id for b in bookings}):
        acts.setdefault(a.event_id, []).append(act_dict(a))
    assets = asset_index(artists)
    progress = {}
    for b in bookings:
        entry = progress.setdefault(b.event_id, {'artists': 0, 'complete': 0})
        entry['artists'] += 1
        if not R.missing_items(booking_dict(b), artists[b.artist_id], acts.get(b.event_id, []), assets):
            entry['complete'] += 1
    checks = ChecklistItem.objects.all() if event_ids is None else ChecklistItem.objects.filter(event_id__in=list(event_ids))
    for c in checks:
        entry = progress.setdefault(c.event_id, {'artists': 0, 'complete': 0})
        entry.setdefault('checklist', 0)
        entry.setdefault('checklist_done', 0)
        if c.status != 'na':
            entry['checklist'] += 1
        if c.status in ('done', 'sent'):
            entry['checklist_done'] += 1
    return progress


def event_listing(only=None):
    events = list(Event.objects.all())
    if only:
        events = [e for e in events if only(e)]
    progress = event_progress([e.id for e in events] if only else None)
    counts = {}
    for b in Booking.objects.exclude(status='cancelled').values_list('event_id', flat=True):
        counts[b] = counts.get(b, 0) + 1
    return [{**event_dict(e), 'booking_count': counts.get(e.id, 0), 'progress': progress.get(e.id, {'artists': 0, 'complete': 0})} for e in events]


def seed_checklist(event_id):
    with transaction.atomic():
        if not Event.objects.filter(id=event_id, checklist_seeded=False).update(checklist_seeded=True):
            return
        ChecklistItem.objects.bulk_create([ChecklistItem(event_id=event_id, key=k, label=l, sort=i) for i, (k, l) in enumerate(R.CHECKLIST)])


def advancing(event_id):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Onbekend evenement.')
    if not e.checklist_seeded:
        seed_checklist(event_id)
    bookings = list(Booking.objects.filter(event_id=event_id).select_related('artist'))
    artists = {b.artist_id: artist_dict(b.artist) for b in bookings}
    acts = sorted_acts(event_id)
    assets = asset_index(artists, [b.id for b in bookings], event_id)
    rows = []
    for b in bookings:
        bd = booking_dict(b)
        missing = [] if b.status == 'cancelled' else R.missing_items(bd, artists[b.artist_id], acts, assets)
        rows.append({**bd, 'artist': summary(artists[b.artist_id]), 'missing': missing, 'complete': not missing,
                     'acts': [a['id'] for a in acts if b.artist_id in a['artist_ids']]})
    names = {b.artist_id: artists[b.artist_id]['name'] for b in bookings if b.status != 'cancelled'}
    for act in acts:
        act['artists'] = [names[a] for a in act['artist_ids'] if a in names]
    checklist = [check_dict(c) for c in ChecklistItem.objects.filter(event_id=event_id)]
    active = [r for r in rows if r['status'] != 'cancelled']
    return {
        'event': event_dict(e), 'bookings': rows, 'acts': acts, 'checklist': checklist,
        'sends': [send_dict(s) for s in Send.objects.filter(event_id=event_id)[:50]],
        'assets': assets.get(('event', event_id), []),
        'summary': {'artists': len(active), 'complete': sum(1 for r in active if r['complete']),
                    'checklist': len([i for i in checklist if i['status'] != 'na']),
                    'checklist_done': len([i for i in checklist if i['status'] in ('done', 'sent')])},
    }


def notes(event_id):
    return [{'id': n.id, 'body': n.body, 'created': ts(n.created)} for n in EventNote.objects.filter(event_id=event_id)]


def add_note(event_id, body, actor):
    body = (body or '').strip()
    if not body:
        raise ValueError('De notitie is leeg.')
    if not Event.objects.filter(id=event_id).exists():
        raise ValueError('Onbekend evenement.')
    EventNote.objects.create(event_id=event_id, body=body[:4000])
    audit(actor, 'Notitie toegevoegd', event_id)


# --- Artists ---------------------------------------------------------------

def artist_list():
    rows = []
    bookings, files, riders = {}, {}, {}
    for artist_id in Booking.objects.values_list('artist_id', flat=True):
        bookings[artist_id] = bookings.get(artist_id, 0) + 1
    for owner, kind in Asset.objects.filter(owner_type='artist').values_list('owner_id', 'kind'):
        files[owner] = files.get(owner, 0) + 1
        if kind in ('tech_rider', 'rider'):
            riders[owner] = riders.get(owner, 0) + 1
    for a in Artist.objects.all():
        rows.append({'id': a.id, 'name': a.name, 'full_name': a.full_name, 'agency': a.agency, 'agent': a.agent, 'email': a.email,
                     'agent_email': a.agent_email, 'instagram': a.instagram, 'updated': ts(a.updated),
                     'has_tech_rider': bool(a.tech_rider.strip()), 'has_rider_url': bool(a.rider_url), 'has_epk': bool(a.epk_url),
                     'booking_count': bookings.get(a.id, 0), 'asset_count': files.get(a.id, 0), 'rider_files': riders.get(a.id, 0),
                     'on_label': a.on_label, 'contact_via': R.contact_via({'contact_via': a.contact_via, 'agency': a.agency, 'agent_email': a.agent_email})})
    return rows


def artist_get(ident, private=True):
    a = Artist.objects.filter(id=ident).first()
    if not a:
        raise ValueError('Onbekende artiest.')
    data = artist_dict(a)
    data['assets'] = [asset_dict(x) for x in Asset.objects.filter(owner_type='artist', owner_id=ident)]
    data['bookings'] = [{'id': b.id, 'event_id': b.event_id, 'status': b.status, 'event_name': b.event.name, 'event_date': b.event.date,
                         'venue': b.event.venue} for b in Booking.objects.filter(artist_id=ident).select_related('event').order_by('-event__date')]
    return R.mask(data, private)


def _name_taken(name, exclude=None):
    query = Artist.objects.filter(name__iexact=name)
    if exclude:
        query = query.exclude(id=exclude)
    return query.exists()


def artist_create(payload, actor):
    data = R._artist_payload(payload, partial=False)
    if _name_taken(data['name']):
        raise ValueError('Er bestaat al een artiest met deze naam.')
    try:
        a = Artist.objects.create(**data)
    except IntegrityError:
        raise ValueError('Er bestaat al een artiest met deze naam.') from None
    audit(actor, 'Artiest aangemaakt', a.id, a.name)
    return a.id


def artist_update(ident, payload, actor):
    data = R._artist_payload(payload, partial=True)
    if 'on_label' in payload:
        if type(payload['on_label']) is not bool:
            raise ValueError('Ongeldige labelstatus.')
        data['on_label'] = payload['on_label']
    if not data:
        return
    if not Artist.objects.filter(id=ident).exists():
        raise ValueError('Onbekende artiest.')
    if 'name' in data and _name_taken(data['name'], ident):
        raise ValueError('Er bestaat al een artiest met deze naam.')
    Artist.objects.filter(id=ident).update(**data, updated=timezone.now())
    audit(actor, 'Artiest bijgewerkt', ident, ', '.join(k for k in data if k not in R.PRIVATE_FIELDS))


def artist_delete(ident, actor):
    a = Artist.objects.filter(id=ident).first()
    if not a:
        raise ValueError('Onbekende artiest.')
    if Booking.objects.filter(artist_id=ident).exists():
        raise ValueError('Deze artiest staat nog op een evenement. Haal die boeking eerst weg.')
    files = list(Asset.objects.filter(owner_type='artist', owner_id=ident).values_list('id', flat=True))
    with transaction.atomic():
        Asset.objects.filter(id__in=files).delete()
        a.delete()
    for f in files:
        (ASSETS / f).unlink(missing_ok=True)
    audit(actor, 'Artiest verwijderd', ident, a.name)


# --- Bookings --------------------------------------------------------------

def booking_detail(booking_id, private=True):
    b = Booking.objects.filter(id=booking_id).select_related('artist', 'event').first()
    if not b:
        raise ValueError('Onbekende boeking.')
    data = booking_dict(b)
    artist = artist_dict(b.artist)
    acts = sorted_acts(b.event_id)
    assets = asset_index([artist['id']], [booking_id])
    lineup = list(Booking.objects.filter(event_id=b.event_id).select_related('artist'))
    names = {x.artist_id: x.artist.name for x in lineup}
    for act in acts:
        act['artists'] = [names[a] for a in act['artist_ids'] if a in names]
    data['missing'] = [] if b.status == 'cancelled' else R.missing_items(data, artist, acts, assets)
    data['complete'] = not data['missing']
    data['artist'] = R.mask(artist, private)
    data['event'] = {k: v for k, v in event_dict(b.event).items() if k in ('id', 'name', 'date', 'venue', 'doors', 'status')}
    data['acts'] = acts
    data['artist_assets'] = assets.get(('artist', artist['id']), [])
    data['assets'] = assets.get(('booking', booking_id), [])
    data['lineup'] = [{'artist_id': x.artist_id, 'name': x.artist.name} for x in lineup if x.status != 'cancelled']
    return data


def booking_add(event_id, payload, actor):
    artist_id = R._text(payload.get('artist_id'), 24)
    name = R._text(payload.get('name'), 120)
    if not Event.objects.filter(id=event_id).exists():
        raise ValueError('Onbekend evenement.')
    with transaction.atomic():
        if artist_id:
            if not Artist.objects.filter(id=artist_id).exists():
                raise ValueError('Onbekende artiest.')
        elif name:
            existing = Artist.objects.filter(name__iexact=name).first()
            if existing:
                artist_id = existing.id
            else:
                artist_id = Artist.objects.create(name=name).id
                audit(actor, 'Artiest aangemaakt', artist_id, name)
        else:
            raise ValueError('Kies een artiest of vul een naam in.')
        if Booking.objects.filter(event_id=event_id, artist_id=artist_id).exists():
            raise ValueError('Deze artiest staat al op dit evenement.')
        sort = Booking.objects.filter(event_id=event_id).count()
        b = Booking.objects.create(event_id=event_id, artist_id=artist_id, sort=sort)
    audit(actor, 'Artiest geboekt', b.id, event_id)
    return b.id


def booking_update(booking_id, payload, actor):
    fields = {}
    if 'status' in payload:
        if payload['status'] not in R.BOOKING_STATUS:
            raise ValueError('Ongeldige boekingsstatus.')
        fields['status'] = payload['status']
    if 'fee' in payload:
        fields['fee'] = R.money(payload['fee'])
    for key in ('flight', 'grounds', 'hotel'):
        if key in payload:
            if payload[key] not in R.YES_NO:
                raise ValueError('Kies ja of nee.')
            fields[key] = payload[key]
    for key, spec, label in (('flight_info', R.FLIGHT_FIELDS, 'Vlucht'), ('hotel_info', R.HOTEL_FIELDS, 'Hotel'), ('ground_info', R.GROUND_FIELDS, 'Grondvervoer')):
        if key in payload:
            fields[key] = R._structured(spec, payload[key], label)
    if 'notes' in payload:
        fields['notes'] = R._text(payload['notes'], 4000)
    for key, limit in (('showday_contact', 200), ('showday_phone', 40)):
        if key in payload:
            fields[key] = R._text(payload[key], limit)
    b = Booking.objects.filter(id=booking_id).first()
    if not b:
        raise ValueError('Onbekende boeking.')
    if isinstance(payload.get('artist'), dict):
        artist_update(b.artist_id, payload['artist'], actor)
    if fields:
        for k, v in fields.items():
            setattr(b, k, v)
        b.save()
        audit(actor, 'Advancing bijgewerkt', booking_id, ', '.join(fields))


def booking_remove(booking_id, actor):
    b = Booking.objects.filter(id=booking_id).first()
    if not b:
        raise ValueError('Onbekende boeking.')
    files = list(Asset.objects.filter(owner_type='booking', owner_id=booking_id).values_list('id', flat=True))
    with transaction.atomic():
        for act in Act.objects.filter(event_id=b.event_id):
            if b.artist_id in (act.artist_ids or []):
                act.artist_ids = [i for i in act.artist_ids if i != b.artist_id]
                act.save(update_fields=['artist_ids'])
        Asset.objects.filter(id__in=files).delete()
        b.delete()
    for f in files:
        (ASSETS / f).unlink(missing_ok=True)
    audit(actor, 'Boeking verwijderd', booking_id, b.event_id)
    return b.event_id


# --- Acts ------------------------------------------------------------------

def _act_payload(event_id, payload, partial):
    out = {}
    if 'artist_ids' in payload:
        ids = payload['artist_ids'] if isinstance(payload['artist_ids'], list) else []
        booked = set(Booking.objects.filter(event_id=event_id).values_list('artist_id', flat=True))
        clean = []
        for ident in ids:
            if not isinstance(ident, str) or ident not in booked:
                raise ValueError('Kies artiesten die op dit evenement staan.')
            if ident not in clean:
                clean.append(ident)
        out['artist_ids'] = clean
    if 'name' in payload:
        out['name'] = R._text(payload['name'], 200)
    if 'start' in payload:
        out['start'] = R._time(payload['start'], 'Starttijd')
    if 'end' in payload:
        out['end'] = R._time(payload['end'], 'Eindtijd')
    if 'stage' in payload:
        out['stage'] = R._text(payload['stage'], 80)
    if 'note' in payload:
        out['note'] = R._text(payload['note'], 400)
    if not out.get('name') and 'artist_ids' in out and (not partial or 'name' in payload):
        names = dict(Artist.objects.filter(id__in=out['artist_ids']).values_list('id', 'name'))
        out['name'] = ' B2B '.join(names[i] for i in out['artist_ids'] if i in names)
    if (not partial or 'name' in out) and not out.get('name'):
        raise ValueError('Geef de act een naam of kies artiesten.')
    return out


def act_create(event_id, payload, actor):
    if not Event.objects.filter(id=event_id).exists():
        raise ValueError('Onbekend evenement.')
    data = _act_payload(event_id, payload, partial=False)
    act = Act.objects.create(event_id=event_id, sort=Act.objects.filter(event_id=event_id).count(), **data)
    audit(actor, 'Act toegevoegd', act.id, act.name)
    return act.id


def act_update(act_id, payload, actor):
    act = Act.objects.filter(id=act_id).first()
    if not act:
        raise ValueError('Onbekende act.')
    for k, v in _act_payload(act.event_id, payload, partial=True).items():
        setattr(act, k, v)
    act.save()
    audit(actor, 'Act bijgewerkt', act_id)
    return act.event_id


def act_delete(act_id, actor):
    act = Act.objects.filter(id=act_id).first()
    if not act:
        raise ValueError('Onbekende act.')
    act.delete()
    audit(actor, 'Act verwijderd', act_id)
    return act.event_id


# --- Checklist -------------------------------------------------------------

def checklist_update(item_id, payload, actor):
    item = ChecklistItem.objects.filter(id=item_id).first()
    if not item:
        raise ValueError('Onbekend checklistonderdeel.')
    if 'status' in payload:
        if payload['status'] not in R.CHECK_STATUS:
            raise ValueError('Ongeldige status.')
        item.status = payload['status']
    if 'notes' in payload:
        item.notes = R._text(payload['notes'], 1000)
    if 'label' in payload:
        item.label = R._text(payload['label'], 200)
        if not item.label:
            raise ValueError('Geef het onderdeel een naam.')
    item.save()
    audit(actor, 'Checklist bijgewerkt', item_id, item.status)
    return item.event_id


def checklist_add(event_id, label, actor):
    label = R._text(label, 200)
    if not label:
        raise ValueError('Geef het onderdeel een naam.')
    if not Event.objects.filter(id=event_id).exists():
        raise ValueError('Onbekend evenement.')
    item = ChecklistItem.objects.create(event_id=event_id, label=label, sort=ChecklistItem.objects.filter(event_id=event_id).count())
    audit(actor, 'Checklistonderdeel toegevoegd', item.id, label)


def checklist_delete(item_id, actor):
    item = ChecklistItem.objects.filter(id=item_id).first()
    if not item:
        raise ValueError('Onbekend checklistonderdeel.')
    item.delete()
    audit(actor, 'Checklistonderdeel verwijderd', item_id)
    return item.event_id


# --- Files -----------------------------------------------------------------

def _owner_exists(owner_type, owner_id):
    model = {'artist': Artist, 'booking': Booking, 'event': Event}.get(owner_type)
    if not model:
        raise ValueError('Ongeldige eigenaar.')
    return model.objects.filter(id=owner_id).exists()


def asset_add_file(owner_type, owner_id, kind, filename, content, actor):
    if kind not in R.ASSET_KINDS:
        raise ValueError('Kies een soort bestand.')
    name = Path(str(filename or '').replace('\\', '/')).name.strip()[:180]
    mime = R.FILE_TYPES.get(Path(name).suffix.lower())
    if not name or not mime:
        raise ValueError('Dit bestandstype wordt niet ondersteund. Gebruik PDF, afbeelding, Office, ZIP of video.')
    if not content:
        raise ValueError('Het bestand is leeg.')
    if len(content) > R.MAX_ASSET:
        raise ValueError('Maximaal 20 MB per bestand. Zet grotere bestanden (video) als link.')
    if not _owner_exists(owner_type, owner_id):
        raise ValueError('Onbekende eigenaar van het bestand.')
    sha = hashlib.sha256(content).hexdigest()
    existing = Asset.objects.filter(owner_type=owner_type, owner_id=owner_id, kind=kind, name=name, has_file=True).first()
    asset = existing or Asset(owner_type=owner_type, owner_id=owner_id, kind=kind, name=name, has_file=True)
    tmp = ASSETS / (asset.id + '.' + os.urandom(6).hex() + '.tmp')
    with tmp.open('xb') as output:
        if os.name != 'nt':
            os.fchmod(output.fileno(), 0o600)
        output.write(content)
    tmp.replace(ASSETS / asset.id)
    asset.mime, asset.size, asset.sha, asset.sync_status, asset.error = mime, len(content), sha, 'local', ''
    try:
        asset.save()
    except Exception:
        if not existing:
            (ASSETS / asset.id).unlink(missing_ok=True)
        raise
    audit(actor, 'Bestand opgeslagen', asset.id, f'{R.ASSET_KINDS[kind]}: {name}')
    return asset.id


def asset_add_link(owner_type, owner_id, kind, name, url, actor):
    if kind not in R.ASSET_KINDS:
        raise ValueError('Kies een soort link.')
    url = R._url(url, 'Link')
    if not url:
        raise ValueError('Vul een link in.')
    if not _owner_exists(owner_type, owner_id):
        raise ValueError('Onbekende eigenaar van de link.')
    import re
    name = R._text(name, 180) or re.sub(r'^https?://', '', url, flags=re.I).split('/')[0]
    asset = Asset.objects.create(owner_type=owner_type, owner_id=owner_id, kind=kind, name=name, url=url, has_file=False, sync_status='link')
    audit(actor, 'Link opgeslagen', asset.id, f'{R.ASSET_KINDS[kind]}: {name}')
    return asset.id


def asset_get(ident):
    a = Asset.objects.filter(id=ident).first()
    if not a:
        raise ValueError('Onbekend bestand.')
    return asset_dict(a)


def asset_content(asset):
    if not asset['has_file']:
        raise ValueError('Dit is een link, geen bestand.')
    path = ASSETS / asset['id']
    if not path.is_file():
        raise ValueError('Het bestand ontbreekt op de server.')
    return path.read_bytes()


def asset_delete(ident, actor):
    asset = asset_get(ident)
    Asset.objects.filter(id=ident).delete()
    (ASSETS / ident).unlink(missing_ok=True)
    audit(actor, 'Bestand verwijderd', ident, asset['name'])


def _drive_root():
    return (settings().get('production_folder') or 'Moonshine/Productie').strip('/')


def _event_folder(event):
    return R.safe_name(f"{(event.get('date') or '').strip()} {event.get('name') or ''}".strip(), 'Evenement')


def asset_drive_path(asset):
    root = _drive_root()
    folder = R.DRIVE_FOLDERS.get(asset['kind'], 'Overig')
    if asset['owner_type'] == 'artist':
        artist = Artist.objects.filter(id=asset['owner_id']).first()
        base = f"{root}/Artiesten/{R.safe_name(artist.name if artist else '', 'Artiest')}"
    elif asset['owner_type'] == 'booking':
        b = Booking.objects.filter(id=asset['owner_id']).select_related('event', 'artist').first()
        if not b:
            raise ValueError('Boeking bestaat niet meer.')
        base = f"{root}/Evenementen/{_event_folder(event_dict(b.event))}/Artiesten/{R.safe_name(b.artist.name, 'Artiest')}"
    else:
        e = Event.objects.filter(id=asset['owner_id']).first()
        if not e:
            raise ValueError('Evenement bestaat niet meer.')
        base = f"{root}/Evenementen/{_event_folder(event_dict(e))}"
    return f"{base}/{folder}/{R.safe_name(asset['name'], 'Bestand')}"


def sync_asset(ident):
    """Copy one file to OneDrive. Only the uploaded version is marked synced;
    a newer upload during the transfer stays local for the next run."""
    from integrations.graph import drive_upload
    asset = asset_get(ident)
    if not asset['has_file']:
        return asset
    try:
        item_id, web_url = drive_upload(asset_drive_path(asset), asset_content(asset), asset['mime'])
    except Exception as e:
        message = safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else 'Controleer de OneDrive-koppeling.'
        Asset.objects.filter(id=ident, sha=asset['sha']).update(sync_status='error', error=message[:500], retry_at=time.time() + R.RETRY_SECONDS)
        raise
    Asset.objects.filter(id=ident, sha=asset['sha']).update(sync_status='synced', onedrive_id=item_id, onedrive_url=web_url, error='')
    return asset_get(ident)


def queue_pending_syncs():
    """Queue local files (and failed ones whose pause is over) for OneDrive."""
    from jobs.queue import enqueue
    due = Asset.objects.filter(has_file=True).filter(Q(sync_status='local') | Q(sync_status='error', retry_at__lt=time.time()))[:50]
    for a in due:
        enqueue('sync_asset', {'asset_id': a.id}, key=a.id, max_attempts=1)


# --- The venue mail ---------------------------------------------------------

def build_pack(event_id, payload, with_content=True):
    data = advancing(event_id)
    event = data['event']
    checklist = {i['id']: i for i in data['checklist']}
    requested = payload.get('items')
    if requested is None:
        item_ids = [i for i, item in checklist.items() if item['status'] not in ('sent', 'na')]
    else:
        item_ids = [i for i in requested if isinstance(i, str) and i in checklist]
    keys = {checklist[i]['key'] for i in item_ids if checklist[i]['key']}
    active = [b for b in data['bookings'] if b['status'] != 'cancelled']
    artists = {a.id: artist_dict(a) for a in Artist.objects.filter(id__in=[b['artist_id'] for b in active])}
    index = asset_index(list(artists), [b['id'] for b in active], event_id)
    attachments, links, warnings = [], [], []

    def add_generated(name, producer):
        content = producer()
        if content is not None:
            attachments.append({'name': name, 'mime': 'application/pdf', 'source': 'generated', 'content': content, 'size': len(content)})

    def add_assets(rows):
        for asset in rows:
            if asset['has_file']:
                if any(a.get('asset_id') == asset['id'] for a in attachments):
                    continue
                attachments.append({'name': asset['name'], 'mime': asset['mime'] or 'application/octet-stream', 'source': 'asset',
                                    'asset_id': asset['id'], 'size': asset['size'], 'content': asset_content(asset) if with_content else None})
            elif asset['url'] and asset['url'] not in [l['url'] for l in links]:
                links.append({'name': f"{asset['name']} ({R.ASSET_KINDS.get(asset['kind'], '')})", 'url': asset['url']})

    sheet_keys = keys & {'timetable', 'contacts', 'travel', 'hotel'}
    if sheet_keys:
        add_generated(f"Advancing - {R.safe_name(event['name'])}.pdf", lambda: R.advancing_pdf(data, sheet_keys))
    for b in active:
        artist = artists.get(b['artist_id'], {})
        own = index.get(('artist', artist.get('id')), [])
        if 'tech_riders' in keys:
            if (artist.get('tech_rider') or '').strip():
                add_generated(f"Technical rider - {R.safe_name(artist['name'])}.pdf", lambda a=artist: R.rider_pdf(a, 'tech', event))
            add_assets([a for a in own if a['kind'] in ('tech_rider', 'rider')])
            if artist.get('rider_url'):
                links.append({'name': f"Rider {artist['name']}", 'url': artist['rider_url']})
            if not ((artist.get('tech_rider') or '').strip() or artist.get('rider_url') or any(a['kind'] in ('tech_rider', 'rider') for a in own)):
                warnings.append(f"Geen technical rider voor {artist.get('name', '')}.")
        if 'hospitality' in keys:
            if (artist.get('hospitality_rider') or '').strip():
                add_generated(f"Hospitality rider - {R.safe_name(artist['name'])}.pdf", lambda a=artist: R.rider_pdf(a, 'hospitality', event))
            add_assets([a for a in own if a['kind'] == 'hospitality_rider'])
        if 'promo' in keys:
            add_assets([a for a in own if a['kind'] in ('logo', 'press_photo', 'bio')])
            if artist.get('epk_url'):
                links.append({'name': f"EPK {artist['name']}", 'url': artist['epk_url']})
    if 'promo' in keys:
        add_generated(f"Bio's - {R.safe_name(event['name'])}.pdf", lambda: R.bios_pdf(data, artists))
    event_assets = index.get(('event', event_id), [])
    if 'guestlist' in keys:
        add_assets([a for a in event_assets if a['kind'] == 'guestlist'])
        if not any(a['kind'] == 'guestlist' for a in event_assets):
            warnings.append('Er is nog geen gastenlijst toegevoegd.')
    if 'production' in keys:
        add_assets([a for a in event_assets if a['kind'] in ('production', 'stage_plot')])
    extra = payload.get('assets') if isinstance(payload.get('assets'), list) else []
    allowed = {a['id']: a for rows in index.values() for a in rows}
    add_assets([allowed[i] for i in extra if isinstance(i, str) and i in allowed])

    total = sum(a['size'] for a in attachments)
    if total > R.MAX_MAIL:
        message = f'De bijlagen zijn samen {R._format_size(total)}. Verstuur in delen (maximaal 30 MB per mail) of deel grote bestanden als link.'
        if with_content:
            raise ValueError(message)
        warnings.insert(0, message)
    incomplete = [b['artist']['name'] for b in active if not b['complete']]
    if incomplete:
        warnings.append('Advancing nog niet compleet voor: ' + ', '.join(incomplete) + '.')
    to = R._recipients(payload['to'] if 'to' in payload else event.get('venue_email'))
    cc = R._recipients(payload.get('cc'))
    subject = R._text(payload.get('subject'), 300) or f"Advancing {event['name']} · {R.nice_date(event.get('date'))}".strip(' ·')
    greeting = (event.get('venue_contact') or '').split(' ')[0] or 'allemaal'
    message = R._text(payload.get('message'), 6000) if payload.get('message') is not None else \
        f"Hoi {greeting},\n\nHierbij de advancing voor {event['name']}{' op ' + R.nice_date(event.get('date')) if event.get('date') else ''}. Laat het ons weten als er iets ontbreekt."
    return {'to': to, 'cc': cc, 'subject': subject, 'message': message, 'items': [checklist[i] for i in item_ids], 'links': links,
            'attachments': attachments, 'warnings': warnings, 'total_size': total,
            'html': R._mail_html(message, data if 'timetable' in keys else None, attachments, links)}


def preview(event_id, payload):
    pack = build_pack(event_id, payload, with_content=False)
    return {**{k: v for k, v in pack.items() if k != 'attachments'},
            'attachments': [{'name': a['name'], 'size': a['size'], 'source': a['source']} for a in pack['attachments']],
            'sender': settings().get('advancing_sender', '')}


def send(event_id, payload, actor):
    from integrations.graph import send_mail
    from integrations.http import UncertainSend
    sender = settings().get('advancing_sender', '')
    if not sender:
        raise ValueError('Stel bij Koppelingen → Advancing eerst het verzendadres in (bijv. events@moonshinednb.nl).')
    pack = build_pack(event_id, payload, with_content=True)
    if not pack['to']:
        raise ValueError('Vul een ontvanger in, bijvoorbeeld het productie-adres van de venue.')
    if not pack['items'] and not pack['attachments']:
        raise ValueError('Kies wat je wilt versturen.')
    status, error = 'accepted', ''
    try:
        send_mail(sender, pack['to'], pack['cc'], pack['subject'], pack['html'], pack['attachments'])
    except UncertainSend as e:
        status, error = 'uncertain', str(e)
    except (ValueError, RuntimeError) as e:
        status, error = 'failed', safe_error(e)
    recipients = ', '.join(pack['to'] + pack['cc'])
    record = Send.objects.create(event_id=event_id, recipients=recipients, subject=pack['subject'], items=[i['label'] for i in pack['items']],
                                 attachments=[a['name'] for a in pack['attachments']], status=status, error=error[:500], actor=actor)
    if status == 'accepted':
        ChecklistItem.objects.filter(id__in=[i['id'] for i in pack['items']]).update(status='sent', sent_at=time.time(), sent_to=recipients[:300])
    audit(actor, {'accepted': 'Advancing verstuurd', 'uncertain': 'Advancing-verzending onzeker', 'failed': 'Advancing-verzending mislukt'}[status],
          event_id, f"{recipients}: {len(pack['attachments'])} bijlagen")
    if status == 'failed':
        raise ValueError(error or 'Verzenden is niet gelukt.')
    if status == 'accepted' and settings().get('production_sync'):
        from jobs.queue import enqueue
        enqueue('archive_sent', {'event_id': event_id, 'send_id': record.id}, key=record.id)
    return {'status': status, 'error': error, 'id': record.id}


def archive_sent(event_id, send_id):
    """Keep the generated documents of a sent mail in the event folder."""
    from integrations.graph import drive_upload
    record = Send.objects.get(id=send_id)
    event = event_dict(Event.objects.get(id=event_id))
    pack = build_pack(event_id, {'items': [i['id'] for i in advancing(event_id)['checklist'] if i['label'] in record.items]}, with_content=True)
    stamp = time.strftime('%Y-%m-%d %H.%M', time.localtime(record.created.timestamp()))
    for a in pack['attachments']:
        if a['source'] == 'generated':
            drive_upload(f"{_drive_root()}/Evenementen/{_event_folder(event)}/Verzonden/{stamp} {R.safe_name(a['name'])}", a['content'], a['mime'])


# --- Releases ----------------------------------------------------------------

DEFAULT_STEPS = [('Master en artwork binnen', -42), ('Aanleveren bij distributie', -28), ('Pitch en pre-save naar DSP’s', -21),
                 ('Promo-assets klaar (visuals, teaser)', -14), ('Aankondiging op socials', -7), ('Release day', 0),
                 ('Promo-push en playlist-follow-up', 7)]


def step_dict(s):
    return {'id': s.id, 'label': s.label, 'due': s.due, 'done': s.done, 'sort': s.sort}


def release_dict(r):
    from core.models import Task
    steps = [step_dict(s) for s in r.steps.all()]
    tasks = Task.objects.filter(release=r.id)
    return {'id': r.id, 'title': r.title, 'artist': r.artist, 'release_date': r.release_date, 'status': r.status,
            'labelgrid_release_id': r.labelgrid_release_id, 'notes': r.notes, 'created': ts(r.created), 'steps': steps,
            'steps_done': sum(1 for s in steps if s['done']), 'tasks_open': tasks.filter(done=False).count(), 'tasks': tasks.count()}


def seed_steps(r):
    from datetime import date, timedelta
    base = date.fromisoformat(r.release_date) if r.release_date else None
    ReleaseStep.objects.bulk_create([ReleaseStep(release=r, label=label, sort=i, due=(base + timedelta(days=d)).isoformat() if base else '')
                                     for i, (label, d) in enumerate(DEFAULT_STEPS)])


def step_save(release_id, payload, actor, ident=None):
    s = ReleaseStep.objects.filter(id=ident).first() if ident else ReleaseStep(release_id=release_id)
    if ident and not s:
        raise ValueError('Stap niet gevonden.')
    if not ident and not Release.objects.filter(id=release_id).exists():
        raise ValueError('Release niet gevonden.')
    if 'label' in payload or not ident:
        s.label = R._text(payload.get('label'), 200)
        if not s.label:
            raise ValueError('Geef de stap een naam.')
    if 'due' in payload:
        s.due = R._date(payload.get('due'), 'Datum')
    if 'done' in payload:
        if type(payload['done']) is not bool:
            raise ValueError('Ongeldige status.')
        s.done = payload['done']
    if not ident:
        s.sort = (ReleaseStep.objects.filter(release_id=release_id).aggregate(m=models.Max('sort'))['m'] or 0) + 1
    s.save()
    audit(actor, 'Releaseplanning bijgewerkt', s.release_id)
    return release_dict(s.release)


def label_artists():
    names = {}
    for r in Release.objects.all():
        for n in [x.strip() for x in re.split(r',|&| x | feat\.? ', r.artist or '') if x.strip()]:
            names.setdefault(n.casefold(), []).append(r.id)
    out = []
    for a in Artist.objects.all():
        releases = names.get(a.name.casefold(), [])
        if a.on_label or releases:
            out.append({'id': a.id, 'name': a.name, 'on_label': a.on_label, 'releases': len(releases), 'agency': a.agency})
    return sorted(out, key=lambda x: x['name'].casefold())


def release_save(payload, actor, ident=None):
    r = Release.objects.filter(id=ident).first() if ident else Release()
    if ident and not r:
        raise ValueError('Release niet gevonden.')
    for key, limit in (('title', 300), ('artist', 300), ('status', 40), ('labelgrid_release_id', 100), ('notes', 4000)):
        if key in payload or not ident:
            setattr(r, key, R._text(payload.get(key), limit) or ('planned' if key == 'status' else ''))
    if 'release_date' in payload or not ident:
        r.release_date = R._date(payload.get('release_date'), 'Releasedatum')
    if not r.title:
        raise ValueError('Geef de release een titel.')
    r.save()
    if not ident:
        seed_steps(r)
    audit(actor, 'Release bijgewerkt' if ident else 'Release aangemaakt', r.id)
    return release_dict(r)

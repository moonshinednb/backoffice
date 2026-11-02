"""The line-up of an event as acts: a solo artist, a duo or a group.

Fee, status, rider and EPK belong to the act; travel, hotel and identity to
each member (a Booking). What is still missing is counted per act, so a duo
does not show every warning twice, and travel is one question ("do they travel
themselves or do we arrange it?") until we arrange it."""
from django.db import transaction
from core.services import audit
from . import rules as R
from .models import Artist, Booking, CrewMember, Event, LineupAct

TRAVEL_ITEMS = ('Vlucht', 'Heenvlucht', 'Terugvlucht', 'Grondvervoer', 'Hotel', 'Volledige naam', 'Geboortedatum')


def _contact_ok(a):
    return bool(a.get('agent_email')) if R.contact_via(a) == 'agency' else bool(a.get('email') or a.get('phone'))


def act_state(act, members, timetable, assets):
    """members: [(booking dict, artist dict)]. Returns (missing for the act, missing per member booking id)."""
    active = [(b, a) for b, a in members if b['status'] != 'cancelled']
    if act.status == 'cancelled' or not active:
        return [], {}
    artists = [a for _, a in active]
    kinds = {x['kind'] for x in assets.get(('act', act.id), [])}
    for a in artists:
        kinds |= {x['kind'] for x in assets.get(('artist', a['id']), [])}
    ids = {a['id'] for a in artists}
    missing = []
    if not any(_contact_ok(a) for a in artists):
        missing.append('Contact: mail/telefoon of agent')
    if not any(ids & set(t['artist_ids']) and t['start'] and t['end'] for t in timetable):
        missing.append('Set time in de timetable')
    if not (kinds & {'tech_rider', 'rider'} or any((a.get('tech_rider') or '').strip() or a.get('rider_url') for a in artists)):
        missing.append('Technical rider')
    bio = 'bio' in kinds or any((a.get('bio') or '').strip() for a in artists)
    photo = bool(kinds & {'press_photo', 'epk'})
    if not bio and not photo:
        missing.append('EPK: bio en persfoto')
    elif not bio:
        missing.append('Bio / promotekst')
    elif not photo:
        missing.append('Persfoto')
    per_member = {}
    if act.travel == '':
        missing.append('Reis: zelf of wij regelen?')
    elif act.travel in ('us', 'venue'):
        for b, a in active:
            own = [m for m in R.missing_items(b, a, timetable, assets) if m.startswith(TRAVEL_ITEMS)]
            per_member[b['id']] = own
            missing += [f"{a['name']}: {m}" if len(active) > 1 else m for m in own]
    return missing, per_member


def act_dict(act, members, timetable, assets):
    missing, per_member = act_state(act, members, timetable, assets)
    ids = {a['id'] for b, a in members if b['status'] != 'cancelled'}
    slots = [t for t in timetable if ids & set(t['artist_ids'])]
    return {'id': act.id, 'name': act.name, 'fee': act.fee, 'status': act.status, 'travel': act.travel, 'notes': act.notes, 'drive_url': act.drive_url,
            'members': [{'booking_id': b['id'], 'artist_id': a['id'], 'name': a['name'], 'status': b['status'], 'missing': per_member.get(b['id'], [])}
                        for b, a in members],
            'times': [f"{t['start']}–{t['end'] or '?'}" for t in slots if t['start']], 'stages': sorted({t['stage'] for t in slots if t['stage']}),
            'missing': missing, 'complete': act.status != 'cancelled' and not missing}


def lineup(event_id, bookings, artists, timetable, assets):
    """Acts of one event, from bookings already loaded (booking dicts keyed by id)."""
    acts = list(LineupAct.objects.filter(event_id=event_id))
    by_act = {}
    for b in bookings:
        by_act.setdefault(b.get('lineup_act_id'), []).append((b, artists[b['artist_id']]))
    return [act_dict(a, by_act.get(a.id, []), timetable, assets) for a in acts]


def _artist(name, artist_id=''):
    if artist_id:
        a = Artist.objects.filter(id=artist_id).first()
        if not a:
            raise ValueError('Onbekende artiest.')
        return a
    name = R._text(name, 120)
    if not name:
        raise ValueError('Vul een naam in.')
    return Artist.objects.filter(name__iexact=name).first() or Artist.objects.create(name=name)


def _book(event_id, act, artist, actor):
    if Booking.objects.filter(event_id=event_id, artist=artist).exists():
        raise ValueError(f'{artist.name} staat al op dit evenement.')
    b = Booking.objects.create(event_id=event_id, artist=artist, lineup_act=act, status=act.status if act.status != 'cancelled' else 'confirmed',
                               sort=Booking.objects.filter(event_id=event_id).count())
    audit(actor, 'Artiest geboekt', b.id, f'{artist.name} in {act.name}')
    return b


def act_create(event_id, payload, actor):
    """New act with its members: {'name', 'members': [names or {'artist_id'}], 'travel', 'fee'}."""
    if not Event.objects.filter(id=event_id).exists():
        raise ValueError('Onbekend evenement.')
    raw = payload.get('members') or []
    if not isinstance(raw, list) or len(raw) > 12:
        raise ValueError('Ongeldige leden.')
    members = [m for m in raw if (isinstance(m, dict) and m.get('artist_id')) or (isinstance(m, str) and m.strip())]
    name = R._text(payload.get('name'), 200) or (members[0].strip() if members and isinstance(members[0], str) else '')
    if not name:
        raise ValueError('Geef de act een naam.')
    if not members:
        members = [name]
    travel = payload.get('travel') if payload.get('travel') in dict(LineupAct.TRAVEL) else ''
    with transaction.atomic():
        act = LineupAct.objects.create(event_id=event_id, name=name, travel=travel, fee=max(0, int(payload.get('fee') or 0)),
                                       sort=LineupAct.objects.filter(event_id=event_id).count())
        bookings = [_book(event_id, act, _artist(m if isinstance(m, str) else '', m.get('artist_id', '') if isinstance(m, dict) else ''), actor)
                    for m in members]
    audit(actor, 'Act toegevoegd', act.id, f"{name}: {', '.join(b.artist.name for b in bookings)}")
    from .drive import queue
    if Event.objects.filter(id=event_id).exclude(drive_id='').exists():
        queue('booking', bookings[0].id)
    return act


def act_update(ident, payload, actor):
    act = LineupAct.objects.filter(id=ident).first()
    if not act:
        raise ValueError('Act niet gevonden.')
    renamed = False
    if 'name' in payload:
        name = R._text(payload.get('name'), 200)
        if not name:
            raise ValueError('Geef de act een naam.')
        renamed, act.name = name != act.name, name
    if 'fee' in payload:
        act.fee = max(0, int(payload.get('fee') or 0))
    if 'status' in payload:
        if payload['status'] not in dict(LineupAct.STATUSES):
            raise ValueError('Onbekende status.')
        act.status = payload['status']
        Booking.objects.filter(lineup_act=act).update(status=act.status)
    if 'travel' in payload:
        if payload['travel'] not in dict(LineupAct.TRAVEL):
            raise ValueError('Onbekende reiskeuze.')
        act.travel = payload['travel']
    if 'notes' in payload:
        act.notes = str(payload.get('notes') or '')[:4000]
    act.save()
    audit(actor, 'Act bijgewerkt', act.id, act.name)
    first = act.members.first()
    if renamed and first and act.event.drive_id:
        from .drive import queue
        queue('booking', first.id)
    return act


def member_add(ident, payload, actor):
    act = LineupAct.objects.filter(id=ident).first()
    if not act:
        raise ValueError('Act niet gevonden.')
    return _book(act.event_id, act, _artist(payload.get('name', ''), payload.get('artist_id', '')), actor)


def act_remove(ident, actor):
    """Take the act off the event: its members' bookings go, artist profiles stay."""
    from .services import booking_remove
    act = LineupAct.objects.filter(id=ident).first()
    if not act:
        raise ValueError('Act niet gevonden.')
    event_id = act.event_id
    for b in list(act.members.all()):
        booking_remove(b.id, actor)
    LineupAct.objects.filter(id=ident).delete()
    audit(actor, 'Act van evenement gehaald', event_id, act.name)
    return event_id


def crew_from_lineup(event_id, actor):
    """Put every member of the line-up on the crew list (role ARTIST, the act in ACT)."""
    from .people import _queue
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Evenement niet gevonden.')
    have = {n.lower() for n in e.crew.values_list('name', flat=True)}
    last = e.crew.order_by('-sort').values_list('sort', flat=True).first() or 0
    new = []
    for b in Booking.objects.filter(event_id=event_id).exclude(status='cancelled').select_related('artist', 'lineup_act'):
        name = (b.artist.full_name or b.artist.name).strip()
        if name.lower() in have or b.artist.name.lower() in have:
            continue
        have.add(name.lower())
        new.append(CrewMember(event=e, name=name, role='ARTIST', act=b.lineup_act.name if b.lineup_act else b.artist.name, sort=last + len(new) + 1))
    CrewMember.objects.bulk_create(new)
    if new:
        _queue(e)
    audit(actor, 'Line-up op de crewlist gezet', event_id, str(len(new)))
    return len(new)

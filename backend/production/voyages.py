"""Voyages: outbound shows outside the Moonshine programme."""
from ninja import Router
from ninja.errors import HttpError
from core.access import actor, body, require
from core.services import audit
from . import rules as R
from .models import Artist, Voyage, VoyageNote

router = Router()
STATUS = dict(Voyage.STATUSES)
TEXT = {'performer': 200, 'event_name': 300, 'venue': 300, 'city': 120, 'country': 80, 'set_time': 40, 'deal': 300, 'travel': 300,
        'promoter_name': 200, 'promoter_phone': 40, 'notes': 6000}


def voyage_dict(v, full=False):
    out = {'id': v.id, 'performer': v.performer, 'artist_id': v.artist_id, 'event_name': v.event_name, 'venue': v.venue, 'city': v.city,
           'country': v.country, 'date': v.date, 'set_time': v.set_time, 'status': v.status, 'fee': v.fee, 'currency': v.currency,
           'deal': v.deal, 'travel': v.travel, 'promoter_name': v.promoter_name, 'promoter_email': v.promoter_email,
           'promoter_phone': v.promoter_phone, 'mail_link': v.mail_link, 'drive_url': v.drive_url, 'updated': v.updated.timestamp()}
    if full:
        out['notes'] = v.notes
        out['log'] = [{'id': n.id, 'kind': n.kind, 'body': n.body, 'author': n.author, 'created': n.created.timestamp()} for n in v.log.all()[:200]]
    return out


def _apply(v, d):
    for key, limit in TEXT.items():
        if key in d:
            setattr(v, key, R._text(d[key], limit))
    if 'date' in d:
        v.date = R._date(d['date'], 'Datum')
    if 'status' in d:
        if d['status'] not in STATUS:
            raise ValueError('Onbekende status.')
        v.status = d['status']
    if 'fee' in d:
        v.fee = R.money(d['fee'])
    if 'currency' in d:
        cur = str(d['currency'] or 'EUR').upper()[:3]
        if not cur.isalpha() or len(cur) != 3:
            raise ValueError('Valuta: drie letters, bijv. EUR of GBP.')
        v.currency = cur
    if 'promoter_email' in d:
        v.promoter_email = R._email(d['promoter_email'], 'E-mail promoter')
    if 'mail_link' in d:
        v.mail_link = R._url(d['mail_link'], 'Link naar mail') if d['mail_link'] else ''
    if 'artist_id' in d:
        v.artist = Artist.objects.filter(id=d['artist_id']).first() if d['artist_id'] else None
    if not v.performer and v.artist:
        v.performer = v.artist.name
    if not v.performer.strip() or not v.event_name.strip():
        raise ValueError('Vul in wie er speelt en bij welk event.')


@router.get('/voyages')
def voyages(request):
    require(request, 'production')
    return {'voyages': [voyage_dict(v) for v in Voyage.objects.all()[:1000]], 'statuses': Voyage.STATUSES}


@router.post('/voyages')
def create(request):
    require(request, 'production', write=True)
    v = Voyage(created_by=actor(request))
    try:
        _apply(v, body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    v.save()
    VoyageNote.objects.create(voyage=v, kind='status', body=f'Aangemaakt als: {STATUS[v.status]}', author=actor(request))
    audit(actor(request), 'Voyage aangemaakt', v.id, f'{v.performer} @ {v.event_name}')
    from .drive import queue
    queue('voyage', v.id)
    return voyage_dict(v, True)


@router.get('/voyages/{ident}')
def detail(request, ident: str):
    require(request, 'production')
    v = Voyage.objects.filter(id=ident).first()
    if not v:
        raise HttpError(404, 'Voyage niet gevonden.')
    return voyage_dict(v, True)


@router.patch('/voyages/{ident}')
def update(request, ident: str):
    require(request, 'production', write=True)
    v = Voyage.objects.filter(id=ident).first()
    if not v:
        raise HttpError(404, 'Voyage niet gevonden.')
    before = (v.status, v.event_name, v.date, v.city)
    try:
        _apply(v, body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    v.save()
    if v.status != before[0]:
        VoyageNote.objects.create(voyage=v, kind='status', body=f'Status: {STATUS[before[0]]} → {STATUS[v.status]}', author=actor(request))
        if v.status in ('confirmed', 'contracted', 'played'):
            from core.notify import done
            done([v.id], actor(request), f'Voyage {STATUS[v.status].lower()}: {v.performer} @ {v.event_name}', v.date or '', f'/voyages/{v.id}', key=f'voyage:{v.id}:{v.status}')
    if v.drive_id and before[1:] != (v.event_name, v.date, v.city):
        from .drive import queue
        queue('voyage', v.id)
    audit(actor(request), 'Voyage bijgewerkt', v.id)
    return voyage_dict(v, True)


@router.delete('/voyages/{ident}')
def delete(request, ident: str):
    require(request, 'production', write=True)
    if not Voyage.objects.filter(id=ident).delete()[0]:
        raise HttpError(404, 'Voyage niet gevonden.')
    audit(actor(request), 'Voyage verwijderd', ident)
    return {'ok': True}


@router.post('/voyages/{ident}/log')
def add_log(request, ident: str):
    require(request, 'production', write=True)
    v = Voyage.objects.filter(id=ident).first()
    if not v:
        raise HttpError(404, 'Voyage niet gevonden.')
    d = body(request)
    text = R._text(d.get('body'), 6000)
    if not text:
        raise HttpError(400, 'Leeg bericht.')
    VoyageNote.objects.create(voyage=v, kind=d.get('kind') if d.get('kind') in ('note', 'mail', 'call') else 'note', body=text, author=actor(request))
    audit(actor(request), 'Voyage-notitie toegevoegd', v.id)
    return voyage_dict(v, True)

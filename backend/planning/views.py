"""Calendar and content planning endpoints."""
from datetime import date, timedelta
from ninja import Router
from ninja.errors import HttpError
from core.access import actor, body, require
from core.services import audit
from production import rules as R
from . import services as S
from .models import KINDS, STATUSES, ContentItem

router = Router()
PLATFORMS = ('instagram', 'tiktok', 'facebook', 'youtube', 'soundcloud', 'x', 'spotify')


def content_dict(c):
    return {'id': c.id, 'event_id': c.event_id, 'event': c.event.name if c.event else '', 'release_id': c.release_id, 'release': c.release.title if c.release else '',
            'title': c.title, 'kind': c.kind, 'platforms': c.platforms, 'date': c.date, 'time': c.time, 'caption': c.caption, 'status': c.status,
            'assignee': c.assignee, 'file_url': c.file_url, 'notes': c.notes, 'updated': c.updated.timestamp()}


def _apply(c, d):
    from production.models import Event, Release
    if 'title' in d:
        c.title = R._text(d['title'], 300)
    if 'kind' in d:
        if d['kind'] not in dict(KINDS):
            raise ValueError('Onbekend soort content.')
        c.kind = d['kind']
    if 'status' in d:
        if d['status'] not in dict(STATUSES):
            raise ValueError('Onbekende status.')
        c.status = d['status']
    if 'platforms' in d:
        c.platforms = [p for p in (d['platforms'] if isinstance(d['platforms'], list) else []) if p in PLATFORMS]
    if 'date' in d:
        c.date = R._date(d['date'], 'Postdatum')
    if 'time' in d:
        c.time = R._time(d['time'], 'Tijd')
    for key, limit in (('caption', 4000), ('notes', 4000), ('assignee', 150)):
        if key in d:
            setattr(c, key, str(d[key] or '')[:limit])
    if 'file_url' in d:
        c.file_url = R._url(d['file_url'], 'Link naar bestand') if d['file_url'] else ''
    if 'event_id' in d:
        c.event = Event.objects.filter(id=d['event_id']).first() if d['event_id'] else None
    if 'release_id' in d:
        c.release = Release.objects.filter(id=d['release_id']).first() if d['release_id'] else None
    if not c.title.strip():
        raise ValueError('Geef de post een titel.')


@router.get('/calendar')
def calendar(request, start: str = '', end: str = ''):
    require(request, 'production')
    start = start or (date.today().replace(day=1) - timedelta(days=7)).isoformat()
    end = end or (date.today() + timedelta(days=45)).isoformat()
    items = S.our_items(start, end)
    outlook, error = [], ''
    try:
        outlook = S.outlook_items(start, end)
    except Exception as e:
        error = 'De Outlook-agenda is niet bereikbaar. ' + ('Geef de app het recht Calendars.ReadWrite.' if '403' in str(e) else 'Controleer de Microsoft-koppeling.')
    return {'items': items + outlook, 'outlook_error': error, 'mailbox': S.mailbox(), 'sync': S.enabled()}


@router.post('/calendar/outlook')
def outlook_create(request):
    require(request, 'production', write=True)
    try:
        S.outlook_save(body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    audit(actor(request), 'Afspraak in Outlook gezet')
    return {'ok': True}


@router.patch('/calendar/outlook/{ident}')
def outlook_update(request, ident: str):
    require(request, 'production', write=True)
    try:
        S.outlook_save(body(request), ident)
    except ValueError as e:
        raise HttpError(400, str(e))
    return {'ok': True}


@router.delete('/calendar/outlook/{ident}')
def outlook_remove(request, ident: str):
    require(request, 'production', write=True)
    try:
        S.outlook_delete(ident)
    except ValueError as e:
        raise HttpError(400, str(e))
    return {'ok': True}


@router.get('/content')
def content(request, event_id: str = '', release_id: str = ''):
    require(request, 'production')
    q = ContentItem.objects.select_related('event', 'release')
    if event_id:
        q = q.filter(event_id=event_id)
    if release_id:
        q = q.filter(release_id=release_id)
    return {'content': [content_dict(c) for c in q[:1000]], 'kinds': KINDS, 'statuses': STATUSES, 'platforms': PLATFORMS}


@router.post('/content')
def create_content(request):
    require(request, 'production', write=True)
    c = ContentItem(created_by=actor(request))
    try:
        _apply(c, body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    c.save()
    audit(actor(request), 'Post gepland', c.id, c.title)
    return content_dict(c)


@router.patch('/content/{ident}')
def update_content(request, ident: str):
    require(request, 'production', write=True)
    c = ContentItem.objects.filter(id=ident).select_related('event', 'release').first()
    if not c:
        raise HttpError(404, 'Post niet gevonden.')
    before = c.status
    try:
        _apply(c, body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    c.save()
    if c.status == 'posted' and before != 'posted':
        from core.notify import done
        done([c.id], actor(request), f'Gepost: {c.title}', c.event.name if c.event else (c.release.title if c.release else ''), '/calendar', key=f'posted:{c.id}')
    return content_dict(c)


@router.delete('/content/{ident}')
def delete_content(request, ident: str):
    require(request, 'production', write=True)
    ContentItem.objects.filter(id=ident).delete()
    return {'ok': True}

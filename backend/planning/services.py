"""The shared calendar: our planning plus the Outlook calendar of the team mailbox.

Our items (events, voyages, releases, posts, meetings) are written to Outlook
with the category "Moonshine", so Outlook shows exactly the same. Appointments
made in Outlook are read back and can be edited from the backoffice."""
import hashlib
import json
import urllib.parse
from datetime import date, datetime, timedelta
from core.services import audit, safe_error, settings
from .models import KINDS, ContentItem, OutlookLink

TZ = 'Europe/Amsterdam'
CATEGORY = 'Moonshine'
# Kind of an Outlook appointment made in the backoffice, stored as an Outlook category 'Moonshine: <name>'.
APPT_KINDS = {'meeting': 'Meeting', 'event': 'Event', 'release': 'Release', 'voyage': 'Voyage', 'content': 'Post'}


def appt_kind(categories):
    for c in categories or []:
        for k, name in APPT_KINDS.items():
            if c.lower() == f'moonshine: {name}'.lower():
                return k
    return ''
KIND = dict(KINDS)
SOURCES = ('event', 'voyage', 'release', 'content', 'meeting', 'step', 'task')
DEFAULT_PUSH = ['event', 'voyage', 'release', 'content', 'meeting']


def mailbox():
    return settings().get('calendar_mailbox') or 'info@moonshinednb.nl'


def enabled():
    return bool(settings().get('calendar_enabled'))


def _day(d, add=0):
    return (date.fromisoformat(d) + timedelta(days=add)).isoformat()


def item(source, ident, title, start, end=None, all_day=True, link='', color='', detail='', location=''):
    return {'id': f'{source}:{ident}', 'source': source, 'source_id': ident, 'title': title, 'start': start, 'end': end or start,
            'all_day': all_day, 'link': link, 'color': color, 'detail': detail, 'location': location}


def our_items(start, end):
    """Everything we plan ourselves between two dates (YYYY-MM-DD)."""
    from production.models import Event, Release, ReleaseStep, Voyage
    from meetings.models import Meeting
    from core.models import Task
    out = []
    for e in Event.objects.filter(date__gte=start, date__lte=end):
        if e.doors:
            out.append(item('event', e.id, f'{e.name}', f'{e.date}T{e.doors}', f'{e.date}T23:59', False, f'/events/{e.id}', 'event', e.venue, e.venue))
        else:
            out.append(item('event', e.id, f'{e.name}', e.date, link=f'/events/{e.id}', color='event', detail=e.venue, location=e.venue))
    for v in Voyage.objects.filter(date__gte=start, date__lte=end).exclude(status__in=['declined', 'cancelled']):
        where = ', '.join(x for x in (v.venue, v.city, v.country) if x)
        out.append(item('voyage', v.id, f'{v.performer} @ {v.event_name}', v.date, link=f'/voyages/{v.id}', color='voyage', detail=v.get_status_display(), location=where))
    for r in Release.objects.filter(release_date__gte=start, release_date__lte=end):
        out.append(item('release', r.id, f'Release: {r.catalog + " " if r.catalog else ""}{r.title}', r.release_date, link='/label', color='release', detail=r.artist))
    for s in ReleaseStep.objects.filter(due__gte=start, due__lte=end, done=False).select_related('release'):
        out.append(item('step', s.id, f'{s.label} · {s.release.title}', s.due, link='/label/planning', color='step'))
    for c in ContentItem.objects.filter(date__gte=start, date__lte=end).select_related('event', 'release'):
        about = c.event.name if c.event else c.release.title if c.release else ''
        title = f'{KIND.get(c.kind, c.kind)}: {c.title}' + (f' · {about}' if about else '')
        if c.time:
            out.append(item('content', c.id, title, f'{c.date}T{c.time}', f'{c.date}T{c.time}', False, f'/calendar?content={c.id}', 'content', c.get_status_display()))
        else:
            out.append(item('content', c.id, title, c.date, link=f'/calendar?content={c.id}', color='content', detail=c.get_status_display()))
    for m in Meeting.objects.filter(date__gte=start, date__lte=end):
        out.append(item('meeting', m.id, f'{m.title}', m.date, link=f'/meetings/{m.id}', color='meeting'))
    for t in Task.objects.filter(done=False, due__gte=start, due__lte=end).select_related('assignee').prefetch_related('assignees'):
        out.append(item('task', t.id, f'Taak: {t.title}', t.due.isoformat(), link='/tasks', color='task', detail=', '.join(u.display_name for u in t.people())))
    return out


# --- Outlook ---------------------------------------------------------------------

def _graph(path, payload=None, method=None):
    from integrations.graph import GRAPH, graph_token
    from integrations.http import http
    return http(GRAPH + path, payload, {'Authorization': 'Bearer ' + graph_token(), 'Prefer': f'outlook.timezone="{TZ}"'}, method)


def _box():
    return '/users/' + urllib.parse.quote(mailbox(), safe='')


def outlook_items(start, end):
    """Appointments from the Outlook calendar (not the ones we wrote ourselves)."""
    ours = set(OutlookLink.objects.values_list('outlook_id', flat=True))
    q = urllib.parse.urlencode({'startDateTime': f'{start}T00:00:00', 'endDateTime': f'{_day(end, 1)}T00:00:00', '$top': '500',
                                '$select': 'id,subject,start,end,isAllDay,location,categories,bodyPreview,webLink,organizer'})
    rows, path = [], f'{_box()}/calendarView?{q}'
    while path:
        page = _graph(path)
        rows.extend(page.get('value', []))
        nxt = page.get('@odata.nextLink', '')
        path = nxt.split('/v1.0', 1)[1] if nxt else ''
    out = []
    for e in rows:
        if e['id'] in ours:
            continue
        s, f = e['start']['dateTime'][:16], e['end']['dateTime'][:16]
        if e.get('isAllDay'):
            s, f = s[:10], _day(f[:10], -1)
        out.append({**item('outlook', e['id'], e.get('subject') or '(geen onderwerp)', s, f, bool(e.get('isAllDay')), e.get('webLink', ''), 'outlook',
                           e.get('bodyPreview', '')[:300], (e.get('location') or {}).get('displayName', '')), 'editable': True,
                    'kind': appt_kind(e.get('categories')), 'categories': e.get('categories') or []})
    return out


def _payload(it):
    body = {'subject': it['title'], 'categories': [CATEGORY], 'showAs': 'free',
            'body': {'contentType': 'text', 'content': (it.get('detail') or '') + '\n\nBeheerd door de Moonshine backoffice; wijzigingen hier worden overschreven.'},
            'location': {'displayName': it.get('location') or ''}}
    if it['all_day']:
        body.update(isAllDay=True, start={'dateTime': f"{it['start'][:10]}T00:00:00", 'timeZone': TZ}, end={'dateTime': f"{_day(it['end'][:10], 1)}T00:00:00", 'timeZone': TZ})
    else:
        end = it['end'] if it['end'] > it['start'] else (datetime.fromisoformat(it['start']) + timedelta(hours=1)).isoformat()[:16]
        body.update(isAllDay=False, start={'dateTime': it['start'] + ':00', 'timeZone': TZ}, end={'dateTime': end[:16] + ':00', 'timeZone': TZ})
    return body


def push():
    """Worker: write our items to Outlook, update changed ones, remove deleted ones."""
    from integrations.http import HttpError
    if not enabled():
        return
    sources = settings().get('calendar_push') or DEFAULT_PUSH
    start, end = _day(date.today().isoformat(), -30), _day(date.today().isoformat(), 400)
    wanted = {f"{it['source']}:{it['source_id']}": it for it in our_items(start, end) if it['source'] in sources}
    links = {f'{l.source}:{l.source_id}': l for l in OutlookLink.objects.all()}
    made = changed = removed = 0
    for key, it in wanted.items():
        body = _payload(it)
        fp = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
        link = links.get(key)
        if link and link.fingerprint == fp:
            continue
        try:
            if link:
                _graph(f'{_box()}/events/{urllib.parse.quote(link.outlook_id, safe="")}', body, 'PATCH')
                changed += 1
            else:
                raise HttpError(404)
        except HttpError as e:
            if e.code != 404:
                raise
            created = _graph(f'{_box()}/events', body, 'POST')
            OutlookLink.objects.update_or_create(source=it['source'], source_id=it['source_id'], defaults={'outlook_id': created['id'], 'fingerprint': fp})
            made += 1
            continue
        link.fingerprint = fp
        link.save(update_fields=['fingerprint', 'updated'])
    for key, link in links.items():
        if key in wanted:
            continue
        try:
            _graph(f'{_box()}/events/{urllib.parse.quote(link.outlook_id, safe="")}', method='DELETE')
        except HttpError as e:
            if e.code != 404:
                raise
        link.delete()
        removed += 1
    if made or changed or removed:
        audit('worker', 'Agenda gesynchroniseerd', detail=f'{made} nieuw, {changed} bijgewerkt, {removed} verwijderd')


def outlook_save(d, ident=None):
    """Create or edit an appointment in Outlook (not one of ours)."""
    from production import rules as R
    subject = R._text(d.get('title'), 255)
    if not subject:
        raise ValueError('Geef de afspraak een titel.')
    start = str(d.get('start') or '')
    if not start:
        raise ValueError('Kies een begin.')
    all_day = bool(d.get('all_day')) or len(start) == 10
    it = {'title': subject, 'start': start[:16], 'end': str(d.get('end') or start)[:16], 'all_day': all_day,
          'detail': R._text(d.get('detail'), 4000), 'location': R._text(d.get('location'), 300)}
    body = _payload(it)
    body.pop('showAs')
    kind = str(d.get('kind') or '')
    if kind and kind not in APPT_KINDS:
        raise ValueError('Onbekende soort afspraak.')
    keep = [c for c in (d.get('categories') or []) if isinstance(c, str) and not c.lower().startswith('moonshine')]
    body['categories'] = keep + ([f'Moonshine: {APPT_KINDS[kind]}'] if kind else [])
    body['body']['content'] = it['detail']
    if ident:
        if OutlookLink.objects.filter(outlook_id=ident).exists():
            raise ValueError('Deze afspraak komt uit de backoffice; wijzig hem op zijn eigen pagina.')
        return _graph(f'{_box()}/events/{urllib.parse.quote(ident, safe="")}', body, 'PATCH')
    return _graph(f'{_box()}/events', body, 'POST')


def outlook_delete(ident):
    if OutlookLink.objects.filter(outlook_id=ident).exists():
        raise ValueError('Deze afspraak komt uit de backoffice; verwijder hem op zijn eigen pagina.')
    _graph(f'{_box()}/events/{urllib.parse.quote(ident, safe="")}', method='DELETE')


def check():
    r = _graph(f'{_box()}/calendars?$select=name,isDefaultCalendar')
    return {'message': f'Agenda van {mailbox()} bereikbaar', 'data': {'calendars': [c['name'] for c in r.get('value', [])]}}

"""Meetings endpoints."""
from ninja import Router
from ninja.errors import HttpError
from core.access import actor, body, require
from . import services as S
from .models import Action, Meeting

router = Router()


def _meeting(ident):
    m = Meeting.objects.filter(id=ident).first()
    if not m:
        raise HttpError(404, 'Meeting niet gevonden.')
    return m


def _err(fn, *a):
    try:
        return fn(*a)
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))


@router.get('/meetings')
def meetings(request):
    require(request, 'production')
    return {'meetings': [S.meeting_dict(m) for m in Meeting.objects.prefetch_related('actions')[:500]]}


@router.get('/meetings/next')
def next_meeting(request):
    require(request, 'production')
    return {'next': S.next_meeting()}


@router.put('/meetings/next')
def set_next_meeting(request):
    require(request, 'production', write=True)
    try:
        return {'next': S.set_next(body(request), actor(request))}
    except ValueError as e:
        raise HttpError(400, str(e))


@router.get('/meetings/board')
def board(request):
    """Open action points per person (sticky notes)."""
    require(request, 'production')
    rows = Action.objects.filter(done=False).select_related('meeting').order_by('-meeting__date', 'created')[:500]
    return {'actions': [S.action_dict(a) for a in rows], 'team': [(u, n) for u, n in (('peppy', 'Pepijn'), ('bram', 'Bram'), ('shoroy', 'Shoroy'))]}


@router.post('/meetings')
def create(request):
    require(request, 'production', write=True)
    from production.drive import enabled
    if not enabled():
        raise HttpError(400, 'Stel eerst OneDrive in bij Koppelingen.')
    day = str(body(request).get('date') or '')
    from production import rules as R
    day = _err(R._date, day, 'Datum')
    if not day:
        raise HttpError(400, 'Kies een datum.')
    return S.meeting_dict(_err(S.create, day, actor(request)), True)


@router.get('/meetings/{ident}')
def detail(request, ident: str):
    require(request, 'production')
    return S.meeting_dict(_meeting(ident), True)


@router.post('/meetings/{ident}/read')
def reread(request, ident: str):
    require(request, 'production', write=True)
    return S.meeting_dict(_err(S.read, _meeting(ident)), True)


@router.post('/meetings/{ident}/extract')
def extract(request, ident: str):
    require(request, 'production', write=True)
    m = _meeting(ident)
    made, how = _err(S.extract, m, actor(request))
    return {'found': made, 'how': how, **S.meeting_dict(m, True)}


@router.post('/meetings/{ident}/actions')
def add_action(request, ident: str):
    require(request, 'production', write=True)
    m = _meeting(ident)
    d = body(request)
    text = str(d.get('text') or '').strip()[:500]
    if not text:
        raise HttpError(400, 'Vul het actiepunt in.')
    Action.objects.create(meeting=m, owner=S.owner_of(str(d.get('owner') or '')), text=text, due=str(d.get('due') or '')[:10])
    return S.meeting_dict(m, True)


@router.patch('/meeting-actions/{ident}')
def update_action(request, ident: int):
    require(request, 'production', write=True)
    a = Action.objects.filter(id=ident).select_related('meeting').first()
    if not a:
        raise HttpError(404, 'Actiepunt niet gevonden.')
    d = body(request)
    if 'done' in d:
        a.done = bool(d['done'])
    if 'owner' in d:
        a.owner = S.owner_of(str(d['owner'] or ''))
    if 'text' in d:
        a.text = str(d['text'] or '').strip()[:500] or a.text
    if 'due' in d:
        a.due = str(d['due'] or '')[:10]
    a.save()
    if a.task_id:
        S.sync_task(a)
    from core.notify import also, done, summary
    from core.services import audit
    who, entity = actor(request), f'ma:{a.id}'
    audit(who, 'Actiepunt afgevinkt' if d.get('done') is True else 'Actiepunt gewijzigd', entity, a.text[:100])
    if d.get('done') is True:
        done([entity], who, f'Afgerond: {a.text[:150]}', summary(entity), f'/meetings/{a.meeting_id}', key=f'actiondone:{a.id}')
    else:
        also(entity, who, a.text[:150], '', f'/meetings/{a.meeting_id}')
    return S.action_dict(a)


@router.delete('/meeting-actions/{ident}')
def delete_action(request, ident: int):
    require(request, 'production', write=True)
    Action.objects.filter(id=ident).delete()
    return {'ok': True}


@router.post('/meeting-actions/{ident}/task')
def to_task(request, ident: int):
    require(request, 'production', write=True)
    a = Action.objects.filter(id=ident).select_related('meeting').first()
    if not a:
        raise HttpError(404, 'Actiepunt niet gevonden.')
    t = S.make_task(a, actor(request))
    from core.services import audit
    audit(actor(request), 'Taak gemaakt van actiepunt', f'ma:{a.id}', a.text[:100])
    audit(actor(request), 'Taak gemaakt van actiepunt', t.id, a.text[:100])
    return {**S.action_dict(a), 'task_id': t.id, 'for': ', '.join(u.display_name for u in t.people()) or ''}

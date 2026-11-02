"""'My work': everything one person still has to do, from every part of the
backoffice, in one list. A meeting action or checklist point that became a task
shows up once, as that task."""
from datetime import date, timedelta
from ninja import Router
from .models import Task

router = Router()


def focus(user):
    """The areas someone works in (event roles), for what the overview shows first."""
    from production.steps import roles
    mine = [k for k, u in roles().items() if u == user.username]
    return mine + (['admin'] if user.role == 'admin' else [])


def items_for(user):
    today = date.today()
    out = []
    for t in Task.objects.filter(done=False).select_related('assignee').prefetch_related('assignees'):
        if user in t.people():
            out.append({'kind': 'task', 'id': t.id, 'title': t.title, 'due': t.due.isoformat() if t.due else '', 'context': '',
                        'link': '/tasks', 'high': t.priority == 'high'})
    from production.models import EventStep
    for s in EventStep.objects.filter(owner=user.username, done=False, task_id='').select_related('event'):
        if s.event.date and s.event.date < today.isoformat():
            continue
        from production.steps import due
        out.append({'kind': 'step', 'id': s.id, 'title': s.label, 'due': due(s, s.event.date), 'context': s.event.name,
                    'link': f'/events/{s.event_id}', 'high': False})
    from meetings.models import Action
    since = (today - timedelta(days=45)).isoformat()
    for a in Action.objects.filter(owner=user.username, done=False, task_id='', meeting__date__gte=since).select_related('meeting'):
        out.append({'kind': 'action', 'id': str(a.id), 'title': a.text, 'due': a.due, 'context': f'Meeting {a.meeting.date}',
                    'link': f'/meetings/{a.meeting_id}', 'high': False})
    from planning.models import ContentItem
    for c in ContentItem.objects.filter(assignee=user.username).exclude(status='posted').select_related('event', 'release'):
        if c.date and c.date < (today - timedelta(days=7)).isoformat():
            continue
        where = c.event.name if c.event else c.release.title if c.release else 'Contentplanning'
        link = f'/events/{c.event_id}/content' if c.event_id else '/calendar'
        out.append({'kind': 'content', 'id': c.id, 'title': c.title, 'due': c.date, 'context': where, 'link': link, 'high': False, 'status': c.status})
    out.sort(key=lambda i: (i['due'] or '9999-99-99', not i['high'], i['title'].lower()))
    return out


@router.get('/my-work')
def my_work(request):
    items = items_for(request.auth)
    today = date.today().isoformat()
    week = (date.today() + timedelta(days=7)).isoformat()
    return {'items': items, 'focus': focus(request.auth),
            'counts': {'late': sum(1 for i in items if i['due'] and i['due'] < today),
                       'week': sum(1 for i in items if i['due'] and today <= i['due'] <= week), 'all': len(items)}}


@router.get('/attention')
def attention(request):
    """For the overview: the coming events with what blocks them (late or next
    checklist points, with who), and the next meeting."""
    from production.models import Event, EventStep
    from production.steps import due, seed
    from meetings.services import next_meeting
    from .models import User
    today = date.today()
    names = {u.username: u.display_name for u in User.objects.all()}
    events = []
    for e in Event.objects.exclude(status='cancelled').exclude(date='').filter(date__gte=today.isoformat()).order_by('date')[:4]:
        seed(e)
        steps = list(EventStep.objects.filter(event=e))
        open_steps = sorted((s for s in steps if not s.done), key=lambda s: due(s, e.date) or '9999')
        top = [{'label': s.label, 'owner': names.get(s.owner, s.owner or 'Team'), 'due': due(s, e.date),
                'late': bool(due(s, e.date)) and due(s, e.date) < today.isoformat()} for s in open_steps[:3]]
        events.append({'id': e.id, 'name': e.name, 'date': e.date, 'venue': e.venue, 'days': (date.fromisoformat(e.date) - today).days,
                       'steps': len(steps), 'done': sum(1 for s in steps if s.done),
                       'late': sum(1 for s in open_steps if due(s, e.date) and due(s, e.date) < today.isoformat()), 'next': top})
    return {'events': events, 'meeting': next_meeting()}

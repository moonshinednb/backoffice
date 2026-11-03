"""Notifications. Not every logged action: only finished work (to the people
who worked on it), tasks assigned to you, and deadlines.

'Worked on it' = appears as actor in the audit log for one of the entities."""
from datetime import date, timedelta
from django.utils import timezone
from ninja import Router
from .access import body
from .models import AuditLog, Notification, Task, User

router = Router()


def involved(entities, exclude=''):
    names = set(AuditLog.objects.filter(entity__in=[e for e in entities if e]).values_list('actor', flat=True))
    names.discard(exclude)
    return list(User.objects.filter(username__in=names, is_active=True))


def notify(users, kind, title, body='', link='', key=''):
    for u in users:
        if key and Notification.objects.filter(user=u, key=key).exists():
            continue
        Notification.objects.create(user=u, kind=kind, title=title[:200], body=body[:500], link=link[:300], key=key[:120])


def worked_by(entities):
    """Per entity: who worked on it (audit log), most recent first."""
    out = {}
    rows = AuditLog.objects.filter(entity__in=[e for e in entities if e]).order_by('-created').values_list('entity', 'actor')
    for entity, who in rows:
        people = out.setdefault(entity, [])
        if who not in people and who not in ('systeem', 'OneDrive', 'Advancingmail', ''):
            people.append(who)
    return out


def summary(entity):
    """'5 wijzigingen in 12 dagen door Bram, Shoroy' for the work on one thing."""
    rows = list(AuditLog.objects.filter(entity=entity).order_by('created').values_list('actor', 'created'))
    if len(rows) < 2:
        return ''
    names = {u.username: u.display_name for u in User.objects.all()}
    people = list(dict.fromkeys(names.get(a, a) for a, _ in rows))
    days = (timezone.now() - rows[0][1]).days
    span = f'in {days} dagen' if days > 1 else 'vandaag' if days == 0 else 'in 2 dagen'
    return f'{len(rows)} wijzigingen {span} door {", ".join(people)}.'


def also(entity, actor, title, what='', link=''):
    """Someone works on something another person worked on in the last two weeks:
    tell those people, at most once a day per thing and person."""
    since = timezone.now() - timedelta(days=14)
    names = set(AuditLog.objects.filter(entity=entity, created__gte=since).exclude(actor=actor).values_list('actor', flat=True))
    users = list(User.objects.filter(username__in=names, is_active=True))
    if not users:
        return
    who = User.objects.filter(username=actor).first()
    notify(users, 'activity', f'{who.display_name if who else actor} werkt ook aan: {title}'[:200], what, link,
           key=f'also:{entity}:{actor}:{date.today().isoformat()}')


def done(entities, actor, title, body='', link='', key=''):
    """Something is complete: tell everyone who worked on it, except the
    person who just finished it."""
    notify(involved(entities, exclude=actor), 'done', title, body, link, key)


def assigned(task, actor, users=None):
    for u in (users if users is not None else task.people()):
        if u.username != actor:
            notify([u], 'assigned', 'Nieuwe taak voor jou', f'{task.title} (van {actor})', '/tasks', key=f'assign:{task.id}:{u.id}')


def deadlines():
    """Daily: tasks due tomorrow or overdue, and release steps due soon."""
    today = date.today()
    for t in Task.objects.filter(done=False, assignee__isnull=False, due__isnull=False, due__lte=today + timedelta(days=1)).prefetch_related('assignees'):
        late = t.due < today
        notify(t.people(), 'deadline', 'Taak over tijd' if late else 'Taak morgen af', t.title, '/tasks',
               key=f'deadline:{t.id}:{"late" if late else "soon"}')
    from production.models import ReleaseStep
    soon = (today + timedelta(days=2)).isoformat()
    for s in ReleaseStep.objects.filter(done=False).exclude(due='').filter(due__lte=soon).select_related('release'):
        late = s.due < today.isoformat()
        notify(involved([s.release_id]), 'deadline', ('Over tijd: ' if late else 'Binnenkort: ') + s.label,
               f'{s.release.title} · {s.due}', '/label/planning', key=f'step:{s.id}:{"late" if late else "soon"}')
    from production.models import EventStep
    from production.steps import due
    for s in EventStep.objects.filter(done=False).exclude(owner='').select_related('event'):
        d = due(s, s.event.date)
        # Deadlines already past when the checklist was made get no alarm.
        if not d or d > soon or d < s.created.date().isoformat() or (s.event.date and s.event.date < today.isoformat()):
            continue
        user = User.objects.filter(username=s.owner, is_active=True).first()
        if user:
            late = d < today.isoformat()
            notify([user], 'deadline', ('Over tijd: ' if late else 'Binnenkort: ') + s.label, f'{s.event.name} · {d}',
                   f'/events/{s.event_id}', key=f'evstep:{s.id}:{"late" if late else "soon"}')


@router.get('/notifications')
def notifications(request):
    rows = Notification.objects.filter(user=request.auth)[:50]
    return {'unread': Notification.objects.filter(user=request.auth, read=False).count(),
            'notifications': [{'id': n.id, 'kind': n.kind, 'title': n.title, 'body': n.body, 'link': n.link,
                               'created': n.created.timestamp(), 'read': n.read} for n in rows]}


@router.post('/notifications/read')
def mark_read(request):
    ids = body(request).get('ids')
    q = Notification.objects.filter(user=request.auth, read=False)
    if isinstance(ids, list):
        q = q.filter(id__in=[i for i in ids if isinstance(i, int)])
    q.update(read=True)
    Notification.objects.filter(user=request.auth, created__lt=timezone.now() - timedelta(days=60)).delete()
    return {'ok': True}

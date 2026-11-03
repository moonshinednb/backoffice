"""The team checklist of an event: per phase, who does what and before when.

Owners follow the roles (setting `event_roles`), deadlines follow the event
date. A step tied to a OneDrive folder ticks itself once there are files in
it; sending the advancing mail ticks 'advancing sent'. Nothing is ever
unticked automatically."""
from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone
from core.services import audit, settings
from . import rules as R
from .models import Booking, Event, EventStep, Send

ROLES = {'bookings': 'peppy', 'artwork': 'peppy', 'advancing': 'shoroy', 'promo': 'anne', 'legal': 'bram', 'finance': 'niels'}
ROLE_LABELS = {'bookings': 'Bookings', 'artwork': 'Artwork', 'advancing': 'Advancing', 'promo': 'Promo', 'legal': 'Juridisch (label)', 'finance': 'Boekhouding'}

# key, phase, label, role, days from the event, OneDrive folder that ticks it ('<section>[/<subfolder>]')
STEPS = [
    ('costing', 'prep', 'Costing/begroting met Luxor afgestemd', 'bookings', -56, 'finance'),
    ('lineup', 'prep', 'Line-up rond: alle artiesten geboekt', 'bookings', -49, ''),
    ('poster', 'prep', 'Poster en line-up-artwork', 'artwork', -42, 'artwork'),
    ('epks', 'promo', 'EPK’s van de line-up binnen', 'bookings', -42, 'epks'),
    ('announcements', 'promo', 'Artist announcements per artiest', 'artwork', -35, 'artwork/Artist Announcements'),
    ('promo_plan', 'promo', 'Promoplanning: posts ingepland in de agenda', 'promo', -35, ''),
    ('reels', 'promo', 'Reels/TikToks klaar', 'promo', -21, 'content/Reels & TikToks'),
    ('giveaway', 'promo', 'Giveaway', 'promo', -14, 'content/Giveaway'),
    ('countdown', 'promo', 'Countdown-stories klaar', 'promo', -10, 'content/Countdown'),
    ('riders', 'production', 'Riders van alle artiesten binnen', 'advancing', -21, 'riders'),
    ('travel', 'production', 'Reis en hotel van de artiesten geregeld', 'advancing', -14, ''),
    ('timetable', 'production', 'Timetable rond', 'advancing', -14, ''),
    ('advancing_sent', 'production', 'Advancing naar Luxor gestuurd: riders, timetable, contacten', 'advancing', -10, ''),
    ('crew', 'production', 'Technical rider, crew- en gastenlijst', 'advancing', -7, 'productie'),
    ('briefings', 'production', 'Briefings voor crew, foto en video', 'advancing', -5, ''),
    ('aftermovie', 'after', 'Foto’s en aftermovie in 07 Na afloop', 'promo', 7, 'na afloop'),
    ('evaluation', 'after', 'Evaluatie met het team', '', 10, ''),
]


def roles():
    custom = settings().get('event_roles')
    return {**ROLES, **(custom if isinstance(custom, dict) else {})}


def _active(username):
    from core.models import User
    return username if username and User.objects.filter(username=username, is_active=True).exists() else ''


def seed(e):
    """Create the standard checklist once, for events that are still coming."""
    from .drive import is_upcoming
    if e.steps_seeded or not is_upcoming(e):
        return
    with transaction.atomic():
        if not Event.objects.filter(id=e.id, steps_seeded=False).update(steps_seeded=True):
            return
        owners = {role: _active(user) for role, user in roles().items()}
        EventStep.objects.bulk_create([EventStep(event=e, key=key, phase=phase, label=label, owner=owners.get(role, ''), offset=offset, auto=auto, sort=i)
                                       for i, (key, phase, label, role, offset, auto) in enumerate(STEPS)])
    e.steps_seeded = True


def due(s, event_date):
    if s.due:
        return s.due
    if not event_date:
        return ''
    return (date.fromisoformat(event_date) + timedelta(days=s.offset)).isoformat()


def step_dict(s, event_date=None):
    event_date = s.event.date if event_date is None else event_date
    return {'id': s.id, 'key': s.key, 'phase': s.phase, 'label': s.label, 'owner': s.owner, 'due': due(s, event_date), 'manual_due': bool(s.due),
            'auto': s.auto, 'done': s.done, 'done_by': s.done_by, 'done_at': s.done_at.timestamp() if s.done_at else None, 'task_id': s.task_id}


def _sync_tasks(steps):
    """A step made into a task is done as soon as that task is."""
    from core.models import Task
    linked = {s.task_id: s for s in steps if s.task_id and not s.done}
    for t in Task.objects.filter(id__in=linked, done=True):
        s = linked[t.id]
        s.done, s.done_by, s.done_at = True, (t.assignee.username if t.assignee else 'Taken'), timezone.now()
        s.save(update_fields=['done', 'done_by', 'done_at'])


def event_steps(event_id):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Evenement niet gevonden.')
    seed(e)
    steps = list(e.steps.all())
    _sync_tasks(steps)
    return {'steps': [step_dict(s, e.date) for s in steps], 'phases': EventStep.PHASES, 'seeded': e.steps_seeded}


def _mark(s, who):
    s.done, s.done_by, s.done_at = True, who, timezone.now()
    s.save(update_fields=['done', 'done_by', 'done_at'])


def auto_check(e, files=None):
    """Tick the steps whose folder has files, and 'advancing sent' after the venue mail."""
    from . import drive
    open_steps = [s for s in e.steps.filter(done=False) if s.auto or s.key == 'advancing_sent']
    if not open_steps:
        return 0
    ticked = 0
    if any(s.key == 'advancing_sent' for s in open_steps) and Send.objects.filter(event_id=e.id, status='sent').exists():
        for s in open_steps:
            if s.key == 'advancing_sent':
                _mark(s, 'Advancingmail')
                ticked += 1
    if not e.drive_id or not drive.enabled():
        return ticked
    files = files or drive.event_files(e)
    sections = {x['name']: x for x in files['sections']}
    # Every act needs a rider: the act name or one of its members in a file name is enough.
    artists = {}
    for b in Booking.objects.filter(event_id=e.id).exclude(status='cancelled').select_related('artist', 'lineup_act'):
        key = b.lineup_act_id or b.id
        artists.setdefault(key, {b.lineup_act.name.lower()} if b.lineup_act else set()).add(b.artist.name.lower())
    for s in open_steps:
        if not s.auto:
            continue
        key, _, sub = s.auto.partition('/')
        section = sections.get(drive.section(key))
        if not section:
            continue
        if sub:
            folder = next((i for i in section['items'] if i['folder'] and i['name'].lower() == sub.lower()), None)
            ok = bool(folder and folder['count'])
        elif key == 'riders' and artists:
            names = ' '.join(i['name'].lower() for i in section['items'])
            ok = all(any(n in names for n in act_names) for act_names in artists.values())
        else:
            ok = section['filled']
        if ok:
            _mark(s, 'OneDrive')
            ticked += 1
    return ticked


def step_update(ident, payload, actor):
    from core.models import Task
    s = EventStep.objects.filter(id=ident).select_related('event').first()
    if not s:
        raise ValueError('Punt niet gevonden.')
    if 'label' in payload:
        s.label = R._text(payload.get('label'), 200)
        if not s.label:
            raise ValueError('Geef het punt een naam.')
    if 'owner' in payload:
        owner = str(payload.get('owner') or '')
        if owner and not _active(owner):
            raise ValueError('Kies iemand uit het team.')
        s.owner = owner
    if 'due' in payload:
        s.due = R._date(payload.get('due'), 'Deadline')
    if 'phase' in payload:
        if payload['phase'] not in dict(EventStep.PHASES):
            raise ValueError('Onbekende fase.')
        s.phase = payload['phase']
    if 'done' in payload:
        if type(payload['done']) is not bool:
            raise ValueError('Ongeldige status.')
        s.done = payload['done']
        s.done_by, s.done_at = (str(actor), timezone.now()) if s.done else ('', None)
        if s.task_id:
            Task.objects.filter(id=s.task_id).update(done=s.done, dirty=True)
    s.save()
    audit(actor, 'Eventpunt bijgewerkt', s.event_id, s.label)
    audit(actor, 'Afgevinkt' if payload.get('done') is True else 'Eventpunt bijgewerkt', s.id, s.event.name)
    from core.notify import also, done, summary
    link = f'/events/{s.event_id}'
    if payload.get('done') is True:
        done([s.id], str(actor), f'Afgerond: {s.label}', ' '.join(x for x in [s.event.name + '.', summary(s.id)] if x), link, key=f'stepdone:{s.id}')
    else:
        also(s.id, str(actor), f'{s.label} ({s.event.name})', '', link)
    return step_dict(s)


def step_add(event_id, payload, actor):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Evenement niet gevonden.')
    label = R._text(payload.get('label'), 200)
    if not label:
        raise ValueError('Geef het punt een naam.')
    phase = payload.get('phase') if payload.get('phase') in dict(EventStep.PHASES) else 'prep'
    owner = str(payload.get('owner') or '')
    if owner and not _active(owner):
        raise ValueError('Kies iemand uit het team.')
    last = e.steps.order_by('-sort').values_list('sort', flat=True).first() or 0
    s = EventStep.objects.create(event=e, label=label, phase=phase, owner=owner, due=R._date(payload.get('due'), 'Deadline'), sort=last + 1)
    audit(actor, 'Eventpunt toegevoegd', e.id, label)
    return step_dict(s, e.date)


def step_delete(ident, actor):
    s = EventStep.objects.filter(id=ident).first()
    if not s:
        raise ValueError('Punt niet gevonden.')
    s.delete()
    audit(actor, 'Eventpunt verwijderd', s.event_id, s.label)


def make_task(ident, actor):
    """Put a step on someone's task list (and Microsoft To Do)."""
    from core.models import Task, User
    s = EventStep.objects.filter(id=ident).select_related('event').first()
    if not s:
        raise ValueError('Punt niet gevonden.')
    if s.task_id and Task.objects.filter(id=s.task_id).exists():
        return step_dict(s)
    d = due(s, s.event.date)
    t = Task.objects.create(title=f'{s.event.name}: {s.label}'[:300], description=f'Eventchecklist van {s.event.name} ({s.event.date or "datum onbekend"}).',
                            assignee=User.objects.filter(username=s.owner, is_active=True).first(), due=date.fromisoformat(d) if d else None,
                            done=s.done, dirty=True)
    s.task_id = t.id
    s.save(update_fields=['task_id'])
    audit(actor, 'Taak gemaakt van eventpunt', s.event_id, s.label)
    if t.assignee:
        from core.notify import assigned
        assigned(t, actor)
    return step_dict(s)


def mine(username, limit=40):
    """Open steps of one person, for events that are still coming."""
    today = date.today().isoformat()
    rows = []
    for s in EventStep.objects.filter(owner=username, done=False).select_related('event'):
        if s.event.date and s.event.date < today:
            continue
        rows.append({**step_dict(s), 'event_id': s.event_id, 'event_name': s.event.name, 'event_date': s.event.date})
    rows.sort(key=lambda r: r['due'] or '9999')
    return rows[:limit]


def refresh_upcoming():
    """Worker: create checklists for new upcoming events and tick what is on OneDrive."""
    from .drive import is_upcoming
    for e in Event.objects.exclude(status='cancelled'):
        if is_upcoming(e):
            seed(e)
            auto_check(e)

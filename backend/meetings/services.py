import re
from datetime import date, timedelta
from django.utils import timezone
from core.models import Task, User
from core.services import audit, safe_error, settings
from .models import Action, Meeting

MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
NAMES = {'pepijn': 'peppy', 'peppy': 'peppy', 'bram': 'bram', 'shoroy': 'shoroy', 'shorrie': 'shoroy'}
TEAM = ('peppy', 'bram', 'shoroy')


def root():
    return (settings().get('meetings_folder') or '1. Vergaderingen').strip('/')


def template():
    return settings().get('meetings_template') or f'{root()}/Template vergaderingen Moonshine Label.docx'


def owner_of(name):
    n = (name or '').strip()
    return NAMES.get(n.lower(), n if n.lower() not in ('', 'team', 'iedereen', 'allen', 'n/a') else '')


def parse_date(text):
    """Dates in folder and file names: 2025-12-15, 15-12-2025, 15-12-25, 9-3-26."""
    m = re.search(r'(20\d\d)-(\d{1,2})-(\d{1,2})', text)
    if m:
        y, a, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        mo, d = (a, b) if a <= 12 else (b, a)
        return f'{y:04d}-{mo:02d}-{d:02d}'
    m = re.search(r'(\d{1,2})-(\d{1,2})-(\d{2,4})', text)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y = y + 2000 if y < 100 else y
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f'{y:04d}-{mo:02d}-{d:02d}'
    return ''


def action_dict(a):
    return {'id': a.id, 'meeting_id': a.meeting_id, 'meeting_date': a.meeting.date, 'owner': a.owner, 'text': a.text, 'due': a.due,
            'done': a.done, 'source': a.source, 'task_id': a.task_id}


def meeting_dict(m, full=False):
    actions = list(m.actions.all())
    out = {'id': m.id, 'date': m.date, 'title': m.title, 'drive_url': m.drive_url, 'file_name': m.file_name,
           'open': sum(1 for a in actions if not a.done), 'actions_count': len(actions),
           'read_at': m.read_at.timestamp() if m.read_at else None, 'extracted_at': m.extracted_at.timestamp() if m.extracted_at else None}
    if full:
        out['text'] = m.text
        out['actions'] = [action_dict(a) for a in actions]
    return out


def read(m):
    """Fetch the Word file from OneDrive and keep its text."""
    from integrations.graph import download_item
    from integrations.office import docx_text
    if not m.drive_id:
        raise ValueError('Deze meeting heeft geen Word-bestand op OneDrive.')
    item, content = download_item(m.drive_id)
    m.text = docx_text(content)[:100000]
    m.drive_url = item.get('webUrl', m.drive_url)
    m.read_at = timezone.now()
    m.save(update_fields=['text', 'drive_url', 'read_at'])
    return m


PROMPT = '''Je krijgt de notulen van een teammeeting van Moonshine (een drum & bass label en eventorganisatie).
Haal ALLE concrete actiepunten en taken eruit die na deze meeting gedaan moeten worden.
Regels:
- Wijs elk actiepunt toe aan één persoon als de tekst dat zegt of het duidelijk is (bijv. iemand bracht het punt in of neemt het op zich). Namen in het team: Pepijn, Bram, Shoroy, Wessel, Bert. Is het onduidelijk, gebruik "team".
- Schrijf elke taak kort en concreet, als opdracht (max. 20 woorden), in het Nederlands.
- Deadline alleen als die in de tekst staat (YYYY-MM-DD, de meeting was op {date}); anders null.
- Verzin niets en neem geen agendapunten of mededelingen op die geen taak zijn.
Antwoord ALLEEN met JSON: {{"actions": [{{"owner": "Pepijn", "task": "...", "due": null}}]}}

NOTULEN:
{text}'''


PEOPLE = r'(Pepijn|Peppy|Bram|Shoroy|Shorrie|Wessel|Bert|Iedereen|Team|Allen)'


def table_actions(lines):
    """A 'Wie / Actie / Deadline' table: Word cells arrive as separate lines."""
    out = []
    for i in range(len(lines) - 1):
        if lines[i].lower() == 'wie' and lines[i + 1].lower().startswith('actie'):
            width = 3 if i + 2 < len(lines) and lines[i + 2].lower().startswith('deadline') else 2
            j = i + width
            while j + 1 < len(lines) and re.fullmatch(PEOPLE, lines[j], re.I):
                task = lines[j + 1]
                deadline = lines[j + 2] if width == 3 and j + 2 < len(lines) else ''
                out.append((lines[j], f'{task} (deadline: {deadline})' if deadline and not re.fullmatch(PEOPLE, deadline, re.I) else task))
                j += width
    return out


def heuristic(text):
    """Without AI: a Wie/Actie table, lines that start with 'Actie', and name-prefixed lines in the action section."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    table = table_actions(lines)
    if table:
        return table
    out, section = [], False
    for line in text.splitlines():
        s = line.strip(' -•\t')
        if re.match(r'(samenvatting en )?actiepunten', s, re.I):
            section = True
            continue
        m = re.match(r'(?:Actie(?:punt)?[^:]*):\s*(.+)', s, re.I)
        if m:
            out.append(('', m.group(1)))
            continue
        m = re.match(r'(Pepijn|Bram|Shoroy|Wessel|Bert)\s*[:\-–]\s*(.+)', s, re.I)
        if section and m:
            out.append((m.group(1), m.group(2)))
    return out


def extract(m, actor='systeem'):
    """Replace the AI-found action points of this meeting (manual ones stay)."""
    body = m.text.strip()
    if len(body) < 200:
        raise ValueError('Er staat nog te weinig in de notulen om actiepunten uit te halen.')
    try:
        from integrations.claude import complete_json
        data = complete_json(PROMPT.format(date=m.date, text=body[:24000]))
        found = [(a.get('owner', ''), a.get('task', ''), a.get('due') or '') for a in data.get('actions', []) if isinstance(a, dict)]
        how = 'ai'
    except ValueError as e:
        if 'AI-koppeling' not in str(e):
            raise
        found, how = [(o, t, '') for o, t in heuristic(body)], 'manual'
    m.actions.filter(source='ai', done=False, task_id='').delete()
    made = 0
    for owner, task, due in found:
        task = str(task).strip()[:500]
        if not task:
            continue
        due = due if re.fullmatch(r'20\d\d-\d\d-\d\d', str(due)) else ''
        Action.objects.create(meeting=m, owner=owner_of(str(owner)), text=task, due=due, source='ai')
        made += 1
    m.extracted_at = timezone.now()
    m.save(update_fields=['extracted_at'])
    audit(actor, 'Actiepunten uit notulen gehaald', m.id, f'{made} gevonden ({how})')
    return made, how


def make_task(a, actor):
    """Turn an action point into a real task (also synced to To Do)."""
    if a.task_id and Task.objects.filter(id=a.task_id).exists():
        return Task.objects.get(id=a.task_id)
    assignee = User.objects.filter(username=a.owner, is_active=True).first()
    t = Task.objects.create(title=a.text[:300], description=f'Uit de meeting van {a.meeting.date}', assignee=assignee,
                            due=date.fromisoformat(a.due) if a.due else None, dirty=True)
    a.task_id = t.id
    a.save(update_fields=['task_id'])
    audit(actor, 'Taak aangemaakt', t.id, 'uit meeting')
    if assignee and assignee.username != actor:
        from core.notify import assigned
        assigned(t, actor)
    return t


def create(day, actor):
    """New meeting: copy the Word template to the right OneDrive folder."""
    from integrations.graph import copy_item
    d = date.fromisoformat(day)
    stamp = d.strftime('%d-%m-%Y')
    folder = f'{root()}/{d.year}/{d.month}. {MONTHS[d.month - 1]}/MS Meeting {stamp}'
    name = f'MS Meeting {stamp}.docx'
    item = copy_item(template(), folder, name)
    m = Meeting.objects.create(date=day, title=f'MS Meeting {stamp}', drive_id=item['id'], drive_url=item['webUrl'], file_name=name)
    audit(actor, 'Meeting aangemaakt', m.id, day)
    return m


def refresh_recent():
    """Worker: re-read the minutes of the last two weeks and extract actions
    from minutes that were filled in but not processed yet."""
    since = (date.today() - timedelta(days=14)).isoformat()
    for m in Meeting.objects.filter(date__gte=since).exclude(drive_id=''):
        try:
            before = m.text
            read(m)
            if m.text != before and len(m.text) > 600 and (not m.extracted_at or m.text != before):
                extract(m)
        except Exception as e:  # one broken file must not stop the rest
            audit('worker', 'Meeting lezen mislukt', m.id, safe_error(e)[:200])


def next_meeting():
    """The coming meeting: one already made for a future date, else the date
    someone set, else the expected date from the rhythm of the last two."""
    from datetime import date, timedelta
    from core.services import settings
    today = date.today().isoformat()
    planned = Meeting.objects.filter(date__gte=today).order_by('date').first()
    custom = settings().get('next_meeting') or {}
    if planned:
        same = custom.get('date') == planned.date
        return {'date': planned.date, 'time': custom.get('time', '') if same else '', 'place': custom.get('place', '') if same else '',
                'source': 'planned', 'meeting_id': planned.id}
    if custom.get('date', '') >= today:
        return {'date': custom['date'], 'time': custom.get('time', ''), 'place': custom.get('place', ''), 'source': 'set', 'meeting_id': None}
    last = list(Meeting.objects.exclude(date='').order_by('-date').values_list('date', flat=True)[:2])
    if len(last) == 2:
        a, b = date.fromisoformat(last[0]), date.fromisoformat(last[1])
        step = max(7, min(28, (a - b).days))
        nxt = a + timedelta(days=step)
        while nxt.isoformat() < today:
            nxt += timedelta(days=step)
        return {'date': nxt.isoformat(), 'time': custom.get('time', ''), 'place': custom.get('place', ''), 'source': 'expected', 'meeting_id': None, 'every': step}
    return None


def set_next(payload, actor):
    from core.services import audit, set_setting
    from production import rules as R
    day = R._date(payload.get('date'), 'Datum')
    if not day:
        raise ValueError('Kies een datum.')
    time_ = R._time(payload.get('time'), 'Tijd') if payload.get('time') else ''
    set_setting('next_meeting', {'date': day, 'time': time_, 'place': R._text(payload.get('place'), 120)})
    audit(actor, 'Volgende meeting ingesteld', '', day)
    return next_meeting()

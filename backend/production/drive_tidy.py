"""Bring existing event folders on OneDrive into the standard tree.

Only renames and moves, never deletes. Every step is written to a log so it
can be undone (manage.py tidy_event_folders --undo <log>). Moving keeps
sharing links working: OneDrive links follow the item, not the path."""
import re
from datetime import date
from . import drive

STAGE = re.compile(r'(?i)\b(main ?stage|basement|kelder|bovenzaal)\b')
DATE_FOLDER = re.compile(r'^(\[TBC\]\s*)?(\d{4})-(\d{1,2})-(\d{1,2})\b(.*)$')
MEDIA = {'.mp3', '.wav', '.insv', '.lrv', '.mov', '.mp4'}
IMAGES = {'.psd', '.png', '.jpg', '.jpeg', '.ai', '.tif', '.tiff', '.svg'}
# Folders that simply *are* the section: renamed instead of moved inside it.
PLAIN = {'finance': {'finance', 'financien', 'financiën', 'costing'}, 'epks': {'epk', 'epks', 'presskit', 'presskits', 'press kits'},
         'riders': {'rider', 'riders'}, 'artwork': {'artwork', 'artworks'}, 'content': {'content'}, 'productie': {'productie'}}


def classify(name, folder, peek=()):
    """(section key, new name or None) for an item at the top of an event
    folder, or None to leave it where it is."""
    n = name.lower().strip()
    if re.match(r'^0\d\s', n):
        return None
    if folder:
        stage = STAGE.search(name)
        sub = stage.group(1).title().replace(' ', '') if stage else None
        if re.search(r'^content van|aftermovie|^photos?$|foto|footage|dji|360|recording|set audio|opname', n):
            return 'na afloop', None
        if re.search(r'financ|costing|begroting|budget', n):
            return 'finance', None
        if re.search(r'epk|press ?kits?|presskit|press ?pack', n):
            return 'epks', sub
        if 'rider' in n:
            return 'riders', sub
        if n == 'assets':
            crew = any(re.search(r'brief|photographer|videographer', p.lower()) for p in peek)
            return ('productie' if crew else 'artwork'), None
        if re.search(r'artwork|poster', n):
            return 'artwork', None
        if re.search(r'content|announcement|days left|reels?\b|tiktok|timetable|giveaway|interview', n) or n == 'tim':
            return 'content', None
        if re.search(r'idea|moodboard|randprogramm|brief|organisatie', n):
            return 'productie', None
        return None
    ext = '.' + n.rsplit('.', 1)[-1] if '.' in n else ''
    if re.search(r'costing|begroting|budget|factu', n) or re.fullmatch(r'[\d\-]+\.xlsx', n):
        return 'finance', None
    if re.match(r'technical rider\s+\d', n):
        return 'productie', None  # our own rider for the venue, not an artist's
    if 'rider' in n:
        return 'riders', None
    if re.search(r'guestlist|crewlist|advancing|briefing|moodboard|line-?up|dj namen|taakverdeling|media distribution|moonshine x|basement @|draaiboek', n):
        return 'productie', None
    if re.search(r'evaluatie|recap', n):
        return 'na afloop', None
    if re.search(r'caption|promotekst|promokalender|content ide', n):
        return 'content', None
    if ext in IMAGES:
        return 'artwork', None
    if ext in MEDIA:
        return 'na afloop', None
    return None


def folder_date(name):
    """'2025-9-26' -> ('2025-09-26', '', False); '[TBC] 2026-08-01' -> (..., '', True)."""
    m = DATE_FOLDER.match(name.strip())
    if not m:
        return None
    try:
        d = date(int(m.group(2)), int(m.group(3)), int(m.group(4))).isoformat()
    except ValueError:
        return None
    return d, m.group(5).strip(' -'), bool(m.group(1))


def normal_name(name):
    parsed = folder_date(name)
    if not parsed or parsed[2]:
        return name
    d, rest, _ = parsed
    return f'{d} {rest}' if rest else d


def plan(kids, peek=None):
    """Steps for one event folder: [(kind, item, section, new name)].
    kind is 'rename' (the folder becomes the section), 'move' or 'keep'."""
    peek = peek or {}
    steps, taken = [], {c['name'] for c in kids}
    plain = set().union(*PLAIN.values())
    # Folders that simply are a section go first, so they are renamed rather than nested.
    for c in sorted(kids, key=lambda x: ('folder' not in x, x['name'].lower().strip() not in plain, x['name'].lower())):
        found = classify(c['name'], 'folder' in c, peek.get(c['id'], ()))
        if not found:
            steps.append(('keep', c, None, None))
            continue
        key, sub = found
        top = drive.section(key)
        if c['name'] == top:
            continue
        if 'folder' in c and not sub and c['name'].lower().strip() in PLAIN.get(key, ()) and top not in taken:
            steps.append(('rename', c, top, None))
            taken.add(top)
        else:
            steps.append(('move', c, top, sub))
            taken.add(top)
    return steps


def _free(name, used):
    if name not in used:
        return name
    stem, dot, ext = name.rpartition('.') if '.' in name else (name, '', '')
    for i in range(2, 50):
        candidate = f'{stem} ({i}).{ext}' if dot else f'{name} ({i})'
        if candidate not in used:
            return candidate
    return name


def tidy_event(folder, apply, log, say):
    """Rename the event folder to the standard date format and sort its top level."""
    from integrations.graph import item_children, move_item, rename_item
    name = normal_name(folder['name'])
    if name != folder['name']:
        say(f"  map hernoemen: {folder['name']} -> {name}")
        if apply:
            rename_item(folder['id'], name)
            log.append({'id': folder['id'], 'parent': folder['parentReference']['id'], 'from': folder['name'], 'to_parent': folder['parentReference']['id'], 'to': name})
    kids = item_children(folder['id'])
    peek = {c['id']: [x['name'] for x in item_children(c['id'])] for c in kids if 'folder' in c and c['name'].lower() == 'assets'}
    sections = {c['name']: c['id'] for c in kids if 'folder' in c}
    contents = {}
    for kind, item, top, sub in plan(kids, peek):
        if kind == 'keep':
            say(f"  laten staan: {item['name']}")
            continue
        if kind == 'rename':
            say(f"  hernoemen: {item['name']} -> {top}")
            if apply:
                rename_item(item['id'], top)
                log.append({'id': item['id'], 'parent': folder['id'], 'from': item['name'], 'to_parent': folder['id'], 'to': top})
            sections[top] = item['id']
            continue
        if top not in sections:
            say(f"  map maken: {top}")
            if apply:
                from integrations.graph import create_folder
                sections[top] = create_folder(folder['id'], top)
            else:
                sections[top] = 'new:' + top
        target = sections[top]
        if target not in contents:
            contents[target] = set() if target.startswith('new:') else {x['name'] for x in item_children(target)}
        new = _free(sub or item['name'], contents[target])
        contents[target].add(new)
        say(f"  verplaatsen: {item['name']} -> {top}/{new}")
        if apply:
            move_item(item['id'], target, new if new != item['name'] else None)
            log.append({'id': item['id'], 'parent': folder['id'], 'from': item['name'], 'to_parent': target, 'to': new})


def undo(log, say):
    """Put every item back where it was, newest step first."""
    from integrations.graph import move_item
    for step in reversed(log):
        say(f"  terug: {step['to']} -> {step['from']}")
        move_item(step['id'], step['parent'], step['from'])

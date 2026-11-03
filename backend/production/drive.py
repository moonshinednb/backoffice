"""Standard OneDrive folder trees for events, line-up artists and releases.

The files of Moonshine live on OneDrive in the team's own structure; the
backoffice only creates the folders and remembers where they are. All
names and subfolders are settings, so the layout can change without code."""
import re
from datetime import date
from core.services import audit, settings
from . import rules as R
from .models import Booking, Event, Release, Voyage

DEFAULTS = {
    'drive_events_folder': '2. Events',
    'drive_releases_folder': '4. Releases',
    'drive_past_events_folder': '2. Events/_Past Events',
    'drive_artists_folder': 'Artists',
    'drive_voyages_folder': '2. Events/_Voyages',
    'drive_voyage_tree': ['Contract', 'Travel', 'Promo', 'Finance'],
    # One folder with all riders (they go to the venue in one go) and one with
    # the EPKs (for our content); the numbers keep the checklist order.
    'drive_event_tree': ['01 Finance', '02 EPKs', '03 Riders', '04 Artwork/Artist Announcements',
                         '05 Content/Reels & TikToks', '05 Content/Countdown', '05 Content/Giveaway', '06 Productie', '07 Na afloop'],
    'drive_artist_tree': [],
    'drive_release_tree': ['Artworks', 'Content', 'Contracts/SIGNED', 'Masters', 'Press Kits'],
}


def conf(key):
    value = settings().get(key)
    return value if value not in (None, '', []) else DEFAULTS[key]


def enabled():
    return bool(settings().get('onedrive_drive_id'))


def event_folder_name(e):
    """'2026-11-20' for a plain 'Moonshine 20/11', '2026-09-19 Moonshine 10 Years'
    when the event has a name of its own (the team's own convention)."""
    name = R.safe_name(e.name, 'Evenement')
    generic = not re.sub(r'(?i)moonshine|[\d\s/.\-]', '', e.name or '')
    if not e.date:
        return f'[TBC] {name}'
    return e.date if generic else f'{e.date} {name}'


ASSET_SECTIONS = {'tech_rider': 'riders', 'hospitality_rider': 'riders', 'rider': 'riders', 'stage_plot': 'riders',
                  'epk': 'epks', 'logo': 'epks', 'press_photo': 'epks', 'press_video': 'epks', 'bio': 'epks', 'visual': 'epks',
                  'invoice': 'finance', 'contract': 'finance', 'guestlist': 'productie', 'production': 'productie'}


def asset_section(kind):
    return ASSET_SECTIONS.get(kind, 'productie')


def section(key):
    """Top folder of the event tree for 'finance', 'epks', 'riders', ... (by its name)."""
    for path in conf('drive_event_tree'):
        top = path.split('/')[0]
        if re.sub(r'^\d+\s*', '', top).lower().startswith(key):
            return top
    return {'epks': '02 EPKs', 'riders': '03 Riders'}.get(key, key.title())


def release_folder_name(r):
    parts = [r.catalog or 'MS0XX', r.artist or '', r.title]
    return R.safe_name(' - '.join(p for p in parts if p), 'Release')


def next_catalog():
    """MS + the next free number after the highest one in use."""
    numbers = [int(m.group(1)) for c in Release.objects.exclude(catalog='').values_list('catalog', flat=True)
               if (m := re.fullmatch(r'MS(\d+)', c.strip().upper()))]
    return f'MS{(max(numbers) + 1) if numbers else 1:03d}'


def _place(obj, path, subfolders, current_name):
    """Create the folder tree. A folder that exists under another name (the
    event was renamed) is renamed instead of created twice."""
    from integrations.graph import drive_item, ensure_path, rename_item
    base = path.rpartition('/')[0]
    if obj.drive_id:
        item = drive_item(obj.drive_id)
        if item and item.get('name') != current_name:
            moved = rename_item(obj.drive_id, current_name)
            obj.drive_url = moved['webUrl']
        elif not item:
            obj.drive_id = ''
    if not obj.drive_id:
        folder = ensure_path(path)
        obj.drive_id, obj.drive_url = folder['id'], folder['webUrl']
    for sub in subfolders:
        ensure_path(f'{base}/{current_name}/{sub}' if base else f'{current_name}/{sub}')
    obj.save(update_fields=['drive_id', 'drive_url'])
    return obj.drive_url


def sync_event(event_id):
    e = Event.objects.filter(id=event_id).first()
    if not e or not enabled():
        return
    name = event_folder_name(e)
    upcoming = is_upcoming(e)
    url = _place(e, f"{conf('drive_events_folder')}/{name}", conf('drive_event_tree') if upcoming else [], name)
    if upcoming:
        for b in Booking.objects.filter(event_id=e.id).select_related('artist'):
            sync_booking(b.id)
    return url


def sync_booking(booking_id):
    b = Booking.objects.filter(id=booking_id).select_related('event', 'artist', 'lineup_act').first()
    if not b or not enabled():
        return
    if not b.event.drive_id:
        return sync_event(b.event_id)
    base = event_base(b.event)
    # One EPK folder per act (a duo shares it); the act remembers it, the members link to it.
    owner = b.lineup_act or b
    name = R.safe_name(b.lineup_act.name if b.lineup_act else b.artist.name, 'Artiest')
    url = _place(owner, f"{base}/{section('epks')}/{name}", conf('drive_artist_tree'), name)
    if b.lineup_act:
        Booking.objects.filter(lineup_act=b.lineup_act).update(drive_id=owner.drive_id, drive_url=owner.drive_url)
    return url


def sync_release(release_id):
    r = Release.objects.filter(id=release_id).first()
    if not r or not enabled():
        return
    name = release_folder_name(r)
    return _place(r, f"{conf('drive_releases_folder')}/{name}", conf('drive_release_tree'), name)


def sync_voyage(voyage_id):
    v = Voyage.objects.filter(id=voyage_id).first()
    if not v or not enabled():
        return
    label = ' '.join(x for x in (v.date or '[TBC]', v.event_name, f'({v.city})' if v.city else '') if x)
    name = R.safe_name(label, 'Voyage')
    return _place(v, f"{conf('drive_voyages_folder')}/{name}", conf('drive_voyage_tree'), name)


def queue(kind, ident):
    """Ask the worker to create or update the folders (never blocks a save)."""
    if enabled():
        from jobs.queue import enqueue
        enqueue('drive_' + kind, {'id': ident}, key=ident, max_attempts=6)


def is_upcoming(e):
    return not e.date or e.date >= date.today().isoformat()


def event_base(e):
    """Path of the event folder as it is now (it may sit in _Past Events);
    creates the folder tree first when the event has none yet."""
    from integrations.graph import drive_item
    if not enabled():
        raise ValueError('Stel eerst OneDrive in bij Koppelingen.')
    if not e.drive_id:
        sync_event(e.id)
        e.refresh_from_db()
    item = drive_item(e.drive_id) if e.drive_id else None
    if not item:
        return f"{conf('drive_events_folder')}/{event_folder_name(e)}"
    parent = _parent_path(item)
    return f"{parent}/{item['name']}" if parent else item['name']


def _parent_path(item):
    """'2. Events/_Past Events' for an item in that folder ('' at the root)."""
    from urllib.parse import unquote
    return unquote((item.get('parentReference') or {}).get('path', '')).split('root:', 1)[-1].strip('/')


def archive_past(days=7):
    """A week after the event its folder moves to _Past Events (nothing is deleted)."""
    from datetime import timedelta
    from integrations.graph import drive_item, ensure_path, move_item
    if not enabled():
        return 0
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    target = None
    moved = 0
    for e in Event.objects.exclude(drive_id='').exclude(date='').filter(date__lt=cutoff):
        item = drive_item(e.drive_id)
        if not item:
            continue
        past = conf('drive_past_events_folder').strip('/')
        if _parent_path(item) == past:
            continue
        target = target or ensure_path(past)
        e.drive_url = move_item(e.drive_id, target['id'])['webUrl']
        e.save(update_fields=['drive_url'])
        audit('worker', 'Eventmap naar _Past Events', e.id, e.name)
        moved += 1
    return moved


def event_files(e, fresh=False):
    """What is in the event folder, per top folder in checklist order. Kept two
    minutes, because reading OneDrive takes about two seconds."""
    from django.core.cache import cache
    from integrations.graph import item_children
    if not e.drive_id:
        return {'url': '', 'sections': [], 'other': []}
    key = f'event-files:{e.id}'
    if not fresh and (hit := cache.get(key)):
        return hit
    def entry(c):
        return {'name': c['name'], 'url': c.get('webUrl', ''), 'size': c.get('size', 0), 'folder': 'folder' in c,
                'count': (c.get('folder') or {}).get('childCount', 0), 'modified': c.get('lastModifiedDateTime', '')}
    kids = item_children(e.drive_id)
    by_name = {c['name']: c for c in kids}
    order = []
    for path in conf('drive_event_tree'):
        top = path.split('/')[0]
        if top not in order:
            order.append(top)
    sections = []
    for top in order:
        c = by_name.get(top)
        items = [entry(x) for x in item_children(c['id'])] if c else []
        items.sort(key=lambda x: (not x['folder'], x['name'].lower()))
        # An empty subfolder (from the standard tree) does not make a section filled.
        filled = any(not x['folder'] or x['count'] for x in items)
        sections.append({'name': top, 'url': c.get('webUrl', '') if c else '', 'exists': bool(c), 'items': items[:60],
                         'count': len(items), 'filled': filled})
    other = sorted((entry(c) for c in kids if c['name'] not in order), key=lambda x: (not x['folder'], x['name'].lower()))
    result = {'url': e.drive_url, 'sections': sections, 'other': other}
    cache.set(key, result, 120)
    return result


IMAGE = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
COVER_WORDS = ('poster', 'flyer', 'line-up', 'lineup', 'key visual', 'artwork', 'cover', 'banner')


def event_cover(e):
    """The event poster: an image from the artwork folder (names like 'poster' first),
    as a OneDrive thumbnail. Kept on disk for six hours; None when there is none."""
    import time
    from core.services import DATA
    from integrations.graph import item_children, item_thumbnail
    if not e.drive_id or not enabled():
        return None
    folder = DATA / 'covers'
    folder.mkdir(parents=True, exist_ok=True)
    path, miss = folder / f'{e.id}.jpg', folder / f'{e.id}.none'
    for f in (path, miss):
        if f.exists() and time.time() - f.stat().st_mtime < 6 * 3600:
            return path.read_bytes() if f is path else None
    art = next((c for c in item_children(e.drive_id) if 'folder' in c and 'artwork' in c['name'].lower()), None)
    images = []
    if art:
        for c in item_children(art['id']):
            if 'folder' in c:
                images += [(x, c['name']) for x in item_children(c['id']) if x['name'].lower().endswith(IMAGE)]
            elif c['name'].lower().endswith(IMAGE):
                images.append((c, ''))
    def rank(pair):
        x, sub = pair
        name = (sub + ' ' + x['name']).lower()
        return (not any(w in name for w in COVER_WORDS), x['name'].lower())
    images.sort(key=rank)
    data = item_thumbnail(images[0][0]['id']) if images else None
    if data:
        path.write_bytes(data)
        miss.unlink(missing_ok=True)
    else:
        miss.touch()
    return data


UPLOAD_LIMIT = 100 * 1024 * 1024


def upload_to_section(e, section_name, filename, content, mime):
    """Put a file in one of the event's top folders (e.g. '05 Content'); same name = new version."""
    from django.core.cache import cache
    from integrations.graph import drive_upload
    tops = {p.split('/')[0] for p in conf('drive_event_tree')}
    if section_name not in tops:
        raise ValueError('Onbekend onderdeel van de eventmap.')
    if len(content) > UPLOAD_LIMIT:
        raise ValueError('Maximaal 100 MB per bestand via de backoffice; zet grotere bestanden (video, opnames) direct op OneDrive.')
    name = R.safe_name(filename, 'Bestand')
    _, url = drive_upload(f"{event_base(e)}/{section_name}/{name}", content, mime or 'application/octet-stream')
    cache.delete(f'event-files:{e.id}')
    return {'name': name, 'url': url}

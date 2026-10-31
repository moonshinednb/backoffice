"""Standard OneDrive folder trees for events, line-up artists and releases.

The files of Moonshine live on OneDrive in the team's own structure; the
backoffice only creates the folders and remembers where they are. All
names and subfolders are settings, so the layout can change without code."""
import re
from datetime import date
from core.services import audit, settings
from . import rules as R
from .models import Booking, Event, Release

DEFAULTS = {
    'drive_events_folder': '2. Events',
    'drive_releases_folder': '4. Releases',
    'drive_event_tree': ['01 Finance', '02 Artists', '03 Artwork/Artist Announcements', '03 Artwork/Posters & Line-up',
                         '04 Content/Reels & TikToks', '04 Content/Giveaway', '05 Crew & Briefings', '06 Organisatie'],
    'drive_artist_tree': ['EPK', 'Rider', 'Contract', 'Travel'],
    'drive_release_tree': ['Artworks', 'Content', 'Contracts/SIGNED', 'Masters', 'Press Kits'],
}


def conf(key):
    value = settings().get(key)
    return value if value not in (None, '', []) else DEFAULTS[key]


def enabled():
    return bool(settings().get('onedrive_drive_id'))


def event_folder_name(e):
    name = R.safe_name(e.name, 'Evenement')
    return f'{e.date} {name}' if e.date else f'[TBC] {name}'


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
    url = _place(e, f"{conf('drive_events_folder')}/{name}", conf('drive_event_tree'), name)
    for b in Booking.objects.filter(event_id=e.id).select_related('artist'):
        sync_booking(b.id)
    return url


def sync_booking(booking_id):
    b = Booking.objects.filter(id=booking_id).select_related('event', 'artist').first()
    if not b or not enabled():
        return
    if not b.event.drive_id:
        return sync_event(b.event_id)
    artists = conf('drive_event_tree')
    artists = next((s for s in artists if s.split('/')[0].lower().endswith('artists')), '02 Artists').split('/')[0]
    name = R.safe_name(b.artist.name, 'Artiest')
    return _place(b, f"{conf('drive_events_folder')}/{event_folder_name(b.event)}/{artists}/{name}", conf('drive_artist_tree'), name)


def sync_release(release_id):
    r = Release.objects.filter(id=release_id).first()
    if not r or not enabled():
        return
    name = release_folder_name(r)
    return _place(r, f"{conf('drive_releases_folder')}/{name}", conf('drive_release_tree'), name)


def queue(kind, ident):
    """Ask the worker to create or update the folders (never blocks a save)."""
    if enabled():
        from jobs.queue import enqueue
        enqueue('drive_' + kind, {'id': ident}, key=ident, max_attempts=6)


def is_upcoming(e):
    return not e.date or e.date >= date.today().isoformat()

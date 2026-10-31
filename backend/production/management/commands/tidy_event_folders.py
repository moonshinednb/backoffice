"""Sort the event folders on OneDrive into the standard tree and link them to events.

    manage.py tidy_event_folders            # dry run: only shows the plan
    manage.py tidy_event_folders --apply    # rename/move (never deletes), writes an undo log
    manage.py tidy_event_folders --undo <log.json>
"""
import json
from datetime import date, datetime
from django.conf import settings as dj
from django.core.management.base import BaseCommand
from production import drive, drive_tidy as T
from production.models import Event


class Command(BaseCommand):
    help = 'Event folders on OneDrive into the standard tree (rename and move only).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--undo')
        parser.add_argument('--only', default='', help='Only folders whose name contains this text.')

    def handle(self, *args, **opts):
        from integrations.graph import drive_children, drive_item
        say = self.stdout.write
        if opts['undo']:
            with open(opts['undo']) as f:
                T.undo(json.load(f), say)
            return
        if not drive.enabled():
            say('OneDrive is niet ingesteld.')
            return
        apply, log = opts['apply'], []
        root, past = drive.conf('drive_events_folder'), drive.conf('drive_past_events_folder')
        folders = []
        for base in (root, past):
            for c in drive_children(base):
                if 'folder' in c and T.folder_date(c['name']) and opts['only'] in c['name']:
                    folders.append(c)
        for folder in sorted(folders, key=lambda c: T.folder_date(c['name'])[0]):
            say(f"== {folder['name']}")
            T.tidy_event(folder, apply, log, say)
        if apply and log:
            out = dj.DATA_DIR / 'drive-moves'
            out.mkdir(exist_ok=True)
            path = out / f"tidy-{datetime.now():%Y%m%d-%H%M%S}.json"
            path.write_text(json.dumps(log, indent=1))
            say(f'{len(log)} stappen gelogd in {path}')
        say('== Events koppelen')
        today = date.today().isoformat()
        for folder in folders:
            d, rest, tbc = T.folder_date(folder['name'])
            e = Event.objects.filter(date=d).order_by('created').first()
            if not e:
                name = rest or f'Moonshine {d[8:]}/{d[5:7]}'
                status = 'cancelled' if tbc else ('done' if d < today else 'planning')
                say(f'  nieuw event: {d} {name} ({status})')
                if apply:
                    e = Event.objects.create(name=name, date=d, status=status, checklist_seeded=d < today)
            if e and not e.drive_id:
                say(f'  koppelen: {e.name} -> {folder["name"]}')
                if apply:
                    item = drive_item(folder['id'])
                    e.drive_id, e.drive_url = folder['id'], (item or folder).get('webUrl', '')
                    e.save(update_fields=['drive_id', 'drive_url'])
        if apply:
            moved = drive.archive_past()
            say(f'{moved} map(pen) naar {past} verplaatst')
            for e in Event.objects.exclude(drive_id=''):
                if drive.is_upcoming(e):
                    drive.sync_event(e.id)
                    say(f'  standaardmappen aangevuld: {e.name}')

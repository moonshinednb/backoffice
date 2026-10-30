"""Copy everything from the first backoffice's SQLite file into this database.

Ids are kept, so stored files (data/files, data/assets) keep matching their
records. Passwords keep working through the legacy scrypt hasher and are
upgraded on first login. Accounts other than admins must choose their own
password at first login. Safe to run once on an empty database."""
import json
import sqlite3
from datetime import datetime, timezone as dt_timezone
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from core.models import AuditLog, Setting, Task, User
from finance.models import Document, ProcessedMessage, Transaction
from production.models import Act, Artist, Asset, Booking, ChecklistItem, Contract, Event, EventNote, LabelStatement, Release, Send


def when(value):
    return datetime.fromtimestamp(float(value or 0), tz=dt_timezone.utc)


def js(value, fallback):
    try:
        result = json.loads(value) if isinstance(value, str) else value
    except ValueError:
        return fallback
    return result if isinstance(result, type(fallback)) else fallback


class Command(BaseCommand):
    help = 'Import data from the legacy moonshine.sqlite3'

    def add_arguments(self, parser):
        parser.add_argument('path')

    def handle(self, path, **options):
        if User.objects.exists():
            raise CommandError('Deze database bevat al gebruikers; import alleen in een lege database.')
        from pathlib import Path
        path = Path(path).resolve()
        if not path.is_file():
            raise CommandError(f'Bestand niet gevonden: {path}')
        src = sqlite3.connect(f'file:{path}?mode=ro', uri=True)
        src.row_factory = sqlite3.Row
        tables = {r[0] for r in src.execute("SELECT name FROM sqlite_master WHERE type='table'")}

        def rows(table, order=''):
            return [dict(r) for r in src.execute(f'SELECT * FROM {table} {order}')] if table in tables else []

        def stamp(model, field, values):
            for ident, value in values:
                model.objects.filter(pk=ident).update(**{field: when(value)})

        counts = {}
        with transaction.atomic():
            for u in rows('users'):
                User.objects.create(id=u['id'], username=u['username'].lower(), first_name=u['name'], role=u['role'], is_active=bool(u['active']),
                                    password='legacy_scrypt$' + u['password_hash'], must_change_password=u['role'] != 'admin',
                                    is_staff=u['role'] == 'admin', is_superuser=u['role'] == 'admin', date_joined=when(u['created']))
            for s in rows('settings'):
                if s['key'] in ('todo_dirty', 'connection_checks'):
                    continue
                Setting.objects.create(key=s['key'], value=js(s['value'], None) if s['value'] not in ('true', 'false') else s['value'] == 'true')
            for t in rows('tasks'):
                Task.objects.create(id=t['id'], title=t['title'], description=t['description'] or '', assignee_id=t['assignee'],
                                    due=t['due'] or None, priority=t['priority'], done=bool(t['done']), graph_id=t['graph_id'] or '')
            stamp(Task, 'created', [(t['id'], t['created']) for t in rows('tasks')])
            for d in rows('documents'):
                Document.objects.create(id=d['id'], name=d['name'], mime=d['mime'], sha=d['sha'], size=d['size'], source=d['source'],
                                        status=d['status'], details=js(d['details'], {}), odoo_id=d['odoo_id'], error=d['error'])
            stamp(Document, 'created', [(d['id'], d['created']) for d in rows('documents')])
            for t in rows('transactions'):
                Transaction.objects.create(id=t['id'], external_id=t['external_id'], source=t['source'], date=t['date'], description=t['description'],
                                           amount=t['amount'], fee=t['fee'], vat_rate=t['vat_rate'], category=t['category'], status=t['status'],
                                           document_id=t['document_id'], odoo_id=t['odoo_id'], payout_id=t.get('payout_id') or '',
                                           statement_id=t.get('statement_id'))
            for m in rows('ingestion'):
                ProcessedMessage.objects.create(external_id=m['external_id'])
            for e in rows('events'):
                Event.objects.create(id=e['id'], name=e['name'], date=e['date'] or '', venue=e['venue'] or '', doors=e['doors'] or '',
                                     capacity=e['capacity'] or 0, status=e['status'], venue_contact=e.get('venue_contact') or '',
                                     venue_email=e.get('venue_email') or '', venue_phone=e.get('venue_phone') or '',
                                     checklist_seeded=bool(e.get('checklist_seeded')))
            stamp(Event, 'created', [(e['id'], e['created']) for e in rows('events')])
            for s in rows('event_slots'):
                Act.objects.create(id=s['id'], event_id=s['event_id'], name=s['act'] or 'Act', start=s['start'] or '', end=s['end'] or '',
                                   stage=s.get('stage') or '', note=s['note'] or '', artist_ids=js(s.get('artist_ids'), []), sort=s['sort'])
            for n in rows('event_notes'):
                EventNote.objects.create(id=n['id'], event_id=n['event_id'], body=n['body'])
            stamp(EventNote, 'created', [(n['id'], n['created']) for n in rows('event_notes')])
            artist_fields = [f.name for f in Artist._meta.fields if f.name not in ('id', 'created', 'updated')]
            for a in rows('artists'):
                Artist.objects.create(id=a['id'], **{k: a.get(k) or '' for k in artist_fields})
            for b in rows('bookings'):
                Booking.objects.create(id=b['id'], event_id=b['event_id'], artist_id=b['artist_id'], status=b['status'], fee=b['fee'],
                                       flight=b['flight'], grounds=b['grounds'], hotel=b['hotel'], flight_info=js(b['flight_info'], {}),
                                       ground_info=js(b['ground_info'], {}), hotel_info=js(b['hotel_info'], {}), notes=b['notes'] or '', sort=b['sort'])
            for a in rows('assets'):
                Asset.objects.create(id=a['id'], owner_type=a['owner_type'], owner_id=a['owner_id'], kind=a['kind'], name=a['name'], mime=a['mime'],
                                     size=a['size'], sha=a['sha'], url=a['url'], has_file=bool(a['has_file']), onedrive_id=a['onedrive_id'],
                                     onedrive_url=a['onedrive_url'], sync_status=a['sync_status'], error=a['error'], retry_at=a.get('retry_at') or 0)
            for c in rows('checklist'):
                ChecklistItem.objects.create(id=c['id'], event_id=c['event_id'], key=c['key'], label=c['label'], status=c['status'],
                                             sent_at=c['sent_at'], sent_to=c['sent_to'], notes=c['notes'], sort=c['sort'])
            for s in rows('sends'):
                Send.objects.create(id=s['id'], event_id=s['event_id'], recipients=s['recipients'], subject=s['subject'], items=js(s['items'], []),
                                    attachments=js(s['attachments'], []), status=s['status'], error=s['error'], actor=s['actor'])
            stamp(Send, 'created', [(s['id'], s['created']) for s in rows('sends')])
            for r in rows('releases'):
                Release.objects.create(id=r['id'], title=r['title'], artist=r['artist'], release_date=r['release_date'], status=r['status'],
                                       labelgrid_release_id=r['labelgrid_release_id'], notes=r['notes'])
            for s in rows('label_statements'):
                LabelStatement.objects.create(id=s['id'], invoice_number=s['invoice_number'], period=s['period'], status=s['status'], currency=s['currency'],
                                              gross_usd=s['gross_usd'], fee_usd=s['fee_usd'], total_due_usd=s['total_due_usd'], raw=js(s['raw'], {}))
            for c in rows('contracts'):
                Contract.objects.create(id=c['id'], title=c['title'], opensign_id=c['opensign_id'], status=c['status'], signers=js(c['signers'], []))
            for a in rows('audit', 'ORDER BY id DESC LIMIT 5000'):
                AuditLog.objects.create(actor=a['actor'], action=a['action'], entity=a['entity'] or '', detail=a['detail'] or '')
            for table, model in (('users', User), ('documents', Document), ('events', Event), ('artists', Artist), ('bookings', Booking),
                                 ('assets', Asset), ('checklist', ChecklistItem), ('releases', Release), ('transactions', Transaction)):
                counts[table] = (len(rows(table)), model.objects.count())
            for table, (old, new) in counts.items():
                self.stdout.write(f'{table}: {old} → {new}')
                if old != new:
                    raise CommandError(f'Aantal klopt niet voor {table}; niets geïmporteerd.')
        self.stdout.write(self.style.SUCCESS('Import compleet en gecontroleerd.'))

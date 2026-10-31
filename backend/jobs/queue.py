"""Enqueue and run background jobs. The worker (`manage.py run_worker`) is a
separate process; the web process only enqueues."""
import logging
import time
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from core.services import audit, safe_error, settings
from .models import Job, Schedule

log = logging.getLogger('moonshine.worker')


def enqueue(kind, payload=None, key='', delay=0, max_attempts=6):
    """Queue a job. With a key, an already open job of the same kind+key is
    reused instead of creating a duplicate."""
    if key:
        open_job = Job.objects.filter(kind=kind, key=key, status__in=['queued', 'running']).first()
        if open_job:
            return open_job
    return Job.objects.create(kind=kind, key=key, payload=payload or {}, max_attempts=max_attempts,
                              run_at=timezone.now() + timedelta(seconds=delay))


def handlers():
    from finance import services as finance
    from production import services as production
    return {
        'read_invoice': lambda p: finance.process_document(p['document_id']),
        'archive_invoice': lambda p: finance.archive_onedrive(p['document_id']),
        'sync_asset': lambda p: production.sync_asset(p['asset_id']),
        'archive_sent': lambda p: production.archive_sent(p['event_id'], p['send_id']),
        'drive_event': lambda p: __import__('production.drive', fromlist=['x']).sync_event(p['id']),
        'drive_booking': lambda p: __import__('production.drive', fromlist=['x']).sync_booking(p['id']),
        'drive_release': lambda p: __import__('production.drive', fromlist=['x']).sync_release(p['id']),
        'drive_voyage': lambda p: __import__('production.drive', fromlist=['x']).sync_voyage(p['id']),
        'promo_send': lambda p: __import__('promo.services', fromlist=['send_batch']).send_batch(p['campaign_id']),
    }


def claim_next():
    """Atomically take the oldest due job. A conditional update makes this
    safe with several workers on PostgreSQL and on SQLite."""
    now = timezone.now()
    for job in Job.objects.filter(status='queued', run_at__lte=now).order_by('run_at')[:5]:
        if Job.objects.filter(id=job.id, status='queued').update(status='running', started=now, attempts=job.attempts + 1):
            job.refresh_from_db()
            return job
    return None


def run_job(job):
    handler = handlers().get(job.kind)
    try:
        if not handler:
            raise ValueError(f'Onbekende taak: {job.kind}')
        handler(job.payload)
    except Exception as e:
        message = safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else f'{type(e).__name__}: controleer de koppeling.'
        final = job.attempts >= job.max_attempts
        Job.objects.filter(id=job.id).update(
            status='failed' if final else 'queued', last_error=message[:2000], finished=timezone.now() if final else None,
            run_at=timezone.now() + timedelta(seconds=min(3600, 30 * 2 ** job.attempts)))
        if final:
            audit('worker', 'Achtergrondtaak mislukt', job.kind, message[:300])
        log.warning('job %s %s failed (attempt %s): %s', job.kind, job.id, job.attempts, message[:200])
        return False
    Job.objects.filter(id=job.id).update(status='done', finished=timezone.now(), last_error='')
    return True


def periodic():
    """name -> (interval seconds, function, enabled?)"""
    from finance import services as finance
    from integrations.providers import sync_todo
    from production.services import queue_pending_syncs
    from core.notify import deadlines
    from meetings.services import refresh_recent as refresh_meetings
    from planning.services import push as sync_calendar
    cfg = settings()
    return {
        'Outlook-facturen': (60, finance.poll_mail, cfg.get('mail_enabled')),
        'ING via Odoo': (60, finance.poll_odoo_bank, cfg.get('odoo_bank_feed')),
        'Microsoft To Do': (60, sync_todo, cfg.get('todo_enabled')),
        'Bestanden naar OneDrive': (30, queue_pending_syncs, cfg.get('production_sync')),
        'Automatisch afletteren': (300, finance.auto_match, cfg.get('auto_match')),
        'Deadline-meldingen': (3600, deadlines, True),
        'Agenda synchroniseren': (600, sync_calendar, bool(cfg.get('calendar_enabled'))),
        'Notulen lezen': (1800, refresh_meetings, bool(cfg.get('onedrive_drive_id'))),
    }


def run_periodic():
    now = timezone.now()
    for name, (interval, fn, enabled) in periodic().items():
        if not enabled:
            continue
        sched, _ = Schedule.objects.get_or_create(name=name)
        backoff = min(1800, interval * 2 ** sched.failures) if sched.failures else interval
        if sched.last_run and (now - sched.last_run).total_seconds() < backoff:
            continue
        sched.last_run = now
        try:
            fn()
            sched.last_ok, sched.failures, sched.last_error = now, 0, ''
        except Exception as e:
            sched.failures += 1
            sched.last_error = (safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else 'Controleer de configuratie.')[:2000]
            if sched.failures <= 3 or sched.failures % 12 == 0:
                audit('worker', name + ' vraagt controle', detail=sched.last_error[:300])
        sched.save()


def work_forever(stop=lambda: False, idle=2.0):
    # Jobs left 'running' by a crashed worker go back in the queue.
    Job.objects.filter(status='running').update(status='queued')
    while not stop():
        try:
            run_periodic()
            job = claim_next()
            if job:
                run_job(job)
                continue
        except Exception:
            log.exception('worker loop')
        time.sleep(idle)

"""A durable task list for background work.

Anything slow or remote (reading an invoice with Claude, posting to Odoo,
copying a file to OneDrive, polling mail) runs as a Job in the worker
process. A failing job is retried with backoff and its last error stays
visible, instead of being lost in a log.
"""
from django.db import models
from core.models import uid


class Job(models.Model):
    STATUSES = [('queued', 'In de wachtrij'), ('running', 'Bezig'), ('done', 'Klaar'), ('failed', 'Mislukt')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    kind = models.CharField(max_length=60, db_index=True)
    key = models.CharField(max_length=200, blank=True, default='', help_text='Deduplicates: one open job per kind+key')
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUSES, default='queued', db_index=True)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=6)
    run_at = models.DateTimeField(db_index=True)
    started = models.DateTimeField(null=True, blank=True)
    finished = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['run_at']
        indexes = [models.Index(fields=['status', 'run_at'])]


class Schedule(models.Model):
    """When each periodic task last ran (mail poll, bank feed, To Do...)."""
    name = models.CharField(primary_key=True, max_length=60)
    last_run = models.DateTimeField(null=True, blank=True)
    last_ok = models.DateTimeField(null=True, blank=True)
    failures = models.IntegerField(default=0)
    last_error = models.TextField(blank=True, default='')

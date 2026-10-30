"""Users, roles, settings and the audit trail."""
import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models


def uid():
    """24 hex characters, the id format the backoffice has always used."""
    return secrets.token_hex(12)


class User(AbstractUser):
    """A team member. `role` decides what they may see and change:

    admin       everything, including users, settings and connections
    finance     finance and production
    production  events, artists, advancing and label; no finance
    viewer      read-only everywhere they can see; passport/birth date masked
    """
    password = models.CharField('password', max_length=256)  # legacy scrypt hashes are longer than 128
    ROLES = [('admin', 'Beheerder'), ('finance', 'Finance'), ('production', 'Productie'), ('viewer', 'Alleen lezen')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    role = models.CharField(max_length=20, choices=ROLES, default='viewer')
    must_change_password = models.BooleanField(default=False)

    @property
    def display_name(self):
        return self.first_name or self.username

    @property
    def can_write(self):
        return self.role != 'viewer'

    @property
    def can_finance(self):
        return self.role in ('admin', 'finance', 'viewer')

    @property
    def can_production(self):
        return self.role in ('admin', 'finance', 'production', 'viewer')

    @property
    def private(self):
        """May see passport numbers and dates of birth."""
        return self.role != 'viewer'


class Setting(models.Model):
    """Non-secret configuration, one JSON value per key."""
    key = models.CharField(primary_key=True, max_length=100)
    value = models.JSONField(default=None, null=True)


class AuditLog(models.Model):
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.CharField(max_length=150)
    action = models.CharField(max_length=200)
    entity = models.CharField(max_length=100, blank=True, default='')
    detail = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-id']


class LoginAttempt(models.Model):
    ip = models.CharField(primary_key=True, max_length=64)
    count = models.IntegerField(default=0)
    until = models.FloatField(default=0)


class Task(models.Model):
    """Shared team task; mirrored to Microsoft To Do when that is enabled."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    due = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, default='normal')
    done = models.BooleanField(default=False)
    graph_id = models.CharField(max_length=300, blank=True, default='')
    dirty = models.BooleanField(default=False, help_text='Changed locally since the last To Do push')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['done', 'due', '-created']

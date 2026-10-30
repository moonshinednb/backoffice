"""Users, roles, settings and the audit trail."""
import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models


def uid():
    """24 hex characters, the id format the backoffice has always used."""
    return secrets.token_hex(12)


class User(AbstractUser):
    """A team member. `role` decides what they may see and change:

    admin       everything, including the admin area (users, keys, integrations)
    staff       the whole workspace, everything except the admin area
    """
    password = models.CharField('password', max_length=256)  # legacy scrypt hashes are longer than 128
    ROLES = [('admin', 'Beheerder'), ('staff', 'Team')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    role = models.CharField(max_length=20, choices=ROLES, default='staff')
    must_change_password = models.BooleanField(default=False)
    language = models.CharField(max_length=2, choices=[('en', 'English'), ('nl', 'Nederlands')], default='en')
    job_title = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=40, blank=True, default='')
    avatar = models.CharField(max_length=40, blank=True, default='', help_text='File name in DATA/avatars')

    @property
    def display_name(self):
        return self.first_name or self.username

    @property
    def can_write(self):
        return True

    @property
    def can_finance(self):
        return True

    @property
    def can_production(self):
        return True

    @property
    def private(self):
        """May see passport numbers and dates of birth."""
        return True


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


class ChatMessage(models.Model):
    """Team chat. recipient empty = the shared team channel, otherwise a
    direct message between sender and recipient."""
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='received_messages')
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['id']


class ChatRead(models.Model):
    """Last message id a user has seen per conversation ('team' or a user id)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation = models.CharField(max_length=24)
    last_id = models.BigIntegerField(default=0)

    class Meta:
        unique_together = [('user', 'conversation')]


class PasswordReset(models.Model):
    """One-time reset link. Only a hash of the token is stored."""
    token_hash = models.CharField(primary_key=True, max_length=64)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    expires = models.DateTimeField()
    used = models.BooleanField(default=False)

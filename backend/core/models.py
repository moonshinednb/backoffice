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
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks', help_text='First of the assignees')
    assignees = models.ManyToManyField(User, blank=True, related_name='shared_tasks', help_text='Everyone the task is for')
    due = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, default='normal')
    done = models.BooleanField(default=False)
    graph_id = models.CharField(max_length=300, blank=True, default='')
    release = models.CharField(max_length=24, blank=True, default='', db_index=True, help_text='Release id when this task belongs to a release')
    dirty = models.BooleanField(default=False, help_text='Changed locally since the last To Do push')

    def people(self):
        """Everyone the task is for (older tasks only have `assignee`)."""
        many = list(self.assignees.all())
        return many or ([self.assignee] if self.assignee_id else [])
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


class Notification(models.Model):
    """A short in-app notice for one person: something finished that they
    worked on, a task assigned to them, or a deadline."""
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    kind = models.CharField(max_length=20)  # done | assigned | deadline
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=500, blank=True, default='')
    link = models.CharField(max_length=300, blank=True, default='')
    key = models.CharField(max_length=120, blank=True, default='', db_index=True, help_text='Deduplicates repeated notices')
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']


class FeatureRequest(models.Model):
    """A wish from the team: where in the app, what kind, how it works now and
    how it should work. The admin sees them all in an inbox."""
    KINDS = [('new', 'Nieuwe functie'), ('change', 'Aanpassing'), ('different', 'Werkt anders dan verwacht'), ('bug', 'Fout / werkt niet'), ('idea', 'Idee')]
    PRIORITIES = [('low', 'Kan wachten'), ('normal', 'Normaal'), ('high', 'Belangrijk'), ('blocking', 'Houdt mijn werk tegen')]
    STATUSES = [('new', 'Nieuw'), ('planned', 'Ingepland'), ('in_progress', 'Mee bezig'), ('done', 'Klaar'), ('declined', 'Niet nu')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    author = models.CharField(max_length=150)
    area = models.CharField(max_length=80)
    sub = models.CharField(max_length=80, blank=True, default='')
    feature = models.CharField(max_length=200, blank=True, default='', help_text='Button or function it is about')
    kind = models.CharField(max_length=12, choices=KINDS, default='change')
    title = models.CharField(max_length=200)
    current = models.TextField(blank=True, default='', help_text='How it works now')
    wanted = models.TextField(blank=True, default='', help_text='How it should work')
    why = models.TextField(blank=True, default='', help_text='Why / what it brings')
    priority = models.CharField(max_length=10, choices=PRIORITIES, default='normal')
    page = models.CharField(max_length=300, blank=True, default='', help_text='Page the request was made from')
    screenshot = models.CharField(max_length=40, blank=True, default='', help_text='File name in the data folder')
    status = models.CharField(max_length=12, choices=STATUSES, default='new', db_index=True)
    admin_note = models.TextField(blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']

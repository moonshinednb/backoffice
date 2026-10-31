"""Weekly meetings: the minutes live as Word files on OneDrive; the backoffice
keeps the text for reading and the action points per person."""
from django.db import models
from core.models import uid


class Meeting(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    date = models.CharField(max_length=10, db_index=True)
    title = models.CharField(max_length=200, default='Moonshine meeting')
    text = models.TextField(blank=True, default='', help_text='Text of the minutes, read from the Word file')
    drive_id = models.CharField(max_length=200, blank=True, default='', unique=False)
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    file_name = models.CharField(max_length=300, blank=True, default='')
    read_at = models.DateTimeField(null=True, blank=True)
    extracted_at = models.DateTimeField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']


class Action(models.Model):
    """One action point from a meeting, for one person."""
    id = models.BigAutoField(primary_key=True)
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='actions')
    owner = models.CharField(max_length=150, blank=True, default='', help_text='Username, a name, or empty for the team')
    text = models.CharField(max_length=500)
    due = models.CharField(max_length=10, blank=True, default='')
    done = models.BooleanField(default=False)
    source = models.CharField(max_length=10, default='manual')  # ai | manual
    task_id = models.CharField(max_length=24, blank=True, default='', help_text='Task created from this action')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['done', 'created']

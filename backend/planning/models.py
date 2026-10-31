"""Content planning (posts, reels, announcements) and the link between our
planning and the Outlook calendar."""
from django.db import models
from core.models import uid

KINDS = [('post', 'Post'), ('reel', 'Reel'), ('tiktok', 'TikTok'), ('story', 'Story'), ('announcement', 'Announcement'), ('video', 'Video'), ('other', 'Overig')]
STATUSES = [('idea', 'Idee'), ('making', 'In de maak'), ('review', 'Ter review'), ('ready', 'Klaar om te posten'), ('posted', 'Gepost')]


class ContentItem(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey('production.Event', null=True, blank=True, on_delete=models.CASCADE, related_name='content')
    release = models.ForeignKey('production.Release', null=True, blank=True, on_delete=models.CASCADE, related_name='content')
    title = models.CharField(max_length=300)
    kind = models.CharField(max_length=20, choices=KINDS, default='post')
    platforms = models.JSONField(default=list, help_text='instagram, tiktok, facebook, youtube …')
    date = models.CharField(max_length=10, blank=True, default='')
    time = models.CharField(max_length=5, blank=True, default='')
    caption = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUSES, default='idea')
    assignee = models.CharField(max_length=150, blank=True, default='')
    file_url = models.CharField(max_length=1000, blank=True, default='', help_text='Link to the file or folder on OneDrive')
    notes = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']


class OutlookLink(models.Model):
    """One of our items as an event in the Outlook calendar."""
    source = models.CharField(max_length=20)  # event | voyage | release | content | meeting
    source_id = models.CharField(max_length=40)
    outlook_id = models.CharField(max_length=300)
    fingerprint = models.CharField(max_length=64, blank=True, default='')
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('source', 'source_id')]

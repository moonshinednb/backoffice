"""Track feedback: demos and tracks the label considers, graded by the team."""
from django.db import models
from core.models import uid

STATUSES = [('new', 'Nieuw'), ('awaiting', 'Wacht op demo/versie'), ('in_review', 'In beoordeling'), ('needs_work', 'Aanpassingen nodig'),
            ('approved', 'Goedgekeurd'), ('signed', 'Getekend'), ('released', 'Uitgebracht'), ('rejected', 'Afgekeurd')]
DECISIONS = [('', 'Nog geen oordeel'), ('fit', 'Fit for release'), ('needs_work', 'Aanpassingen nodig'), ('not_fit', 'Niet geschikt')]


class Track(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    number = models.IntegerField(null=True, blank=True, help_text='Number from the old TRACK FEEDBACK sheet')
    artist = models.CharField(max_length=300)
    title = models.CharField(max_length=300)
    link = models.CharField(max_length=1000, blank=True, default='', help_text='SoundCloud, Dropbox, Spotify …')
    file_id = models.CharField(max_length=200, blank=True, default='', help_text='OneDrive item of an uploaded file')
    file_url = models.CharField(max_length=1000, blank=True, default='')
    file_name = models.CharField(max_length=300, blank=True, default='')
    scouted_by = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUSES, default='new')
    release = models.ForeignKey('production.Release', null=True, blank=True, on_delete=models.SET_NULL, related_name='tracks', help_text='Signed on')
    options = models.JSONField(default=list, help_text='Releases this could go on (release ids or free text such as VA4)')
    notes = models.TextField(blank=True, default='')
    contact = models.CharField(max_length=300, blank=True, default='', help_text='How we reach the artist (mail, DM, agent)')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-number', '-created']


class Review(models.Model):
    """One person's grade and feedback on a track."""
    id = models.BigAutoField(primary_key=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.CharField(max_length=150, help_text='Username, or a name for people without an account')
    production = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    composition = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    decision = models.CharField(max_length=20, choices=DECISIONS, blank=True, default='')
    release_types = models.CharField(max_length=100, blank=True, default='', help_text='VA, EP, single …')
    production_feedback = models.TextField(blank=True, default='')
    composition_feedback = models.TextField(blank=True, default='')
    dealbreaker = models.CharField(max_length=300, blank=True, default='')
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('track', 'reviewer')]


class TrackLog(models.Model):
    """Versions, status changes and comments, newest first."""
    id = models.BigAutoField(primary_key=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='log')
    kind = models.CharField(max_length=10, default='comment')  # comment | version | status
    body = models.TextField()
    author = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

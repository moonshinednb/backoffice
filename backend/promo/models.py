"""Promo mailing: premiere requests before a release, playlist pitches after."""
from django.db import models
from core.models import uid

GROUPS = [('promo', 'Promo-kanalen'), ('playlists', 'Spotify-playlists'), ('other', 'Overig')]


class Contact(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=320, blank=True, default='', db_index=True)
    handle = models.CharField(max_length=80, blank=True, default='', help_text='Instagram handle, with @')
    group = models.CharField(max_length=20, choices=GROUPS, default='promo')
    tag = models.CharField(max_length=100, blank=True, default='')
    source = models.CharField(max_length=200, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    active = models.BooleanField(default=True, help_text='Off = never mail again')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']


class Template(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=100)
    channel = models.CharField(max_length=10, default='email')  # email | instagram
    subject = models.CharField(max_length=300, blank=True, default='')
    body = models.TextField()

    class Meta:
        ordering = ['name']


class Campaign(models.Model):
    KINDS = [('premiere', 'Premiere / promo (voor release)'), ('pitch', 'Playlist-pitch (na release)'), ('other', 'Overig')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=KINDS, default='premiere')
    release = models.ForeignKey('production.Release', null=True, blank=True, on_delete=models.SET_NULL, related_name='campaigns')
    artist = models.CharField(max_length=300, blank=True, default='')
    links = models.JSONField(default=list, help_text='[{title, link}]')
    promo_text = models.TextField(blank=True, default='')
    sender = models.CharField(max_length=320, blank=True, default='')
    sender_name = models.CharField(max_length=100, blank=True, default='')
    subject = models.CharField(max_length=300, blank=True, default='')
    body = models.TextField(blank=True, default='')
    dm_body = models.TextField(blank=True, default='')
    status = models.CharField(max_length=10, default='draft')  # draft | sending | done
    created_by = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']


class Recipient(models.Model):
    id = models.BigAutoField(primary_key=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='recipients')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='sends')
    channel = models.CharField(max_length=10, default='email')  # email | instagram
    status = models.CharField(max_length=10, default='selected')  # selected | queued | sent | failed | uncertain | done
    error = models.CharField(max_length=500, blank=True, default='')
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('campaign', 'contact', 'channel')]

"""Events, the artist roster, advancing and the label."""
from django.db import models
from core.models import uid


class Event(models.Model):
    STATUSES = [('planning', 'In planning'), ('confirmed', 'Bevestigd'), ('live', 'Live'), ('done', 'Afgelopen'), ('cancelled', 'Geannuleerd')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=300)
    date = models.CharField(max_length=10, blank=True, default='', db_index=True)
    venue = models.CharField(max_length=300, blank=True, default='')
    doors = models.CharField(max_length=10, blank=True, default='')
    capacity = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUSES, default='planning')
    venue_contact = models.CharField(max_length=300, blank=True, default='')
    venue_email = models.CharField(max_length=1000, blank=True, default='')
    venue_phone = models.CharField(max_length=60, blank=True, default='')
    checklist_seeded = models.BooleanField(default=False)
    drive_id = models.CharField(max_length=200, blank=True, default='', help_text='OneDrive folder of this event')
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created']


class Act(models.Model):
    """One slot in the timetable; a B2B lists several artists."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='acts')
    name = models.CharField(max_length=200)
    start = models.CharField(max_length=5, blank=True, default='')
    end = models.CharField(max_length=5, blank=True, default='')
    stage = models.CharField(max_length=80, blank=True, default='')
    note = models.CharField(max_length=400, blank=True, default='')
    artist_ids = models.JSONField(default=list)
    sort = models.IntegerField(default=0)


class EventNote(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='notes')
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']


class Artist(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=120)
    full_name = models.CharField(max_length=200, blank=True, default='')
    passport = models.CharField(max_length=60, blank=True, default='')
    date_of_birth = models.CharField(max_length=10, blank=True, default='')
    nationality = models.CharField(max_length=60, blank=True, default='')
    email = models.CharField(max_length=320, blank=True, default='')
    phone = models.CharField(max_length=40, blank=True, default='')
    instagram = models.CharField(max_length=80, blank=True, default='')
    agency = models.CharField(max_length=200, blank=True, default='')
    agent = models.CharField(max_length=200, blank=True, default='')
    agent_email = models.CharField(max_length=320, blank=True, default='')
    agent_phone = models.CharField(max_length=40, blank=True, default='')
    contact_via = models.CharField(max_length=10, blank=True, default='', help_text="'agency' or 'self'; empty = agency when one is filled in")
    on_label = models.BooleanField(default=False)
    rider_url = models.CharField(max_length=1000, blank=True, default='')
    epk_url = models.CharField(max_length=1000, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    tech_rider = models.TextField(blank=True, default='')
    hospitality_rider = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        constraints = [models.UniqueConstraint(models.functions.Lower('name'), name='artist_name_unique_ci')]


class Booking(models.Model):
    STATUSES = [('option', 'Optie'), ('confirmed', 'Bevestigd'), ('cancelled', 'Geannuleerd')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    artist = models.ForeignKey(Artist, on_delete=models.PROTECT, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUSES, default='confirmed')
    fee = models.IntegerField(default=0)
    flight = models.CharField(max_length=3, blank=True, default='')
    grounds = models.CharField(max_length=3, blank=True, default='')
    hotel = models.CharField(max_length=3, blank=True, default='')
    flight_info = models.JSONField(default=dict)
    ground_info = models.JSONField(default=dict)
    hotel_info = models.JSONField(default=dict)
    notes = models.TextField(blank=True, default='')
    showday_contact = models.CharField(max_length=200, blank=True, default='')
    showday_phone = models.CharField(max_length=40, blank=True, default='')
    drive_id = models.CharField(max_length=200, blank=True, default='', help_text='OneDrive folder of this artist within the event')
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    sort = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort', 'created']
        constraints = [models.UniqueConstraint(fields=['event', 'artist'], name='booking_unique')]


class Asset(models.Model):
    """A file or link belonging to an artist, a booking or an event."""
    OWNERS = [('artist', 'Artiest'), ('booking', 'Boeking'), ('event', 'Evenement')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    owner_type = models.CharField(max_length=10, choices=OWNERS)
    owner_id = models.CharField(max_length=24, db_index=True)
    kind = models.CharField(max_length=30)
    name = models.CharField(max_length=180)
    mime = models.CharField(max_length=120, blank=True, default='')
    size = models.IntegerField(default=0)
    sha = models.CharField(max_length=64, blank=True, default='')
    url = models.CharField(max_length=1000, blank=True, default='')
    has_file = models.BooleanField(default=False)
    onedrive_id = models.CharField(max_length=300, blank=True, default='')
    onedrive_url = models.CharField(max_length=1000, blank=True, default='')
    sync_status = models.CharField(max_length=10, default='local', db_index=True)
    error = models.TextField(blank=True, default='')
    retry_at = models.FloatField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['kind', '-created']


class ChecklistItem(models.Model):
    STATUSES = [('todo', 'Te doen'), ('done', 'Klaar'), ('sent', 'Verstuurd'), ('na', 'N.v.t.')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='checklist')
    key = models.CharField(max_length=40, blank=True, default='')
    label = models.CharField(max_length=200)
    status = models.CharField(max_length=10, choices=STATUSES, default='todo')
    sent_at = models.FloatField(default=0)
    sent_to = models.CharField(max_length=300, blank=True, default='')
    notes = models.CharField(max_length=1000, blank=True, default='')
    sort = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort', 'created']


class Send(models.Model):
    """One advancing mail, whatever the outcome."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sends')
    recipients = models.TextField()
    subject = models.CharField(max_length=300)
    items = models.JSONField(default=list)
    attachments = models.JSONField(default=list)
    status = models.CharField(max_length=10)
    error = models.TextField(blank=True, default='')
    actor = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']


class Release(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    title = models.CharField(max_length=300)
    artist = models.CharField(max_length=300, blank=True, default='')
    release_date = models.CharField(max_length=10, blank=True, default='')
    status = models.CharField(max_length=40, default='planned')
    labelgrid_release_id = models.CharField(max_length=100, blank=True, default='')
    catalog = models.CharField(max_length=20, blank=True, default='', help_text='Catalogue number, e.g. MS013')
    drive_id = models.CharField(max_length=200, blank=True, default='')
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-release_date', '-created']


class LabelStatement(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    invoice_number = models.CharField(max_length=100, unique=True)
    period = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=100, blank=True, default='')
    currency = models.CharField(max_length=10, default='USD')
    gross_usd = models.FloatField(default=0)
    fee_usd = models.FloatField(default=0)
    total_due_usd = models.FloatField(default=0)
    raw = models.JSONField(default=dict)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']


class Contract(models.Model):
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    title = models.CharField(max_length=300)
    opensign_id = models.CharField(max_length=200, blank=True, default='', db_index=True)
    status = models.CharField(max_length=40, default='draft')
    signers = models.JSONField(default=list)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']


class ReleaseStep(models.Model):
    """One step in a release's planning, e.g. master in or artwork done."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name='steps')
    label = models.CharField(max_length=200)
    due = models.CharField(max_length=10, blank=True, default='')
    done = models.BooleanField(default=False)
    sort = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort', 'due']

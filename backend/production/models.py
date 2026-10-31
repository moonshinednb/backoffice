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
    steps_seeded = models.BooleanField(default=False, help_text='Team checklist created')
    drive_id = models.CharField(max_length=200, blank=True, default='', help_text='OneDrive folder of this event')
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    lists_url = models.CharField(max_length=1000, blank=True, default='', help_text='Crew- and guestlist Excel on OneDrive')
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
    in_roster = models.BooleanField(default=False, help_text='One of our own Moonshine artists (the Artists catalogue)')
    photo_id = models.CharField(max_length=200, blank=True, default='', help_text='Profile photo on OneDrive')
    socials = models.JSONField(default=dict, help_text='spotify, soundcloud, instagram, tiktok, youtube, facebook, beatport, bandcamp, website')
    city = models.CharField(max_length=120, blank=True, default='')
    genres = models.CharField(max_length=200, blank=True, default='')
    epk_folder = models.CharField(max_length=1000, blank=True, default='', help_text='Link to the EPK folder on OneDrive')
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


class EventStep(models.Model):
    """One point on the team checklist of an event: who does it and when.
    The deadline follows the event date (offset in days) unless set by hand."""
    PHASES = [('prep', 'Voorbereiding'), ('promo', 'Promo'), ('production', 'Productie'), ('after', 'Na afloop')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='steps')
    key = models.CharField(max_length=40, blank=True, default='')
    phase = models.CharField(max_length=12, choices=PHASES, default='prep')
    label = models.CharField(max_length=200)
    owner = models.CharField(max_length=150, blank=True, default='', help_text='Username; empty = team')
    offset = models.IntegerField(default=0, help_text='Days relative to the event date')
    due = models.CharField(max_length=10, blank=True, default='', help_text='Set by hand; empty = event date + offset')
    auto = models.CharField(max_length=120, blank=True, default='', help_text='OneDrive section that ticks this step when it has files')
    done = models.BooleanField(default=False)
    done_by = models.CharField(max_length=150, blank=True, default='')
    done_at = models.DateTimeField(null=True, blank=True)
    task_id = models.CharField(max_length=24, blank=True, default='')
    sort = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort', 'created']


class CrewMember(models.Model):
    """Crew list (backstage entrance), as in the team's Excel: name, role, act, cars."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='crew')
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=120, blank=True, default='')
    act = models.CharField(max_length=200, blank=True, default='')
    cars = models.IntegerField(default=0)
    sort = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort', 'created']


class Guest(models.Model):
    """Guest list (frontstage entrance): name, +1s, backstage, relation."""
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=200)
    plus = models.IntegerField(default=0)
    backstage = models.BooleanField(default=False)
    relation = models.CharField(max_length=200, blank=True, default='')
    added_by = models.CharField(max_length=150, blank=True, default='')
    sort = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort', 'created']


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


class Voyage(models.Model):
    """An outbound show: one of our artists playing outside the Moonshine
    programme (other events, abroad). Tracked from first contact to played."""
    STATUSES = [('lead', 'Aanvraag'), ('offer', 'Voorstel verstuurd'), ('negotiating', 'In onderhandeling'), ('confirmed', 'Bevestigd'),
                ('contracted', 'Contract getekend'), ('advanced', 'Advancing rond'), ('played', 'Gespeeld'), ('declined', 'Afgewezen'), ('cancelled', 'Geannuleerd')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    performer = models.CharField(max_length=200, help_text='Who plays, e.g. PEPPY or Moonshine Showcase')
    artist = models.ForeignKey(Artist, null=True, blank=True, on_delete=models.SET_NULL, related_name='voyages')
    event_name = models.CharField(max_length=300)
    venue = models.CharField(max_length=300, blank=True, default='')
    city = models.CharField(max_length=120, blank=True, default='')
    country = models.CharField(max_length=80, blank=True, default='')
    date = models.CharField(max_length=10, blank=True, default='')
    set_time = models.CharField(max_length=40, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUSES, default='lead')
    fee = models.IntegerField(default=0, help_text='Cents')
    currency = models.CharField(max_length=3, default='EUR')
    deal = models.CharField(max_length=300, blank=True, default='', help_text='Flat fee, door split, guarantee + bonus …')
    travel = models.CharField(max_length=300, blank=True, default='', help_text='Who arranges and pays travel/hotel')
    promoter_name = models.CharField(max_length=200, blank=True, default='')
    promoter_email = models.CharField(max_length=320, blank=True, default='')
    promoter_phone = models.CharField(max_length=40, blank=True, default='')
    mail_link = models.CharField(max_length=1000, blank=True, default='', help_text='Link to the mail thread')
    notes = models.TextField(blank=True, default='')
    deliverables = models.JSONField(default=dict, help_text='{key: {done, at, by}}: what has been sent or received')
    drive_id = models.CharField(max_length=200, blank=True, default='')
    drive_url = models.CharField(max_length=1000, blank=True, default='')
    created_by = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'created']


class VoyageNote(models.Model):
    """Contact log: a mail, call or decision, with who and when."""
    id = models.BigAutoField(primary_key=True)
    voyage = models.ForeignKey(Voyage, on_delete=models.CASCADE, related_name='log')
    kind = models.CharField(max_length=10, default='note')  # note | mail | call | status
    body = models.TextField()
    author = models.CharField(max_length=150, blank=True, default='')
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

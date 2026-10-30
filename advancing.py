"""Moonshine advancing: who plays, what they need, and what the venue has
   received.

   - Artists are a reusable roster. Riders, EPK, promo content and contact
     details live with the artist, so they are entered once and reused for
     every night.
   - A booking puts an artist on an event: fee, flight, ground transport
     and hotel for that night.
   - Acts are the timetable. One act can be several artists (a B2B), so an
     act links artist IDs; this reuses the event_slots table.
   - The venue checklist tracks what has been prepared and sent, so nothing
     is forgotten for the venue (Luxor and others).

   Local-first like the rest of the backoffice: every save lands in SQLite
   immediately. Files are stored locally and copied to OneDrive by the
   worker when that is configured, so a missing Microsoft connection never
   blocks advancing work."""
import hashlib, html, json, os, re, threading, time
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from store import db, uid, encode, audit, settings, safe_error, DATA

ASSETS = DATA / 'assets'
MAX_ASSET = 20 * 1024 * 1024
MAX_MAIL = 30 * 1024 * 1024

ARTIST_FIELDS = {
    'name': 120, 'full_name': 200, 'passport': 60, 'date_of_birth': 10, 'nationality': 60,
    'email': 320, 'phone': 40, 'instagram': 80, 'agency': 200, 'agent': 200,
    'agent_email': 320, 'agent_phone': 40, 'rider_url': 1000, 'epk_url': 1000,
    'bio': 6000, 'tech_rider': 20000, 'hospitality_rider': 20000, 'notes': 4000,
}
LABELS = {'email': 'E-mail artiest', 'agent_email': 'E-mail agent', 'rider_url': 'Riderlink',
          'epk_url': 'EPK-link', 'date_of_birth': 'Geboortedatum'}
# Needed only to book travel. Masked for viewers and never put in venue mail.
PRIVATE_FIELDS = ('passport', 'date_of_birth')

YES_NO = ('', 'yes', 'no')
BOOKED_BY = ('', 'artist', 'agency', 'venue', 'moonshine')
BOOKED_BY_LABEL = {'artist': 'Artiest', 'agency': 'Agency', 'venue': 'Venue', 'moonshine': 'Moonshine'}
BOOKING_STATUS = ('option', 'confirmed', 'cancelled')
CHECK_STATUS = ('todo', 'done', 'sent', 'na')

LEG_FIELDS = {'from': 120, 'to': 120, 'departure': 'datetime', 'arrival': 'datetime', 'number': 20}
FLIGHT_FIELDS = {'tickets_booked': YES_NO, 'booked_by': BOOKED_BY, 'price': 'money', 'notes': 2000,
                 'inbound': LEG_FIELDS, 'outbound': LEG_FIELDS}
HOTEL_FIELDS = {'booked_by': BOOKED_BY, 'name': 200, 'address': 300, 'check_in': 'date', 'check_out': 'date',
                'rooms': 200, 'confirmation': 80, 'price': 'money', 'notes': 2000}
GROUND_FIELDS = {'booked_by': BOOKED_BY, 'pickup_time': 'datetime', 'pickup_location': 200,
                 'dropoff_location': 200, 'return_time': 'datetime', 'return_location': 200,
                 'driver': 120, 'driver_phone': 40, 'notes': 2000}

ASSET_KINDS = {
    'tech_rider': 'Technical rider', 'hospitality_rider': 'Hospitality rider', 'rider': 'Rider',
    'epk': 'EPK', 'logo': 'Logo', 'press_photo': 'Persfoto', 'press_video': 'Persvideo',
    'bio': 'Bio / promotekst', 'visual': 'Visual', 'invoice': 'Factuur', 'contract': 'Contract',
    'stage_plot': 'Stage plot', 'guestlist': 'Gastenlijst', 'production': 'Productieplanning', 'other': 'Overig',
}
DRIVE_FOLDERS = {
    'tech_rider': 'Riders', 'hospitality_rider': 'Riders', 'rider': 'Riders', 'epk': 'EPK', 'logo': 'Logos',
    'press_photo': 'Persfotos', 'press_video': 'Persvideos', 'bio': 'Bio', 'visual': 'Visuals',
    'invoice': 'Facturen', 'contract': 'Contracten', 'stage_plot': 'Productie', 'guestlist': 'Gastenlijst',
    'production': 'Productie', 'other': 'Overig',
}
FILE_TYPES = {
    '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ai': 'application/postscript',
    '.eps': 'application/postscript', '.psd': 'image/vnd.adobe.photoshop', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv', '.txt': 'text/plain', '.rtf': 'application/rtf', '.zip': 'application/zip',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
}

CHECKLIST = [
    ('timetable', 'Line-up en set times'),
    ('tech_riders', 'Technical riders van alle artiesten'),
    ('hospitality', 'Hospitality riders'),
    ('travel', 'Aankomst en vertrek: vluchten en vervoer'),
    ('hotel', 'Hotel en rooming list'),
    ('contacts', 'Contactlijst artiesten en agents'),
    ('promo', 'Promomateriaal: logo’s, persfoto’s en bio’s'),
    ('guestlist', 'Gastenlijst'),
    ('production', 'Productieplanning: opbouw, soundcheck en curfew'),
]

EMAIL = re.compile(r'^[^@\s<>"]{1,64}@[^@\s<>"]+\.[^@\s<>"]{2,}$')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
DATETIME_RE = re.compile(r'^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$')
TIME_RE = re.compile(r'^([01]?\d|2[0-3])[:.]([0-5]\d)$')
HANDLE_RE = re.compile(r'^[A-Za-z0-9._]{1,60}$')


# --------------------------------------------------------------------------
# Input cleaning. Everything that reaches SQLite, a PDF, an e-mail or
# OneDrive passes through one of these.
# --------------------------------------------------------------------------

def _text(value, limit):
    return '' if value is None else str(value).strip()[:limit]


def _email(value, label):
    text = _text(value, 320)
    if text and not EMAIL.match(text):
        raise ValueError(f'{label}: vul een geldig e-mailadres in.')
    return text


def _url(value, label):
    text = _text(value, 1000)
    if text and not re.match(r'^https?://[^\s<>"]+$', text, re.I):
        raise ValueError(f'{label}: gebruik een volledige link die begint met https://')
    return text


def _date(value, label, past=False):
    text = _text(value, 10)
    if not text:
        return ''
    try:
        day = date.fromisoformat(text) if DATE_RE.match(text) else None
    except ValueError:
        day = None
    if not day:
        raise ValueError(f'{label}: gebruik een geldige datum.')
    if past and day > date.today():
        raise ValueError(f'{label} ligt in de toekomst.')
    return text


def _datetime(value, label):
    text = _text(value, 16)
    if not text:
        return ''
    try:
        if not DATETIME_RE.match(text):
            raise ValueError
        datetime.fromisoformat(text)
    except ValueError:
        raise ValueError(f'{label}: gebruik datum en tijd.') from None
    return text


def _time(value, label):
    text = _text(value, 5)
    if not text:
        return ''
    match = TIME_RE.match(text)
    if not match:
        raise ValueError(f'{label}: gebruik een tijd als 23:30.')
    return f'{int(match[1]):02d}:{match[2]}'


def money(value):
    """Euro input (12,50 / 1.250,00 / 12.5 / number) to integer cents."""
    if value in (None, ''):
        return 0
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        text = str(value)
    else:
        text = str(value).replace('€', '').replace(' ', '').strip()
        if ',' in text and '.' in text:
            text = text.replace('.', '').replace(',', '.')
        elif ',' in text:
            text = text.replace(',', '.')
    try:
        amount = Decimal(text)
    except InvalidOperation:
        raise ValueError('Vul een geldig bedrag in.') from None
    if not amount.is_finite() or amount < 0 or amount > Decimal('10000000'):
        raise ValueError('Vul een geldig bedrag in.')
    return int((amount * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def _structured(spec, value, label):
    """Clean a nested dict (flight, hotel, ground) against its spec; unknown
    keys are dropped."""
    value = value if isinstance(value, dict) else {}
    out = {}
    for key, rule in spec.items():
        raw = value.get(key)
        if isinstance(rule, dict):
            out[key] = _structured(rule, raw, label)
        elif isinstance(rule, tuple):
            text = _text(raw, 20)
            if text not in rule:
                raise ValueError(f'{label}: ongeldige keuze.')
            out[key] = text
        elif rule == 'money':
            out[key] = money(raw)
        elif rule == 'date':
            out[key] = _date(raw, label)
        elif rule == 'datetime':
            out[key] = _datetime(raw, label)
        else:
            out[key] = _text(raw, rule)
    return out


def _json(value, fallback):
    try:
        result = json.loads(value or '')
    except (TypeError, ValueError):
        return fallback
    return result if isinstance(result, type(fallback)) else fallback


def _minutes(hhmm):
    """Sort key for set times. A night runs past midnight, so anything
    before 06:00 sorts after the evening."""
    match = TIME_RE.match(hhmm or '')
    if not match:
        return 10 ** 6
    value = int(match[1]) * 60 + int(match[2])
    return value + 24 * 60 if value < 6 * 60 else value


def safe_name(name, fallback='Naamloos'):
    """OneDrive-safe file or folder name."""
    clean = ''.join(c for c in str(name or '') if c not in '\\/:*?"<>|#%' and ord(c) >= 32).strip().strip('.')
    return clean[:120] or fallback


# --------------------------------------------------------------------------
# Artists
# --------------------------------------------------------------------------

def _artist_payload(payload, partial):
    out = {}
    for key, limit in ARTIST_FIELDS.items():
        if key not in payload:
            continue
        raw = payload[key]
        if key in ('email', 'agent_email'):
            out[key] = _email(raw, LABELS[key])
        elif key in ('rider_url', 'epk_url'):
            out[key] = _url(raw, LABELS[key])
        elif key == 'date_of_birth':
            out[key] = _date(raw, LABELS[key], past=True)
        elif key == 'instagram':
            handle = _text(raw, 80)
            handle = re.sub(r'^https?://(www\.)?instagram\.com/', '', handle, flags=re.I).strip('/').lstrip('@')
            if handle and not HANDLE_RE.match(handle):
                raise ValueError('Instagram: gebruik alleen de gebruikersnaam, zoals @moonshine.')
            out[key] = '@' + handle if handle else ''
        else:
            out[key] = _text(raw, limit)
    if (not partial or 'name' in out) and not out.get('name'):
        raise ValueError('Geef de artiest een naam.')
    return out


def mask(artist, private):
    if private or not artist:
        return artist
    out = dict(artist)
    for key in PRIVATE_FIELDS:
        if out.get(key):
            out[key] = '••••'
    out['masked'] = True
    return out


def artist_list():
    with db() as c:
        return [dict(r) for r in c.execute(
            "SELECT a.id,a.name,a.full_name,a.agency,a.agent,a.email,a.agent_email,a.instagram,a.updated,"
            " length(trim(a.tech_rider))>0 AS has_tech_rider, a.rider_url!='' AS has_rider_url, a.epk_url!='' AS has_epk,"
            " (SELECT COUNT(*) FROM bookings b WHERE b.artist_id=a.id) AS booking_count,"
            " (SELECT COUNT(*) FROM assets s WHERE s.owner_type='artist' AND s.owner_id=a.id) AS asset_count,"
            " (SELECT COUNT(*) FROM assets s WHERE s.owner_type='artist' AND s.owner_id=a.id AND s.kind IN ('tech_rider','rider')) AS rider_files"
            " FROM artists a ORDER BY a.name COLLATE NOCASE")]


def artist_get(ident, private=True):
    with db() as c:
        row = c.execute('SELECT * FROM artists WHERE id=?', (ident,)).fetchone()
        if not row:
            raise ValueError('Onbekende artiest.')
        artist = dict(row)
        artist['assets'] = [dict(r) for r in c.execute(
            "SELECT * FROM assets WHERE owner_type='artist' AND owner_id=? ORDER BY kind,created DESC", (ident,))]
        artist['bookings'] = [dict(r) for r in c.execute(
            'SELECT b.id,b.event_id,b.status,e.name AS event_name,e.date AS event_date,e.venue FROM bookings b '
            'JOIN events e ON e.id=b.event_id WHERE b.artist_id=? ORDER BY e.date DESC', (ident,))]
    return mask(artist, private)


def artist_create(payload, actor):
    data = _artist_payload(payload, partial=False)
    ident, now = uid(), time.time()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if c.execute('SELECT 1 FROM artists WHERE name=? COLLATE NOCASE', (data['name'],)).fetchone():
            raise ValueError('Er bestaat al een artiest met deze naam.')
        columns = ['id', 'created', 'updated'] + list(data)
        c.execute(f'INSERT INTO artists({",".join(columns)}) VALUES({",".join("?" * len(columns))})',
                  [ident, now, now] + list(data.values()))
    audit(actor, 'Artiest aangemaakt', ident, data['name'])
    return ident


def artist_update(ident, payload, actor):
    data = _artist_payload(payload, partial=True)
    if not data:
        return
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT 1 FROM artists WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekende artiest.')
        if 'name' in data and c.execute('SELECT 1 FROM artists WHERE name=? COLLATE NOCASE AND id!=?', (data['name'], ident)).fetchone():
            raise ValueError('Er bestaat al een artiest met deze naam.')
        c.execute(f'UPDATE artists SET {",".join(k + "=?" for k in data)},updated=? WHERE id=?',
                  list(data.values()) + [time.time(), ident])
    audit(actor, 'Artiest bijgewerkt', ident, ', '.join(k for k in data if k not in PRIVATE_FIELDS))


def artist_delete(ident, actor):
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT name FROM artists WHERE id=?', (ident,)).fetchone()
        if not row:
            raise ValueError('Onbekende artiest.')
        if c.execute('SELECT 1 FROM bookings WHERE artist_id=?', (ident,)).fetchone():
            raise ValueError('Deze artiest staat nog op een evenement. Haal die boeking eerst weg.')
        files = [r['id'] for r in c.execute("SELECT id FROM assets WHERE owner_type='artist' AND owner_id=?", (ident,))]
        c.execute("DELETE FROM assets WHERE owner_type='artist' AND owner_id=?", (ident,))
        c.execute('DELETE FROM artists WHERE id=?', (ident,))
    for asset_id in files:
        (ASSETS / asset_id).unlink(missing_ok=True)
    audit(actor, 'Artiest verwijderd', ident, row['name'])


# --------------------------------------------------------------------------
# Completeness. One list of what is still missing per booking; the overview
# shows a warning until it is empty.
# --------------------------------------------------------------------------

def _leg_complete(leg):
    return all((leg or {}).get(k) for k in ('from', 'to', 'departure', 'arrival', 'number'))


def missing_items(booking, artist, acts, assets):
    """What still blocks this artist's advancing. `assets` maps
    (owner_type, owner_id) to asset rows."""
    missing = []
    mine = assets.get(('artist', artist.get('id')), [])
    kinds = {a['kind'] for a in mine}
    if not artist.get('full_name'):
        missing.append('Volledige naam')
    if not (artist.get('email') or artist.get('agent_email')):
        missing.append('E-mail van artiest of agent')
    if not any(artist.get('id') in act['artist_ids'] and act['start'] and act['end'] for act in acts):
        missing.append('Act en set time')
    if not ((artist.get('tech_rider') or '').strip() or artist.get('rider_url') or kinds & {'tech_rider', 'rider'}):
        missing.append('Technical rider')
    if not ((artist.get('bio') or '').strip() or 'bio' in kinds):
        missing.append('Bio / promotekst')
    if 'press_photo' not in kinds:
        missing.append('Persfoto')

    flight, hotel, ground = booking['flight_info'], booking['hotel_info'], booking['ground_info']
    if booking['flight'] == '':
        missing.append('Vlucht: ja of nee')
    elif booking['flight'] == 'yes':
        if flight.get('tickets_booked') != 'yes':
            missing.append('Vlucht: tickets geboekt')
        if not flight.get('booked_by'):
            missing.append('Vlucht: geboekt door')
        if not _leg_complete(flight.get('inbound')):
            missing.append('Heenvlucht')
        if not _leg_complete(flight.get('outbound')):
            missing.append('Terugvlucht')
    if booking['grounds'] == '':
        missing.append('Grondvervoer: ja of nee')
    elif booking['grounds'] == 'yes' and not (ground.get('pickup_time') and ground.get('pickup_location')):
        missing.append('Grondvervoer: ophaaltijd en -locatie')
    if booking['hotel'] == '':
        missing.append('Hotel: ja of nee')
    elif booking['hotel'] == 'yes' and not (hotel.get('name') and hotel.get('check_in') and hotel.get('check_out')):
        missing.append('Hotel: naam, check-in en check-out')

    # Passport and date of birth only matter when we or the venue book
    # travel or a room in the artist's name.
    needs_id = (booking['flight'] == 'yes' and flight.get('booked_by') in ('moonshine', 'venue')) or \
               (booking['hotel'] == 'yes' and hotel.get('booked_by') in ('moonshine', 'venue'))
    if needs_id and not (artist.get('passport') and artist.get('date_of_birth')):
        missing.append('Paspoort/ID en geboortedatum')
    return missing


# --------------------------------------------------------------------------
# Event advancing
# --------------------------------------------------------------------------

def _booking_row(row):
    booking = dict(row)
    booking['flight_info'] = _structured_defaults(FLIGHT_FIELDS, _json(booking['flight_info'], {}))
    booking['hotel_info'] = _structured_defaults(HOTEL_FIELDS, _json(booking['hotel_info'], {}))
    booking['ground_info'] = _structured_defaults(GROUND_FIELDS, _json(booking['ground_info'], {}))
    return booking


def _structured_defaults(spec, value):
    out = {}
    for key, rule in spec.items():
        if isinstance(rule, dict):
            out[key] = _structured_defaults(rule, value.get(key) if isinstance(value.get(key), dict) else {})
        elif rule == 'money':
            out[key] = value.get(key) if isinstance(value.get(key), int) else 0
        else:
            out[key] = value.get(key) if isinstance(value.get(key), str) else ''
    return out


def _acts(c, event_id):
    acts = []
    for row in c.execute('SELECT id,start,end,act,note,stage,artist_ids,sort FROM event_slots WHERE event_id=?', (event_id,)):
        act = dict(row)
        act['name'] = act.pop('act')
        act['artist_ids'] = [a for a in _json(act['artist_ids'], []) if isinstance(a, str)]
        acts.append(act)
    acts.sort(key=lambda a: (_minutes(a['start']), a['sort']))
    return acts


def _asset_index(c, artist_ids=(), booking_ids=(), event_id=None):
    index = {}
    pairs = [('artist', i) for i in artist_ids] + [('booking', i) for i in booking_ids]
    if event_id:
        pairs.append(('event', event_id))
    for owner_type in ('artist', 'booking', 'event'):
        ids = [i for t, i in pairs if t == owner_type]
        for start in range(0, len(ids), 400):
            chunk = ids[start:start + 400]
            for row in c.execute(f'SELECT * FROM assets WHERE owner_type=? AND owner_id IN ({",".join("?" * len(chunk))}) ORDER BY created DESC',
                                 [owner_type] + chunk):
                index.setdefault((owner_type, row['owner_id']), []).append(dict(row))
    return index


def _seed_checklist(c, event_id):
    now = time.time()
    for sort, (key, label) in enumerate(CHECKLIST):
        c.execute('INSERT INTO checklist(id,event_id,key,label,sort,created) VALUES(?,?,?,?,?,?)',
                  (uid(), event_id, key, label, sort, now))
    c.execute('UPDATE events SET checklist_seeded=1 WHERE id=?', (event_id,))


def _ensure_checklist(event_id):
    """Seed the default venue checklist once per event. Only takes a write
    lock the first time."""
    with db() as c:
        row = c.execute('SELECT checklist_seeded FROM events WHERE id=?', (event_id,)).fetchone()
        if not row:
            raise ValueError('Onbekend evenement.')
        if row['checklist_seeded']:
            return
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT checklist_seeded FROM events WHERE id=?', (event_id,)).fetchone()['checklist_seeded']:
            _seed_checklist(c, event_id)


def _load(event_id):
    _ensure_checklist(event_id)
    with db() as c:
        row = c.execute('SELECT * FROM events WHERE id=?', (event_id,)).fetchone()
        if not row:
            raise ValueError('Onbekend evenement.')
        event = dict(row)
        bookings = [_booking_row(r) for r in c.execute('SELECT * FROM bookings WHERE event_id=? ORDER BY sort,created', (event_id,))]
        artist_ids = [b['artist_id'] for b in bookings]
        artists = {}
        if artist_ids:
            artists = {r['id']: dict(r) for r in c.execute(
                f'SELECT * FROM artists WHERE id IN ({",".join("?" * len(artist_ids))})', artist_ids)}
        acts = _acts(c, event_id)
        assets = _asset_index(c, artist_ids, [b['id'] for b in bookings], event_id)
        checklist = [dict(r) for r in c.execute('SELECT * FROM checklist WHERE event_id=? ORDER BY sort,created', (event_id,))]
        sends = []
        for r in c.execute('SELECT * FROM sends WHERE event_id=? ORDER BY created DESC LIMIT 50', (event_id,)):
            send = dict(r)
            send['items'] = _json(send['items'], [])
            send['attachments'] = _json(send['attachments'], [])
            sends.append(send)
    return event, bookings, artists, acts, assets, checklist, sends


def _summary(artist):
    keys = ('id', 'name', 'full_name', 'email', 'phone', 'agency', 'agent', 'agent_email', 'agent_phone', 'instagram')
    return {k: artist.get(k, '') for k in keys}


def advancing(event_id):
    event, bookings, artists, acts, assets, checklist, sends = _load(event_id)
    rows = []
    for booking in bookings:
        artist = artists.get(booking['artist_id'], {'id': booking['artist_id']})
        missing = [] if booking['status'] == 'cancelled' else missing_items(booking, artist, acts, assets)
        rows.append({**booking, 'artist': _summary(artist), 'missing': missing, 'complete': not missing,
                     'acts': [a['id'] for a in acts if booking['artist_id'] in a['artist_ids']]})
    active = [r for r in rows if r['status'] != 'cancelled']
    names = {b['artist_id']: artists.get(b['artist_id'], {}).get('name', '') for b in bookings}
    for act in acts:
        act['artists'] = [names.get(a, '') for a in act['artist_ids'] if a in names]
    return {
        'event': event, 'bookings': rows, 'acts': acts, 'checklist': checklist, 'sends': sends,
        'assets': assets.get(('event', event_id), []),
        'summary': {
            'artists': len(active), 'complete': sum(1 for r in active if r['complete']),
            'checklist': len([i for i in checklist if i['status'] != 'na']),
            'checklist_done': len([i for i in checklist if i['status'] in ('done', 'sent')]),
        },
    }


def event_progress():
    """Per-event advancing progress for the events list, in a few queries."""
    with db() as c:
        bookings = [_booking_row(r) for r in c.execute("SELECT * FROM bookings WHERE status!='cancelled'")]
        artists = {r['id']: dict(r) for r in c.execute('SELECT * FROM artists')}
        acts_by_event = {}
        for event_id in {b['event_id'] for b in bookings}:
            acts_by_event[event_id] = _acts(c, event_id)
        assets = _asset_index(c, list(artists))
        checks = {r['event_id']: (r['total'], r['done']) for r in c.execute(
            "SELECT event_id, SUM(status!='na') AS total, SUM(status IN ('done','sent')) AS done FROM checklist GROUP BY event_id")}
    progress = {}
    for booking in bookings:
        entry = progress.setdefault(booking['event_id'], {'artists': 0, 'complete': 0})
        entry['artists'] += 1
        if not missing_items(booking, artists.get(booking['artist_id'], {}), acts_by_event.get(booking['event_id'], []), assets):
            entry['complete'] += 1
    for event_id, (total, done) in checks.items():
        entry = progress.setdefault(event_id, {'artists': 0, 'complete': 0})
        entry['checklist'], entry['checklist_done'] = total or 0, done or 0
    return progress


def booking_detail(booking_id, private=True):
    with db() as c:
        row = c.execute('SELECT * FROM bookings WHERE id=?', (booking_id,)).fetchone()
        if not row:
            raise ValueError('Onbekende boeking.')
        booking = _booking_row(row)
        artist = dict(c.execute('SELECT * FROM artists WHERE id=?', (booking['artist_id'],)).fetchone())
        event = dict(c.execute('SELECT id,name,date,venue,doors,status FROM events WHERE id=?', (booking['event_id'],)).fetchone())
        acts = _acts(c, booking['event_id'])
        assets = _asset_index(c, [artist['id']], [booking_id])
        rows = c.execute('SELECT b.artist_id,b.status,a.name FROM bookings b JOIN artists a ON a.id=b.artist_id '
                         'WHERE b.event_id=? ORDER BY b.sort,b.created', (booking['event_id'],)).fetchall()
    booked = {r['artist_id']: r['name'] for r in rows}
    for act in acts:
        act['artists'] = [booked[a] for a in act['artist_ids'] if a in booked]
    booking['missing'] = [] if booking['status'] == 'cancelled' else missing_items(booking, artist, acts, assets)
    booking['complete'] = not booking['missing']
    booking['artist'] = mask(artist, private)
    booking['event'] = event
    booking['acts'] = acts
    booking['artist_assets'] = assets.get(('artist', artist['id']), [])
    booking['assets'] = assets.get(('booking', booking_id), [])
    booking['lineup'] = [{'artist_id': r['artist_id'], 'name': r['name']} for r in rows if r['status'] != 'cancelled']
    return booking


def booking_add(event_id, payload, actor):
    artist_id = _text(payload.get('artist_id'), 24)
    name = _text(payload.get('name'), 120)
    now = time.time()
    created_artist = False
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT 1 FROM events WHERE id=?', (event_id,)).fetchone():
            raise ValueError('Onbekend evenement.')
        if artist_id:
            if not c.execute('SELECT 1 FROM artists WHERE id=?', (artist_id,)).fetchone():
                raise ValueError('Onbekende artiest.')
        elif name:
            row = c.execute('SELECT id FROM artists WHERE name=? COLLATE NOCASE', (name,)).fetchone()
            if row:
                artist_id = row['id']
            else:
                artist_id = uid()
                created_artist = True
                c.execute('INSERT INTO artists(id,name,created,updated) VALUES(?,?,?,?)', (artist_id, name, now, now))
        else:
            raise ValueError('Kies een artiest of vul een naam in.')
        if c.execute('SELECT 1 FROM bookings WHERE event_id=? AND artist_id=?', (event_id, artist_id)).fetchone():
            raise ValueError('Deze artiest staat al op dit evenement.')
        sort = c.execute('SELECT COALESCE(MAX(sort),-1)+1 FROM bookings WHERE event_id=?', (event_id,)).fetchone()[0]
        booking_id = uid()
        c.execute('INSERT INTO bookings(id,event_id,artist_id,sort,created,updated) VALUES(?,?,?,?,?,?)',
                  (booking_id, event_id, artist_id, sort, now, now))
    if created_artist:
        audit(actor, 'Artiest aangemaakt', artist_id, name)
    audit(actor, 'Artiest geboekt', booking_id, event_id)
    return booking_id


def booking_update(booking_id, payload, actor):
    fields = {}
    if 'status' in payload:
        if payload['status'] not in BOOKING_STATUS:
            raise ValueError('Ongeldige boekingsstatus.')
        fields['status'] = payload['status']
    if 'fee' in payload:
        fields['fee'] = money(payload['fee'])
    for key in ('flight', 'grounds', 'hotel'):
        if key in payload:
            if payload[key] not in YES_NO:
                raise ValueError('Kies ja of nee.')
            fields[key] = payload[key]
    for key, spec, label in (('flight_info', FLIGHT_FIELDS, 'Vlucht'), ('hotel_info', HOTEL_FIELDS, 'Hotel'),
                             ('ground_info', GROUND_FIELDS, 'Grondvervoer')):
        if key in payload:
            fields[key] = encode(_structured(spec, payload[key], label))
    if 'notes' in payload:
        fields['notes'] = _text(payload['notes'], 4000)
    artist_changes = payload.get('artist') if isinstance(payload.get('artist'), dict) else None
    with db() as c:
        row = c.execute('SELECT artist_id FROM bookings WHERE id=?', (booking_id,)).fetchone()
        if not row:
            raise ValueError('Onbekende boeking.')
        artist_id = row['artist_id']
    if artist_changes:
        artist_update(artist_id, artist_changes, actor)
    if fields:
        with db() as c:
            c.execute(f'UPDATE bookings SET {",".join(k + "=?" for k in fields)},updated=? WHERE id=?',
                      list(fields.values()) + [time.time(), booking_id])
        audit(actor, 'Advancing bijgewerkt', booking_id, ', '.join(fields))


def booking_remove(booking_id, actor):
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT event_id,artist_id FROM bookings WHERE id=?', (booking_id,)).fetchone()
        if not row:
            raise ValueError('Onbekende boeking.')
        for act in c.execute('SELECT id,artist_ids FROM event_slots WHERE event_id=?', (row['event_id'],)).fetchall():
            ids = _json(act['artist_ids'], [])
            if row['artist_id'] in ids:
                c.execute('UPDATE event_slots SET artist_ids=? WHERE id=?', (encode([i for i in ids if i != row['artist_id']]), act['id']))
        files = [r['id'] for r in c.execute("SELECT id FROM assets WHERE owner_type='booking' AND owner_id=?", (booking_id,))]
        c.execute("DELETE FROM assets WHERE owner_type='booking' AND owner_id=?", (booking_id,))
        c.execute('DELETE FROM bookings WHERE id=?', (booking_id,))
    for asset_id in files:
        (ASSETS / asset_id).unlink(missing_ok=True)
    audit(actor, 'Boeking verwijderd', booking_id, row['event_id'])
    return row['event_id']


def remove_event_files(event_id):
    """Called before an event is deleted: drop the files that hang off it.
    OneDrive copies stay, like the event folder itself."""
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        booking_ids = [r['id'] for r in c.execute('SELECT id FROM bookings WHERE event_id=?', (event_id,))]
        files = []
        for owner_type, ids in (('booking', booking_ids), ('event', [event_id])):
            for ident in ids:
                files += [r['id'] for r in c.execute('SELECT id FROM assets WHERE owner_type=? AND owner_id=?', (owner_type, ident))]
                c.execute('DELETE FROM assets WHERE owner_type=? AND owner_id=?', (owner_type, ident))
    for asset_id in files:
        (ASSETS / asset_id).unlink(missing_ok=True)


# --------------------------------------------------------------------------
# Acts (timetable). Stored in event_slots so the legacy running order and
# the new timetable are one list.
# --------------------------------------------------------------------------

def _act_payload(c, event_id, payload, partial):
    out = {}
    if 'artist_ids' in payload:
        ids = payload['artist_ids'] if isinstance(payload['artist_ids'], list) else []
        booked = {r['artist_id'] for r in c.execute('SELECT artist_id FROM bookings WHERE event_id=?', (event_id,))}
        clean = []
        for ident in ids:
            if not isinstance(ident, str) or ident not in booked:
                raise ValueError('Kies artiesten die op dit evenement staan.')
            if ident not in clean:
                clean.append(ident)
        out['artist_ids'] = encode(clean)
    if 'name' in payload:
        out['act'] = _text(payload['name'], 200)
    if 'start' in payload:
        out['start'] = _time(payload['start'], 'Starttijd')
    if 'end' in payload:
        out['end'] = _time(payload['end'], 'Eindtijd')
    if 'stage' in payload:
        out['stage'] = _text(payload['stage'], 80)
    if 'note' in payload:
        out['note'] = _text(payload['note'], 400)
    if not out.get('act') and 'artist_ids' in out and (not partial or 'name' in payload):
        ids = _json(out['artist_ids'], [])
        names = {r['id']: r['name'] for r in c.execute(
            f'SELECT id,name FROM artists WHERE id IN ({",".join("?" * len(ids))})', ids)} if ids else {}
        out['act'] = ' B2B '.join(names[i] for i in ids if i in names)
    if (not partial or 'act' in out) and not out.get('act'):
        raise ValueError('Geef de act een naam of kies artiesten.')
    return out


def act_create(event_id, payload, actor):
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT 1 FROM events WHERE id=?', (event_id,)).fetchone():
            raise ValueError('Onbekend evenement.')
        data = _act_payload(c, event_id, payload, partial=False)
        sort = c.execute('SELECT COALESCE(MAX(sort),-1)+1 FROM event_slots WHERE event_id=?', (event_id,)).fetchone()[0]
        ident = uid()
        c.execute('INSERT INTO event_slots(id,event_id,start,end,act,note,stage,artist_ids,sort) VALUES(?,?,?,?,?,?,?,?,?)',
                  (ident, event_id, data.get('start', ''), data.get('end', ''), data['act'], data.get('note', ''),
                   data.get('stage', ''), data.get('artist_ids', '[]'), sort))
        c.execute('UPDATE events SET updated=? WHERE id=?', (time.time(), event_id))
    audit(actor, 'Act toegevoegd', ident, data['act'])
    return ident


def act_update(act_id, payload, actor):
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT event_id FROM event_slots WHERE id=?', (act_id,)).fetchone()
        if not row:
            raise ValueError('Onbekende act.')
        data = _act_payload(c, row['event_id'], payload, partial=True)
        if data:
            c.execute(f'UPDATE event_slots SET {",".join(k + "=?" for k in data)} WHERE id=?', list(data.values()) + [act_id])
            c.execute('UPDATE events SET updated=? WHERE id=?', (time.time(), row['event_id']))
    audit(actor, 'Act bijgewerkt', act_id)
    return row['event_id']


def act_delete(act_id, actor):
    with db() as c:
        row = c.execute('SELECT event_id FROM event_slots WHERE id=?', (act_id,)).fetchone()
        if not row:
            raise ValueError('Onbekende act.')
        c.execute('DELETE FROM event_slots WHERE id=?', (act_id,))
    audit(actor, 'Act verwijderd', act_id)
    return row['event_id']


# --------------------------------------------------------------------------
# Venue checklist
# --------------------------------------------------------------------------

def checklist_update(item_id, payload, actor):
    fields = {}
    if 'status' in payload:
        if payload['status'] not in CHECK_STATUS:
            raise ValueError('Ongeldige status.')
        fields['status'] = payload['status']
    if 'notes' in payload:
        fields['notes'] = _text(payload['notes'], 1000)
    if 'label' in payload:
        fields['label'] = _text(payload['label'], 200)
        if not fields['label']:
            raise ValueError('Geef het onderdeel een naam.')
    with db() as c:
        row = c.execute('SELECT event_id FROM checklist WHERE id=?', (item_id,)).fetchone()
        if not row:
            raise ValueError('Onbekend checklistonderdeel.')
        if fields:
            c.execute(f'UPDATE checklist SET {",".join(k + "=?" for k in fields)} WHERE id=?', list(fields.values()) + [item_id])
    audit(actor, 'Checklist bijgewerkt', item_id, fields.get('status', ''))
    return row['event_id']


def checklist_add(event_id, label, actor):
    label = _text(label, 200)
    if not label:
        raise ValueError('Geef het onderdeel een naam.')
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT 1 FROM events WHERE id=?', (event_id,)).fetchone():
            raise ValueError('Onbekend evenement.')
        sort = c.execute('SELECT COALESCE(MAX(sort),-1)+1 FROM checklist WHERE event_id=?', (event_id,)).fetchone()[0]
        ident = uid()
        c.execute('INSERT INTO checklist(id,event_id,key,label,sort,created) VALUES(?,?,?,?,?,?)',
                  (ident, event_id, '', label, sort, time.time()))
    audit(actor, 'Checklistonderdeel toegevoegd', ident, label)
    return ident


def checklist_delete(item_id, actor):
    with db() as c:
        row = c.execute('SELECT event_id FROM checklist WHERE id=?', (item_id,)).fetchone()
        if not row:
            raise ValueError('Onbekend checklistonderdeel.')
        c.execute('DELETE FROM checklist WHERE id=?', (item_id,))
    audit(actor, 'Checklistonderdeel verwijderd', item_id)
    return row['event_id']


# --------------------------------------------------------------------------
# Files: riders, EPK, promo, invoices. Stored locally, mirrored to OneDrive.
# --------------------------------------------------------------------------

def _owner_exists(c, owner_type, owner_id):
    table = {'artist': 'artists', 'booking': 'bookings', 'event': 'events'}.get(owner_type)
    if not table:
        raise ValueError('Ongeldige eigenaar.')
    return bool(c.execute(f'SELECT 1 FROM {table} WHERE id=?', (owner_id,)).fetchone())


def asset_add_file(owner_type, owner_id, kind, filename, content, actor):
    if kind not in ASSET_KINDS:
        raise ValueError('Kies een soort bestand.')
    name = Path(str(filename or '').replace('\\', '/')).name.strip()[:180]
    mime = FILE_TYPES.get(Path(name).suffix.lower())
    if not name or not mime:
        raise ValueError('Dit bestandstype wordt niet ondersteund. Gebruik PDF, afbeelding, Office, ZIP of video.')
    if not content:
        raise ValueError('Het bestand is leeg.')
    if len(content) > MAX_ASSET:
        raise ValueError('Maximaal 20 MB per bestand. Zet grotere bestanden (video) als link.')
    sha = hashlib.sha256(content).hexdigest()
    now = time.time()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not _owner_exists(c, owner_type, owner_id):
            raise ValueError('Onbekende eigenaar van het bestand.')
        # Same owner, kind and name: a new version replaces the old one.
        existing = c.execute('SELECT id FROM assets WHERE owner_type=? AND owner_id=? AND kind=? AND name=? AND has_file=1',
                             (owner_type, owner_id, kind, name)).fetchone()
        ident = existing['id'] if existing else uid()
        tmp = ASSETS / (ident + '.' + uid() + '.tmp')
        with tmp.open('xb') as output:
            if os.name != 'nt':
                os.fchmod(output.fileno(), 0o600)
            output.write(content)
        tmp.replace(ASSETS / ident)
        try:
            if existing:
                c.execute("UPDATE assets SET mime=?,size=?,sha=?,sync_status='local',error='',created=? WHERE id=?",
                          (mime, len(content), sha, now, ident))
            else:
                c.execute('INSERT INTO assets(id,owner_type,owner_id,kind,name,mime,size,sha,has_file,sync_status,created) '
                          "VALUES(?,?,?,?,?,?,?,?,1,'local',?)", (ident, owner_type, owner_id, kind, name, mime, len(content), sha, now))
        except Exception:
            if not existing:
                (ASSETS / ident).unlink(missing_ok=True)
            raise
    audit(actor, 'Bestand opgeslagen', ident, f'{ASSET_KINDS[kind]}: {name}')
    return ident


def asset_add_link(owner_type, owner_id, kind, name, url, actor):
    if kind not in ASSET_KINDS:
        raise ValueError('Kies een soort link.')
    url = _url(url, 'Link')
    if not url:
        raise ValueError('Vul een link in.')
    name = _text(name, 180) or re.sub(r'^https?://', '', url, flags=re.I).split('/')[0]
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not _owner_exists(c, owner_type, owner_id):
            raise ValueError('Onbekende eigenaar van de link.')
        ident = uid()
        c.execute("INSERT INTO assets(id,owner_type,owner_id,kind,name,url,has_file,sync_status,created) VALUES(?,?,?,?,?,?,0,'link',?)",
                  (ident, owner_type, owner_id, kind, name, url, time.time()))
    audit(actor, 'Link opgeslagen', ident, f'{ASSET_KINDS[kind]}: {name}')
    return ident


def asset_get(ident):
    with db() as c:
        row = c.execute('SELECT * FROM assets WHERE id=?', (ident,)).fetchone()
    if not row:
        raise ValueError('Onbekend bestand.')
    return dict(row)


def asset_content(asset):
    if not asset['has_file']:
        raise ValueError('Dit is een link, geen bestand.')
    path = ASSETS / asset['id']
    if not path.is_file():
        raise ValueError('Het bestand ontbreekt op de server.')
    return path.read_bytes()


def asset_delete(ident, actor):
    asset = asset_get(ident)
    with db() as c:
        c.execute('DELETE FROM assets WHERE id=?', (ident,))
    (ASSETS / ident).unlink(missing_ok=True)
    audit(actor, 'Bestand verwijderd', ident, asset['name'])
    return asset


def _drive_root():
    return (settings().get('production_folder') or 'Moonshine/Productie').strip('/')


def _event_folder(event):
    day = (event.get('date') or '').strip()
    return safe_name(f"{day} {event.get('name') or ''}".strip(), 'Evenement')


def asset_drive_path(asset):
    root = _drive_root()
    folder = DRIVE_FOLDERS.get(asset['kind'], 'Overig')
    with db() as c:
        if asset['owner_type'] == 'artist':
            artist = c.execute('SELECT name FROM artists WHERE id=?', (asset['owner_id'],)).fetchone()
            base = f"{root}/Artiesten/{safe_name(artist['name'] if artist else '', 'Artiest')}"
        elif asset['owner_type'] == 'booking':
            row = c.execute('SELECT e.name,e.date,a.name AS artist FROM bookings b JOIN events e ON e.id=b.event_id '
                            'JOIN artists a ON a.id=b.artist_id WHERE b.id=?', (asset['owner_id'],)).fetchone()
            if not row:
                raise ValueError('Boeking bestaat niet meer.')
            base = f"{root}/Evenementen/{_event_folder(dict(row))}/Artiesten/{safe_name(row['artist'], 'Artiest')}"
        else:
            row = c.execute('SELECT name,date FROM events WHERE id=?', (asset['owner_id'],)).fetchone()
            if not row:
                raise ValueError('Evenement bestaat niet meer.')
            base = f"{root}/Evenementen/{_event_folder(dict(row))}"
    return f"{base}/{folder}/{safe_name(asset['name'], 'Bestand')}"


def sync_asset(ident):
    """Copy one file to OneDrive. Network I/O; never call inside a db lock."""
    from integrations import drive_upload
    asset = asset_get(ident)
    if not asset['has_file']:
        return asset
    try:
        item_id, web_url = drive_upload(asset_drive_path(asset), asset_content(asset), asset['mime'])
    except Exception as e:
        message = safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else 'Controleer de OneDrive-koppeling.'
        with db() as c:
            c.execute("UPDATE assets SET sync_status='error',error=? WHERE id=?", (message[:500], ident))
        raise
    with db() as c:
        c.execute("UPDATE assets SET sync_status='synced',onedrive_id=?,onedrive_url=?,error='' WHERE id=?",
                  (item_id, web_url, ident))
    return asset_get(ident)


def sync_pending(limit=3):
    if not settings().get('production_sync'):
        return 0
    with db() as c:
        ids = [r['id'] for r in c.execute("SELECT id FROM assets WHERE has_file=1 AND sync_status='local' ORDER BY created LIMIT ?", (limit,))]
    done = 0
    for ident in ids:
        try:
            sync_asset(ident)
            done += 1
        except Exception as e:
            audit('worker', 'OneDrive-opslag vraagt controle', ident, safe_error(e)[:200] if isinstance(e, (ValueError, RuntimeError)) else '')
            break
    return done


# --------------------------------------------------------------------------
# Documents: rider PDFs and the advancing sheet.
# --------------------------------------------------------------------------

MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']


def nice_date(value):
    try:
        day = date.fromisoformat((value or '')[:10])
    except ValueError:
        return value or ''
    return f'{day.day} {MONTHS[day.month - 1]} {day.year}'


def nice_datetime(value):
    if not value:
        return ''
    try:
        moment = datetime.fromisoformat(value)
    except ValueError:
        return value
    return f'{moment.day:02d}-{moment.month:02d} {moment.hour:02d}:{moment.minute:02d}'


def _rider_blocks(text):
    """Rider text to PDF blocks: '# ' headings, '- ' or '* ' bullets,
    blank lines between paragraphs."""
    blocks, paragraph = [], []

    def flush():
        if paragraph:
            blocks.append(('p', ' '.join(paragraph)))
            paragraph.clear()
    for raw in (text or '').splitlines():
        line = raw.strip()
        if not line:
            flush()
        elif line.startswith('#'):
            flush()
            blocks.append(('h', line.lstrip('#').strip()))
        elif line[:2] in ('- ', '* ', '• '):
            flush()
            blocks.append(('li', line[2:].strip()))
        else:
            paragraph.append(line)
    flush()
    return blocks


def rider_pdf(artist, kind, event=None):
    from pdfgen import render
    label = 'Technical rider' if kind == 'tech' else 'Hospitality rider'
    text = artist.get('tech_rider' if kind == 'tech' else 'hospitality_rider') or ''
    if not text.strip():
        raise ValueError(f'Er is nog geen {label.lower()} ingevuld voor {artist["name"]}.')
    subtitle = ' · '.join(x for x in (event and event.get('name'), event and nice_date(event.get('date')), event and event.get('venue')) if x)
    contact = [(k, v) for k, v in (('Artiest', artist['name']), ('Contact', artist.get('full_name')),
                                   ('Agent', ' · '.join(x for x in (artist.get('agent'), artist.get('agency')) if x)),
                                   ('E-mail', artist.get('agent_email') or artist.get('email')),
                                   ('Telefoon', artist.get('agent_phone') or artist.get('phone'))) if v]
    return render(f'{label} · {artist["name"]}', subtitle or 'Moonshine', _rider_blocks(text) + [('rule',), ('kv', contact)])


def advancing_pdf(data, keys):
    from pdfgen import render
    event = data['event']
    active = [b for b in data['bookings'] if b['status'] != 'cancelled']
    blocks = []
    facts = [(k, v) for k, v in (('Datum', nice_date(event.get('date'))), ('Locatie', event.get('venue')),
                                 ('Deuren', event.get('doors')), ('Capaciteit', str(event.get('capacity') or '')),
                                 ('Contact venue', event.get('venue_contact'))) if v]
    if facts:
        blocks.append(('kv', facts))
    if 'timetable' in keys:
        blocks += [('h', 'Timetable'), ('table', ['Tijd', 'Act', 'Artiesten', 'Stage'],
                   [[f"{a['start']} – {a['end']}".strip(' –'), a['name'], ', '.join(a.get('artists', [])), a.get('stage', '')]
                    for a in data['acts']] or [['', 'Nog geen acts ingepland', '', '']])]
    if 'contacts' in keys:
        blocks += [('h', 'Contacten'), ('table', ['Artiest', 'Naam', 'E-mail', 'Telefoon', 'Agent'],
                   [[b['artist']['name'], b['artist']['full_name'], b['artist']['email'], b['artist']['phone'],
                     ' · '.join(x for x in (b['artist']['agent'], b['artist']['agency'], b['artist']['agent_email'], b['artist']['agent_phone']) if x)]
                    for b in active])]
    if 'travel' in keys:
        flights = []
        for b in active:
            if b['flight'] != 'yes':
                continue
            for direction, leg in (('Heen', b['flight_info']['inbound']), ('Terug', b['flight_info']['outbound'])):
                flights.append([b['artist']['name'], direction, leg.get('number', ''),
                                f"{leg.get('from', '')} → {leg.get('to', '')}".strip(' →'),
                                nice_datetime(leg.get('departure')), nice_datetime(leg.get('arrival'))])
        grounds = [[b['artist']['name'], nice_datetime(b['ground_info'].get('pickup_time')), b['ground_info'].get('pickup_location', ''),
                    b['ground_info'].get('dropoff_location', ''), nice_datetime(b['ground_info'].get('return_time')),
                    ' '.join(x for x in (b['ground_info'].get('driver'), b['ground_info'].get('driver_phone')) if x)]
                   for b in active if b['grounds'] == 'yes']
        blocks.append(('h', 'Vluchten'))
        blocks.append(('table', ['Artiest', 'Richting', 'Vlucht', 'Route', 'Vertrek', 'Aankomst'], flights) if flights
                      else ('p', 'Geen vluchten.'))
        blocks.append(('h', 'Grondvervoer'))
        blocks.append(('table', ['Artiest', 'Ophalen', 'Van', 'Naar', 'Terug', 'Chauffeur'], grounds) if grounds
                      else ('p', 'Geen grondvervoer geregeld.'))
    if 'hotel' in keys:
        rooms = [[b['artist']['name'], b['hotel_info'].get('name', ''), nice_date(b['hotel_info'].get('check_in')),
                  nice_date(b['hotel_info'].get('check_out')), b['hotel_info'].get('rooms', ''), b['hotel_info'].get('confirmation', '')]
                 for b in active if b['hotel'] == 'yes']
        blocks.append(('h', 'Hotel en rooming list'))
        blocks.append(('table', ['Artiest', 'Hotel', 'Check-in', 'Check-out', 'Kamers', 'Bevestiging'], rooms) if rooms
                      else ('p', 'Geen hotelkamers nodig.'))
    subtitle = ' · '.join(x for x in (nice_date(event.get('date')), event.get('venue')) if x)
    return render(f"Advancing · {event['name']}", subtitle, blocks)


def bios_pdf(data, artists):
    from pdfgen import render
    blocks = []
    for b in data['bookings']:
        if b['status'] == 'cancelled':
            continue
        artist = artists[b['artist_id']]
        if (artist.get('bio') or '').strip():
            blocks += [('h', artist['name']), ('p', artist['bio'])]
            if artist.get('instagram'):
                blocks.append(('p', 'Instagram: ' + artist['instagram']))
    return render(f"Bio's · {data['event']['name']}", nice_date(data['event'].get('date')), blocks) if blocks else None


# --------------------------------------------------------------------------
# The advancing pack: one mail to the venue with exactly what the selected
# checklist items need.
# --------------------------------------------------------------------------

def _recipients(value):
    raw = value if isinstance(value, list) else re.split(r'[;,\s]+', str(value or ''))
    out = []
    for item in raw:
        item = str(item).strip()
        if not item:
            continue
        if not EMAIL.match(item):
            raise ValueError(f'Ongeldig e-mailadres: {item[:80]}')
        if item.lower() not in [o.lower() for o in out]:
            out.append(item)
    if len(out) > 20:
        raise ValueError('Maximaal 20 ontvangers.')
    return out


def _format_size(size):
    return f'{size / 1024 / 1024:.1f} MB' if size >= 1024 * 1024 else f'{max(1, round(size / 1024))} kB'


def build_pack(event_id, payload, with_content=True):
    data = advancing(event_id)
    event = data['event']
    checklist = {i['id']: i for i in data['checklist']}
    requested = payload.get('items')
    if requested is None:
        item_ids = [i for i, item in checklist.items() if item['status'] not in ('sent', 'na')]
    else:
        item_ids = [i for i in requested if isinstance(i, str) and i in checklist]
    keys = {checklist[i]['key'] for i in item_ids if checklist[i]['key']}
    active = [b for b in data['bookings'] if b['status'] != 'cancelled']
    with db() as c:
        artists = {r['id']: dict(r) for r in c.execute(
            f'SELECT * FROM artists WHERE id IN ({",".join("?" * len(active))})', [b['artist_id'] for b in active])} if active else {}
        index = _asset_index(c, list(artists), [b['id'] for b in active], event_id)

    attachments, links, warnings = [], [], []

    def add_generated(name, producer):
        content = producer() if with_content else None
        if with_content and content is None:
            return
        attachments.append({'name': name, 'mime': 'application/pdf', 'source': 'generated', 'content': content,
                            'size': len(content) if content else 0})

    def add_assets(rows):
        for asset in rows:
            if asset['has_file']:
                if any(a.get('asset_id') == asset['id'] for a in attachments):
                    continue
                attachments.append({'name': asset['name'], 'mime': asset['mime'] or 'application/octet-stream', 'source': 'asset',
                                    'asset_id': asset['id'], 'size': asset['size'],
                                    'content': asset_content(asset) if with_content else None})
            elif asset['url'] and asset['url'] not in [l['url'] for l in links]:
                links.append({'name': f"{asset['name']} ({ASSET_KINDS.get(asset['kind'], '')})", 'url': asset['url']})

    sheet_keys = keys & {'timetable', 'contacts', 'travel', 'hotel'}
    if sheet_keys:
        add_generated(f"Advancing - {safe_name(event['name'])}.pdf", lambda: advancing_pdf(data, sheet_keys))
    for b in active:
        artist = artists.get(b['artist_id'], {})
        own = index.get(('artist', artist.get('id')), [])
        if 'tech_riders' in keys:
            if (artist.get('tech_rider') or '').strip():
                add_generated(f"Technical rider - {safe_name(artist['name'])}.pdf", lambda a=artist: rider_pdf(a, 'tech', event))
            add_assets([a for a in own if a['kind'] in ('tech_rider', 'rider')])
            if artist.get('rider_url'):
                links.append({'name': f"Rider {artist['name']}", 'url': artist['rider_url']})
            if not ((artist.get('tech_rider') or '').strip() or artist.get('rider_url') or any(a['kind'] in ('tech_rider', 'rider') for a in own)):
                warnings.append(f"Geen technical rider voor {artist.get('name', '')}.")
        if 'hospitality' in keys:
            if (artist.get('hospitality_rider') or '').strip():
                add_generated(f"Hospitality rider - {safe_name(artist['name'])}.pdf", lambda a=artist: rider_pdf(a, 'hospitality', event))
            add_assets([a for a in own if a['kind'] == 'hospitality_rider'])
        if 'promo' in keys:
            add_assets([a for a in own if a['kind'] in ('logo', 'press_photo', 'bio')])
            if artist.get('epk_url'):
                links.append({'name': f"EPK {artist['name']}", 'url': artist['epk_url']})
    if 'promo' in keys:
        add_generated(f"Bio's - {safe_name(event['name'])}.pdf", lambda: bios_pdf(data, artists))
    event_assets = index.get(('event', event_id), [])
    if 'guestlist' in keys:
        add_assets([a for a in event_assets if a['kind'] == 'guestlist'])
        if not any(a['kind'] == 'guestlist' for a in event_assets):
            warnings.append('Er is nog geen gastenlijst toegevoegd.')
    if 'production' in keys:
        add_assets([a for a in event_assets if a['kind'] in ('production', 'stage_plot')])
    extra = payload.get('assets') if isinstance(payload.get('assets'), list) else []
    allowed = {a['id']: a for rows in index.values() for a in rows}
    add_assets([allowed[i] for i in extra if isinstance(i, str) and i in allowed])

    total = sum(a['size'] for a in attachments)
    if with_content and total > MAX_MAIL:
        raise ValueError(f'De bijlagen zijn samen {_format_size(total)}. Verstuur in delen (maximaal 30 MB per mail) of deel grote bestanden als link.')
    incomplete = [b['artist']['name'] for b in active if not b['complete']]
    if incomplete:
        warnings.append('Advancing nog niet compleet voor: ' + ', '.join(incomplete) + '.')

    to = _recipients(payload['to'] if 'to' in payload else event.get('venue_email'))
    cc = _recipients(payload.get('cc'))
    subject = _text(payload.get('subject'), 300) or f"Advancing {event['name']} · {nice_date(event.get('date'))}".strip(' ·')
    greeting = (event.get('venue_contact') or '').split(' ')[0] or 'allemaal'
    message = _text(payload.get('message'), 6000) if payload.get('message') is not None else \
        f"Hoi {greeting},\n\nHierbij de advancing voor {event['name']}{' op ' + nice_date(event.get('date')) if event.get('date') else ''}. Laat het ons weten als er iets ontbreekt."
    items = [checklist[i] for i in item_ids]
    pack = {
        'to': to, 'cc': cc, 'subject': subject, 'message': message, 'items': items, 'links': links,
        'attachments': attachments, 'warnings': warnings, 'total_size': total,
        'html': _mail_html(message, data if 'timetable' in keys else None, attachments, links),
    }
    return pack


def _mail_html(message, timetable_data, attachments, links):
    esc = html.escape
    parts = ['<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1b1b1d">']
    for paragraph in message.split('\n\n'):
        if paragraph.strip():
            parts.append('<p style="margin:0 0 12px">' + esc(paragraph.strip()).replace('\n', '<br>') + '</p>')
    if timetable_data and timetable_data['acts']:
        parts.append('<p style="margin:18px 0 6px;font-weight:bold">Timetable</p><table style="border-collapse:collapse;font-size:13px">')
        for act in timetable_data['acts']:
            window = f"{act['start']} – {act['end']}".strip(' –')
            parts.append('<tr><td style="padding:3px 16px 3px 0;color:#555">' + esc(window) + '</td><td style="padding:3px 0">'
                         + esc(act['name']) + (' <span style="color:#888">· ' + esc(act['stage']) + '</span>' if act.get('stage') else '') + '</td></tr>')
        parts.append('</table>')
    if attachments:
        parts.append('<p style="margin:18px 0 6px;font-weight:bold">In de bijlage</p><ul style="margin:0;padding-left:18px">')
        parts += ['<li>' + esc(a['name']) + '</li>' for a in attachments]
        parts.append('</ul>')
    if links:
        parts.append('<p style="margin:18px 0 6px;font-weight:bold">Links</p><ul style="margin:0;padding-left:18px">')
        parts += ['<li><a href="' + esc(l['url'], quote=True) + '">' + esc(l['name']) + '</a></li>' for l in links]
        parts.append('</ul>')
    parts.append('<p style="margin:22px 0 0">Met vriendelijke groet,<br>Moonshine</p></div>')
    return ''.join(parts)


def preview(event_id, payload):
    pack = build_pack(event_id, payload, with_content=True)
    return {k: v for k, v in pack.items() if k != 'attachments'} | {
        'attachments': [{'name': a['name'], 'size': a['size'], 'source': a['source']} for a in pack['attachments']],
        'sender': settings().get('advancing_sender', ''),
    }


def send(event_id, payload, actor):
    """Send the pack through Outlook (Microsoft Graph). Logged either way;
    checklist items become 'sent' only when Outlook accepted the message."""
    from integrations import send_mail, UncertainSend
    sender = settings().get('advancing_sender', '')
    if not sender:
        raise ValueError('Stel bij Koppelingen → Advancing eerst het verzendadres in (bijv. events@moonshinednb.nl).')
    pack = build_pack(event_id, payload, with_content=True)
    if not pack['to']:
        raise ValueError('Vul een ontvanger in, bijvoorbeeld het productie-adres van de venue.')
    if not pack['items'] and not pack['attachments']:
        raise ValueError('Kies wat je wilt versturen.')
    status, error = 'accepted', ''
    try:
        send_mail(sender, pack['to'], pack['cc'], pack['subject'], pack['html'], pack['attachments'])
    except UncertainSend as e:
        status, error = 'uncertain', str(e)
    except (ValueError, RuntimeError) as e:
        status, error = 'failed', safe_error(e)
    now = time.time()
    ident = uid()
    recipients = ', '.join(pack['to'] + pack['cc'])
    with db() as c:
        c.execute('INSERT INTO sends(id,event_id,recipients,subject,items,attachments,status,error,actor,created) VALUES(?,?,?,?,?,?,?,?,?,?)',
                  (ident, event_id, recipients, pack['subject'], encode([i['label'] for i in pack['items']]),
                   encode([a['name'] for a in pack['attachments']]), status, error[:500], actor, now))
        if status == 'accepted':
            for item in pack['items']:
                c.execute("UPDATE checklist SET status='sent',sent_at=?,sent_to=? WHERE id=?", (now, recipients[:300], item['id']))
    audit(actor, {'accepted': 'Advancing verstuurd', 'uncertain': 'Advancing-verzending onzeker', 'failed': 'Advancing-verzending mislukt'}[status],
          event_id, f"{recipients}: {len(pack['attachments'])} bijlagen")
    if status == 'failed':
        raise ValueError(error or 'Verzenden is niet gelukt.')
    if status == 'accepted' and settings().get('production_sync'):
        generated = [a for a in pack['attachments'] if a['source'] == 'generated']
        threading.Thread(target=_archive_sent, args=(event_id, generated, now), daemon=True).start()
    return {'status': status, 'error': error, 'id': ident}


def _archive_sent(event_id, attachments, stamp):
    """Keep what was sent in the event folder. Best effort: the mail is
    already out, so a failure here is only audited."""
    from integrations import drive_upload
    try:
        with db() as c:
            event = dict(c.execute('SELECT name,date FROM events WHERE id=?', (event_id,)).fetchone())
        day = time.strftime('%Y-%m-%d %H.%M', time.localtime(stamp))
        for attachment in attachments:
            drive_upload(f"{_drive_root()}/Evenementen/{_event_folder(event)}/Verzonden/{day} {safe_name(attachment['name'])}",
                         attachment['content'], attachment['mime'])
    except Exception as e:
        audit('worker', 'Verzonden advancing niet in OneDrive bewaard', event_id,
              safe_error(e)[:200] if isinstance(e, (ValueError, RuntimeError)) else '')

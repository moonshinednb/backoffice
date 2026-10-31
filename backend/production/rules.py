"""Pure advancing rules: input cleaning, completeness, documents and the
venue mail. No database access here; services.py feeds these plain dicts.
Ported unchanged from the first backoffice."""
import html
import json
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP




MAX_ASSET = 20 * 1024 * 1024


MAX_MAIL = 30 * 1024 * 1024


RETRY_SECONDS = 15 * 60


ARTIST_FIELDS = {
    'name': 120, 'full_name': 200, 'passport': 60, 'date_of_birth': 10, 'nationality': 60,
    'email': 320, 'phone': 40, 'instagram': 80, 'agency': 200, 'agent': 200,
    'agent_email': 320, 'agent_phone': 40, 'contact_via': 10, 'rider_url': 1000, 'epk_url': 1000,
    'bio': 6000, 'tech_rider': 20000, 'hospitality_rider': 20000, 'notes': 4000,
}


LABELS = {'email': 'E-mail artiest', 'agent_email': 'E-mail agent', 'rider_url': 'Riderlink',
          'epk_url': 'EPK-link', 'date_of_birth': 'Geboortedatum'}


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
    'tech_rider': 'Technical rider', 'hospitality_rider': 'Hospitality rider', 'rider': 'Riders', 'epk': 'EPK', 'logo': 'Logos',
    'press_photo': 'Persfotos', 'press_video': 'Persvideos', 'bio': 'Bio', 'visual': 'Visuals',
    'invoice': 'Facturen', 'contract': 'Contracten', 'stage_plot': 'Stage plot', 'guestlist': 'Gastenlijst',
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
        elif re.fullmatch(r'\d{1,3}(\.\d{3})+', text):
            # Dutch thousands separator without decimals: 1.500 is 1500.
            text = text.replace('.', '')
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


def _artist_payload(payload, partial):
    out = {}
    for key, limit in ARTIST_FIELDS.items():
        if key not in payload or (key in PRIVATE_FIELDS and payload[key] == '••••'):
            continue  # a masked value coming back unchanged is not a new value
        raw = payload[key]
        if key in ('email', 'agent_email'):
            out[key] = _email(raw, LABELS[key])
        elif key in ('rider_url', 'epk_url'):
            out[key] = _url(raw, LABELS[key])
        elif key == 'contact_via':
            if raw not in ('', 'agency', 'self'):
                raise ValueError('Kies contact via agency of via de artiest zelf.')
            out[key] = raw
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


def _leg_complete(leg):
    return all((leg or {}).get(k) for k in ('from', 'to', 'departure', 'arrival', 'number'))


def missing_items(booking, artist, acts, assets):
    """What still blocks this artist's advancing. `assets` maps
    (owner_type, owner_id) to asset rows."""
    missing = []
    mine = assets.get(('artist', artist.get('id')), [])
    kinds = {a['kind'] for a in mine}
    if contact_via(artist) == 'agency':
        if not artist.get('agent_email'):
            missing.append('E-mail van de agent')
    elif not (artist.get('email') or artist.get('phone')):
        missing.append('E-mail of telefoon van de artiest')
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

    # The full name only matters when we or the venue book travel or a room in
    # the artist's name; booking a flight also needs the date of birth.
    # Passport/ID stays optional.
    if needs_id(booking):
        if not artist.get('full_name'):
            missing.append('Volledige naam (voor reis/hotel)')
        flight_by_us = booking.get('flight') == 'yes' and (booking.get('flight_info') or {}).get('booked_by') in ('moonshine', 'venue')
        if flight_by_us and not artist.get('date_of_birth'):
            missing.append('Geboortedatum (voor de vlucht)')
    return missing


def contact_via(artist):
    return artist.get('contact_via') or ('agency' if artist.get('agency') or artist.get('agent_email') else 'self')


def needs_id(booking):
    flight, hotel = booking.get('flight_info') or {}, booking.get('hotel_info') or {}
    return (booking.get('flight') == 'yes' and flight.get('booked_by') in ('moonshine', 'venue')) or \
           (booking.get('hotel') == 'yes' and hotel.get('booked_by') in ('moonshine', 'venue'))


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
    from .pdf import render
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
    from .pdf import render
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
        def contact(a):
            if contact_via(a) == 'agency':
                return ' · '.join(x for x in (a['agent'], a['agency'], a['agent_email'], a['agent_phone']) if x)
            return ' · '.join(x for x in ('Artiest zelf', a['email'], a['phone']) if x)
        blocks += [('h', 'Contacten'), ('table', ['Artiest', 'Advancing via', 'Showdag'],
                   [[b['artist']['name'], contact(b['artist']), ' · '.join(x for x in (b.get('showday_contact'), b.get('showday_phone')) if x)]
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
    from .pdf import render
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

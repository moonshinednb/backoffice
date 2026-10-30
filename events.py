"""Moonshine events. Event-night production: advancing (running order),
   artists, notes, documents, content and announce posts, each one a file in
   the event's OneDrive folder so the whole night is one browsable place.

   Everything is local-first. OneDrive is the durable archive and the
   hand-off surface for artists and agencies, not the source of truth while
   a night is in progress: an editor needs instant saves and a readable
   offline copy more than they need round-trip consistency with a file
   service on every keystroke.

   Conflicts are detected, never silently resolved. If a OneDrive copy
   changed after our last push we mark the field conflicted and show both
   values instead of picking a winner."""
import hashlib, json, time
from store import db, uid, encode, audit

# Advancing: the running order of the night. Each slot has a time, the act
# on it, and a set length, so gaps and overruns are visible immediately.
SLOT_FIELDS = ('id', 'start', 'end', 'act', 'note', 'locked')

ARTIST_FIELDS = ('id', 'name', 'genre', 'b2b', 'fee', 'fee_paid', 'contact', 'bio', 'rider_done', 'status')
POST_FIELDS = ('id', 'kind', 'title', 'body', 'artist_id', 'channel', 'status', 'scheduled')

VALID_SLOT = {'id', 'start', 'end', 'act', 'note', 'locked', 'done'}
VALID_ARTIST = {'id', 'name', 'genre', 'b2b', 'fee', 'fee_paid', 'contact', 'bio', 'rider_done', 'status'}
VALID_POST = {'id', 'kind', 'title', 'body', 'artist_id', 'channel', 'status', 'scheduled'}


def _clean(value, allowed):
    """Drop unknown keys and coerce to the declared type. Anything reaching
    OneDrive or a file on disk goes through here first."""
    out = {}
    for key in allowed:
        if key not in value:
            continue
        raw = value[key]
        if key in ('b2b', 'fee_paid', 'rider_done', 'locked', 'done'):
            out[key] = 1 if raw in (True, 1, '1', 'true', 'on') else 0
        elif key in ('fee',):
            try:
                # Cents internally, euros on screen. Reject anything that is
                # not a finite number rather than storing NaN.
                out[key] = max(0, int(round(float(raw) * 100)))
            except (TypeError, ValueError):
                out[key] = 0
        else:
            out[key] = '' if raw is None else str(raw)[:4000]
    return out


def _norm(value):
    """Stable hash of a payload, used to detect OneDrive drift."""
    return hashlib.sha256(encode(_sorted(value)).encode('utf-8')).hexdigest()[:32]


def _sorted(value):
    if isinstance(value, dict):
        return {k: _sorted(value[k]) for k in sorted(value)}
    if isinstance(value, list):
        return [_sorted(v) for v in value]
    return value


def _folder_name(event):
    date = (event.get('date') or '').strip()
    name = (event.get('name') or 'Evenement').strip()
    # OneDrive-safe: no \ / : * ? " < > |
    clean = ''.join(c for c in name if c not in '\\/:*?"<>|').strip() or 'Evenement'
    return f'{date}_{clean}' if date else clean


def _manifest(event, slots, artists, posts, notes):
    """The single file that describes the night. OneDrive consumers (an
    agency, a promoter, the door) can read this without the backoffice."""
    return {
        'moonshine_event': 1,
        'name': event['name'],
        'date': event['date'],
        'venue': event['venue'],
        'doors': event['doors'],
        'capacity': event['capacity'],
        'status': event['status'],
        'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'advancing': [s for s in slots],
        'artists': [a for a in artists],
        'announce_posts': [p for p in posts],
        'notes': notes,
    }


def create(payload):
    name = (payload.get('name') or '').strip()
    if not name:
        raise ValueError('Geef het evenement een naam.')
    ident = uid()
    now = time.time()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        c.execute(
            'INSERT INTO events(id,name,date,venue,doors,capacity,status,notes,rider,created,updated) '
            'VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            (ident, name, (payload.get('date') or '').strip(), (payload.get('venue') or '').strip(),
             (payload.get('doors') or '').strip(), int(payload.get('capacity') or 0),
             (payload.get('status') or 'planning'), (payload.get('notes') or ''),
             (payload.get('rider') or ''), now, now))
    audit('events', 'Evenement aangemaakt', ident, name)
    return get(ident)


def update(ident, payload):
    fields, values = [], []
    for key in ('name', 'date', 'venue', 'doors', 'status', 'venue_contact', 'venue_phone'):
        if key in payload:
            fields.append(f'{key}=?')
            values.append(str(payload.get(key) or '').strip()[:300])
    if 'name' in payload and not str(payload.get('name') or '').strip():
        raise ValueError('Geef het evenement een naam.')
    if 'venue_email' in payload:
        from advancing import _recipients
        fields.append('venue_email=?')
        values.append(', '.join(_recipients(payload.get('venue_email'))))
    if 'capacity' in payload:
        fields.append('capacity=?')
        values.append(max(0, int(payload.get('capacity') or 0)))
    if 'notes' in payload:
        fields.append('notes=?')
        values.append(str(payload.get('notes') or '')[:20000])
    if 'rider' in payload:
        fields.append('rider=?')
        values.append(str(payload.get('rider') or '')[:20000])
    if not fields:
        return get(ident)
    fields.append('updated=?')
    values.extend([time.time(), ident])
    with db() as c:
        cur = c.execute(f'UPDATE events SET {",".join(fields)} WHERE id=?', values)
        if not cur.rowcount:
            raise ValueError('Onbekend evenement.')
    return get(ident)


def get(ident):
    with db() as c:
        row = c.execute('SELECT * FROM events WHERE id=?', (ident,)).fetchone()
        if not row:
            raise ValueError('Onbekend evenement.')
        event = dict(row)
        event['advancing'] = [dict(r) for r in c.execute('SELECT * FROM event_slots WHERE event_id=? ORDER BY sort,start', (ident,))]
        event['artists'] = [dict(r) for r in c.execute('SELECT * FROM event_artists WHERE event_id=? ORDER BY sort,name', (ident,))]
        event['posts'] = [dict(r) for r in c.execute('SELECT * FROM event_posts WHERE event_id=? ORDER BY created DESC', (ident,))]
        event['documents'] = [dict(r) for r in c.execute('SELECT * FROM event_documents WHERE event_id=? ORDER BY created DESC', (ident,))]
    return event


def listing(only=None):
    """All events, newest first, with advancing progress per event. The
    client splits upcoming and past by date. `only` filters the rows (and
    the progress work) to events for which it returns True."""
    from advancing import event_progress
    rows = [r for r in _rows() if only is None or only(r)]
    progress = event_progress([r['id'] for r in rows] if only else None)
    for row in rows:
        row['progress'] = progress.get(row['id'], {'artists': 0, 'complete': 0})
    return rows


def _rows():
    with db() as c:
        return [dict(r) for r in c.execute(
            'SELECT e.*,'
            ' (SELECT COUNT(*) FROM event_slots s WHERE s.event_id=e.id) AS slot_count,'
            ' (SELECT COUNT(*) FROM event_artists a WHERE a.event_id=e.id) AS artist_count,'
            ' (SELECT COUNT(*) FROM bookings b WHERE b.event_id=e.id AND b.status!=\'cancelled\') AS booking_count,'
            ' (SELECT COUNT(*) FROM event_documents d WHERE d.event_id=e.id) AS document_count'
            ' FROM events e ORDER BY e.date DESC, e.created DESC')]


def remove(ident):
    """Local delete. The OneDrive folder is left alone on purpose: it may
    hold contracts and signed riders that are not recoverable anywhere else."""
    from advancing import remove_event_files
    get(ident)
    remove_event_files(ident)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        cur = c.execute('DELETE FROM events WHERE id=?', (ident,))
        if not cur.rowcount:
            raise ValueError('Onbekend evenement.')
        for table in ('event_slots', 'event_artists', 'event_posts', 'event_documents'):
            c.execute(f'DELETE FROM {table} WHERE event_id=?', (ident,))
    audit('events', 'Evenement verwijderd', ident)


def _touch(ident):
    with db() as c:
        c.execute('UPDATE events SET updated=? WHERE id=?', (time.time(), ident))


def upsert_slots(ident, rows):
    """Replace the running order wholesale. The advancing is edited as one
    block, so a partial patch would leave gaps nobody asked for."""
    clean = []
    for index, row in enumerate(rows or []):
        item = _clean(row, VALID_SLOT)
        item['id'] = item.get('id') or uid()
        item['sort'] = index
        clean.append(item)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekend evenement.')
        # Keep the timetable links (artists, stage) of slots that come back
        # with their id; this legacy call does not know about them.
        kept = {r['id']: (r['artist_ids'], r['stage']) for r in c.execute('SELECT id,artist_ids,stage FROM event_slots WHERE event_id=?', (ident,))}
        c.execute('DELETE FROM event_slots WHERE event_id=?', (ident,))
        for item in clean:
            artist_ids, stage = kept.get(item['id'], ('[]', ''))
            c.execute(
                'INSERT INTO event_slots(id,event_id,start,end,act,note,locked,done,sort,artist_ids,stage) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
                (item['id'], ident, item.get('start', ''), item.get('end', ''), item.get('act', ''),
                 item.get('note', ''), item.get('locked', 0), item.get('done', 0), item['sort'], artist_ids, stage))
    _touch(ident)
    return get(ident)


def upsert_artists(ident, rows):
    clean = []
    for index, row in enumerate(rows or []):
        item = _clean(row, VALID_ARTIST)
        if not (item.get('name') or '').strip():
            continue
        item['id'] = item.get('id') or uid()
        item['sort'] = index
        clean.append(item)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekend evenement.')
        c.execute('DELETE FROM event_artists WHERE event_id=?', (ident,))
        for item in clean:
            c.execute(
                'INSERT INTO event_artists(id,event_id,name,genre,b2b,fee,fee_paid,contact,bio,rider_done,status,sort) '
                'VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                (item['id'], ident, item.get('name', ''), item.get('genre', ''), item.get('b2b', 0),
                 item.get('fee', 0), item.get('fee_paid', 0), item.get('contact', ''),
                 item.get('bio', ''), item.get('rider_done', 0), item.get('status', 'confirmed'), item['sort']))
    _touch(ident)
    return get(ident)


def upsert_posts(ident, rows):
    clean = []
    for row in rows or []:
        item = _clean(row, VALID_POST)
        item['id'] = item.get('id') or uid()
        item['created'] = time.time()
        clean.append(item)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekend evenement.')
        c.execute('DELETE FROM event_posts WHERE event_id=?', (ident,))
        for item in clean:
            c.execute(
                'INSERT INTO event_posts(id,event_id,kind,title,body,artist_id,channel,status,scheduled,created) '
                'VALUES(?,?,?,?,?,?,?,?,?,?)',
                (item['id'], ident, item.get('kind', 'announce'), item.get('title', ''), item.get('body', ''),
                 item.get('artist_id', ''), item.get('channel', 'instagram'), item.get('status', 'draft'),
                 item.get('scheduled', ''), item['created']))
    _touch(ident)
    return get(ident)


def add_note(ident, body):
    body = (body or '').strip()
    if not body:
        raise ValueError('De notitie is leeg.')
    note_id = uid()
    with db() as c:
        if not c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekend evenement.')
        c.execute('INSERT INTO event_notes(id,event_id,body,created) VALUES(?,?,?,?)', (note_id, ident, body[:4000], time.time()))
    _touch(ident)
    return note_id


def notes(ident):
    with db() as c:
        return [dict(r) for r in c.execute('SELECT * FROM event_notes WHERE event_id=? ORDER BY created DESC', (ident,))]


def attach_document(ident, document_id, label=''):
    """Link an existing invoice/document to the night, so contracts and
    artist invoices surface inside the event instead of a separate list."""
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        if not c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone():
            raise ValueError('Onbekend evenement.')
        doc = c.execute('SELECT id,name FROM documents WHERE id=?', (document_id,)).fetchone()
        if not doc:
            raise ValueError('Onbekend document.')
        c.execute('INSERT OR IGNORE INTO event_documents(id,event_id,document_id,label,created) VALUES(?,?,?,?,?)',
                  (uid(), ident, document_id, (label or '')[:200], time.time()))
    _touch(ident)
    return get(ident)


def detach_document(ident, link_id):
    with db() as c:
        cur = c.execute('DELETE FROM event_documents WHERE id=? AND event_id=?', (link_id, ident))
        if not cur.rowcount:
            raise ValueError('Onbekend document.')
    _touch(ident)


def manifest(ident):
    """Exactly what gets written to OneDrive. Deterministic apart from the
    generated stamp, so _norm on the caller's side can detect drift."""
    event = get(ident)
    return _manifest(event, event['advancing'], event['artists'], event['posts'], notes(ident))
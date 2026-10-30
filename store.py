"""Persistent Moonshine data. Amounts are integer euro cents."""
import os, sqlite3, json, hashlib, secrets, time
from pathlib import Path
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('MOONSHINE_DATA', str(ROOT / 'data'))).resolve()
DATA.mkdir(parents=True, exist_ok=True)
(DATA / 'files').mkdir(exist_ok=True)
(DATA / 'assets').mkdir(exist_ok=True)

@contextmanager
def db():
    conn = sqlite3.connect(DATA / 'moonshine.sqlite3', timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    try:
        yield conn
        conn.commit()
    except BaseException:
        conn.rollback()
        raise
    finally:
        conn.close()

def init():
    if os.name!='nt':
        DATA.chmod(0o700)
        for folder in ('files','assets'):
            (DATA/folder).chmod(0o700)
            for path in (DATA/folder).iterdir():
                if path.is_file():path.chmod(0o600)
    with db() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','finance','viewer')), password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id), csrf TEXT NOT NULL, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, sha TEXT NOT NULL UNIQUE, size INTEGER NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}', odoo_id INTEGER, error TEXT, created REAL NOT NULL, updated REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',assignee TEXT REFERENCES users(id), due TEXT, priority TEXT NOT NULL DEFAULT 'normal',done INTEGER NOT NULL DEFAULT 0,graph_id TEXT,created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS transactions(id TEXT PRIMARY KEY,external_id TEXT NOT NULL UNIQUE, source TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,amount INTEGER NOT NULL,fee INTEGER NOT NULL DEFAULT 0,vat_rate INTEGER,category TEXT NOT NULL DEFAULT 'unknown',status TEXT NOT NULL DEFAULT 'open',document_id TEXT REFERENCES documents(id),odoo_id INTEGER,payout_id TEXT NOT NULL DEFAULT '',created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,created REAL NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT,detail TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS login_attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,until REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS ingestion(external_id TEXT PRIMARY KEY,created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, name TEXT NOT NULL, date TEXT NOT NULL DEFAULT '', venue TEXT NOT NULL DEFAULT '', doors TEXT NOT NULL DEFAULT '', capacity INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'planning', notes TEXT NOT NULL DEFAULT '', rider TEXT NOT NULL DEFAULT '', created REAL NOT NULL, updated REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS event_slots(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, start TEXT NOT NULL DEFAULT '', end TEXT NOT NULL DEFAULT '', act TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', locked INTEGER NOT NULL DEFAULT 0, done INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS event_artists(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, name TEXT NOT NULL, genre TEXT NOT NULL DEFAULT '', b2b INTEGER NOT NULL DEFAULT 0, fee INTEGER NOT NULL DEFAULT 0, fee_paid INTEGER NOT NULL DEFAULT 0, contact TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', rider_done INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'confirmed', sort INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS event_posts(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, kind TEXT NOT NULL DEFAULT 'announce', title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', artist_id TEXT NOT NULL DEFAULT '', channel TEXT NOT NULL DEFAULT 'instagram', status TEXT NOT NULL DEFAULT 'draft', scheduled TEXT NOT NULL DEFAULT '', created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS event_notes(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, body TEXT NOT NULL, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS event_documents(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, document_id TEXT NOT NULL REFERENCES documents(id), label TEXT NOT NULL DEFAULT '', created REAL NOT NULL, UNIQUE(event_id,document_id));
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
        CREATE INDEX IF NOT EXISTS idx_event_slots ON event_slots(event_id);
        CREATE INDEX IF NOT EXISTS idx_event_artists ON event_artists(event_id);
        CREATE INDEX IF NOT EXISTS idx_event_posts ON event_posts(event_id);
        CREATE INDEX IF NOT EXISTS idx_event_notes ON event_notes(event_id);
        CREATE INDEX IF NOT EXISTS idx_event_documents ON event_documents(event_id);
        CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created);
        CREATE INDEX IF NOT EXISTS idx_documents_status_created ON documents(status,created);
        CREATE TABLE IF NOT EXISTS calendar_events(id TEXT PRIMARY KEY, graph_id TEXT UNIQUE, subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', start TEXT NOT NULL DEFAULT '', end TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', event_id TEXT REFERENCES events(id) ON DELETE SET NULL, updated REAL NOT NULL DEFAULT 0, created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS promo_contacts(id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL, tag TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '', handle TEXT NOT NULL DEFAULT '', unsubscribed INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL, UNIQUE(email));
        CREATE TABLE IF NOT EXISTS promo_campaigns(id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', sender TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', created REAL NOT NULL, sent REAL NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS promo_recipients(id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES promo_campaigns(id) ON DELETE CASCADE, contact_id TEXT NOT NULL REFERENCES promo_contacts(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'queued', error TEXT NOT NULL DEFAULT '', sent REAL NOT NULL DEFAULT 0, UNIQUE(campaign_id,contact_id));
        CREATE TABLE IF NOT EXISTS promo_templates(id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS label_statements(id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL UNIQUE, period TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT '', currency TEXT NOT NULL DEFAULT 'USD', gross_usd REAL NOT NULL DEFAULT 0, fee_usd REAL NOT NULL DEFAULT 0, total_due_usd REAL NOT NULL DEFAULT 0, raw TEXT NOT NULL DEFAULT '{}', created REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS contracts(id TEXT PRIMARY KEY, title TEXT NOT NULL, document_id TEXT REFERENCES documents(id) ON DELETE SET NULL, opensign_id TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', signers TEXT NOT NULL DEFAULT '[]', created REAL NOT NULL, updated REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS releases(id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT NOT NULL DEFAULT '', release_date TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'planned', labelgrid_release_id TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created REAL NOT NULL, updated REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start);
        CREATE INDEX IF NOT EXISTS idx_promo_recipients_campaign ON promo_recipients(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
        CREATE INDEX IF NOT EXISTS idx_releases_date ON releases(release_date);
        ''')
        # Advancing: a reusable artist roster, bookings of artists on events,
        # files (riders, EPK, promo), the venue checklist and the send log.
        c.executescript('''
        CREATE TABLE IF NOT EXISTS artists(id TEXT PRIMARY KEY, name TEXT NOT NULL, full_name TEXT NOT NULL DEFAULT '', passport TEXT NOT NULL DEFAULT '', date_of_birth TEXT NOT NULL DEFAULT '', nationality TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '', agency TEXT NOT NULL DEFAULT '', agent TEXT NOT NULL DEFAULT '', agent_email TEXT NOT NULL DEFAULT '', agent_phone TEXT NOT NULL DEFAULT '', rider_url TEXT NOT NULL DEFAULT '', epk_url TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', tech_rider TEXT NOT NULL DEFAULT '', hospitality_rider TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created REAL NOT NULL, updated REAL NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_name ON artists(name COLLATE NOCASE);
        CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, artist_id TEXT NOT NULL REFERENCES artists(id), status TEXT NOT NULL DEFAULT 'confirmed', fee INTEGER NOT NULL DEFAULT 0, flight TEXT NOT NULL DEFAULT '', grounds TEXT NOT NULL DEFAULT '', hotel TEXT NOT NULL DEFAULT '', flight_info TEXT NOT NULL DEFAULT '{}', ground_info TEXT NOT NULL DEFAULT '{}', hotel_info TEXT NOT NULL DEFAULT '{}', notes TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL, updated REAL NOT NULL, UNIQUE(event_id,artist_id));
        CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_artist ON bookings(artist_id);
        CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY, owner_type TEXT NOT NULL CHECK(owner_type IN ('artist','booking','event')), owner_id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL DEFAULT '', size INTEGER NOT NULL DEFAULT 0, sha TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', has_file INTEGER NOT NULL DEFAULT 0, onedrive_id TEXT NOT NULL DEFAULT '', onedrive_url TEXT NOT NULL DEFAULT '', sync_status TEXT NOT NULL DEFAULT 'local', error TEXT NOT NULL DEFAULT '', created REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_type,owner_id);
        CREATE INDEX IF NOT EXISTS idx_assets_sync ON assets(sync_status);
        CREATE TABLE IF NOT EXISTS checklist(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, key TEXT NOT NULL DEFAULT '', label TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', sent_at REAL NOT NULL DEFAULT 0, sent_to TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_checklist_event ON checklist(event_id);
        CREATE TABLE IF NOT EXISTS sends(id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, recipients TEXT NOT NULL, subject TEXT NOT NULL, items TEXT NOT NULL DEFAULT '[]', attachments TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL, error TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT '', created REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_sends_event ON sends(event_id);
        ''')
        for table,column,ddl in (('events','venue_contact',"TEXT NOT NULL DEFAULT ''"),('events','venue_email',"TEXT NOT NULL DEFAULT ''"),('events','venue_phone',"TEXT NOT NULL DEFAULT ''"),('events','checklist_seeded','INTEGER NOT NULL DEFAULT 0'),('event_slots','artist_ids',"TEXT NOT NULL DEFAULT '[]'"),('event_slots','stage',"TEXT NOT NULL DEFAULT ''"),('assets','retry_at','REAL NOT NULL DEFAULT 0')):
            if column not in {r['name'] for r in c.execute(f'PRAGMA table_info({table})')}:c.execute(f'ALTER TABLE {table} ADD COLUMN {column} {ddl}')
        columns={r['name'] for r in c.execute('PRAGMA table_info(transactions)')}
        if 'payout_id' not in columns:c.execute("ALTER TABLE transactions ADD COLUMN payout_id TEXT NOT NULL DEFAULT ''")
        if 'statement_id' not in columns:c.execute('ALTER TABLE transactions ADD COLUMN statement_id INTEGER')
        c.execute('CREATE INDEX IF NOT EXISTS idx_transactions_payout ON transactions(payout_id)')
        if os.name!='nt':
            for name in ('moonshine.sqlite3','moonshine.sqlite3-wal','moonshine.sqlite3-shm'):
                path=DATA/name
                if path.exists():path.chmod(0o600)

def uid(): return secrets.token_hex(12)
def encode(value): return json.dumps(value,ensure_ascii=False,separators=(',',':'))
def hash_password(password):
    salt = secrets.token_bytes(16)
    result = hashlib.scrypt(password.encode(),salt=salt,n=16384,r=8,p=1)
    return salt.hex()+':'+result.hex()
def check_password(password, encoded):
    try:
        salt,digest = encoded.split(':')
        return secrets.compare_digest(hashlib.scrypt(password.encode(),salt=bytes.fromhex(salt),n=16384,r=8,p=1).hex(),digest)
    except (ValueError,TypeError): return False
def audit(actor, action, entity='', detail=''):
    with db() as c: c.execute('INSERT INTO audit(created,actor,action,entity,detail) VALUES(?,?,?,?,?)',(time.time(),actor,action,entity,safe_error(detail)))

def safe_error(message):
    """Errors may originate in provider responses. Never persist or return keys."""
    import re
    text=str(message)
    for value in secret_values().values():
        if isinstance(value,str) and value:text=text.replace(value,'[afgeschermd]')
    text=re.sub(r'(?i)(bearer\s+)[^\s,;]+',r'\1[afgeschermd]',text)
    return text[:2000]
def settings():
    with db() as c: return {r['key']:json.loads(r['value']) for r in c.execute('SELECT * FROM settings')}
def secret_values():
    path = DATA / 'secrets.json'
    return json.loads(path.read_text('utf-8')) if path.exists() else {}
def save_secrets(values):
    path = DATA / 'secrets.json'
    tmp = DATA / ('secrets-'+uid()+'.tmp')
    tmp.touch(mode=0o600)
    tmp.write_text(encode(values),'utf-8')
    tmp.replace(path)
    try: path.chmod(0o600)
    except OSError: pass
def document(row):
    d=dict(row); d['details']=json.loads(d['details']); return d
def ingest(name, mime, content, source='upload'):
    sha=hashlib.sha256(content).hexdigest()
    ident=uid(); now=time.time()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        old=c.execute('SELECT id FROM documents WHERE sha=?',(sha,)).fetchone()
        if old:return old['id'],True
        path=DATA/'files'/ident
        with path.open('xb') as output:
            if os.name!='nt':os.fchmod(output.fileno(),0o600)
            output.write(content)
        try:
            c.execute('INSERT INTO documents(id,name,mime,sha,size,source,status,created,updated) VALUES(?,?,?,?,?,?,?,?,?)',(ident,name,mime,sha,len(content),source,'awaiting_ai',now,now))
        except sqlite3.IntegrityError:
            path.unlink(missing_ok=True)
            old=c.execute('SELECT id FROM documents WHERE sha=?',(sha,)).fetchone()
            return old['id'],True
    return ident,False

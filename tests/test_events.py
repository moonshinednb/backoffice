"""Tests for the events module and its API surface.

Covers the local CRUD contract, input coercion, the manifest that goes to
OneDrive, and the drift detection that guards against silently overwriting
someone else's edit. OneDrive transport itself is not exercised here - it
needs real credentials and a live tenant.
"""
import json, os, sys, tempfile, threading, unittest, urllib.error, urllib.request
from http.cookies import SimpleCookie
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_TMP = tempfile.mkdtemp(prefix='moonshine-events-')
os.environ['MOONSHINE_DATA'] = _TMP
os.environ['MOONSHINE_SECURE_COOKIE'] = '0'

import store, events, accounting
from store import db
from server import Handler
from http.server import ThreadingHTTPServer


class EventCoreTests(unittest.TestCase):
    def setUp(self):
        store.init()
        self.event = events.create({'name': 'Test Nacht', 'date': '2026-11-14', 'venue': 'Moonshine', 'doors': '23:00'})

    def test_create_and_fetch(self):
        fetched = events.get(self.event['id'])
        self.assertEqual(fetched['name'], 'Test Nacht')
        self.assertEqual(fetched['date'], '2026-11-14')
        self.assertEqual(fetched['status'], 'planning')
        self.assertEqual(fetched['advancing'], [])
        self.assertEqual(fetched['artists'], [])

    def test_create_requires_name(self):
        with self.assertRaises(ValueError):
            events.create({'name': '   '})

    def test_unknown_event_raises(self):
        for call in (lambda: events.get('0' * 24), lambda: events.update('0' * 24, {'name': 'x'})):
            with self.assertRaises(ValueError):
                call()

    def test_update_fields(self):
        updated = events.update(self.event['id'], {'name': 'Nieuwe Naam', 'capacity': 500, 'status': 'confirmed'})
        self.assertEqual(updated['name'], 'Nieuwe Naam')
        self.assertEqual(updated['capacity'], 500)
        self.assertEqual(updated['status'], 'confirmed')
        # Untouched fields survive.
        self.assertEqual(updated['date'], '2026-11-14')

    def test_advancing_order_and_locks(self):
        updated = events.upsert_slots(self.event['id'], [
            {'start': '23:00', 'end': '00:00', 'act': 'Support'},
            {'start': '00:00', 'end': '02:00', 'act': 'Headliner', 'locked': True},
        ])
        acts = [s['act'] for s in updated['advancing']]
        self.assertEqual(acts, ['Support', 'Headliner'])
        self.assertEqual(updated['advancing'][0]['locked'], 0)
        self.assertEqual(updated['advancing'][1]['locked'], 1)

    def test_advancing_replaces_wholesale(self):
        events.upsert_slots(self.event['id'], [{'act': 'A'}, {'act': 'B'}, {'act': 'C'}])
        events.upsert_slots(self.event['id'], [{'act': 'Only'}])
        self.assertEqual([s['act'] for s in events.get(self.event['id'])['advancing']], ['Only'])

    def test_artist_fee_is_coerced_to_cents(self):
        updated = events.upsert_artists(self.event['id'], [{'name': 'Nala', 'fee': '350.50', 'b2b': True}])
        artist = updated['artists'][0]
        self.assertEqual(artist['fee'], 35050)
        self.assertEqual(artist['b2b'], 1)

    def test_artist_bad_fee_falls_back_to_zero(self):
        updated = events.upsert_artists(self.event['id'], [{'name': 'X', 'fee': 'not-a-number'}])
        self.assertEqual(updated['artists'][0]['fee'], 0)

    def test_artist_negative_fee_clamped(self):
        updated = events.upsert_artists(self.event['id'], [{'name': 'X', 'fee': -50}])
        self.assertEqual(updated['artists'][0]['fee'], 0)

    def test_artist_without_name_is_dropped(self):
        updated = events.upsert_artists(self.event['id'], [{'name': ''}, {'name': 'Keep'}])
        self.assertEqual([a['name'] for a in updated['artists']], ['Keep'])

    def test_unknown_artist_keys_are_stripped(self):
        """Only declared fields may reach disk or OneDrive."""
        events.upsert_artists(self.event['id'], [{'name': 'X', 'odoo_id': 99, '__class__': 'evil'}])
        artist = events.get(self.event['id'])['artists'][0]
        self.assertNotIn('odoo_id', artist)
        self.assertNotIn('__class__', artist)

    def test_posts_roundtrip(self):
        updated = events.upsert_posts(self.event['id'], [
            {'kind': 'announce', 'title': 'Headliner', 'body': 'Kom naar Moonshine', 'channel': 'instagram'},
            {'kind': 'content', 'title': 'Recap', 'body': 'Bedankt iedereen', 'channel': 'site'},
        ])
        self.assertEqual(len(updated['posts']), 2)
        self.assertEqual({p['kind'] for p in updated['posts']}, {'announce', 'content'})

    def test_notes_require_body(self):
        with self.assertRaises(ValueError):
            events.add_note(self.event['id'], '   ')
        events.add_note(self.event['id'], 'Soundcheck om 21:00')
        self.assertEqual(len(events.notes(self.event['id'])), 1)

    def test_remove_cascades_children(self):
        ident = self.event['id']
        events.upsert_slots(ident, [{'act': 'A'}])
        events.upsert_artists(ident, [{'name': 'A'}])
        events.add_note(ident, 'n')
        events.remove(ident)
        with db() as c:
            for table in ('events', 'event_slots', 'event_artists', 'event_notes'):
                count = c.execute(f'SELECT COUNT(*) FROM {table} WHERE id!=?', (ident,)).fetchone()[0] if table == 'events' else 0
            self.assertIsNone(c.execute('SELECT id FROM events WHERE id=?', (ident,)).fetchone())
            for table in ('event_slots', 'event_artists', 'event_notes', 'event_posts'):
                self.assertIsNone(c.execute(f'SELECT id FROM {table} WHERE event_id=?', (ident,)).fetchone(), table)

    def test_listing_counts_children(self):
        events.upsert_slots(self.event['id'], [{'act': 'A'}, {'act': 'B'}])
        events.upsert_artists(self.event['id'], [{'name': 'A'}])
        row = next(r for r in events.listing() if r['id'] == self.event['id'])
        self.assertEqual(row['slot_count'], 2)
        self.assertEqual(row['artist_count'], 1)

    def test_folder_name_is_path_safe(self):
        unsafe = events.create({'name': 'Nacht/2026: "live" <dubbel>?', 'date': '2026-05-01'})
        folder = events._folder_name(unsafe)
        for ch in '\\/:*?"<>|':
            self.assertNotIn(ch, folder)
        self.assertTrue(folder.startswith('2026-05-01_'))

    def test_folder_name_without_date(self):
        no_date = events.create({'name': 'Zonder Datum'})
        self.assertEqual(events._folder_name(no_date), 'Zonder Datum')


class ManifestTests(unittest.TestCase):
    def setUp(self):
        store.init()
        self.event = events.create({'name': 'Manifest', 'date': '2026-11-14', 'venue': 'Zaal'})

    def test_manifest_contains_whole_night(self):
        ident = self.event['id']
        events.upsert_slots(ident, [{'start': '23:00', 'act': 'A'}])
        events.upsert_artists(ident, [{'name': 'A', 'fee': '100'}])
        events.upsert_posts(ident, [{'kind': 'announce', 'title': 'A', 'body': 'x'}])
        events.add_note(ident, 'Note')
        manifest = events.manifest(ident)
        for key in ('name', 'date', 'venue', 'doors', 'capacity', 'status', 'advancing', 'artists', 'announce_posts', 'notes'):
            self.assertIn(key, manifest)
        self.assertEqual(len(manifest['advancing']), 1)
        self.assertEqual(len(manifest['notes']), 1)

    def test_manifest_is_json_serialisable(self):
        payload = json.dumps(events.manifest(self.event['id']))
        self.assertIn('Manifest', payload)

    def test_norm_detects_drift(self):
        ident = self.event['id']
        events.upsert_artists(ident, [{'name': 'Original', 'fee': '100'}])
        local = events.manifest(ident)
        remote = json.loads(json.dumps(local))
        remote['artists'][0]['name'] = 'Changed Remotely'
        self.assertNotEqual(events._norm(remote['artists']), events._norm(local['artists']))

    def test_norm_ignores_key_order(self):
        self.assertEqual(events._norm({'a': 1, 'b': 2}), events._norm({'b': 2, 'a': 1}))

    def test_norm_ignores_untouched_fields(self):
        ident = self.event['id']
        events.upsert_artists(ident, [{'name': 'A'}])
        local = events.manifest(ident)
        remote = json.loads(json.dumps(local))
        remote['venue'] = 'Ander'
        remote['capacity'] = 999
        # venue and capacity are compared; the artist list is not drifted.
        self.assertEqual(events._norm(remote['artists']), events._norm(local['artists']))


class EventApiTests(unittest.TestCase):
    """HTTP surface: permissions, CSRF and event CRUD over a real server."""

    @classmethod
    def setUpClass(cls):
        store.init()
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.cookies = SimpleCookie()
        self.csrf = None
        # One admin per test, so tests never share session state.
        self.username = 'admin_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      ('u_' + self.username, self.username, 'Admin', 'admin', store.hash_password('test-password-123'), 0.0))
        status, body = self.request('/api/login', {'username': self.username, 'password': 'test-password-123'}, auth=False)
        self.assertEqual(status, 200, body)
        self.cookies = SimpleCookie()
        self.cookies.load(self._last_set_cookie)
        self.csrf = body['csrf']

    def request(self, path, payload=None, method=None, auth=True):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(self.base + path, data=data, method=method or ('POST' if data else 'GET'))
        if data:
            req.add_header('Content-Type', 'application/json')
        if auth:
            req.add_header('Cookie', self.cookies.output(header='', sep='; ').strip())
            if self.csrf:
                req.add_header('X-CSRF-Token', self.csrf)
        self._last_set_cookie = ''
        try:
            with urllib.request.urlopen(req) as response:
                self._last_set_cookie = response.headers.get('Set-Cookie', '')
                return response.status, json.loads(response.read() or b'{}')
        except urllib.error.HTTPError as e:
            self._last_set_cookie = e.headers.get('Set-Cookie', '') if e.headers else ''
            body = e.read()
            try:
                return e.code, json.loads(body or b'{}')
            except ValueError:
                return e.code, {}

    def login_as(self, username):
        self.cookies = SimpleCookie()
        self.csrf = None
        req = urllib.request.Request(self.base + '/api/login', data=json.dumps({'username': username, 'password': 'test-password-123'}).encode(), method='POST')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req) as response:
            self.cookies.load(response.headers.get('Set-Cookie', ''))
            self.csrf = json.loads(response.read())['csrf']

    def test_event_lifecycle_over_http(self):
        status, created = self.request('/api/events', {'name': 'HTTP Nacht', 'date': '2026-12-24'})
        self.assertEqual(status, 200)
        ident = created['id']

        status, listed = self.request('/api/events')
        self.assertEqual(status, 200)
        self.assertTrue(any(e['id'] == ident for e in listed['events']))

        status, _ = self.request(f'/api/events/{ident}/artists', {'artists': [{'name': 'Act', 'fee': '400'}]}, 'PUT')
        self.assertEqual(status, 200)

        status, detail = self.request(f'/api/events/{ident}')
        self.assertEqual(status, 200)
        self.assertEqual(detail['artists'][0]['fee'], 40000)

        status, _ = self.request(f'/api/events/{ident}', {'notes': 'Soundcheck 21:00'}, 'PATCH')
        self.assertEqual(status, 200)

        status, detail = self.request(f'/api/events/{ident}')
        self.assertEqual(detail['notes'], 'Soundcheck 21:00')

        status, _ = self.request(f'/api/events/{ident}', None, 'DELETE')
        self.assertEqual(status, 200)
        status, _ = self.request(f'/api/events/{ident}')
        self.assertEqual(status, 400)

    def test_viewer_cannot_create_event(self):
        viewer = 'viewer_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      ('v_' + viewer, viewer, 'Viewer', 'viewer', store.hash_password('test-password-123'), 0.0))
        self.login_as(viewer)
        status, _ = self.request('/api/events', {'name': 'Nope'})
        self.assertEqual(status, 403)

    def test_viewer_can_read_events(self):
        status, created = self.request('/api/events', {'name': 'Lezen Mag'})
        viewer = 'viewer_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      ('v_' + viewer, viewer, 'Viewer', 'viewer', store.hash_password('test-password-123'), 0.0))
        self.login_as(viewer)
        status, listed = self.request('/api/events')
        self.assertEqual(status, 200)
        self.assertTrue(any(e['id'] == created['id'] for e in listed['events']))

    def test_viewer_cannot_delete_event(self):
        status, created = self.request('/api/events', {'name': 'Mag Niet'})
        viewer = 'viewer_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      ('v_' + viewer, viewer, 'Viewer', 'viewer', store.hash_password('test-password-123'), 0.0))
        self.login_as(viewer)
        status, _ = self.request(f"/api/events/{created['id']}", None, 'DELETE')
        self.assertEqual(status, 403)

    def test_event_write_requires_csrf(self):
        status, created = self.request('/api/events', {'name': 'CSRF Test'})
        # Drop the token: the write must be refused.
        self.csrf = ''
        status, _ = self.request(f"/api/events/{created['id']}/artists", {'artists': [{'name': 'X'}]}, 'PUT')
        self.assertEqual(status, 403)

    def test_push_without_onedrive_config_is_rejected_cleanly(self):
        status, created = self.request('/api/events', {'name': 'Push Test'})
        self.assertEqual(status, 200, created)
        status, body = self.request(f"/api/events/{created['id']}/push", {})
        # No OneDrive configured in the test environment: a 400 with a Dutch
        # message, never a stack trace or a secret.
        self.assertEqual(status, 400)
        self.assertIn('error', body)
        self.assertNotIn('Traceback', str(body))


if __name__ == '__main__':
    unittest.main()
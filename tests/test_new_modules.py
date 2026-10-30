"""Tests for calendar, promo mail, LabelGrid, OpenSign, releases and itinerary.

All external providers are exercised without credentials: calls that need
a key must fail with a Dutch 400 message, never a traceback or a secret.
"""
import json, os, sys, tempfile, unittest
from http.cookies import SimpleCookie
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer
import urllib.request, urllib.error

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_TMP = tempfile.mkdtemp(prefix='moonshine-newmods-')
os.environ['MOONSHINE_DATA'] = _TMP
os.environ['MOONSHINE_SECURE_COOKIE'] = '0'

import store, integrations
from store import db
from server import Handler


class ApiBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        store.init()
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.base = f'http://127.0.0.1:{cls.server.server_address[1]}'
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.username = 'admin_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      ('u_' + self.username, self.username, 'Admin', 'admin', store.hash_password('pw-12345678'), 0.0))
        status, body = self.raw('/api/login', {'username': self.username, 'password': 'pw-12345678'}, auth=False)
        self.assertEqual(status, 200, body)
        self.cookies = SimpleCookie()
        self.cookies.load(self._cookie)
        self.csrf = body['csrf']

    def raw(self, path, payload=None, method=None, auth=True, query=''):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(self.base + path + query, data=data, method=method or ('POST' if data else 'GET'))
        if data:
            req.add_header('Content-Type', 'application/json')
        if auth:
            req.add_header('Cookie', self.cookies.output(header='', sep='; ').strip())
            if self.csrf:
                req.add_header('X-CSRF-Token', self.csrf)
        self._cookie = ''
        try:
            with urllib.request.urlopen(req) as r:
                self._cookie = r.headers.get('Set-Cookie', '')
                return r.status, json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            self._cookie = e.headers.get('Set-Cookie', '') if e.headers else ''
            try:
                return e.code, json.loads(e.read() or b'{}')
            except ValueError:
                return e.code, {}


class CalendarTests(ApiBase):
    def test_calendar_starts_empty(self):
        status, body = self.raw('/api/calendar')
        self.assertEqual(status, 200)
        self.assertEqual(body['events'], [])

    def test_event_push_without_config_rejected(self):
        status, created = self.raw('/api/events', {'name': 'Agenda Test', 'date': '2026-12-01'})
        self.assertEqual(status, 200)
        status, body = self.raw(f"/api/events/{created['id']}/calendar", {})
        self.assertEqual(status, 400)
        self.assertIn('error', body)


class PromoTests(ApiBase):
    def test_contact_and_import(self):
        status, _ = self.raw('/api/promo/contacts', {'email': 'dj@example.nl', 'name': 'DJ Test'})
        self.assertEqual(status, 200)
        status, body = self.raw('/api/promo/import', {'rows': [
            {'email': 'a@example.nl', 'name': 'A'},
            {'email': 'geen-mail', 'name': 'Slecht'},
            {'email': 'DJ@EXAMPLE.NL', 'name': 'Dubbel'},
        ]})
        self.assertEqual(status, 200)
        # only a@example.nl is new; bad row skipped, dj@ dupe ignored (case-insensitive)
        self.assertEqual(body['added'], 1)

    def test_campaign_lifecycle(self):
        self.raw('/api/promo/contacts', {'email': 'fan@example.nl', 'name': 'Fan'})
        status, created = self.raw('/api/promo/campaigns', {'name': 'Release 1', 'subject': 'Hoi {{Naam}}', 'body': '<p>Hoi {{Naam}}</p>'})
        self.assertEqual(status, 200)
        ident = created['id']
        with db() as c:
            cid = c.execute('SELECT id FROM promo_contacts WHERE email=?', ('fan@example.nl',)).fetchone()['id']
        status, _ = self.raw(f'/api/promo/campaigns/{ident}/recipients', {'contact_ids': [cid]})
        self.assertEqual(status, 200)
        status, body = self.raw(f'/api/promo/campaigns/{ident}/preview', query='?email=fan@example.nl')
        self.assertEqual(status, 200)
        self.assertIn('Fan', body['body'])
        status, body = self.raw(f'/api/promo/campaigns/{ident}/send', {})
        self.assertEqual(status, 200)
        self.assertEqual(body['queued'], 1)
        status, _ = self.raw(f'/api/promo/campaigns/{ident}/stop', {})
        self.assertEqual(status, 200)

    def test_send_without_recipients_rejected(self):
        status, created = self.raw('/api/promo/campaigns', {'name': 'Leeg', 'subject': 'x', 'body': 'y'})
        status, body = self.raw(f"/api/promo/campaigns/{created['id']}/send", {})
        self.assertEqual(status, 400)


class LabelGridTests(ApiBase):
    def test_statements_start_empty(self):
        status, body = self.raw('/api/label/statements')
        self.assertEqual(status, 200)
        self.assertEqual(body['statements'], [])

    def test_pull_without_key_rejected(self):
        status, body = self.raw('/api/label/pull', {})
        self.assertEqual(status, 400)
        self.assertIn('error', body)
        self.assertNotIn('Traceback', str(body))


class ContractTests(ApiBase):
    def test_contracts_start_empty(self):
        status, body = self.raw('/api/contracts')
        self.assertEqual(status, 200)
        self.assertEqual(body['contracts'], [])

    def test_create_without_key_rejected(self):
        status, body = self.raw('/api/contracts', {'title': 'Optreden', 'signers': [{'name': 'X', 'email': 'x@example.nl'}]})
        self.assertEqual(status, 400)
        self.assertIn('error', body)

    def test_opensign_webhook_accepts_without_secret(self):
        # No webhook secret configured in tests: payload is accepted and ignored safely.
        status, body = self.raw('/api/webhooks/opensign', {'document': {'id': 'nope'}, 'status': 'signed'})
        self.assertEqual(status, 202 if status == 202 else 200)


class ReleaseTests(ApiBase):
    def test_release_crud(self):
        status, created = self.raw('/api/releases', {'title': 'EP 1', 'artist': 'Moonshine', 'release_date': '2026-06-01'})
        self.assertEqual(status, 200)
        ident = created['id']
        status, body = self.raw('/api/releases')
        self.assertTrue(any(r['id'] == ident for r in body['releases']))
        status, _ = self.raw(f'/api/releases/{ident}', {'status': 'released'}, method='PATCH')
        self.assertEqual(status, 200)
        status, _ = self.raw(f'/api/releases/{ident}', None, method='DELETE')
        self.assertEqual(status, 200)
        status, _ = self.raw(f'/api/releases/{ident}', {'status': 'x'}, method='PATCH')
        self.assertEqual(status, 404)

    def test_release_requires_title(self):
        status, _ = self.raw('/api/releases', {'title': '   '})
        self.assertEqual(status, 400)


class ItineraryTests(ApiBase):
    def test_itinerary_download(self):
        status, created = self.raw('/api/events', {'name': 'Itin Nacht', 'date': '2026-11-01', 'venue': 'Zaal'})
        ident = created['id']
        self.raw(f'/api/events/{ident}/advancing', {'slots': [{'start': '23:00', 'end': '01:00', 'act': 'Headliner'}]}, method='PUT')
        req = urllib.request.Request(self.base + f'/api/events/{ident}/itinerary')
        req.add_header('Cookie', self.cookies.output(header='', sep='; ').strip())
        with urllib.request.urlopen(req) as r:
            text = r.read().decode('utf-8')
        self.assertIn('Headliner', text)
        self.assertIn('Itin Nacht', text)


if __name__ == '__main__':
    unittest.main()

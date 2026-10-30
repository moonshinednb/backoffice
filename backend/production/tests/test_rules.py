import json
from django.test import TestCase
from core.tests.test_api import ApiTests
from production import rules as R

BOOKING = {'flight': 'no', 'grounds': 'no', 'hotel': 'no', 'flight_info': {}, 'hotel_info': {}, 'ground_info': {}}


class MissingTests(TestCase):
    def test_agency_needs_agent_email_only(self):
        artist = {'id': 'a', 'agency': 'Wasted Agency', 'contact_via': 'agency'}
        missing = R.missing_items(BOOKING, artist, [], {})
        self.assertIn('E-mail van de agent', missing)
        self.assertNotIn('Volledige naam (voor reis/hotel)', missing)

    def test_self_needs_artist_contact(self):
        missing = R.missing_items(BOOKING, {'id': 'a', 'contact_via': 'self', 'phone': '+316'}, [], {})
        self.assertFalse(any('agent' in m or 'artiest' in m for m in missing))

    def test_passport_only_when_we_book(self):
        booking = {**BOOKING, 'flight': 'yes', 'flight_info': {'booked_by': 'moonshine'}}
        missing = R.missing_items(booking, {'id': 'a', 'contact_via': 'self', 'email': 'x@y.nl'}, [], {})
        self.assertIn('Paspoort/ID (voor reis/hotel)', missing)
        self.assertFalse(any('geboortedatum' in m.lower() for m in missing))


class ReleaseTests(ApiTests):
    def test_release_gets_planning_and_tasks(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        r = self.send(c, 'post', '/api/releases', {'title': 'Moonlight EP', 'artist': 'Dwonji', 'release_date': '2030-06-01'}).json()
        self.assertEqual(len(r['steps']), 7)
        self.assertEqual(r['steps'][-2]['due'], '2030-06-01')
        r = self.send(c, 'patch', f"/api/release-steps/{r['steps'][0]['id']}", {'done': True}).json()
        self.assertEqual(r['steps_done'], 1)
        self.send(c, 'post', '/api/tasks', {'title': 'Artwork checken', 'release': r['id']})
        rel = c.get('/api/releases').json()['releases'][0]
        self.assertEqual(rel['tasks_open'], 1)

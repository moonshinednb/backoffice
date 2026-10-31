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


class DriveTreeTests(ApiTests):
    def test_event_booking_and_release_trees(self):
        from unittest import mock
        from core.services import set_setting
        from production import drive
        from production.models import Booking, Event, Release
        set_setting('onedrive_drive_id', 'drive-1')
        made, renamed = [], []
        fake_ensure = lambda path: (made.append(path), {'id': 'id:' + path, 'webUrl': 'https://sp/' + path})[1]
        items = {}
        with mock.patch('integrations.graph.ensure_path', side_effect=fake_ensure), \
             mock.patch('integrations.graph.drive_item', side_effect=lambda i: items.get(i)), \
             mock.patch('integrations.graph.rename_item', side_effect=lambda i, n: (renamed.append(n), {'id': i, 'webUrl': 'https://sp/renamed'})[1]):
            c, _ = self.login('peppy', 'admin-pass-1')
            e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
            drive.sync_event(e['id'])
            self.assertIn('2. Events/2030-11-20 Inner Orbit', made)
            self.assertIn('2. Events/2030-11-20 Inner Orbit/04 Content/Reels & TikToks', made)
            r = self.send(c, 'post', f"/api/events/{e['id']}/bookings", {'name': 'Dwonji'}).json()
            drive.sync_booking(r['booking_id'])
            self.assertIn('2. Events/2030-11-20 Inner Orbit/02 Artists/Dwonji/Rider', made)
            self.assertTrue(Booking.objects.get(id=r['booking_id']).drive_url.startswith('https://sp/'))
            # rename: event name changes -> folder renamed, not duplicated
            ev = Event.objects.get(id=e['id']); items[ev.drive_id] = {'name': '2030-11-20 Inner Orbit'}
            self.send(c, 'patch', f"/api/events/{e['id']}", {'name': 'Inner Orbit II'})
            drive.sync_event(e['id'])
            self.assertIn('2030-11-20 Inner Orbit II', renamed)
            rel = self.send(c, 'post', '/api/releases', {'title': 'Moonlight', 'artist': 'Dwonji'}).json()
            self.assertEqual(rel['catalog'], 'MS001')
            drive.sync_release(rel['id'])
            self.assertIn('4. Releases/MS001 - Dwonji - Moonlight/Contracts/SIGNED', made)
            self.assertEqual(self.send(c, 'post', '/api/releases', {'title': 'Next'}).json()['catalog'], 'MS002')

    def test_disabled_without_drive(self):
        from production import drive
        self.assertFalse(drive.enabled())

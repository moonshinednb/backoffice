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

    def test_masked_private_value_is_ignored(self):
        out = R._artist_payload({'name': 'X', 'passport': '••••', 'date_of_birth': '••••'}, partial=True)
        self.assertEqual(out, {'name': 'X'})

    def test_date_of_birth_when_we_book_the_flight(self):
        booking = {**BOOKING, 'flight': 'yes', 'flight_info': {'booked_by': 'moonshine'}}
        missing = R.missing_items(booking, {'id': 'a', 'contact_via': 'self', 'email': 'x@y.nl'}, [], {})
        self.assertIn('Geboortedatum (voor de vlucht)', missing)
        self.assertFalse(any('paspoort' in m.lower() for m in missing))  # passport/ID is optional
        hotel_only = {**BOOKING, 'hotel': 'yes', 'hotel_info': {'booked_by': 'moonshine'}}
        missing = R.missing_items(hotel_only, {'id': 'a', 'contact_via': 'self', 'email': 'x@y.nl'}, [], {})
        self.assertIn('Volledige naam (voor reis/hotel)', missing)
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
        from production.models import Booking, Event
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
            self.assertIn('2. Events/2030-11-20 Inner Orbit/05 Content/Reels & TikToks', made)
            self.assertIn('2. Events/2030-11-20 Inner Orbit/03 Riders', made)
            ev = Event.objects.get(id=e['id'])
            items[ev.drive_id] = {'name': '2030-11-20 Inner Orbit', 'parentReference': {'path': '/drives/d/root:/2.%20Events'}}
            r = self.send(c, 'post', f"/api/events/{e['id']}/bookings", {'name': 'Dwonji'}).json()
            drive.sync_booking(r['booking_id'])
            self.assertIn('2. Events/2030-11-20 Inner Orbit/02 EPKs/Dwonji', made)
            self.assertTrue(Booking.objects.get(id=r['booking_id']).drive_url.startswith('https://sp/'))
            # rename: event name changes -> folder renamed, not duplicated
            self.send(c, 'patch', f"/api/events/{e['id']}", {'name': 'Inner Orbit II'})
            drive.sync_event(e['id'])
            self.assertIn('2030-11-20 Inner Orbit II', renamed)
            rel = self.send(c, 'post', '/api/releases', {'title': 'Moonlight', 'artist': 'Dwonji'}).json()
            self.assertEqual(rel['catalog'], 'MS001')
            drive.sync_release(rel['id'])
            self.assertIn('4. Releases/MS001 - Dwonji - Moonlight/Contracts/SIGNED', made)
            self.assertEqual(self.send(c, 'post', '/api/releases', {'title': 'Next'}).json()['catalog'], 'MS002')
            # a past event gets no empty standard folders
            made.clear()
            old = self.send(c, 'post', '/api/events', {'name': 'Moonshine 26/09', 'date': '2025-09-26'}).json()
            drive.sync_event(old['id'])
            self.assertEqual(made, ['2. Events/2025-09-26'])

    def test_upload_lands_in_event_tree(self):
        from unittest import mock
        from core.services import set_setting
        from production import services as S
        from production.models import Artist, Booking, Event
        set_setting('onedrive_drive_id', 'drive-1')
        e = Event.objects.create(name='Moonshine 20/11', date='2030-11-20', drive_id='ev')
        b = Booking.objects.create(event=e, artist=Artist.objects.create(name='Dwonji'))
        ours = Artist.objects.create(name='PEPPY', in_roster=True)
        guest = Artist.objects.create(name='Kanine')
        where = {'id': 'ev', 'name': '2030-11-20', 'parentReference': {'path': '/drives/d/root:/2.%20Events'}}
        with mock.patch('integrations.graph.drive_item', return_value=where):
            p = lambda kind, owner_type, owner_id, name='x.pdf': S.asset_drive_path({'kind': kind, 'owner_type': owner_type, 'owner_id': owner_id, 'name': name})
            self.assertEqual(p('tech_rider', 'booking', b.id, 'Tech Rider 2026.pdf'), '2. Events/2030-11-20/03 Riders/Dwonji - Tech Rider 2026.pdf')
            self.assertEqual(p('rider', 'booking', b.id, 'Dwonji rider.pdf'), '2. Events/2030-11-20/03 Riders/Dwonji rider.pdf')
            self.assertEqual(p('press_photo', 'booking', b.id, 'press.jpg'), '2. Events/2030-11-20/02 EPKs/Dwonji/press.jpg')
            self.assertEqual(p('guestlist', 'event', e.id, 'guests.xlsx'), '2. Events/2030-11-20/06 Productie/guests.xlsx')
            self.assertEqual(p('epk', 'artist', ours.id, 'epk.pdf'), 'Artists/PEPPY/EPK/epk.pdf')
            self.assertEqual(p('rider', 'artist', guest.id, 'rider.pdf'), '2. Events/_Artiesten/Kanine/Riders/rider.pdf')

    def test_folder_names(self):
        from production import drive
        from production.models import Event
        self.assertEqual(drive.event_folder_name(Event(name='Moonshine 20/11', date='2026-11-20')), '2026-11-20')
        self.assertEqual(drive.event_folder_name(Event(name='Moonshine 10 Years', date='2026-09-19')), '2026-09-19 Moonshine 10 Years')
        self.assertEqual(drive.event_folder_name(Event(name='RTR', date='2026-10-02')), '2026-10-02 RTR')
        self.assertEqual(drive.section('epks'), '02 EPKs')
        self.assertEqual(drive.section('na afloop'), '07 Na afloop')

    def test_tidy_rules(self):
        from production import drive_tidy as T
        f = lambda n, peek=(): T.classify(n, True, peek)
        self.assertEqual(f('Press Kits Mainstage'), ('epks', 'Mainstage'))
        self.assertEqual(f('Riders Mainstage'), ('riders', 'Mainstage'))
        self.assertEqual(f('Presskits'), ('epks', None))
        self.assertEqual(f('Content van 28-3'), ('na afloop', None))
        self.assertEqual(f('Content voor 27-6'), ('content', None))
        self.assertEqual(f('X DAYS LEFT STORIES'), ('content', None))
        self.assertEqual(f('Set Audio Recordings'), ('na afloop', None))
        self.assertEqual(f('Assets', ['Basement', 'Photographer']), ('productie', None))
        self.assertEqual(f('assets', ['Banner.png']), ('artwork', None))
        self.assertIsNone(f('01 Finance'))
        self.assertIsNone(f('Hubert'))
        g = lambda n: T.classify(n, False)
        self.assertEqual(g('Costing Moonshine 26 september 2025.xlsx'), ('finance', None))
        self.assertEqual(g('2026-3-20.xlsx'), ('finance', None))
        self.assertEqual(g('Technical Rider 19-09-2026.docx'), ('productie', None))
        self.assertEqual(g('KRITIKAL Rider.pdf'), ('riders', None))
        self.assertEqual(g('THE GUESTLIST 26-9-2025.docx'), ('productie', None))
        self.assertEqual(g('Evaluatie Jessica 27_7.docx'), ('na afloop', None))
        self.assertEqual(g('Moonshine - Basement Rec 19_09 - Luxor Live.mp3'), ('na afloop', None))
        self.assertEqual(g('moonshine_sept2025_4-5_artist.psd'), ('artwork', None))
        self.assertEqual(g('Promokalender.docx'), ('content', None))
        self.assertEqual(T.normal_name('2025-9-26'), '2025-09-26')
        self.assertEqual(T.normal_name('2026-10-02 RTR'), '2026-10-02 RTR')
        self.assertEqual(T.normal_name('[TBC] 2026-08-01'), '[TBC] 2026-08-01')
        kids = [{'id': '1', 'name': 'Artworks', 'folder': {}}, {'id': '2', 'name': 'Photos', 'folder': {}}, {'id': '3', 'name': 'DJI Vids', 'folder': {}},
                {'id': '4', 'name': 'Finance', 'folder': {}}, {'id': '5', 'name': 'notes.txt'}, {'id': '6', 'name': 'ARTIST CONTENT FILES', 'folder': {}},
                {'id': '7', 'name': 'Content', 'folder': {}}]
        steps = {s[1]['name']: (s[0], s[2], s[3]) for s in T.plan(kids)}
        self.assertEqual(steps['Artworks'], ('rename', '04 Artwork', None))
        self.assertEqual(steps['Finance'], ('rename', '01 Finance', None))
        self.assertEqual(steps['Photos'], ('move', '07 Na afloop', None))
        self.assertEqual(steps['DJI Vids'], ('move', '07 Na afloop', None))
        self.assertEqual(steps['notes.txt'], ('keep', None, None))
        self.assertEqual(steps['Content'], ('rename', '05 Content', None))
        self.assertEqual(steps['ARTIST CONTENT FILES'], ('move', '05 Content', None))

    def test_disabled_without_drive(self):
        from production import drive
        self.assertFalse(drive.enabled())


class VoyageTests(ApiTests):
    def test_voyage_flow(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        self.assertEqual(self.send(c, 'post', '/api/voyages', {'event_name': 'X'}).status_code, 400)
        v = self.send(c, 'post', '/api/voyages', {'performer': 'PEPPY', 'event_name': 'Hospitality on the Beach', 'city': 'Split', 'country': 'HR',
                                                   'date': '2030-07-10', 'fee': '1.200', 'currency': 'eur', 'promoter_email': 'Promo@Event.com'}).json()
        self.assertEqual(v['fee'], 120000); self.assertEqual(v['currency'], 'EUR'); self.assertEqual(v['status'], 'lead')
        v = self.send(c, 'patch', f"/api/voyages/{v['id']}", {'status': 'confirmed'}).json()
        self.assertIn('Bevestigd', v['log'][0]['body'])
        v = self.send(c, 'post', f"/api/voyages/{v['id']}/log", {'kind': 'mail', 'body': 'Contract gestuurd'}).json()
        self.assertEqual(v['log'][0]['kind'], 'mail')
        self.assertEqual(len(c.get('/api/voyages').json()['voyages']), 1)


class VoyageDeliverableTests(ApiTests):
    def test_deliverables(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        v = self.send(c, 'post', '/api/voyages', {'event_name': 'Rampage', 'performer': 'PEPPY, Shorrie'}).json()
        v = self.send(c, 'patch', f"/api/voyages/{v['id']}", {'deliver': {'tech_rider': True, 'epk': True, 'nonsense': True}}).json()
        self.assertTrue(v['deliverables']['tech_rider']['done'])
        self.assertEqual(v['delivered'], 2)
        self.assertNotIn('nonsense', v['deliverables'])


class RosterTests(ApiTests):
    def test_roster_profile(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        a = self.send(c, 'post', '/api/artists', {'name': 'PEPPY'}).json()
        self.send(c, 'patch', f"/api/artists/{a['id']}", {'in_roster': True, 'city': 'Arnhem', 'genres': 'Neurofunk',
                                                         'socials': {'spotify': 'https://open.spotify.com/artist/x', 'bogus': 'https://x.nl'}})
        self.send(c, 'post', '/api/artists', {'name': 'Iemand anders'})
        r = c.get('/api/roster').json()['artists']
        self.assertEqual([x['name'] for x in r], ['PEPPY'])
        self.assertEqual(r[0]['socials'], {'spotify': 'https://open.spotify.com/artist/x'})
        self.assertEqual(r[0]['city'], 'Arnhem')
        self.send(c, 'post', '/api/roster', {'name': 'MC Goblin'})
        self.assertEqual([x['name'] for x in c.get('/api/roster').json()['artists']], ['MC Goblin', 'PEPPY'])


class EventFilesTests(ApiTests):
    def test_empty_subfolder_is_not_filled(self):
        from unittest import mock
        from core.services import set_setting
        from production import drive
        from production.models import Event
        set_setting('onedrive_drive_id', 'drive-1')
        e = Event.objects.create(name='Moonshine 13/03', date='2030-03-13', drive_id='ev')
        tree = {'ev': [{'id': 'a', 'name': '04 Artwork', 'folder': {'childCount': 1}}, {'id': 'f', 'name': '01 Finance', 'folder': {'childCount': 1}}],
                'a': [{'id': 'aa', 'name': 'Artist Announcements', 'folder': {'childCount': 0}}],
                'f': [{'id': 'x', 'name': 'costing.xlsx', 'size': 10}]}
        with mock.patch('integrations.graph.item_children', side_effect=lambda i: tree.get(i, [])):
            sections = {s['name']: s for s in drive.event_files(e)['sections']}
        self.assertFalse(sections['04 Artwork']['filled'])
        self.assertTrue(sections['01 Finance']['filled'])
        self.assertFalse(sections['03 Riders']['exists'])


class EventUploadTests(ApiTests):
    def test_upload_into_section_and_cache(self):
        from unittest import mock
        from django.core.files.uploadedfile import SimpleUploadedFile
        from core.services import set_setting
        from production.models import Event
        set_setting('onedrive_drive_id', 'drive-1')
        e = Event.objects.create(name='Moonshine 20/11', date='2030-11-20', drive_id='ev')
        c, _ = self.login('peppy', 'admin-pass-1')
        where = {'id': 'ev', 'name': '2030-11-20', 'parentReference': {'path': '/drives/d/root:/2.%20Events'}}
        with mock.patch('integrations.graph.drive_item', return_value=where), \
             mock.patch('integrations.graph.drive_upload', return_value=('x', 'https://sp/x')) as up:
            r = c.post(f'/api/events/{e.id}/files', {'section': '05 Content', 'file': SimpleUploadedFile('reel 1.mp4', b'1234', 'video/mp4')}, HTTP_X_CSRFTOKEN=c.csrf)
            self.assertEqual(r.status_code, 200)
            self.assertEqual(up.call_args[0][0], '2. Events/2030-11-20/05 Content/reel 1.mp4')
            bad = c.post(f'/api/events/{e.id}/files', {'section': '../Geheim', 'file': SimpleUploadedFile('x.txt', b'1', 'text/plain')}, HTTP_X_CSRFTOKEN=c.csrf)
            self.assertEqual(bad.status_code, 400)
        calls = []
        with mock.patch('integrations.graph.item_children', side_effect=lambda i: calls.append(i) or []):
            from production import drive
            drive.event_files(e); drive.event_files(e)
            self.assertEqual(calls.count('ev'), 1)  # second time from the cache
            drive.event_files(e, fresh=True)
            self.assertEqual(calls.count('ev'), 2)

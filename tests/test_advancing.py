"""Advancing: artists, bookings, timetable, venue checklist, files, PDF
documents, the advancing mail and the Outlook/OneDrive adapters.

Microsoft Graph is mocked: these tests check what would be sent and in which
order, not a live tenant."""
import json, os, re, sys, tempfile, threading, unittest, urllib.error, urllib.request, zlib
from http.cookies import SimpleCookie
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault('MOONSHINE_DATA', tempfile.mkdtemp(prefix='moonshine-advancing-'))
os.environ['MOONSHINE_SECURE_COOKIE'] = '0'

import store, events, advancing, integrations
from store import db
from server import Handler
from http.server import ThreadingHTTPServer

PNG = b'\x89PNG\r\n\x1a\n' + b'0' * 64


def unique(prefix):
    return f'{prefix} {os.urandom(3).hex()}'


def set_setting(key, value):
    with db() as c:
        c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)', (key, json.dumps(value)))


def clear_setting(*keys):
    with db() as c:
        for key in keys:
            c.execute('DELETE FROM settings WHERE key=?', (key,))


def pdf_text(data):
    """Everything drawn in a PDF from pdfgen (content streams are Flate)."""
    streams = re.findall(rb'stream\n(.*?)\nendstream', data, re.S)
    return b''.join(zlib.decompress(s) for s in streams).decode('cp1252', 'replace')


def complete_booking(event_id, name=None):
    """A booking with everything the completeness check asks for."""
    name = name or unique('Artiest')
    booking_id = advancing.booking_add(event_id, {'name': name}, 'test')
    artist_id = advancing.booking_detail(booking_id)['artist']['id']
    advancing.act_create(event_id, {'artist_ids': [artist_id], 'start': '23:00', 'end': '00:30'}, 'test')
    advancing.booking_update(booking_id, {
        'flight': 'no', 'grounds': 'no', 'hotel': 'no',
        'artist': {'full_name': 'Volledige Naam', 'email': 'artiest@example.com', 'bio': 'Bio.', 'tech_rider': '# Setup\n- 2x CDJ'},
    }, 'test')
    advancing.asset_add_file('artist', artist_id, 'press_photo', 'foto.png', PNG, 'test')
    return booking_id, artist_id


class AdvancingCoreTests(unittest.TestCase):
    def setUp(self):
        store.init()
        self.event = events.create({'name': unique('Nacht'), 'date': '2026-11-14', 'venue': 'Luxor'})
        self.eid = self.event['id']

    def test_checklist_is_seeded_once(self):
        first = advancing.advancing(self.eid)['checklist']
        self.assertEqual([i['key'] for i in first], [k for k, _ in advancing.CHECKLIST])
        self.assertEqual(len(advancing.advancing(self.eid)['checklist']), len(first))
        for item in first:
            advancing.checklist_delete(item['id'], 'test')
        self.assertEqual(advancing.advancing(self.eid)['checklist'], [], 'A cleared checklist is not re-seeded')

    def test_booking_by_name_creates_then_reuses_artist(self):
        name = unique('Dwonji')
        booking = advancing.booking_add(self.eid, {'name': name}, 'test')
        artist_id = advancing.booking_detail(booking)['artist']['id']
        other = events.create({'name': unique('Andere nacht')})
        again = advancing.booking_add(other['id'], {'name': name.upper()}, 'test')
        self.assertEqual(advancing.booking_detail(again)['artist']['id'], artist_id)
        with self.assertRaises(ValueError):
            advancing.booking_add(self.eid, {'artist_id': artist_id}, 'test')
        with self.assertRaises(ValueError):
            advancing.booking_add(self.eid, {}, 'test')

    def test_completeness_follows_the_advancing(self):
        booking = advancing.booking_add(self.eid, {'name': unique('HDN')}, 'test')
        missing = advancing.booking_detail(booking)['missing']
        for item in ('Volledige naam', 'Act en set time', 'Technical rider', 'Persfoto', 'Vlucht: ja of nee', 'Hotel: ja of nee'):
            self.assertIn(item, missing)
        booking, artist_id = complete_booking(self.eid)
        self.assertEqual(advancing.booking_detail(booking)['missing'], [])
        advancing.booking_update(booking, {'flight': 'yes', 'flight_info': {'booked_by': 'artist'}}, 'test')
        missing = advancing.booking_detail(booking)['missing']
        self.assertIn('Heenvlucht', missing)
        self.assertNotIn('Paspoort/ID en geboortedatum', missing, 'Not needed when the artist books')
        advancing.booking_update(booking, {'flight_info': {'booked_by': 'venue'}}, 'test')
        self.assertIn('Paspoort/ID en geboortedatum', advancing.booking_detail(booking)['missing'])
        leg = lambda a, b: {'from': a, 'to': b, 'departure': '2026-11-14T09:00', 'arrival': '2026-11-14T10:30', 'number': 'SK1'}
        advancing.booking_update(booking, {'flight_info': {'tickets_booked': 'yes', 'booked_by': 'venue', 'inbound': leg('CPH', 'AMS'), 'outbound': leg('AMS', 'CPH')},
                                           'artist': {'passport': 'NX1', 'date_of_birth': '1990-01-01'}}, 'test')
        self.assertTrue(advancing.booking_detail(booking)['complete'])
        advancing.booking_update(booking, {'status': 'cancelled'}, 'test')
        self.assertEqual(advancing.booking_detail(booking)['missing'], [], 'Cancelled bookings do not count')

    def test_legacy_running_order_keeps_timetable_links(self):
        booking = advancing.booking_add(self.eid, {'name': unique('Legacy')}, 'test')
        artist = advancing.booking_detail(booking)['artist']['id']
        act = advancing.act_create(self.eid, {'artist_ids': [artist], 'start': '22:00', 'stage': 'Main'}, 'test')
        events.upsert_slots(self.eid, [{'id': act, 'act': 'Hernoemd', 'start': '22:30'}])
        kept = advancing.advancing(self.eid)['acts'][0]
        self.assertEqual((kept['artist_ids'], kept['stage'], kept['start']), ([artist], 'Main', '22:30'))

    def test_money_accepts_dutch_and_plain_input(self):
        for raw, cents in (('1.500', 150000), ('1.250.000', 125000000), ('1.250,50', 125050), ('12,5', 1250), (12.5, 1250), ('€ 99', 9900), ('', 0), (None, 0)):
            self.assertEqual(advancing.money(raw), cents, raw)
        for bad in ('abc', '-5', 'NaN', True):
            with self.assertRaises(ValueError):
                advancing.money(bad)

    def test_artist_input_is_validated(self):
        ident = advancing.artist_create({'name': unique('Kritikal')}, 'test')
        for payload in ({'email': 'geen-mail'}, {'rider_url': 'javascript:alert(1)'}, {'date_of_birth': '2999-01-01'},
                        {'date_of_birth': '14-11-1990'}, {'instagram': 'bad handle!'}, {'name': ''}):
            with self.assertRaises(ValueError, msg=payload):
                advancing.artist_update(ident, payload, 'test')
        advancing.artist_update(ident, {'instagram': 'https://www.instagram.com/kritikal.music/'}, 'test')
        self.assertEqual(advancing.artist_get(ident)['instagram'], '@kritikal.music')
        name = advancing.artist_get(ident)['name']
        with self.assertRaises(ValueError):
            advancing.artist_create({'name': name.lower()}, 'test')

    def test_act_b2b_name_keeps_the_chosen_order(self):
        first = advancing.booking_detail(advancing.booking_add(self.eid, {'name': unique('Dwonji')}, 'test'))['artist']
        second = advancing.booking_detail(advancing.booking_add(self.eid, {'name': unique('HDN')}, 'test'))['artist']
        advancing.act_create(self.eid, {'artist_ids': [second['id'], first['id']], 'start': '9:05', 'end': '10:00'}, 'test')
        act = advancing.advancing(self.eid)['acts'][0]
        self.assertEqual(act['name'], f"{second['name']} B2B {first['name']}")
        self.assertEqual(act['start'], '09:05')
        stranger = advancing.artist_create({'name': unique('Niet geboekt')}, 'test')
        with self.assertRaises(ValueError):
            advancing.act_create(self.eid, {'artist_ids': [stranger]}, 'test')
        with self.assertRaises(ValueError):
            advancing.act_create(self.eid, {'name': 'X', 'start': '25:00'}, 'test')

    def test_timetable_sorts_past_midnight(self):
        for name, start in (('Closing', '01:00'), ('Opening', '22:00'), ('Peak', '23:30')):
            advancing.act_create(self.eid, {'name': name, 'start': start}, 'test')
        self.assertEqual([a['name'] for a in advancing.advancing(self.eid)['acts']], ['Opening', 'Peak', 'Closing'])

    def test_removing_a_booking_unlinks_it_from_acts(self):
        a = advancing.booking_add(self.eid, {'name': unique('A')}, 'test')
        b = advancing.booking_add(self.eid, {'name': unique('B')}, 'test')
        ids = [advancing.booking_detail(x)['artist']['id'] for x in (a, b)]
        advancing.act_create(self.eid, {'name': 'B2B', 'artist_ids': ids}, 'test')
        advancing.booking_remove(a, 'test')
        self.assertEqual(advancing.advancing(self.eid)['acts'][0]['artist_ids'], [ids[1]])

    def test_travel_details_are_cleaned(self):
        booking = advancing.booking_add(self.eid, {'name': unique('NCT')}, 'test')
        advancing.booking_update(booking, {'hotel': 'yes', 'hotel_info': {'name': 'Haarhuis', 'price': '99,50', 'evil': '<script>'}}, 'test')
        hotel = advancing.booking_detail(booking)['hotel_info']
        self.assertEqual(hotel['price'], 9950)
        self.assertNotIn('evil', hotel)
        for payload in ({'flight': 'misschien'}, {'flight_info': {'booked_by': 'iemand'}},
                        {'ground_info': {'pickup_time': 'morgen'}}, {'status': 'weet niet'}):
            with self.assertRaises(ValueError, msg=payload):
                advancing.booking_update(booking, payload, 'test')

    def test_files_version_and_cleanup(self):
        booking = advancing.booking_add(self.eid, {'name': unique('Primate')}, 'test')
        artist_id = advancing.booking_detail(booking)['artist']['id']
        first = advancing.asset_add_file('artist', artist_id, 'logo', 'logo.png', PNG, 'test')
        again = advancing.asset_add_file('artist', artist_id, 'logo', 'logo.png', PNG + b'more', 'test')
        self.assertEqual(first, again, 'Same owner, kind and name is a new version')
        self.assertEqual(advancing.asset_get(first)['size'], len(PNG) + 4)
        invoice = advancing.asset_add_file('booking', booking, 'invoice', 'factuur.pdf', b'%PDF-1.4 test', 'test')
        sheet = advancing.asset_add_file('event', self.eid, 'guestlist', 'gastenlijst.xlsx', b'PK\x03\x04', 'test')
        with self.assertRaises(ValueError):
            advancing.asset_add_file('artist', artist_id, 'logo', 'script.exe', b'MZ', 'test')
        with self.assertRaises(ValueError):
            advancing.asset_add_file('artist', artist_id, 'nonsense', 'a.png', PNG, 'test')
        with self.assertRaises(ValueError):
            advancing.asset_add_link('artist', artist_id, 'epk', 'EPK', 'javascript:alert(1)', 'test')
        events.remove(self.eid)
        for gone in (invoice, sheet):
            self.assertFalse((advancing.ASSETS / gone).exists())
            with self.assertRaises(ValueError):
                advancing.asset_get(gone)
        self.assertTrue((advancing.ASSETS / first).exists(), 'Artist content survives the event')

    def test_viewers_get_passport_and_birthdate_masked(self):
        booking = advancing.booking_add(self.eid, {'name': unique('Shiny')}, 'test')
        advancing.booking_update(booking, {'artist': {'passport': 'NX123', 'date_of_birth': '1991-02-03'}}, 'test')
        masked = advancing.booking_detail(booking, private=False)['artist']
        self.assertNotIn('NX123', json.dumps(masked))
        self.assertNotIn('1991-02-03', json.dumps(masked))
        self.assertEqual(advancing.booking_detail(booking)['artist']['passport'], 'NX123')

    def test_rider_and_advancing_pdfs(self):
        booking, artist_id = complete_booking(self.eid, unique('Fluffy'))
        artist = advancing.artist_get(artist_id)
        data = advancing.rider_pdf(artist, 'tech', self.event)
        self.assertTrue(data.startswith(b'%PDF-1.4'))
        start = int(re.search(rb'startxref\n(\d+)', data).group(1))
        self.assertEqual(data[start:start + 4], b'xref')
        for number, offset in enumerate(re.findall(rb'(\d{10}) 00000 n', data), 1):
            self.assertTrue(data[int(offset):].startswith(b'%d 0 obj' % number))
        self.assertIn('2x CDJ', pdf_text(data))
        with self.assertRaises(ValueError):
            advancing.rider_pdf(artist, 'hospitality', self.event)
        sheet = pdf_text(advancing.advancing_pdf(advancing.advancing(self.eid), {'timetable', 'contacts'}))
        self.assertIn('Timetable', sheet)
        self.assertIn('23:00', sheet)
        self.assertIn('artiest@example.com', sheet)

    def test_listing_carries_progress(self):
        complete_booking(self.eid)
        advancing.booking_add(self.eid, {'name': unique('Open')}, 'test')
        row = next(r for r in events.listing() if r['id'] == self.eid)
        self.assertEqual(row['progress']['artists'], 2)
        self.assertEqual(row['progress']['complete'], 1)
        self.assertEqual(row['booking_count'], 2)


class SendPackTests(unittest.TestCase):
    def setUp(self):
        store.init()
        self.event = events.create({'name': unique('Moonshine <10YRS>'), 'date': '2026-11-14', 'venue': 'Luxor'})
        self.eid = self.event['id']
        events.update(self.eid, {'venue_contact': 'Sanne de Vries', 'venue_email': 'productie@luxor.example'})
        self.booking, self.artist_id = complete_booking(self.eid, unique('Sano'))
        clear_setting('advancing_sender', 'production_sync')

    def tearDown(self):
        clear_setting('advancing_sender', 'production_sync')

    def test_preview_builds_the_pack(self):
        pack = advancing.preview(self.eid, {})
        self.assertEqual(pack['to'], ['productie@luxor.example'])
        self.assertIn('Moonshine', pack['subject'])
        names = [a['name'] for a in pack['attachments']]
        self.assertTrue(any(n.startswith('Advancing - ') for n in names))
        self.assertTrue(any(n.startswith('Technical rider - ') for n in names))
        self.assertIn('foto.png', names)
        self.assertNotIn('<10YRS>', pack['html'], 'Event names are escaped in the mail')
        self.assertIn('Hoi Sanne', pack['message'])
        self.assertNotIn('NX', pack['html'])

    def test_choosing_items_limits_the_pack(self):
        timetable = next(i['id'] for i in advancing.advancing(self.eid)['checklist'] if i['key'] == 'timetable')
        pack = advancing.preview(self.eid, {'items': [timetable]})
        self.assertEqual([a['name'] for a in pack['attachments']], [f"Advancing - {advancing.safe_name(self.event['name'])}.pdf"])

    def test_send_requires_a_sender(self):
        with self.assertRaises(ValueError):
            advancing.send(self.eid, {}, 'test')

    def test_accepted_send_marks_the_checklist(self):
        set_setting('advancing_sender', 'events@moonshine.example')
        with mock.patch('integrations.send_mail') as send_mail:
            result = advancing.send(self.eid, {'cc': 'peppy@moonshine.example'}, 'test')
        self.assertEqual(result['status'], 'accepted')
        sender, to, cc, subject, html, attachments = send_mail.call_args.args
        self.assertEqual((sender, to, cc), ('events@moonshine.example', ['productie@luxor.example'], ['peppy@moonshine.example']))
        self.assertTrue(all(isinstance(a['content'], bytes) and a['content'] for a in attachments))
        overview = advancing.advancing(self.eid)
        self.assertTrue(all(i['status'] == 'sent' for i in overview['checklist']))
        self.assertEqual(overview['sends'][0]['status'], 'accepted')

    def test_failed_send_is_logged_and_reported(self):
        set_setting('advancing_sender', 'events@moonshine.example')
        with mock.patch('integrations.send_mail', side_effect=integrations.HttpError(403)):
            with self.assertRaises(ValueError):
                advancing.send(self.eid, {}, 'test')
        overview = advancing.advancing(self.eid)
        self.assertEqual(overview['sends'][0]['status'], 'failed')
        self.assertFalse(any(i['status'] == 'sent' for i in overview['checklist']))

    def test_uncertain_send_does_not_mark_items(self):
        set_setting('advancing_sender', 'events@moonshine.example')
        with mock.patch('integrations.send_mail', side_effect=integrations.UncertainSend('Geen antwoord')):
            result = advancing.send(self.eid, {}, 'test')
        self.assertEqual(result['status'], 'uncertain')
        self.assertFalse(any(i['status'] == 'sent' for i in advancing.advancing(self.eid)['checklist']))

    def test_recipients_and_size_are_checked(self):
        with self.assertRaises(ValueError):
            advancing.preview(self.eid, {'to': 'geen-adres'})
        with mock.patch.object(advancing, 'MAX_MAIL', 100):
            pack = advancing.preview(self.eid, {})
            self.assertIn('30 MB', pack['warnings'][0], 'The preview lists the pack and warns')
            set_setting('advancing_sender', 'events@moonshine.example')
            with mock.patch('integrations.send_mail') as send_mail, self.assertRaises(ValueError):
                advancing.send(self.eid, {}, 'test')
            send_mail.assert_not_called()

    def test_cancelled_artist_leaves_the_timetable(self):
        other = advancing.booking_add(self.eid, {'name': unique('Afgezegd')}, 'test')
        other_artist = advancing.booking_detail(other)['artist']['id']
        advancing.act_create(self.eid, {'name': 'Duo', 'artist_ids': [self.artist_id, other_artist], 'start': '01:00'}, 'test')
        advancing.booking_update(other, {'status': 'cancelled'}, 'test')
        duo = next(a for a in advancing.advancing(self.eid)['acts'] if a['name'] == 'Duo')
        self.assertNotIn(advancing.artist_get(other_artist)['name'], duo['artists'])


class GraphAdapterTests(unittest.TestCase):
    """Order and shape of the Microsoft Graph calls, with the network mocked."""

    def setUp(self):
        store.init()
        integrations._FOLDERS.clear()

    def tearDown(self):
        clear_setting('production_sync', 'onedrive_drive_id')
        integrations._FOLDERS.clear()

    def mail(self, size):
        return {'name': 'rider.pdf', 'mime': 'application/pdf', 'content': b'x' * size}

    def test_small_attachment_is_attached_inline(self):
        calls = []

        def graph(path, payload=None, method=None, raw=False):
            calls.append((method, path, payload))
            return {'id': 'm1'} if path.endswith('/messages') else {}
        with mock.patch.object(integrations, 'graph', side_effect=graph):
            integrations.send_mail('events@moonshine.example', ['a@b.example'], [], 'Onderwerp', '<p>Hoi</p>', [self.mail(1000)])
        self.assertEqual([c[1] for c in calls], ['/users/events%40moonshine.example/messages', '/users/events%40moonshine.example/messages/m1/attachments',
                                                 '/users/events%40moonshine.example/messages/m1/send'])
        self.assertEqual(calls[1][2]['@odata.type'], '#microsoft.graph.fileAttachment')
        self.assertEqual(calls[2][2], b'')

    def test_large_attachment_uses_an_upload_session(self):
        puts = []

        def graph(path, payload=None, method=None, raw=False):
            if path.endswith('/messages'):
                return {'id': 'm2'}
            if path.endswith('createUploadSession'):
                return {'uploadUrl': 'https://outlook.office.com/upload/abc'}
            return {}

        def http(url, payload=None, headers=None, method=None, raw=False):
            puts.append((url, headers['Content-Range'], len(payload)))
            return {}
        with mock.patch.object(integrations, 'graph', side_effect=graph), mock.patch.object(integrations, 'http', side_effect=http):
            integrations.send_mail('events@moonshine.example', ['a@b.example'], [], 'S', '<p></p>', [self.mail(7 * 1024 * 1024)])
        total = 7 * 1024 * 1024
        self.assertEqual([p[1] for p in puts], [f'bytes 0-3145727/{total}', f'bytes 3145728-6291455/{total}', f'bytes 6291456-{total - 1}/{total}'])
        self.assertTrue(all(p[0] == 'https://outlook.office.com/upload/abc' for p in puts))

    def test_failure_before_send_deletes_the_draft(self):
        calls = []

        def graph(path, payload=None, method=None, raw=False):
            calls.append((method, path))
            if path.endswith('/messages'):
                return {'id': 'm3'}
            if path.endswith('/attachments'):
                raise integrations.HttpError(413)
            return {}
        with mock.patch.object(integrations, 'graph', side_effect=graph):
            with self.assertRaises(integrations.HttpError):
                integrations.send_mail('events@moonshine.example', ['a@b.example'], [], 'S', '', [self.mail(10)])
        self.assertIn(('DELETE', '/users/events%40moonshine.example/messages/m3'), calls)
        self.assertFalse(any(path.endswith('/send') for _, path in calls))

    def test_no_answer_on_send_is_uncertain(self):
        def graph(path, payload=None, method=None, raw=False):
            if path.endswith('/messages'):
                return {'id': 'm4'}
            if path.endswith('/send'):
                raise RuntimeError('Externe dienst is niet bereikbaar.')
            return {}
        with mock.patch.object(integrations, 'graph', side_effect=graph):
            with self.assertRaises(integrations.UncertainSend):
                integrations.send_mail('events@moonshine.example', ['a@b.example'], [], 'S', '', [])

    def test_server_error_on_send_is_uncertain_and_refusal_deletes_draft(self):
        calls = []

        def graph_with(code):
            def graph(path, payload=None, method=None, raw=False):
                calls.append((method, path))
                if path.endswith('/messages'):
                    return {'id': 'm5'}
                if path.endswith('/send'):
                    raise integrations.HttpError(code)
                return {}
            return graph
        with mock.patch.object(integrations, 'graph', side_effect=graph_with(504)):
            with self.assertRaises(integrations.UncertainSend):
                integrations.send_mail('e@m.example', ['a@b.example'], [], 'S', '', [])
        self.assertNotIn('DELETE', [m for m, _ in calls])
        calls.clear()
        with mock.patch.object(integrations, 'graph', side_effect=graph_with(400)):
            with self.assertRaises(integrations.HttpError):
                integrations.send_mail('e@m.example', ['a@b.example'], [], 'S', '', [])
        self.assertIn(('DELETE', '/users/e%40m.example/messages/m5'), calls)

    def test_sync_keeps_a_newer_version_local_and_retries_errors(self):
        artist = advancing.artist_create({'name': unique('Versie')}, 'test')
        asset = advancing.asset_add_file('artist', artist, 'tech_rider', 'rider.pdf', b'%PDF v1', 'test')

        def upload_while_replaced(path, content, mime):
            advancing.asset_add_file('artist', artist, 'tech_rider', 'rider.pdf', b'%PDF v2', 'test')
            return 'id', 'https://onedrive.example/id'
        with mock.patch('integrations.drive_upload', side_effect=upload_while_replaced):
            advancing.sync_asset(asset)
        self.assertEqual(advancing.asset_get(asset)['sync_status'], 'local', 'Version 2 still has to go out')
        set_setting('production_sync', True)
        with mock.patch('integrations.drive_upload', side_effect=RuntimeError('Externe dienst is niet bereikbaar.')):
            with self.assertRaises(RuntimeError):
                advancing.sync_asset(asset)
        self.assertEqual(advancing.asset_get(asset)['sync_status'], 'error')
        with mock.patch('integrations.drive_upload', return_value=('id', 'u')):
            advancing.sync_pending(500)
        self.assertEqual(advancing.asset_get(asset)['sync_status'], 'error', 'Not retried before the pause is over')
        with db() as c:
            c.execute('UPDATE assets SET retry_at=0 WHERE id=?', (asset,))
        with mock.patch('integrations.drive_upload', return_value=('id', 'u')):
            advancing.sync_pending(500)
        self.assertEqual(advancing.asset_get(asset)['sync_status'], 'synced', 'Retried after the pause')

    def test_rider_kinds_get_their_own_onedrive_folder(self):
        artist = advancing.artist_create({'name': unique('Twee riders')}, 'test')
        tech = advancing.asset_get(advancing.asset_add_file('artist', artist, 'tech_rider', 'Rider.pdf', b'%PDF', 'test'))
        hosp = advancing.asset_get(advancing.asset_add_file('artist', artist, 'hospitality_rider', 'Rider.pdf', b'%PDF', 'test'))
        self.assertNotEqual(advancing.asset_drive_path(tech), advancing.asset_drive_path(hosp))

    def test_drive_upload_creates_missing_folders(self):
        set_setting('production_sync', True)
        set_setting('onedrive_drive_id', 'drive1')
        calls = []

        def http(url, payload=None, headers=None, method=None, raw=False):
            calls.append((method or 'GET', url))
            if method is None:
                raise integrations.HttpError(404)
            if method == 'POST' and url.endswith('/children'):
                if 'Productie' in url:
                    raise integrations.HttpError(409)
                return {}
            return {'id': 'item1', 'webUrl': 'https://onedrive.example/item1'}
        with mock.patch.object(integrations, 'http', side_effect=http), mock.patch.object(integrations, '_drive_token', return_value={'Authorization': 'Bearer t'}):
            result = integrations.drive_upload('Moonshine/Productie/Artiesten/Dwonji/Riders/rider.pdf', b'%PDF', 'application/pdf')
        self.assertEqual(result, ('item1', 'https://onedrive.example/item1'))
        created = [u for m, u in calls if m == 'POST']
        self.assertEqual(len(created), 5, 'One create per missing folder level, conflicts tolerated')
        self.assertTrue(calls[-1][1].endswith('/root:/Moonshine/Productie/Artiesten/Dwonji/Riders/rider.pdf:/content'))

    def test_large_drive_upload_uses_320k_chunks(self):
        set_setting('production_sync', True)
        set_setting('onedrive_drive_id', 'drive1')
        integrations._FOLDERS.add('Moonshine/Productie')
        ranges = []

        def http(url, payload=None, headers=None, method=None, raw=False):
            if url.endswith(':/createUploadSession'):
                return {'uploadUrl': 'https://onedrive.example/upload/1'}
            ranges.append(headers['Content-Range'])
            return {'id': 'item2', 'webUrl': 'https://onedrive.example/item2'}
        with mock.patch.object(integrations, 'http', side_effect=http), mock.patch.object(integrations, '_drive_token', return_value={}):
            integrations.drive_upload('Moonshine/Productie/video.mp4', b'v' * (5 * 1024 * 1024), 'video/mp4')
        self.assertEqual(ranges[0], f'bytes 0-{integrations.DRIVE_CHUNK - 1}/{5 * 1024 * 1024}')
        self.assertEqual(integrations.DRIVE_CHUNK % (320 * 1024), 0)

    def test_drive_upload_requires_the_switch(self):
        with self.assertRaises(ValueError):
            integrations.drive_upload('Moonshine/x.pdf', b'x', 'application/pdf')

    def test_sync_asset_records_the_outcome(self):
        artist = advancing.artist_create({'name': unique('Gagelhasu')}, 'test')
        asset = advancing.asset_add_file('artist', artist, 'press_photo', 'pers.png', PNG, 'test')
        with mock.patch('integrations.drive_upload', return_value=('id9', 'https://onedrive.example/id9')) as upload:
            synced = advancing.sync_asset(asset)
        self.assertEqual((synced['sync_status'], synced['onedrive_url']), ('synced', 'https://onedrive.example/id9'))
        self.assertIn('/Artiesten/', upload.call_args.args[0])
        self.assertTrue(upload.call_args.args[0].endswith('/Persfotos/pers.png'))
        with mock.patch('integrations.drive_upload', side_effect=RuntimeError('Externe dienst gaf HTTP 403')):
            with self.assertRaises(RuntimeError):
                advancing.sync_asset(asset)
        failed = advancing.asset_get(asset)
        self.assertEqual(failed['sync_status'], 'error')
        self.assertIn('403', failed['error'])


class AdvancingApiTests(unittest.TestCase):
    """HTTP surface: the full flow, uploads, permissions and the PWA files."""

    @classmethod
    def setUpClass(cls):
        store.init()
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_address[1]}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.login(self.make_user('admin'))

    def make_user(self, role):
        username = f'{role}_' + os.urandom(4).hex()
        with db() as c:
            c.execute('INSERT INTO users(id,username,name,role,password_hash,active,created) VALUES(?,?,?,?,?,1,?)',
                      (os.urandom(12).hex(), username, role, role, store.hash_password('test-password-123'), 0.0))
        return username

    def login(self, username):
        req = urllib.request.Request(self.base + '/api/login', data=json.dumps({'username': username, 'password': 'test-password-123'}).encode(), method='POST')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req) as response:
            self.cookies = SimpleCookie()
            self.cookies.load(response.headers.get('Set-Cookie', ''))
            self.csrf = json.loads(response.read())['csrf']

    def raw(self, path, data=None, method=None, headers=None):
        req = urllib.request.Request(self.base + path, data=data, method=method or ('POST' if data is not None else 'GET'))
        req.add_header('Cookie', self.cookies.output(header='', sep='; ').strip())
        req.add_header('X-CSRF-Token', self.csrf)
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, response.headers, response.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def api(self, path, payload=None, method=None):
        data = None if payload is None else json.dumps(payload).encode()
        status, _, body = self.raw(path, data, method, {'Content-Type': 'application/json'} if data else None)
        return status, json.loads(body or b'{}')

    def test_full_flow_over_http(self):
        status, event = self.api('/api/events', {'name': unique('HTTP Nacht'), 'date': '2026-12-24'})
        self.assertEqual(status, 200)
        eid = event['id']
        status, result = self.api(f'/api/events/{eid}/bookings', {'name': unique('Mind Vortex')})
        self.assertEqual(status, 200, result)
        booking_id = result['booking_id']
        self.assertEqual(len(result['checklist']), len(advancing.CHECKLIST))
        status, booking = self.api(f'/api/bookings/{booking_id}', {'fee': '750', 'flight': 'no', 'artist': {'full_name': 'Mind Vortex', 'tech_rider': '# Setup\n- CDJ'}}, 'PATCH')
        self.assertEqual((status, booking['fee']), (200, 75000))
        status, overview = self.api(f'/api/events/{eid}/acts', {'artist_ids': [booking['artist']['id']], 'start': '22:00', 'end': '23:00'})
        self.assertEqual((status, len(overview['acts'])), (200, 1))
        item = overview['checklist'][0]['id']
        status, overview = self.api(f'/api/checklist/{item}', {'status': 'done'}, 'PATCH')
        self.assertEqual(overview['checklist'][0]['status'], 'done')
        status, headers, body = self.raw(f'/api/events/{eid}/advancing.pdf')
        self.assertEqual((status, headers['Content-Type']), (200, 'application/pdf'))
        self.assertTrue(body.startswith(b'%PDF'))
        status, headers, body = self.raw(f"/api/artists/{booking['artist']['id']}/rider.pdf?kind=tech")
        self.assertEqual(status, 200)
        self.assertIn('attachment', headers['Content-Disposition'])
        status, headers, body = self.raw(f"/api/artists/{booking['artist']['id']}/rider.pdf?kind=hospitality")
        self.assertEqual(status, 400, 'An empty rider is refused, not an empty PDF')
        status, preview = self.api(f'/api/events/{eid}/send-preview', {})
        self.assertEqual(status, 200)
        self.assertNotIn('content', json.dumps(preview['attachments']))
        status, sent = self.api(f'/api/events/{eid}/send', {})
        self.assertEqual(status, 400, 'No sender configured')

    def test_upload_download_and_delete_a_file(self):
        status, artist = self.api('/api/artists', {'name': unique('Don Darkoe')})
        self.assertEqual(status, 200)
        boundary = 'moonshine' + os.urandom(6).hex()
        fields = {'owner_type': 'artist', 'owner_id': artist['id'], 'kind': 'tech_rider'}
        body = b''.join(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items())
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="rider.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode() + b'%PDF-1.4 rider' + f'\r\n--{boundary}--\r\n'.encode()
        status, _, response = self.raw('/api/assets', body, 'POST', {'Content-Type': f'multipart/form-data; boundary={boundary}'})
        self.assertEqual(status, 200, response)
        asset = json.loads(response)
        self.assertEqual((asset['kind'], asset['sync_status']), ('tech_rider', 'local'))
        status, headers, content = self.raw(f"/api/assets/{asset['id']}/file")
        self.assertEqual((status, content), (200, b'%PDF-1.4 rider'))
        self.assertIn("attachment; filename*=UTF-8''rider.pdf", headers['Content-Disposition'])
        status, link = self.api('/api/assets', {'owner_type': 'artist', 'owner_id': artist['id'], 'kind': 'press_video', 'url': 'https://vimeo.com/1'})
        self.assertEqual((status, link['has_file']), (200, 0))
        self.assertEqual(self.api(f"/api/assets/{asset['id']}", method='DELETE')[0], 200)
        self.assertEqual(self.raw(f"/api/assets/{asset['id']}/file")[0], 400)

    def test_viewers_read_masked_and_cannot_write(self):
        status, event = self.api('/api/events', {'name': unique('Viewer Nacht')})
        status, result = self.api(f"/api/events/{event['id']}/bookings", {'name': unique('Kritikal')})
        booking_id = result['booking_id']
        self.api(f'/api/bookings/{booking_id}', {'artist': {'passport': 'NX999', 'date_of_birth': '1990-05-05'}}, 'PATCH')
        self.login(self.make_user('viewer'))
        status, booking = self.api(f'/api/bookings/{booking_id}')
        self.assertEqual(status, 200)
        self.assertNotIn('NX999', json.dumps(booking))
        self.assertEqual(self.api('/api/artists', {'name': unique('Nee')})[0], 403)
        self.assertEqual(self.api(f'/api/bookings/{booking_id}', {'fee': '1'}, 'PATCH')[0], 403)

    def test_settings_validate_the_advancing_sender(self):
        self.assertEqual(self.api('/api/settings', {'settings': {'advancing_sender': 'geen adres'}, 'secrets': {}})[0], 400)
        self.assertEqual(self.api('/api/settings', {'settings': {'production_sync': 'ja'}, 'secrets': {}})[0], 400)

    def test_state_lists_upcoming_events(self):
        name = unique('Komend')
        self.api('/api/events', {'name': name, 'date': '2099-01-01'})
        status, state = self.api('/api/state')
        self.assertEqual(status, 200)
        self.assertIn('upcoming_events', state)
        self.assertTrue(all('progress' in e for e in state['upcoming_events']))

    def test_pwa_files_are_served(self):
        with urllib.request.urlopen(self.base + '/manifest.webmanifest') as response:
            self.assertEqual(response.headers['Content-Type'], 'application/manifest+json')
            manifest = json.loads(response.read())
        self.assertEqual(manifest['display'], 'standalone')
        self.assertEqual({i['sizes'] for i in manifest['icons']}, {'192x192', '512x512'})
        for icon in manifest['icons']:
            with urllib.request.urlopen(self.base + icon['src']) as response:
                self.assertEqual(response.headers['Content-Type'], 'image/png')
        with urllib.request.urlopen(self.base + '/sw.js') as response:
            self.assertIn('javascript', response.headers['Content-Type'])
            self.assertEqual(response.headers['Cache-Control'], 'no-cache')
            source = response.read().decode()
        self.assertIn("url.pathname.startsWith('/api/')", source, 'API responses must never be cached')
        for path in ('/orbs.js', '/vendor/thinking-orbs-0.3.2/engine.es.js', '/vendor/thinking-orbs-0.3.2/index-B8WsUNf5.js'):
            with urllib.request.urlopen(self.base + path) as response:
                self.assertIn('javascript', response.headers['Content-Type'])
            self.assertIn(path, source, 'The orbs are part of the offline shell')
        with urllib.request.urlopen(self.base + '/vendor/thinking-orbs-0.3.2/engine.es.js') as response:
            self.assertIn('immutable', response.headers['Cache-Control'])


if __name__ == '__main__':
    unittest.main()

import io
from unittest import mock
from core.tests.test_api import ApiTests
from production import people
from production.models import Event


def sample_xlsx():
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'CREW LIST - BACKSTAGE ENTRANCE'
    ws.append(['CREW LIST MS10YRS 19-09-26'])
    ws.append(['', 'NAME', 'ROLE', 'ACT', 'CARS'])
    ws.append([1, 'Bram de Haas', 'CORE CREW + DJ', 'Gagelhasu', 1])
    ws.append([2, 'Anne', 'PROMO', '', None])
    ws.append([3, '', '', '', ''])
    g = wb.create_sheet('GUESTLIST - FRONTSTAGE ENTRANCE')
    g.append(['GUEST LIST'])
    g.append(['', 'NAME', '+1s', 'BACKSTAGE?', 'RELATION'])
    g.append([1, 'Jan Jansen', 'NO', 'NO', 'DJ BASEMENT: OXFR'])
    g.append([2, 'Piet', '+2', 'YES', '+1 MS CREW'])
    out = io.BytesIO(); wb.save(out)
    return out.getvalue()


class PeopleTests(ApiTests):
    def test_parse_team_excel(self):
        crew, guests = people.parse_xlsx(sample_xlsx())
        self.assertEqual([c['name'] for c in crew], ['Bram de Haas', 'Anne'])
        self.assertEqual(crew[0], {'name': 'Bram de Haas', 'role': 'CORE CREW + DJ', 'act': 'Gagelhasu', 'cars': 1})
        self.assertEqual(guests[1], {'name': 'Piet', 'plus': 2, 'relation': '+1 MS CREW'})
        self.assertEqual(guests[0]['plus'], 0)

    def test_lists_export_and_copy(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
        r = self.send(c, 'post', f"/api/events/{e['id']}/crew", {'name': 'Bram de Haas', 'role': 'CORE CREW', 'cars': 1})
        self.assertEqual(r.status_code, 200)
        g = self.send(c, 'post', f"/api/events/{e['id']}/guests", {'name': 'Piet', 'plus': 2, 'relation': 'Vriend'}).json()
        self.assertEqual(g['added_by'], 'peppy')
        self.assertEqual(self.send(c, 'patch', f"/api/guests/{g['id']}", {'plus': 11}).status_code, 400)
        o = c.get(f"/api/events/{e['id']}/people").json()
        self.assertEqual(o['totals'], {'crew': 1, 'cars': 1, 'guests': 1, 'people': 3})
        self.assertEqual(o['file_name'], 'CREWLIST + GUESTLIST 20-11-30.xlsx')
        # the export reads back as the same lists
        crew, guests = people.parse_xlsx(c.get(f"/api/events/{e['id']}/people.xlsx").content)
        self.assertEqual(crew[0]['name'], 'Bram de Haas')
        self.assertEqual(guests[0], {'name': 'Piet', 'plus': 2, 'relation': 'Vriend'})
        # core crew comes from the previous event
        nxt = self.send(c, 'post', '/api/events', {'name': 'Next', 'date': '2031-01-10'}).json()
        r = self.send(c, 'post', f"/api/events/{nxt['id']}/crew/copy").json()
        self.assertEqual(r['copied'], 1)
        self.assertEqual(self.send(c, 'post', f"/api/events/{nxt['id']}/crew/copy").json()['copied'], 0)

    def test_import_from_onedrive(self):
        from core.services import set_setting
        set_setting('onedrive_drive_id', 'drive-1')
        e = Event.objects.create(name='Moonshine 10 Years', date='2026-09-19', drive_id='ev')
        tree = {'ev': [{'id': 'p', 'name': '06 Productie', 'folder': {}}],
                'p': [{'id': 'x', 'name': 'CREWLIST + GUESTLIST 19-09-26.xlsx', 'webUrl': 'https://sp/x', 'lastModifiedDateTime': '2026-09-18'}]}
        c, _ = self.login('peppy', 'admin-pass-1')
        with mock.patch('integrations.graph.item_children', side_effect=lambda i: tree.get(i, [])), \
             mock.patch('integrations.graph.download_item', return_value=({}, sample_xlsx())):
            r = self.send(c, 'post', f'/api/events/{e.id}/people/import').json()
            self.assertEqual(r['imported'], {'crew': 2, 'guests': 2, 'file': 'CREWLIST + GUESTLIST 19-09-26.xlsx'})
            self.assertEqual(self.send(c, 'post', f'/api/events/{e.id}/people/import').status_code, 400)  # already filled
        self.assertEqual(Event.objects.get(id=e.id).lists_url, 'https://sp/x')


class VenueContactTests(ApiTests):
    def test_contacts_drive_the_advancing_mail(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
        r = self.send(c, 'post', f"/api/events/{e['id']}/contacts", {'role': 'Productie', 'name': 'Jessica de Vries', 'email': 'productie@luxor.nl', 'phone': '+31 6 1'})
        self.assertEqual(r.status_code, 200)
        bar = self.send(c, 'post', f"/api/events/{e['id']}/contacts", {'role': 'Bar', 'name': 'Tom', 'email': 'bar@luxor.nl'}).json()
        self.assertEqual(self.send(c, 'post', f"/api/events/{e['id']}/contacts", {'email': 'geen-mail'}).status_code, 400)
        self.assertEqual(self.send(c, 'post', f"/api/events/{e['id']}/contacts", {}).status_code, 400)
        self.send(c, 'patch', f"/api/venue-contacts/{bar['id']}", {'advancing': False, 'note': 'Alleen voor de bar-afspraken'})
        ev = c.get(f"/api/events/{e['id']}/overview").json()['event']
        self.assertEqual(ev['venue_email'], 'productie@luxor.nl')
        self.assertEqual(ev['greeting'], 'Jessica')
        self.assertEqual(len(ev['contacts']), 2)
        self.assertEqual(ev['contacts'][1]['note'], 'Alleen voor de bar-afspraken')
        preview = self.send(c, 'post', f"/api/events/{e['id']}/send-preview", {}).json()
        self.assertEqual(preview['to'], ['productie@luxor.nl'])
        self.assertTrue(preview['message'].startswith('Hoi Jessica'))
        self.assertEqual(self.send(c, 'delete', f"/api/venue-contacts/{bar['id']}").status_code, 200)

from core.tests.test_api import ApiTests
from production.models import Asset, Booking, CrewMember, LineupAct


class LineupTests(ApiTests):
    def test_duo_act_with_quiet_advancing(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
        r = self.send(c, 'post', f"/api/events/{e['id']}/lineup", {'name': 'Transit & Fifth', 'members': ['Transit', 'Fifth']}).json()
        act = next(a for a in r['lineup'] if a['name'] == 'Transit & Fifth')
        self.assertEqual([m['name'] for m in act['members']], ['Transit', 'Fifth'])
        # one question about travel instead of three yes/no per person
        self.assertIn('Reis: zelf of wij regelen?', act['missing'])
        self.assertFalse(any(m.startswith(('Vlucht', 'Hotel', 'Grondvervoer')) for m in act['missing']))
        self.assertEqual(len([m for m in act['missing'] if 'rider' in m.lower()]), 1)  # rider once per act
        # travelling themselves: no travel items at all
        r = self.send(c, 'patch', f"/api/lineup/{act['id']}", {'travel': 'self', 'fee': 90000}).json()
        act = next(a for a in r['lineup'] if a['id'] == act['id'])
        self.assertFalse(any('Reis' in m or 'Vlucht' in m for m in act['missing']))
        self.assertEqual(act['fee'], 90000)
        # we arrange it: travel per member, with the member's name
        r = self.send(c, 'patch', f"/api/lineup/{act['id']}", {'travel': 'us'}).json()
        act = next(a for a in r['lineup'] if a['id'] == act['id'])
        self.assertTrue(any(m.startswith('Transit: Vlucht') for m in act['missing']))
        # a solo artist added the old way becomes an act too
        r = self.send(c, 'post', f"/api/events/{e['id']}/bookings", {'name': 'Kanine'}).json()
        self.assertTrue(any(a['name'] == 'Kanine' and len(a['members']) == 1 for a in r['lineup']))
        self.assertEqual(r['summary']['artists'], 2)
        # members on the crew list
        out = self.send(c, 'post', f"/api/events/{e['id']}/crew/lineup").json()
        self.assertEqual(out['added'], 3)
        self.assertEqual(CrewMember.objects.get(name='Fifth').act, 'Transit & Fifth')
        self.assertEqual(self.send(c, 'post', f"/api/events/{e['id']}/crew/lineup").json()['added'], 0)
        # add a member, remove the act
        r = self.send(c, 'post', f"/api/lineup/{act['id']}/members", {'name': 'MC Synner'}).json()
        self.assertEqual(len(next(a for a in r['lineup'] if a['id'] == act['id'])['members']), 3)
        r = self.send(c, 'delete', f"/api/lineup/{act['id']}").json()
        self.assertFalse(any(a['id'] == act['id'] for a in r['lineup']))
        self.assertFalse(LineupAct.objects.filter(id=act['id']).exists())
        self.assertEqual(Booking.objects.filter(event_id=e['id']).count(), 1)

    def test_last_member_removed_removes_act(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'X', 'date': '2030-11-20'}).json()
        r = self.send(c, 'post', f"/api/events/{e['id']}/bookings", {'name': 'Solo'}).json()
        act_id = Booking.objects.get(id=r['booking_id']).lineup_act_id
        self.send(c, 'delete', f"/api/bookings/{r['booking_id']}")
        self.assertFalse(LineupAct.objects.filter(id=act_id).exists())

    def test_act_rider_lands_with_act_name(self):
        from unittest import mock
        from core.services import set_setting
        from production import services as S
        from production.models import Event
        set_setting('onedrive_drive_id', 'drive-1')
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Moonshine 20/11', 'date': '2030-11-20'}).json()
        Event.objects.filter(id=e['id']).update(drive_id='ev')
        r = self.send(c, 'post', f"/api/events/{e['id']}/lineup", {'name': 'Transit & Fifth', 'members': ['Transit', 'Fifth']}).json()
        act_id = next(a['id'] for a in r['lineup'] if a['name'] == 'Transit & Fifth')
        where = {'id': 'ev', 'name': '2030-11-20', 'parentReference': {'path': '/drives/d/root:/2.%20Events'}}
        with mock.patch('integrations.graph.drive_item', return_value=where):
            p = S.asset_drive_path({'kind': 'tech_rider', 'owner_type': 'act', 'owner_id': act_id, 'name': 'rider.pdf'})
            self.assertEqual(p, '2. Events/2030-11-20/03 Riders/Transit & Fifth - rider.pdf')
            p = S.asset_drive_path({'kind': 'press_photo', 'owner_type': 'act', 'owner_id': act_id, 'name': 'pic.jpg'})
            self.assertEqual(p, '2. Events/2030-11-20/02 EPKs/Transit & Fifth/pic.jpg')

import io
from unittest import mock
from openpyxl import Workbook
from core.models import Notification
from core.tests.test_api import ApiTests


class PromoTests(ApiTests):
    def test_import_campaign_and_send(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        wb = Workbook(); ws = wb.active; ws.title = 'Spotify Playlists'
        ws.append(['Playlist', 'Email', 'Instagram']); ws.append(['DnB Weapons', 'curator@example.com', '@dnbweapons']); ws.append(['Only IG', '', 'https://instagram.com/onlyig'])
        buf = io.BytesIO(); wb.save(buf)
        from django.core.files.uploadedfile import SimpleUploadedFile
        r = c.post('/api/promo/import', {'file': SimpleUploadedFile('lijst.xlsx', buf.getvalue())}, HTTP_X_CSRFTOKEN=c.csrf).json()
        self.assertEqual(r['added'], 2)
        contacts = c.get('/api/promo/contacts').json()['contacts']
        self.assertEqual({x['group'] for x in contacts}, {'playlists'})
        camp = self.send(c, 'post', '/api/promo/campaigns', {'kind': 'pitch'}).json()
        self.send(c, 'patch', f"/api/promo/campaigns/{camp['id']}", {'artist': 'Dwonji', 'links': [{'title': 'Moonlight', 'link': 'https://open.spotify.com/x'}]})
        mail = [x['id'] for x in contacts if x['email']]
        self.send(c, 'post', f"/api/promo/campaigns/{camp['id']}/recipients", {'contact_ids': mail})
        pv = self.send(c, 'post', f"/api/promo/campaigns/{camp['id']}/preview", {'contact_id': mail[0]}).json()
        self.assertIn('Hi DnB Weapons', pv['body']); self.assertIn('Moonlight — Dwonji', pv['subject'])
        self.assertEqual(self.send(c, 'post', f"/api/promo/campaigns/{camp['id']}/send").json()['queued'], 1)
        from promo.services import send_batch
        with mock.patch('integrations.graph.send_mail') as sm:
            send_batch(camp['id'], pause=0)
        sm.assert_called_once()
        d = c.get(f"/api/promo/campaigns/{camp['id']}").json()
        self.assertEqual(d['status'], 'done'); self.assertEqual(d['recipients'][0]['status'], 'sent')


class NotifyTests(ApiTests):
    def test_assign_and_done(self):
        self.bram.must_change_password = False; self.bram.save()
        a, _ = self.login('peppy', 'admin-pass-1')
        t = self.send(a, 'post', '/api/tasks', {'title': 'Flyer', 'assignee': self.bram.id}).json()
        self.assertEqual(Notification.objects.filter(user=self.bram, kind='assigned').count(), 1)
        b, _ = self.login('bram', 'tijdelijk1')
        self.send(b, 'patch', f"/api/tasks/{t['id']}", {'done': True})
        self.assertEqual(Notification.objects.filter(user=self.admin, kind='done').count(), 1)
        self.assertEqual(Notification.objects.filter(user=self.bram, kind='done').count(), 0)
        self.assertEqual(a.get('/api/notifications').json()['unread'], 1)

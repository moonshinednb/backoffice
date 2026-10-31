from core.models import FeatureRequest, Notification, User
from core.tests.test_api import ApiTests


class FeatureRequestTests(ApiTests):
    def test_request_inbox_and_status(self):
        anne = User.objects.create(username='anne', first_name='Anne', role='staff')
        anne.set_password('anne-pass-123'); anne.save()
        c, _ = self.login('anne', 'anne-pass-123')
        r = self.send(c, 'post', '/api/feature-requests', {'area': 'Evenementen', 'sub': 'Guestlist', 'feature': 'Gast toevoegen', 'kind': 'change',
                                                             'title': 'Zoeken op relatie', 'wanted': 'Filter op relatie', 'priority': 'high', 'page': '/events/x/guests'})
        self.assertEqual(r.status_code, 200)
        rid = r.json()['id']
        self.assertEqual(Notification.objects.filter(user=self.admin, kind='feature').count(), 1)
        self.assertEqual(self.send(c, 'post', '/api/feature-requests', {'area': 'Evenementen', 'title': 'Leeg'}).status_code, 400)
        self.assertEqual(self.send(c, 'patch', f'/api/feature-requests/{rid}', {'status': 'done'}).status_code, 403)
        png = b'\x89PNG\r\n\x1a\n' + b'0' * 100
        from django.core.files.uploadedfile import SimpleUploadedFile
        up = c.post(f'/api/feature-requests/{rid}/screenshot', {'file': SimpleUploadedFile('s.png', png, 'image/png')}, HTTP_X_CSRFTOKEN=c.csrf)
        self.assertTrue(up.json()['has_screenshot'])
        a, _ = self.login('peppy', 'admin-pass-1')
        inbox = a.get('/api/feature-requests').json()
        self.assertEqual((len(inbox['requests']), inbox['new']), (1, 1))
        self.assertEqual(inbox['requests'][0]['author_name'], 'Anne')
        self.assertEqual(a.get(f'/api/feature-requests/{rid}/screenshot').content, png)
        self.send(a, 'patch', f'/api/feature-requests/{rid}', {'status': 'planned', 'admin_note': 'Volgende week'})
        self.assertEqual(Notification.objects.filter(user=anne, kind='feature').count(), 1)
        # others only see their own
        self.bram.must_change_password = False; self.bram.set_password('bram-pass-123'); self.bram.save()
        b, _ = self.login('bram', 'bram-pass-123')
        self.assertEqual(b.get('/api/feature-requests').json()['requests'], [])
        self.assertEqual(b.get(f'/api/feature-requests/{rid}/screenshot').status_code, 404)

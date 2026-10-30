import json
from django.test import TestCase, Client
from core.models import User


class ApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username='peppy', first_name='Peppy', role='admin', is_staff=True, is_superuser=True)
        self.admin.set_password('admin-pass-1'); self.admin.save()
        self.bram = User.objects.create(username='bram', first_name='Bram', role='finance', must_change_password=True)
        self.bram.set_password('tijdelijk1'); self.bram.save()

    def login(self, username, password):
        c = Client(enforce_csrf_checks=True)
        csrf = c.get('/api/auth/me').json()['csrf']
        r = c.post('/api/auth/login', json.dumps({'username': username, 'password': password}), content_type='application/json', HTTP_X_CSRFTOKEN=csrf)
        c.csrf = r.json().get('csrf', csrf)
        return c, r

    def send(self, c, method, path, data=None):
        return getattr(c, method)(path, json.dumps(data or {}), content_type='application/json', HTTP_X_CSRFTOKEN=c.csrf)

    def test_login_and_wrong_password(self):
        _, r = self.login('peppy', 'fout-wachtwoord')
        self.assertEqual(r.status_code, 401)
        c, r = self.login('peppy', 'admin-pass-1')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(c.get('/api/auth/me').json()['user']['role'], 'admin')

    def test_csrf_required(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        r = c.post('/api/events', json.dumps({'name': 'X'}), content_type='application/json')
        self.assertEqual(r.status_code, 403)

    def test_temporary_password_blocks_writes_until_changed(self):
        c, _ = self.login('bram', 'tijdelijk1')
        self.assertEqual(self.send(c, 'post', '/api/tasks', {'title': 'x'}).status_code, 403)
        r = self.send(c, 'post', '/api/auth/password', {'current': 'tijdelijk1', 'password': 'eigen-wachtwoord'})
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['user']['must_change_password'])
        self.assertEqual(self.send(c, 'post', '/api/tasks', {'title': 'x'}).status_code, 200)

    def test_only_admin_manages_users(self):
        self.bram.must_change_password = False; self.bram.save()
        c, _ = self.login('bram', 'tijdelijk1')
        self.assertEqual(self.send(c, 'post', '/api/users', {'username': 'anne', 'password': 'welkom123', 'role': 'finance'}).status_code, 403)
        a, _ = self.login('peppy', 'admin-pass-1')
        r = self.send(a, 'post', '/api/users', {'username': 'anne', 'name': 'Anne', 'password': 'welkom123', 'role': 'finance'})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()['must_change_password'])
        self.assertIn('admin', a.get('/api/dashboard').json())
        self.assertNotIn('admin', c.get('/api/dashboard').json())

    def test_event_booking_flow(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Moonshine 10YRS', 'date': '2030-11-14', 'venue': 'Luxor'}).json()
        r = self.send(c, 'post', f"/api/events/{e['id']}/bookings", {'name': 'Dwonji'}).json()
        b = self.send(c, 'patch', f"/api/bookings/{r['booking_id']}", {'fee': '1.500', 'artist': {'full_name': 'Lui'}}).json()
        self.assertEqual(b['fee'], 150000)
        self.assertEqual(c.get(f"/api/events/{e['id']}/advancing.pdf").status_code, 200)


class ChatProfileTests(ApiTests):
    def test_profile_and_chat(self):
        a, _ = self.login('peppy', 'admin-pass-1')
        r = self.send(a, 'patch', '/api/profile', {'language': 'nl', 'job_title': 'Founder'}).json()
        self.assertEqual(r['user']['language'], 'nl')
        self.assertEqual(self.send(a, 'post', '/api/chat/team', {'body': 'Hoi team'}).status_code, 200)
        self.send(a, 'post', f'/api/chat/{self.bram.id}', {'body': 'Hoi Bram'})
        self.bram.must_change_password = False; self.bram.save()
        b, _ = self.login('bram', 'tijdelijk1')
        self.assertEqual(b.get('/api/chat').json()['unread'], 2)
        self.assertEqual(b.get(f'/api/chat/{self.admin.id}').json()['messages'][0]['body'], 'Hoi Bram')
        self.assertEqual(b.get('/api/chat').json()['unread'], 1)

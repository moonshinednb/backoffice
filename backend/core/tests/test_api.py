import json
from django.test import TestCase, Client
from core.models import User


class ApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username='peppy', first_name='Peppy', role='admin', is_staff=True, is_superuser=True)
        self.admin.set_password('admin-pass-1'); self.admin.save()
        self.bram = User.objects.create(username='bram', first_name='Bram', role='staff', must_change_password=True)
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
        self.assertEqual(self.send(c, 'post', '/api/users', {'username': 'anne', 'password': 'welkom123', 'role': 'staff'}).status_code, 403)
        a, _ = self.login('peppy', 'admin-pass-1')
        r = self.send(a, 'post', '/api/users', {'username': 'anne', 'name': 'Anne', 'password': 'welkom123', 'role': 'staff'})
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


class ResetTests(ApiTests):
    def test_forgot_and_reset(self):
        from unittest import mock
        self.bram.email = 'bram@example.com'; self.bram.save()
        c = Client()
        sent = {}
        with mock.patch('integrations.resend.send_email', side_effect=lambda to, subject, html, text: sent.update(to=to, text=text)):
            r = c.post('/api/auth/forgot', json.dumps({'login': 'bram'}), content_type='application/json')
            self.assertEqual(r.status_code, 200)
            self.assertEqual(c.post('/api/auth/forgot', json.dumps({'login': 'niemand'}), content_type='application/json').json(), r.json())
        self.assertEqual(sent['to'], 'bram@example.com')
        token = sent['text'].split('token=')[1].split()[0]
        r = c.post('/api/auth/reset', json.dumps({'token': token, 'password': 'nieuw-wachtwoord'}), content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(c.post('/api/auth/reset', json.dumps({'token': token, 'password': 'nog-een-keer'}), content_type='application/json').status_code, 400)
        _, r = self.login('bram', 'nieuw-wachtwoord')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['user']['must_change_password'])


class AiProviderTests(ApiTests):
    def test_providers_and_validation(self):
        import pathlib
        from unittest import mock
        from integrations import claude
        a, _ = self.login('peppy', 'admin-pass-1')
        self.assertEqual(self.send(a, 'post', '/api/settings', {'settings': {'ai_provider': 'bogus'}, 'secrets': {}}).status_code, 400)
        r = self.send(a, 'post', '/api/settings', {'settings': {'ai_provider': 'gemini', 'ai_model': 'gemini-test'}, 'secrets': {'ai_api_key': 'geheime-sleutel'}})
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('geheime-sleutel', json.dumps(a.get('/api/settings').json()))
        self.assertTrue(any(c['id'] == 'ai' and c['status'] != 'not_connected' for c in a.get('/api/connections').json()['connections']))
        self.assertEqual(claude.config()[0], 'gemini')
        pathlib.Path('/tmp/files').mkdir(exist_ok=True)
        pathlib.Path('/tmp/files/docx').write_bytes(b'%PDF-1')
        reply = {'candidates': [{'content': {'parts': [{'text': '```json\n{"supplier":"X","currency":"EUR"}\n```'}]}}]}
        with mock.patch.object(claude, 'http', return_value=reply) as h, mock.patch.object(claude, 'DATA', pathlib.Path('/tmp')):
            d = claude.extract({'id': 'docx', 'mime': 'application/pdf'})
        self.assertEqual(d['supplier'], 'X')
        self.assertIn('generativelanguage', h.call_args[0][0])
        self.send(a, 'post', '/api/settings', {'settings': {'ai_provider': 'openai', 'ai_base_url': 'https://api.example.com/v1'}, 'secrets': {}})
        with mock.patch.object(claude, 'DATA', pathlib.Path('/tmp')), self.assertRaises(ValueError):
            claude.extract({'id': 'docx', 'mime': 'application/pdf'})


class MicrosoftTokenTests(ApiTests):
    def test_mail_uses_app_token_and_todo_uses_delegated(self):
        from unittest import mock
        from core.services import save_secrets, set_setting
        from integrations import graph
        set_setting('microsoft_tenant', 'tenant-1'); set_setting('microsoft_client_id', 'client-1')
        save_secrets({'microsoft_client_secret': 'sec', 'microsoft_todo_refresh_token': 'todo-refresh'})
        bodies = []

        def fake(url, data=None, headers=None, *a, **k):
            from urllib.parse import parse_qs
            bodies.append(parse_qs(data.decode()))
            return {'access_token': 'at-' + bodies[-1]['grant_type'][0], 'expires_in': 3600}
        with mock.patch.object(graph, 'http', side_effect=fake):
            self.assertEqual(graph.graph_token(), 'at-client_credentials')
            self.assertEqual(graph.graph_token(delegated=True), 'at-refresh_token')
        self.assertEqual(bodies[1]['refresh_token'], ['todo-refresh'])
        self.assertNotIn('client_secret', bodies[1])


class KeyTestTests(ApiTests):
    def test_failed_and_ok_checks_are_remembered(self):
        from unittest import mock
        from core.services import save_secrets
        save_secrets({'sumup_api_key': 'k'})
        a, _ = self.login('peppy', 'admin-pass-1')
        with mock.patch('integrations.checks.test_connection', side_effect=ValueError('Sleutel geweigerd')):
            r = self.send(a, 'post', '/api/connections/test', {'provider': 'sumup'})
        self.assertGreaterEqual(r.status_code, 400)
        sumup = next(c for c in a.get('/api/connections').json()['connections'] if c['id'] == 'sumup')
        self.assertEqual(sumup['status'], 'failed')
        self.assertIn('geweigerd', sumup['error'])
        with mock.patch('integrations.checks.test_connection', return_value={'message': 'SumUp-account geverifieerd'}):
            self.assertEqual(self.send(a, 'post', '/api/connections/test', {'provider': 'sumup'}).status_code, 200)
        sumup = next(c for c in a.get('/api/connections').json()['connections'] if c['id'] == 'sumup')
        self.assertEqual(sumup['status'], 'verified')



class TaskAssigneesTests(ApiTests):
    def test_task_for_two_people(self):
        from core.models import Notification
        anne = User.objects.create(username='anne', first_name='Anne', role='staff')
        c, _ = self.login('peppy', 'admin-pass-1')
        t = self.send(c, 'post', '/api/tasks', {'title': 'Poster checken', 'assignees': [str(self.bram.id), str(anne.id)]}).json()
        self.assertEqual(set(t['assignees']), {self.bram.id, anne.id})
        self.assertEqual(t['assignee'], self.bram.id)  # the first one picked
        self.assertEqual(Notification.objects.filter(kind='assigned').count(), 2)
        t = self.send(c, 'patch', f"/api/tasks/{t['id']}", {'title': 'Poster checken', 'assignees': [str(anne.id)]}).json()
        self.assertEqual(t['assignees'], [anne.id])
        self.assertEqual(self.send(c, 'post', '/api/tasks', {'title': 'x', 'assignees': ['999999']}).status_code, 400)
        # an old-style single assignee still works
        t = self.send(c, 'post', '/api/tasks', {'title': 'Oud', 'assignee': str(self.bram.id)}).json()
        self.assertEqual(t['assignees'], [self.bram.id])

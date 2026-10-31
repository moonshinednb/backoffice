from unittest import mock
from core.services import set_setting
from core.tests.test_api import ApiTests
from planning import services as S
from planning.models import OutlookLink


class PlanningTests(ApiTests):
    def test_content_calendar_and_outlook_sync(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20', 'doors': '22:00'}).json()
        p = self.send(c, 'post', '/api/content', {'title': 'Line-up reveal', 'kind': 'reel', 'platforms': ['instagram', 'tiktok', 'bogus'],
                                                  'date': '2030-11-01', 'time': '19:00', 'event_id': e['id']}).json()
        self.assertEqual(p['platforms'], ['instagram', 'tiktok'])
        with mock.patch.object(S, 'outlook_items', side_effect=RuntimeError('403')):
            cal = c.get('/api/calendar?start=2030-10-01&end=2030-11-30').json()
        sources = sorted(i['source'] for i in cal['items'])
        self.assertEqual(sources, ['content', 'event'])
        self.assertIn('Calendars.ReadWrite', cal['outlook_error'])
        calls = []

        def fake(path, payload=None, method=None):
            calls.append((method, path, payload))
            return {'id': f'ol-{len(calls)}'} if method == 'POST' else {}
        set_setting('calendar_enabled', True)
        with mock.patch.object(S, '_graph', side_effect=fake), mock.patch.object(S, 'our_items', return_value=S.our_items('2030-10-01', '2030-12-31')):
            S.push()
            self.assertEqual(OutlookLink.objects.count(), 2)
            self.assertTrue(all(c[2]['categories'] == ['Moonshine'] for c in calls if c[0] == 'POST'))
            n = len(calls); S.push(); self.assertEqual(len(calls), n)  # unchanged: nothing sent
        self.send(c, 'delete', f"/api/content/{p['id']}")
        with mock.patch.object(S, '_graph', side_effect=fake), mock.patch.object(S, 'our_items', return_value=S.our_items('2030-10-01', '2030-12-31')):
            S.push()
        self.assertEqual(OutlookLink.objects.count(), 1)
        self.assertEqual(calls[-1][0], 'DELETE')
        r = self.send(c, 'patch', f'/api/calendar/outlook/{OutlookLink.objects.first().outlook_id}', {'title': 'x', 'start': '2030-11-02'})
        self.assertEqual(r.status_code, 400)

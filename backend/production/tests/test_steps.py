from unittest import mock
from core.models import Task, User
from core.tests.test_api import ApiTests
from production.models import Artist, Booking, Event, EventStep


class EventChecklistTests(ApiTests):
    def team(self):
        for name in ('shoroy', 'anne'):
            User.objects.get_or_create(username=name, defaults={'first_name': name.title(), 'role': 'staff'})

    def test_new_event_gets_owners_and_deadlines(self):
        self.team()
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
        steps = {s['key']: s for s in c.get(f"/api/events/{e['id']}/steps").json()['steps']}
        self.assertEqual(steps['riders']['owner'], 'shoroy')
        self.assertEqual(steps['poster']['owner'], 'peppy')
        self.assertEqual(steps['reels']['owner'], 'anne')
        self.assertEqual(steps['costing']['owner'], 'peppy')
        self.assertEqual(steps['riders']['due'], '2030-10-30')  # 21 days before
        # the deadline follows the event date
        self.send(c, 'patch', f"/api/events/{e['id']}", {'date': '2030-12-04'})
        steps = {s['key']: s for s in c.get(f"/api/events/{e['id']}/steps").json()['steps']}
        self.assertEqual(steps['riders']['due'], '2030-11-13')
        mine = c.get('/api/my-event-steps').json()['steps']
        self.assertTrue(mine and all(s['owner'] == 'peppy' for s in mine))
        self.assertEqual(mine[0]['key'], 'costing')

    def test_past_event_gets_no_checklist(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Moonshine 26/09', 'date': '2020-09-26'}).json()
        r = c.get(f"/api/events/{e['id']}/steps").json()
        self.assertEqual(r['steps'], [])
        self.assertFalse(r['seeded'])

    def test_ticks_from_onedrive_and_task(self):
        from core.services import set_setting
        from production import steps
        self.team()
        set_setting('onedrive_drive_id', 'drive-1')
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': '2030-11-20'}).json()
        ev = Event.objects.get(id=e['id'])
        ev.drive_id = 'ev'; ev.save()
        Booking.objects.create(event=ev, artist=Artist.objects.create(name='Dwonji'))
        Booking.objects.create(event=ev, artist=Artist.objects.create(name='Kanine'))
        folder = lambda name, n: {'name': name, 'folder': True, 'count': n, 'url': '', 'size': 0, 'modified': ''}
        file = lambda name: {'name': name, 'folder': False, 'count': 0, 'url': '', 'size': 1, 'modified': ''}
        files = {'url': '', 'other': [], 'sections': [
            {'name': '01 Finance', 'items': [file('Costing.xlsx')], 'filled': True},
            {'name': '03 Riders', 'items': [file('Dwonji - Rider.pdf')], 'filled': True},
            {'name': '04 Artwork', 'items': [folder('Artist Announcements', 0), file('poster.png')], 'filled': True},
            {'name': '05 Content', 'items': [folder('Reels & TikToks', 3)], 'filled': True}]}
        self.assertEqual(steps.auto_check(ev, files), 3)
        self.assertFalse(EventStep.objects.get(event=ev, key='announcements').done)  # empty subfolder
        done = set(EventStep.objects.filter(event=ev, done=True).values_list('key', flat=True))
        self.assertEqual(done, {'costing', 'poster', 'reels'})  # riders: Kanine is still missing
        files['sections'][1]['items'].append(file('KANINE tech rider.pdf'))
        steps.auto_check(ev, files)
        self.assertTrue(EventStep.objects.get(event=ev, key='riders').done)
        # a step made into a task is done when the task is
        s = EventStep.objects.get(event=ev, key='travel')
        r = self.send(c, 'post', f'/api/event-steps/{s.id}/task').json()
        t = Task.objects.get(id=r['task_id'])
        self.assertEqual(t.assignee.username, 'shoroy')
        Task.objects.filter(id=t.id).update(done=True)
        travel = next(x for x in c.get(f"/api/events/{e['id']}/steps").json()['steps'] if x['key'] == 'travel')
        self.assertTrue(travel['done'])

    def test_roles_setting(self):
        self.team()
        c, _ = self.login('peppy', 'admin-pass-1')
        self.assertEqual(self.send(c, 'post', '/api/settings', {'settings': {'event_roles': {'advancing': 'nobody'}}, 'secrets': {}}).status_code, 400)
        self.assertEqual(self.send(c, 'post', '/api/settings', {'settings': {'event_roles': {'advancing': 'anne'}}, 'secrets': {}}).status_code, 200)
        roles = {k: u for k, _, u in c.get('/api/event-roles').json()['roles']}
        self.assertEqual(roles['advancing'], 'anne')
        e = self.send(c, 'post', '/api/events', {'name': 'Next', 'date': '2031-01-10'}).json()
        riders = next(s for s in c.get(f"/api/events/{e['id']}/steps").json()['steps'] if s['key'] == 'riders')
        self.assertEqual(riders['owner'], 'anne')

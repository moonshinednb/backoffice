from datetime import date, timedelta
from core.models import Task, User
from core.tests.test_api import ApiTests


class MyWorkTests(ApiTests):
    def test_everything_of_one_person_once(self):
        from meetings.models import Action, Meeting
        from planning.models import ContentItem
        from production.models import EventStep
        d = lambda n: (date.today() + timedelta(days=n)).isoformat()
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': d(30)}).json()
        t = Task.objects.create(title='Poster drukken', due=date.today() - timedelta(days=2), assignee=self.admin)
        t.assignees.set([self.admin, self.bram])
        Task.objects.create(title='Niet van mij', assignee=self.bram)
        m = Meeting.objects.create(id='m1', date=d(-3), title='MS Meeting')
        Action.objects.create(meeting=m, owner='peppy', text='Contract VA4 sturen')
        linked = Action.objects.create(meeting=m, owner='peppy', text='Is al een taak', task_id=t.id)
        old = Meeting.objects.create(id='m0', date=d(-200), title='Oud')
        Action.objects.create(meeting=old, owner='peppy', text='Heel oud punt')
        ContentItem.objects.create(event_id=e['id'], title='Reel line-up', assignee='peppy', date=d(3))
        r = c.get('/api/my-work').json()
        titles = [i['title'] for i in r['items']]
        today = date.today().isoformat()
        late = [i for i in r['items'] if i['due'] and i['due'] < today]
        self.assertEqual(r['items'][:len(late)], late)  # everything overdue comes first
        self.assertIn('Poster drukken', [i['title'] for i in late])
        self.assertIn('Contract VA4 sturen', titles)
        self.assertIn('Reel line-up', titles)
        self.assertNotIn('Niet van mij', titles)
        self.assertNotIn('Is al een taak', titles)
        self.assertNotIn('Heel oud punt', titles)
        self.assertTrue(any(i['kind'] == 'step' for i in r['items']))  # bookings/artwork are peppy's by default
        self.assertEqual(r['counts']['late'], len(late))
        self.assertIn('admin', r['focus'])
        self.assertIn('bookings', r['focus'])


class AttentionTests(ApiTests):
    def test_events_with_blockers(self):
        from datetime import date, timedelta
        c, _ = self.login('peppy', 'admin-pass-1')
        d = (date.today() + timedelta(days=20)).isoformat()
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': d}).json()
        r = c.get('/api/attention').json()
        ev = next(x for x in r['events'] if x['id'] == e['id'])
        self.assertEqual(ev['days'], 20)
        self.assertEqual(len(ev['next']), 3)
        self.assertTrue(ev['next'][0]['late'])  # costing is due 56 days before
        self.assertGreater(ev['late'], 0)
        self.assertIn('meeting', r)

    def test_event_list_shows_checklist_progress(self):
        from datetime import date, timedelta
        c, _ = self.login('peppy', 'admin-pass-1')
        d = (date.today() + timedelta(days=20)).isoformat()
        e = self.send(c, 'post', '/api/events', {'name': 'Inner Orbit', 'date': d}).json()
        c.get('/api/attention')  # seeds the checklist
        row = next(x for x in c.get('/api/events').json()['events'] if x['id'] == e['id'])
        self.assertGreater(row['progress']['steps'], 0)
        self.assertEqual(row['progress']['steps_done'], 0)
        self.assertGreater(row['progress']['steps_late'], 0)

    def test_team_work_lists_everyone(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        self.send(c, 'post', '/api/tasks', {'title': 'Zonder eigenaar'})
        r = c.get('/api/team-work').json()
        self.assertIn('peppy', [p['username'] for p in r['people']])
        self.assertTrue(all('items' in p and 'late' in p for p in r['people']))
        self.assertIsInstance(r['unassigned'], list)

    def test_cover_without_onedrive_is_404(self):
        c, _ = self.login('peppy', 'admin-pass-1')
        e = self.send(c, 'post', '/api/events', {'name': 'Zonder map', 'date': '2030-01-01'}).json()
        self.assertEqual(c.get(f"/api/events/{e['id']}/cover").status_code, 404)
        ev = next(x for x in c.get('/api/attention').json()['events'] if x['id'] == e['id'])
        self.assertTrue(all('id' in n for n in ev['next']))

    def test_activity_and_done_summary(self):
        from core.models import Notification
        self.bram.must_change_password = False; self.bram.save()
        p, _ = self.login('peppy', 'admin-pass-1')
        t = self.send(p, 'post', '/api/tasks', {'title': 'Poster maken'}).json()
        b, _ = self.login('bram', 'tijdelijk1')
        self.send(b, 'patch', f"/api/tasks/{t['id']}", {'title': 'Poster maken v2'})
        n = Notification.objects.get(user__username='peppy', kind='activity')
        self.assertIn('Bram werkt ook aan', n.title)
        self.send(b, 'patch', f"/api/tasks/{t['id']}", {'done': True})
        d = Notification.objects.get(user__username='peppy', kind='done')
        self.assertIn('wijzigingen', d.body)
        items = p.get('/api/team-work').json()
        self.assertTrue(all('people' in i for g in items['people'] for i in g['items']))

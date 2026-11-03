from unittest import mock
from core.models import Task
from core.tests.test_api import ApiTests
from meetings import services as S
from meetings.models import Action, Meeting

TEXT = ('Moonshine Label meeting\nDatum: 15/12/25\nNotulen:\n1. Social media\nActie: artwork naar de booking agents sturen voor woensdag.\n'
        + 'Uitleg ' * 60 + '\nSamenvatting en actiepunten\nBram: planning Q1 afmaken\nShoroy: loyalty program uitwerken\n')


class MeetingTests(ApiTests):
    def test_dates(self):
        self.assertEqual(S.parse_date('2025-01-20 Vergadering'), '2025-01-20')
        self.assertEqual(S.parse_date('15-12-2025 Vergadering'), '2025-12-15')
        self.assertEqual(S.parse_date('Vergadering 16-02-25.docx'), '2025-02-16')
        self.assertEqual(S.parse_date('Moonshine meeting 9-3-26.docx'), '2026-03-09')
        self.assertEqual(S.parse_date('2025-15-12.docx'), '2025-12-15')

    def test_extract_without_ai_and_with_ai(self):
        m = Meeting.objects.create(date='2025-12-15', text=TEXT)
        made, how = S.extract(m)
        self.assertEqual(how, 'manual')
        owners = sorted(a.owner for a in m.actions.all())
        self.assertEqual(owners, ['', 'bram', 'shoroy'])
        reply = {'actions': [{'owner': 'Pepijn', 'task': 'VA3-contracten versturen', 'due': '2025-12-20'}, {'owner': 'team', 'task': 'Posts delen', 'due': None}]}
        with mock.patch('integrations.claude.complete_json', return_value=reply):
            made, how = S.extract(m)
        self.assertEqual((made, how), (2, 'ai'))
        self.assertEqual(Action.objects.get(text__startswith='VA3').owner, 'peppy')

    def test_board_and_task(self):
        m = Meeting.objects.create(date='2030-01-06', text=TEXT)
        a = Action.objects.create(meeting=m, owner='bram', text='Planning Q1 afmaken', due='2030-01-13')
        c, _ = self.login('peppy', 'admin-pass-1')
        board = c.get('/api/meetings/board').json()
        self.assertEqual(board['actions'][0]['owner'], 'bram')
        r = self.send(c, 'post', f'/api/meeting-actions/{a.id}/task').json()
        t = Task.objects.get(id=r['task_id'])
        self.assertEqual(t.assignee.username, 'bram')
        self.assertEqual(r['for'], 'Bram')
        self.assertEqual([u.username for u in t.assignees.all()], ['bram'])
        self.send(c, 'patch', f'/api/meeting-actions/{a.id}', {'due': '2030-01-20', 'owner': 'peppy'})
        t.refresh_from_db()
        self.assertEqual((t.due.isoformat(), t.assignee.username), ('2030-01-20', 'peppy'))
        self.send(c, 'patch', f'/api/meeting-actions/{a.id}', {'done': True})
        self.assertTrue(Task.objects.get(id=t.id).done)


class TableTests(ApiTests):
    def test_wie_actie_deadline_table(self):
        text = 'Notulen\n' + 'Uitleg ' * 60 + '\n6. Belangrijkste actiepunten\nWie\nActie\nDeadline\nBram\nOdoo afronden\nVrijdag\nShoroy\nAftermovie publiceren\nMaandag 2 november\nIedereen\nDemo\'s beoordelen\nDoorlopend\n7. Afspraken\n'
        m = Meeting.objects.create(date='2026-10-28', text=text)
        made, how = S.extract(m)
        self.assertEqual(made, 3)
        self.assertEqual(sorted(a.owner for a in m.actions.all()), ['', 'bram', 'shoroy'])
        self.assertIn('deadline: Vrijdag', m.actions.get(owner='bram').text)


class NextMeetingTests(ApiTests):
    def test_expected_set_and_planned(self):
        from datetime import date, timedelta
        from meetings.models import Meeting
        from meetings import services as S
        d = lambda n: (date.today() + timedelta(days=n)).isoformat()
        Meeting.objects.create(id='m1', date=d(-16), title='a')
        Meeting.objects.create(id='m2', date=d(-2), title='b')
        n = S.next_meeting()
        self.assertEqual((n['source'], n['date'], n['every']), ('expected', d(12), 14))
        c, _ = self.login('peppy', 'admin-pass-1')
        r = self.send(c, 'put', '/api/meetings/next', {'date': d(5), 'time': '20:00', 'place': 'Discord'}).json()['next']
        self.assertEqual((r['source'], r['date'], r['time'], r['place']), ('set', d(5), '20:00', 'Discord'))
        Meeting.objects.create(id='m3', date=d(5), title='c')
        r = c.get('/api/meetings/next').json()['next']
        self.assertEqual((r['source'], r['meeting_id'], r['time']), ('planned', 'm3', '20:00'))

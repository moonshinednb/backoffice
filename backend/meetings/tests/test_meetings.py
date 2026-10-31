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
        self.send(c, 'patch', f'/api/meeting-actions/{a.id}', {'done': True})
        self.assertTrue(Task.objects.get(id=t.id).done)

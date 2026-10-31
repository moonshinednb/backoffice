import io
import zipfile
from unittest import mock
from django.core.management import call_command
from openpyxl import Workbook
from core.tests.test_api import ApiTests
from feedback.models import Review, Track


def docx(text):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('word/document.xml', '<w:document><w:body>' + ''.join(f'<w:p><w:r><w:t>{p}</w:t></w:r></w:p>' for p in text.split('\n')) + '</w:body></w:document>')
    return buf.getvalue()


def sheet():
    wb = Workbook(); ws = wb.active; ws.title = 'So'
    ws.append(['#', 'TRACKS', None, None, None, 'PRODUCTION', None, None, 'COMPOSITION', None, None, 'TOTAL', 'LINKS', 'SIGNED ON WHICH ALBUM', 'NOTES'])
    ws.append([None, 'Artist', 'Title', 'Link', 'Gescout door', '# Pepijn', '# Bram', '#Shoroy', '# Pepijn', '# Bram', '#Shoroy', None, 'Link to feedback file'])
    ws.append([1, 'Synna', 'Miss You', 'Miss you', 'Bram', 4, 4, 6, 7.2, 7.5, 7, 6, 'LINK 1', None, 'mooie vocal'])
    ws.append([6, 'Dwonji', 'GENOVIA', 'GENOVIA', 'Pepijn', 8, 7.2, 8, 8, 6.8, 8, 7.7, 'LINK 6', 'MS004 - VA2'])
    ws['D3'].hyperlink = 'https://soundcloud.com/synna/miss-you'
    cl = wb.create_sheet('Changelog'); cl.append(['Date', 'Artist name', 'Track name', 'Track #', 'Change']); cl.append(['?', 'Synna', 'Miss You', 1, 'New Version added'])
    b = io.BytesIO(); wb.save(b); return b.getvalue()


def options():
    wb = Workbook(); ws = wb.active
    ws.append(['ARTIST', 'TRACK', 'STATUS', 'COMMENTS', 'FOR VA4', 'FOR BTTW', 'FOR OTHER RELEASE'])
    ws.append(['Hystatus & LAU', 'Demons', 'Confirmed for release', None, True, False, False])
    ws.append(['Synna', 'Miss You', 'Rejected', 'te zacht', False, False, False])
    b = io.BytesIO(); wb.save(b); return b.getvalue()


FILES = {
    '3. Scouting/TRACK FEEDBACK.xlsx': sheet(),
    '3. Scouting/Feedback Files/1.docx': docx('Productie feedback Pepijn:\nBass te narrow.\nCompositie feedback Pepijn:\nGoed opgebouwd.Productie feedback Bert:\nKwaliteit nog niet daar'),
    '3. Scouting/Track options.xlsx': options(),
    '3. Scouting/TrackFeedbackV2.docx': docx('TRACK: \nSiro - Dunes\nDECISION:\nNeeds Adjustment\nPOSSIBLE RELEASE TYPES:\nVA\nFEEDBACK:\nClap te veel.\nDEALBREAKER:\nRelease type'),
}


def fake(path):
    if path not in FILES:
        raise ValueError('niet gevonden')
    return FILES[path]


class FeedbackTests(ApiTests):
    def test_import_and_review(self):
        with mock.patch('integrations.graph.download_path', side_effect=fake):
            call_command('import_track_feedback')
            call_command('import_track_feedback')  # idempotent
        self.assertEqual(Track.objects.filter(number__isnull=False).count(), 2)
        t = Track.objects.get(number=1)
        self.assertEqual(t.link, 'https://soundcloud.com/synna/miss-you')
        self.assertEqual(t.status, 'rejected')
        self.assertEqual(float(Review.objects.get(track=t, reviewer='peppy').production), 4.0)
        self.assertIn('narrow', Review.objects.get(track=t, reviewer='peppy').production_feedback)
        self.assertIn('Kwaliteit', Review.objects.get(track=t, reviewer='Bert').production_feedback)
        self.assertEqual(Track.objects.get(number=6).status, 'signed')
        self.assertIn('VA4', Track.objects.get(artist='Hystatus & LAU').options)
        self.assertEqual(Review.objects.get(reviewer='Feedback V2').decision, 'needs_work')
        self.assertEqual(t.log.filter(kind='version').count(), 1)
        c, _ = self.login('peppy', 'admin-pass-1')
        data = c.get('/api/feedback/tracks').json()
        row = next(x for x in data['tracks'] if x['number'] == 1)
        self.assertEqual(row['average'], round((4 + 4 + 6 + 7.2 + 7.5 + 7) / 6, 1))
        r = self.send(c, 'put', f"/api/feedback/tracks/{t.id}/review", {'production': '8,5', 'composition': 9, 'decision': 'fit'}).json()
        self.assertEqual(r['reviews']['peppy']['production'], 8.5)
        self.assertEqual(self.send(c, 'put', f"/api/feedback/tracks/{t.id}/review", {'production': 11}).status_code, 400)
        r = self.send(c, 'patch', f"/api/feedback/tracks/{t.id}", {'status': 'approved', 'options': ['VA4']}).json()
        self.assertTrue(any('Goedgekeurd' in l['body'] for l in r['log']))

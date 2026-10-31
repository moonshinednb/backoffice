"""Import the old track feedback from OneDrive: TRACK FEEDBACK.xlsx (scores,
links, scout, signed album, notes), the numbered Word files with written
feedback, the Changelog sheet, Track options.xlsx and TrackFeedbackV2.docx.
Safe to run again: tracks are matched by number or artist + title."""
import io
import re
import zipfile
from decimal import Decimal
from django.core.management.base import BaseCommand
from feedback.models import Review, Track, TrackLog

NAMES = {'pepijn': 'peppy', 'peppy': 'peppy', 'bram': 'bram', 'shoroy': 'shoroy', 'shorrie': 'shoroy'}
OPTION_STATUS = {'released': 'released', 'rejected': 'rejected', 'confirmed for release': 'approved', 'confirmed': 'approved',
                 'needs feedback': 'in_review', 'master needed': 'approved', 'chaser sent': 'awaiting'}
DECISION = {'fit for release': 'fit', 'needs adjustment': 'needs_work', 'not fit for release': 'not_fit'}


def who(name):
    return NAMES.get(name.strip().lower(), name.strip())


from integrations.office import docx_text  # noqa: E402


def num(v):
    try:
        return Decimal(str(v).replace(',', '.')).quantize(Decimal('0.1')) if v not in (None, '') else None
    except Exception:
        return None


class Command(BaseCommand):
    help = 'Import track feedback from OneDrive (3. Scouting)'

    def add_arguments(self, parser):
        parser.add_argument('--folder', default='3. Scouting')
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, folder, dry_run=False, **o):
        from openpyxl import load_workbook
        from integrations.graph import download_path
        from production.models import Release
        stats = {'tracks': 0, 'reviews': 0, 'feedback_files': 0, 'log': 0, 'options': 0, 'v2': 0}
        wb = load_workbook(io.BytesIO(download_path(f'{folder}/TRACK FEEDBACK.xlsx')), data_only=True)
        ws = wb.worksheets[0]
        head1 = [str(c.value or '').strip().upper() for c in ws[1]]
        head2 = [str(c.value or '').strip().lower() for c in ws[2]]
        def col(label, row=head2, start=0):
            return next((i for i, h in enumerate(row) if i >= start and label in h), None)
        c_art, c_title, c_link, c_scout = col('artist'), col('title'), col('link'), col('gescout')
        prod = col('production', head1) if col('production', head1) is not None else 5
        comp = col('composition', head1) if col('composition', head1) is not None else 8
        c_signed, c_notes = col('SIGNED', head1), col('NOTES', head1)
        people = [who(re.sub(r'[#\s]', '', h)) for h in head2[prod:prod + 3]]
        if dry_run:
            self.stdout.write(f'kolommen: artiest={c_art} titel={c_title} link={c_link} scout={c_scout} prod={prod} comp={comp} signed={c_signed} notes={c_notes} mensen={people}')
        releases = {r.catalog.upper(): r for r in Release.objects.exclude(catalog='')}
        for row in ws.iter_rows(min_row=3):
            vals = [c.value for c in row]
            n = vals[0]
            if not isinstance(n, (int, float)) or not vals[c_art] or not vals[c_title]:
                continue
            n = int(n)
            link_cell = row[c_link] if c_link is not None else None
            link = (link_cell.hyperlink.target if link_cell is not None and link_cell.hyperlink else '') or ''
            signed = str(vals[c_signed] or '').strip() if c_signed is not None else ''
            notes = str(vals[c_notes] or '').strip() if c_notes is not None else ''
            if dry_run:
                stats['tracks'] += 1
                continue
            t = Track.objects.filter(number=n).first() or Track(number=n)
            t.artist, t.title = str(vals[c_art]).strip()[:300], str(vals[c_title]).strip()[:300]
            t.link = link[:1000] if link.startswith('http') else t.link
            t.scouted_by = str(vals[c_scout] or '').strip()[:150] if c_scout is not None else ''
            if notes:
                t.notes = notes[:8000]
            m = re.match(r'(MS\d{3})', signed.upper())
            if m and m.group(1) in releases:
                t.release = releases[m.group(1)]
                t.status = 'released' if t.release.status == 'released' else 'signed'
            elif signed:
                t.options = list(dict.fromkeys((t.options or []) + [signed[:100]]))
                t.status = 'signed'
            elif t.status == 'new':
                t.status = 'in_review'
            t.save()
            stats['tracks'] += 1
            for k, person in enumerate(people):
                p, c = num(vals[prod + k]), num(vals[comp + k])
                if p is None and c is None:
                    continue
                r, _ = Review.objects.get_or_create(track=t, reviewer=person)
                r.production, r.composition = p, c
                r.save(); stats['reviews'] += 1
            try:
                text = docx_text(download_path(f'{folder}/Feedback Files/{n}.docx'))
            except Exception:
                continue
            parts = re.split(r'(Productie|Compositie) feedback (\w+):', text)
            for i in range(1, len(parts) - 2, 3):
                kind, person, fb = parts[i], who(parts[i + 1]), parts[i + 2].strip()
                if not fb:
                    continue
                r, _ = Review.objects.get_or_create(track=t, reviewer=person)
                setattr(r, 'production_feedback' if kind == 'Productie' else 'composition_feedback', fb[:8000])
                r.save()
            stats['feedback_files'] += 1
        if 'Changelog' in wb.sheetnames and not dry_run:
            for vals in wb['Changelog'].iter_rows(min_row=2, values_only=True):
                if len(vals) < 5 or not isinstance(vals[3], (int, float)):
                    continue
                t = Track.objects.filter(number=int(vals[3])).first()
                if t and not TrackLog.objects.filter(track=t, kind='version', body=str(vals[4])).exists():
                    TrackLog.objects.create(track=t, kind='version', body=f"{vals[4]}{' (' + vals[0].strftime('%d-%m-%Y') + ')' if hasattr(vals[0], 'strftime') else ''}", author='import')
                    stats['log'] += 1
        try:
            ow = load_workbook(io.BytesIO(download_path(f'{folder}/Track options.xlsx')), data_only=True).worksheets[0]
            for vals in ow.iter_rows(min_row=2, values_only=True):
                if not vals or not vals[0]:
                    continue
                artist, title = str(vals[0]).strip(), str(vals[1] or 'TBD').strip()
                status = OPTION_STATUS.get(str(vals[2] or '').strip().lower(), 'awaiting' if 'await' in str(vals[2] or '').lower() else None)
                opts = [name for name, flag in zip(('VA4', 'BTTW', 'Andere release'), vals[4:7]) if flag is True]
                if dry_run:
                    stats['options'] += 1; continue
                t = Track.objects.filter(artist__iexact=artist, title__iexact=title).first() if title.upper() != 'TBD' else None
                t = t or Track.objects.filter(artist__iexact=artist, title__iexact='TBD').first() or Track(artist=artist[:300], title=title[:300])
                if status:
                    t.status = status
                t.options = list(dict.fromkeys((t.options or []) + opts))
                if vals[3]:
                    t.notes = (t.notes + '\n' if t.notes else '') + str(vals[3])[:2000]
                t.save(); stats['options'] += 1
        except Exception as e:
            self.stdout.write(f'Track options overgeslagen: {e}')
        try:
            text = docx_text(download_path(f'{folder}/TrackFeedbackV2.docx'))
            for block in re.split(r'TRACK:\s*', text)[1:]:
                fields = dict(re.findall(r'(DECISION|POSSIBLE RELEASE TYPES|FEEDBACK|DEALBREAKER):\s*(.*?)\s*(?=(?:DECISION|POSSIBLE RELEASE TYPES|FEEDBACK|DEALBREAKER):|\Z)', block, re.S))
                name = block.split('\n', 1)[0].strip() or block[:80]
                artist, _, title = re.split(r'\s+[-–]\s+', name, maxsplit=1)[0], '', (re.split(r'\s+[-–]\s+', name, maxsplit=1) + [''])[1]
                if dry_run or not artist or not title:
                    stats['v2'] += 1 if dry_run else 0; continue
                t = Track.objects.filter(artist__iexact=artist.strip(), title__iexact=title.strip()).first() or Track.objects.create(artist=artist.strip()[:300], title=title.strip()[:300], status='in_review')
                r, _ = Review.objects.get_or_create(track=t, reviewer='Feedback V2')
                r.decision = DECISION.get(fields.get('DECISION', '').strip().lower(), '')
                r.release_types = fields.get('POSSIBLE RELEASE TYPES', '').strip()[:100]
                r.production_feedback = fields.get('FEEDBACK', '').strip()[:8000]
                r.dealbreaker = fields.get('DEALBREAKER', '').strip()[:300]
                r.save(); stats['v2'] += 1
        except Exception as e:
            self.stdout.write(f'TrackFeedbackV2 overgeslagen: {e}')
        self.stdout.write(self.style.SUCCESS(f'Klaar: {stats}'))

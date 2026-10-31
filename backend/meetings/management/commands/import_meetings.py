"""Import all minutes from OneDrive (1. Vergaderingen/<jaar>/<maand>/<map>/*.docx).
Existing meetings (same file) are updated, not duplicated. No AI calls."""
from django.core.management.base import BaseCommand
from meetings import services as S
from meetings.models import Meeting


class Command(BaseCommand):
    help = 'Import meeting minutes from OneDrive'

    def handle(self, **o):
        from integrations.graph import drive_children
        made = updated = skipped = 0
        for year in drive_children(S.root()):
            if not year.get('folder') or not year['name'].isdigit():
                continue
            for month in drive_children(f"{S.root()}/{year['name']}"):
                if not month.get('folder'):
                    continue
                for folder in drive_children(f"{S.root()}/{year['name']}/{month['name']}"):
                    if not folder.get('folder'):
                        continue
                    base = f"{S.root()}/{year['name']}/{month['name']}/{folder['name']}"
                    docs = [f for f in drive_children(base) if f['name'].lower().endswith('.docx')]
                    day = S.parse_date(folder['name']) or next((S.parse_date(f['name']) for f in docs if S.parse_date(f['name'])), '')
                    if not docs or not day:
                        skipped += 1
                        continue
                    doc = next((f for f in docs if 'notulen' in f['name'].lower()), None) or next((f for f in docs if 'template' not in f['name'].lower()), docs[0])
                    m = Meeting.objects.filter(drive_id=doc['id']).first()
                    new = m is None
                    m = m or Meeting(drive_id=doc['id'])
                    m.date, m.title, m.file_name, m.drive_url = day, folder['name'][:200], doc['name'][:300], doc.get('webUrl', '')
                    m.save()
                    try:
                        S.read(m)
                    except Exception as e:
                        self.stdout.write(f"  lezen mislukt: {base}: {e}")
                    made, updated = made + new, updated + (not new)
        self.stdout.write(self.style.SUCCESS(f'Meetings: {made} nieuw, {updated} bijgewerkt, {skipped} overgeslagen'))

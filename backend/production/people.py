"""Crew list (backstage entrance) and guest list (frontstage entrance) per event.

The columns follow the team's Excel. The backoffice keeps the lists and
writes the same two-tab Excel to 06 Productie on OneDrive after each change,
so the venue and the door keep getting the file they know."""
import io
import re
from django.db import transaction
from core.services import audit
from . import rules as R
from .models import CrewMember, Event, Guest

XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
CREW_SHEET, GUEST_SHEET = 'CREW LIST (BACKSTAGE ENTRANCE)', 'GUEST LIST (FRONTSTAGE ENTRANCE'  # Excel allows 31 characters
TEMPLATE = '2. Events/ASSETS/TEMPLATE CREWLIST + GUESTLIST.xlsx'


def crew_dict(c):
    return {'id': c.id, 'name': c.name, 'role': c.role, 'act': c.act, 'cars': c.cars}


def guest_dict(g):
    return {'id': g.id, 'name': g.name, 'plus': g.plus, 'backstage': g.backstage, 'relation': g.relation, 'added_by': g.added_by}


def _event(event_id):
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise ValueError('Evenement niet gevonden.')
    return e


def overview(event_id):
    e = _event(event_id)
    crew, guests = list(e.crew.all()), list(e.guests.all())
    return {'crew': [crew_dict(c) for c in crew], 'guests': [guest_dict(g) for g in guests], 'file_url': e.lists_url, 'file_name': file_name(e),
            'totals': {'crew': len(crew), 'cars': sum(c.cars for c in crew), 'guests': len(guests),
                       'people': len(guests) + sum(g.plus for g in guests), 'backstage': sum(1 for g in guests if g.backstage)}}


def _number(value, label, top):
    try:
        n = int(value or 0)
    except (TypeError, ValueError):
        raise ValueError(f'{label}: vul een getal in.')
    if not 0 <= n <= top:
        raise ValueError(f'{label}: tussen 0 en {top}.')
    return n


def _queue(e):
    from . import drive
    if drive.enabled():
        from jobs.queue import enqueue
        enqueue('event_lists', {'event_id': e.id}, key=e.id, delay=20)


def crew_save(event_id, payload, actor, ident=None):
    e = _event(event_id) if not ident else None
    c = CrewMember.objects.filter(id=ident).select_related('event').first() if ident else CrewMember(event=e)
    if not c:
        raise ValueError('Crewlid niet gevonden.')
    if 'name' in payload or not ident:
        c.name = R._text(payload.get('name'), 200)
        if not c.name:
            raise ValueError('Vul een naam in.')
    for key, limit in (('role', 120), ('act', 200)):
        if key in payload:
            setattr(c, key, R._text(payload.get(key), limit))
    if 'cars' in payload:
        c.cars = _number(payload.get('cars'), 'Auto’s', 20)
    if not ident:
        c.sort = (c.event.crew.order_by('-sort').values_list('sort', flat=True).first() or 0) + 1
    c.save()
    _queue(c.event)
    if not ident:
        audit(actor, 'Crewlid toegevoegd', c.event_id, c.name)
    return crew_dict(c)


def guest_save(event_id, payload, actor, ident=None):
    e = _event(event_id) if not ident else None
    g = Guest.objects.filter(id=ident).select_related('event').first() if ident else Guest(event=e, added_by=str(actor))
    if not g:
        raise ValueError('Gast niet gevonden.')
    if 'name' in payload or not ident:
        g.name = R._text(payload.get('name'), 200)
        if not g.name:
            raise ValueError('Vul een naam in.')
    if 'relation' in payload:
        g.relation = R._text(payload.get('relation'), 200)
    if 'plus' in payload:
        g.plus = _number(payload.get('plus'), '+1s', 10)
    if 'backstage' in payload:
        if type(payload['backstage']) is not bool:
            raise ValueError('Backstage: ja of nee.')
        g.backstage = payload['backstage']
    if not ident:
        g.sort = (g.event.guests.order_by('-sort').values_list('sort', flat=True).first() or 0) + 1
    g.save()
    _queue(g.event)
    if not ident:
        audit(actor, 'Gast toegevoegd', g.event_id, g.name)
    return guest_dict(g)


def remove(model, ident, actor):
    row = model.objects.filter(id=ident).select_related('event').first()
    if not row:
        raise ValueError('Niet gevonden.')
    row.delete()
    _queue(row.event)
    audit(actor, ('Crewlid' if model is CrewMember else 'Gast') + ' verwijderd', row.event_id, row.name)


# --- Excel ---------------------------------------------------------------------

def _plus(value):
    text = str(value or '').strip().upper()
    if text.isdigit():
        return min(int(text), 10)
    m = re.match(r'^\+\s*(\d+)', text)
    return min(int(m.group(1)), 10) if m else 0


def _yes(value):
    return str(value or '').strip().upper() in ('YES', 'JA', 'Y', 'J', 'X', 'TRUE', '1')


def parse_xlsx(content):
    """(crew rows, guest rows) from the team's Excel: the tab with CREW and the
    tab with GUEST in its name, columns found by their header (NAME, ROLE, ...)."""
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True, read_only=True)
    crew, guests = [], []
    for ws in wb.worksheets:
        title = ws.title.upper()
        kind = 'crew' if 'CREW' in title else 'guest' if 'GUEST' in title else None
        if not kind:
            continue
        cols = None
        for row in ws.iter_rows(values_only=True):
            cells = [str(v).strip() if v is not None else '' for v in row]
            if cols is None:
                upper = [c.upper() for c in cells]
                if 'NAME' in upper:
                    cols = {h: i for i, h in enumerate(upper) if h}
                continue
            get = lambda h: cells[cols[h]] if h in cols and cols[h] < len(cells) else ''
            name = get('NAME')
            if not name or name.upper() in ('TOTAL', 'TOTAAL'):
                continue
            if kind == 'crew':
                cars = get('CARS')
                crew.append({'name': name[:200], 'role': get('ROLE')[:120], 'act': get('ACT')[:200], 'cars': min(int(float(cars)), 20) if re.fullmatch(r'\d+(\.0)?', cars) else 0})
            else:
                guests.append({'name': name[:200], 'plus': _plus(get('+1S') or get('+1')), 'backstage': _yes(get('BACKSTAGE?') or get('BACKSTAGE')),
                               'relation': get('RELATION')[:200]})
    return crew, guests


def file_name(e):
    d = e.date
    stamp = f'{d[8:10]}-{d[5:7]}-{d[2:4]}' if len(d) == 10 else 'TBC'
    return f'CREWLIST + GUESTLIST {stamp}.xlsx'


def export_xlsx(e):
    """The two-tab Excel in the team's own layout."""
    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = openpyxl.Workbook()
    head = Font(bold=True, color='FFFFFF')
    fill = PatternFill('solid', fgColor='1F1A1B')
    stamp = file_name(e).removeprefix('CREWLIST + GUESTLIST ').removesuffix('.xlsx')

    def sheet(ws, title, headers, rows, widths):
        ws.append([f'{title} {e.name.upper()} {stamp}'])
        ws['A1'].font = Font(bold=True, size=14)
        ws.append([''] + headers)
        for cell in ws[2]:
            cell.font, cell.fill, cell.alignment = head, fill, Alignment(vertical='center')
        for i, r in enumerate(rows, 1):
            ws.append([i] + r)
        for col, width in zip('ABCDEF', widths):
            ws.column_dimensions[col].width = width
        ws.freeze_panes = 'A3'

    crew = list(e.crew.all())
    guests = list(e.guests.all())
    sheet(wb.active, 'CREW LIST', ['NAME', 'ROLE', 'ACT', 'CARS'], [[c.name, c.role, c.act, c.cars or ''] for c in crew], [5, 30, 28, 34, 8])
    wb.active.title = CREW_SHEET
    ws = wb.create_sheet(GUEST_SHEET)
    sheet(ws, 'GUEST LIST', ['NAME', '+1s', 'BACKSTAGE?', 'RELATION'],
          [[g.name, f'+{g.plus}' if g.plus else 'NO', 'YES' if g.backstage else 'NO', g.relation] for g in guests], [5, 30, 8, 13, 34])
    ws.append([])
    ws.append(['', 'TOTAL', len(guests) + sum(g.plus for g in guests)])
    ws.cell(ws.max_row, 2).font = Font(bold=True)
    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def write_drive(event_id):
    """Worker: put the current lists in 06 Productie of the event folder."""
    from integrations.graph import drive_upload
    from . import drive
    e = Event.objects.filter(id=event_id).first()
    if not e or not drive.enabled():
        return
    _, url = drive_upload(f"{drive.event_base(e)}/{drive.section('productie')}/{file_name(e)}", export_xlsx(e), XLSX)
    Event.objects.filter(id=e.id).update(lists_url=url)


def _find_drive_file(e):
    from integrations.graph import item_children
    from . import drive
    if not e.drive_id:
        return None
    kids = item_children(e.drive_id)
    places = [kids] + [item_children(c['id']) for c in kids if c['name'] == drive.section('productie') and 'folder' in c]
    found = [c for group in places for c in group
             if 'folder' not in c and c['name'].lower().endswith('.xlsx') and re.search(r'crew|guest', c['name'], re.I)]
    return max(found, key=lambda c: c.get('lastModifiedDateTime', ''), default=None)


def import_drive(event_id, actor, force=False):
    """Read the existing crew-/guestlist Excel of this event from OneDrive.
    Only fills empty lists, unless forced."""
    from integrations.graph import download_item
    e = _event(event_id)
    if not force and (e.crew.exists() or e.guests.exists()):
        raise ValueError('Deze lijsten zijn al gevuld.')
    item = _find_drive_file(e)
    if not item:
        raise ValueError('Geen crew-/guestlist-Excel gevonden in de eventmap.')
    _, content = download_item(item['id'])
    crew, guests = parse_xlsx(content)
    with transaction.atomic():
        if force:
            e.crew.all().delete()
            e.guests.all().delete()
        CrewMember.objects.bulk_create([CrewMember(event=e, sort=i, **c) for i, c in enumerate(crew)])
        Guest.objects.bulk_create([Guest(event=e, sort=i, added_by='Excel', **g) for i, g in enumerate(guests)])
        Event.objects.filter(id=e.id).update(lists_url=item.get('webUrl', ''))
    audit(actor, 'Crew- en guestlist geïmporteerd', e.id, f"{item['name']}: {len(crew)} crew, {len(guests)} gasten")
    return {**overview(event_id), 'imported': {'crew': len(crew), 'guests': len(guests), 'file': item['name']}}


def copy_crew(event_id, actor):
    """Core crew from the previous event with a crew list, else from the template on OneDrive."""
    e = _event(event_id)
    have = {n.lower() for n in e.crew.values_list('name', flat=True)}
    source = (CrewMember.objects.exclude(event=e).filter(event__date__lte=e.date or '9999').order_by('-event__date', 'sort')
              .values_list('event_id', flat=True).first())
    if source:
        rows = [{'name': c.name, 'role': c.role} for c in CrewMember.objects.filter(event_id=source)]
        origin = Event.objects.get(id=source).name
    else:
        from integrations.graph import download_path
        rows, _ = parse_xlsx(download_path(TEMPLATE))
        rows, origin = [{'name': r['name'], 'role': r['role']} for r in rows], 'het sjabloon'
    new = [r for r in rows if r['name'].lower() not in have]
    last = e.crew.order_by('-sort').values_list('sort', flat=True).first() or 0
    CrewMember.objects.bulk_create([CrewMember(event=e, sort=last + i + 1, **r) for i, r in enumerate(new)])
    if new:
        _queue(e)
    audit(actor, 'Crew overgenomen', e.id, f'{len(new)} van {origin}')
    return {**overview(event_id), 'copied': len(new), 'origin': origin}

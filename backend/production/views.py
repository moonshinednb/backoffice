"""Production endpoints: events, artists, advancing, files, the venue mail,
label and contracts."""
from django.http import HttpResponse
from ninja import File, Form, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from core.access import actor, body, require
from . import rules as R
from . import services as S
from .models import Contract, LabelStatement, Release

router = Router()


def pdf_response(content, name):
    response = HttpResponse(content, content_type='application/pdf')
    from urllib.parse import quote
    response['Content-Disposition'] = "attachment; filename*=UTF-8''" + quote(name)
    return response


# --- Events ----------------------------------------------------------------

@router.get('/events')
def events(request):
    require(request, 'production')
    return {'events': S.event_listing()}


@router.post('/events')
def create_event(request):
    require(request, 'production', write=True)
    return S.event_dict(S.event_create(body(request), actor(request)))


@router.patch('/events/{ident}')
def update_event(request, ident: str):
    require(request, 'production', write=True)
    return S.event_dict(S.event_update(ident, body(request), actor(request)))


@router.delete('/events/{ident}')
def delete_event(request, ident: str):
    require(request, 'production', write=True)
    S.event_remove(ident, actor(request))
    return {'ok': True}


@router.get('/events/{ident}/overview')
def overview(request, ident: str):
    require(request, 'production')
    return S.advancing(ident)


@router.get('/events/{ident}/notes')
def notes(request, ident: str):
    require(request, 'production')
    return {'notes': S.notes(ident)}


@router.post('/events/{ident}/notes')
def add_note(request, ident: str):
    require(request, 'production', write=True)
    S.add_note(ident, body(request).get('body', ''), actor(request))
    return {'notes': S.notes(ident)}


@router.get('/events/{ident}/advancing.pdf')
def advancing_pdf(request, ident: str):
    require(request, 'production')
    data = S.advancing(ident)
    return pdf_response(R.advancing_pdf(data, {'timetable', 'contacts', 'travel', 'hotel'}), f"Advancing - {R.safe_name(data['event']['name'])}.pdf")


@router.post('/events/{ident}/bookings')
def add_booking(request, ident: str):
    require(request, 'production', write=True)
    booking = S.booking_add(ident, body(request), actor(request))
    return {'booking_id': booking, **S.advancing(ident)}


@router.post('/events/{ident}/lineup')
def add_lineup_act(request, ident: str):
    """New act (solo, duo, group) with its members."""
    require(request, 'production', write=True)
    from . import lineup
    try:
        act = lineup.act_create(ident, body(request), actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return {'act_id': act.id, **S.advancing(ident)}


@router.patch('/lineup/{ident}')
def update_lineup_act(request, ident: str):
    require(request, 'production', write=True)
    from . import lineup
    try:
        act = lineup.act_update(ident, body(request), actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return S.advancing(act.event_id)


@router.delete('/lineup/{ident}')
def remove_lineup_act(request, ident: str):
    require(request, 'production', write=True)
    from . import lineup
    try:
        return S.advancing(lineup.act_remove(ident, actor(request)))
    except ValueError as e:
        raise HttpError(400, str(e))


@router.post('/lineup/{ident}/members')
def add_lineup_member(request, ident: str):
    require(request, 'production', write=True)
    from . import lineup
    try:
        b = lineup.member_add(ident, body(request), actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return {'booking_id': b.id, **S.advancing(b.event_id)}


@router.post('/events/{ident}/crew/lineup')
def crew_from_lineup(request, ident: str):
    """Put the line-up on the crew list (role ARTIST, act in ACT)."""
    require(request, 'production', write=True)
    from . import lineup, people
    try:
        added = lineup.crew_from_lineup(ident, actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return {**people.overview(ident), 'added': added}


@router.post('/events/{ident}/acts')
def add_act(request, ident: str):
    require(request, 'production', write=True)
    S.act_create(ident, body(request), actor(request))
    return S.advancing(ident)


@router.post('/events/{ident}/checklist')
def add_check(request, ident: str):
    require(request, 'production', write=True)
    S.checklist_add(ident, body(request).get('label', ''), actor(request))
    return S.advancing(ident)


@router.post('/events/{ident}/send-preview')
def send_preview(request, ident: str):
    require(request, 'production', write=True)
    return S.preview(ident, body(request))


@router.post('/events/{ident}/send')
def send(request, ident: str):
    require(request, 'production', write=True)
    result = S.send(ident, body(request), actor(request))
    return {'result': result, **S.advancing(ident)}


# --- Bookings, acts, checklist ------------------------------------------------

@router.get('/bookings/{ident}')
def booking(request, ident: str):
    user = require(request, 'production')
    return S.booking_detail(ident, user.private)


@router.patch('/bookings/{ident}')
def update_booking(request, ident: str):
    user = require(request, 'production', write=True)
    S.booking_update(ident, body(request), actor(request))
    return S.booking_detail(ident, user.private)


@router.delete('/bookings/{ident}')
def delete_booking(request, ident: str):
    require(request, 'production', write=True)
    return {'ok': True, 'event_id': S.booking_remove(ident, actor(request))}


@router.patch('/acts/{ident}')
def update_act(request, ident: str):
    require(request, 'production', write=True)
    return S.advancing(S.act_update(ident, body(request), actor(request)))


@router.delete('/acts/{ident}')
def delete_act(request, ident: str):
    require(request, 'production', write=True)
    return S.advancing(S.act_delete(ident, actor(request)))


@router.patch('/checklist/{ident}')
def update_check(request, ident: str):
    require(request, 'production', write=True)
    return S.advancing(S.checklist_update(ident, body(request), actor(request)))


@router.delete('/checklist/{ident}')
def delete_check(request, ident: str):
    require(request, 'production', write=True)
    return S.advancing(S.checklist_delete(ident, actor(request)))


# --- Artists -------------------------------------------------------------------

@router.get('/artists')
def artists(request):
    require(request, 'production')
    return {'artists': S.artist_list()}


@router.post('/artists')
def create_artist(request):
    user = require(request, 'production', write=True)
    return S.artist_get(S.artist_create(body(request), actor(request)), user.private)


@router.get('/artists/{ident}')
def artist(request, ident: str):
    user = require(request, 'production')
    return S.artist_get(ident, user.private)


@router.patch('/artists/{ident}')
def update_artist(request, ident: str):
    user = require(request, 'production', write=True)
    S.artist_update(ident, body(request), actor(request))
    return S.artist_get(ident, user.private)


@router.delete('/artists/{ident}')
def delete_artist(request, ident: str):
    require(request, 'production', write=True)
    S.artist_delete(ident, actor(request))
    return {'ok': True}


@router.get('/roster')
def roster(request):
    """The Moonshine artists: profile, socials, releases and upcoming shows."""
    require(request, 'production')
    from datetime import date
    from .models import Artist, Booking, Release, Voyage
    today = date.today().isoformat()
    rows = []
    for a in Artist.objects.filter(in_roster=True).order_by('name'):
        d = S.artist_dict(a)
        name = a.name.casefold()
        releases = [r for r in Release.objects.all() if name in (r.artist or '').casefold()]
        shows = Booking.objects.filter(artist=a, event__date__gte=today).exclude(status='cancelled').count()
        voyages = Voyage.objects.filter(performer__icontains=a.name, date__gte=today).exclude(status__in=['declined', 'cancelled']).count()
        rows.append({k: d[k] for k in ('id', 'name', 'full_name', 'photo', 'socials', 'city', 'genres', 'epk_folder', 'agency', 'instagram', 'email')}
                    | {'releases': len(releases), 'latest_release': max((r.release_date for r in releases if r.release_date), default=''),
                       'upcoming_shows': shows + voyages, 'has_rider': bool(a.tech_rider.strip() or a.rider_url), 'has_bio': bool(a.bio.strip())})
    return {'artists': rows}


@router.post('/roster')
def add_to_roster(request):
    """Add one of our own artists (new or existing by name)."""
    require(request, 'production', write=True)
    from .models import Artist
    name = R._text(body(request).get('name'), 120)
    if not name:
        raise HttpError(400, 'Vul een artiestennaam in.')
    a = Artist.objects.filter(name__iexact=name).first() or Artist.objects.create(name=name)
    a.in_roster = True
    a.save(update_fields=['in_roster'])
    from core.services import audit
    audit(actor(request), 'Toegevoegd aan Moonshine-artiesten', a.id, a.name)
    return {'id': a.id}


@router.post('/artists/{ident}/photo')
def artist_photo(request, ident: str, file: File[UploadedFile]):
    """Profile photo, stored on OneDrive under Artists/<name>/."""
    require(request, 'production', write=True)
    from .drive import enabled
    from .models import Artist
    from integrations.graph import drive_upload
    a = Artist.objects.filter(id=ident).first()
    if not a:
        raise HttpError(404, 'Artiest niet gevonden.')
    if not enabled():
        raise HttpError(400, 'Stel eerst OneDrive in bij Koppelingen.')
    content = file.read(15 * 1024 * 1024 + 1)
    if len(content) > 15 * 1024 * 1024:
        raise HttpError(400, 'Maximaal 15 MB.')
    if not (content.startswith(b'\xff\xd8\xff') or content.startswith(b'\x89PNG') or content[8:12] == b'WEBP'):
        raise HttpError(400, 'Gebruik een JPG-, PNG- of WebP-afbeelding.')
    ext = 'png' if content.startswith(b'\x89PNG') else 'webp' if content[8:12] == b'WEBP' else 'jpg'
    try:
        from .drive import conf
        a.photo_id, _ = drive_upload(f"{conf('drive_artists_folder')}/{R.safe_name(a.name, 'Artiest')}/Profielfoto.{ext}", content, f'image/{"jpeg" if ext == "jpg" else ext}')
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))
    a.save(update_fields=['photo_id'])
    return S.artist_get(ident, True)


@router.get('/artists/{ident}/photo')
def artist_photo_file(request, ident: str):
    require(request, 'production')
    from django.http import HttpResponseRedirect
    from .models import Artist
    from integrations.graph import drive_item
    a = Artist.objects.filter(id=ident).first()
    item = drive_item(a.photo_id) if a and a.photo_id else None
    if not item or not item.get('@microsoft.graph.downloadUrl'):
        raise HttpError(404, 'Geen foto.')
    return HttpResponseRedirect(item['@microsoft.graph.downloadUrl'])


@router.get('/artists/{ident}/rider.pdf')
def rider_pdf(request, ident: str, kind: str = 'tech'):
    require(request, 'production')
    kind = 'hospitality' if kind == 'hospitality' else 'tech'
    data = S.artist_get(ident, True)
    label = 'Hospitality rider' if kind == 'hospitality' else 'Technical rider'
    return pdf_response(R.rider_pdf(data, kind), f"{label} - {R.safe_name(data['name'])}.pdf")


# --- Files -----------------------------------------------------------------------

@router.post('/assets')
def upload_asset(request, owner_type: Form[str], owner_id: Form[str], kind: Form[str], file: File[UploadedFile]):
    require(request, 'production', write=True)
    ident = S.asset_add_file(owner_type, owner_id, kind, file.name, file.read(), actor(request))
    return S.asset_get(ident)


@router.post('/assets/link')
def add_link(request):
    require(request, 'production', write=True)
    d = body(request)
    ident = S.asset_add_link(str(d.get('owner_type', '')), str(d.get('owner_id', '')), str(d.get('kind', '')), d.get('name', ''), d.get('url', ''), actor(request))
    return S.asset_get(ident)


@router.get('/assets/{ident}/file')
def asset_file(request, ident: str):
    require(request, 'production')
    asset = S.asset_get(ident)
    from urllib.parse import quote
    response = HttpResponse(S.asset_content(asset), content_type=asset['mime'] or 'application/octet-stream')
    response['Content-Disposition'] = "attachment; filename*=UTF-8''" + quote(asset['name'])
    return response


@router.post('/assets/{ident}/sync')
def sync_asset(request, ident: str):
    require(request, 'production', write=True)
    return S.sync_asset(ident)


@router.delete('/assets/{ident}')
def delete_asset(request, ident: str):
    require(request, 'production', write=True)
    S.asset_delete(ident, actor(request))
    return {'ok': True}


# --- Label and contracts --------------------------------------------------------------

@router.get('/releases')
def releases(request):
    require(request, 'production')
    return {'releases': [S.release_dict(r) for r in Release.objects.prefetch_related('steps')[:500]],
            'statements': [{'id': s.id, 'invoice_number': s.invoice_number, 'period': s.period, 'status': s.status, 'currency': s.currency,
                            'gross_usd': s.gross_usd, 'fee_usd': s.fee_usd, 'total_due_usd': s.total_due_usd} for s in LabelStatement.objects.all()[:200]]}


@router.post('/releases')
def create_release(request):
    require(request, 'production', write=True)
    return S.release_save(body(request), actor(request))


@router.patch('/releases/{ident}')
def update_release(request, ident: str):
    require(request, 'production', write=True)
    return S.release_save(body(request), actor(request), ident)


@router.delete('/releases/{ident}')
def delete_release(request, ident: str):
    require(request, 'production', write=True)
    if not Release.objects.filter(id=ident).delete()[0]:
        raise HttpError(404, 'Release niet gevonden.')
    return {'ok': True}


@router.post('/releases/{ident}/steps')
def add_step(request, ident: str):
    require(request, 'production', write=True)
    return S.step_save(ident, body(request), actor(request))


@router.patch('/release-steps/{ident}')
def update_step(request, ident: str):
    require(request, 'production', write=True)
    return S.step_save(None, body(request), actor(request), ident)


@router.delete('/release-steps/{ident}')
def delete_step(request, ident: str):
    require(request, 'production', write=True)
    from .models import ReleaseStep
    step = ReleaseStep.objects.filter(id=ident).select_related('release').first()
    if not step:
        raise HttpError(404, 'Stap niet gevonden.')
    release = step.release
    step.delete()
    return S.release_dict(release)


@router.post('/drive/{kind}/{ident}')
def drive_folders(request, kind: str, ident: str):
    """Create or repair the OneDrive folders now (also for existing items)."""
    require(request, 'production', write=True)
    from . import drive
    if not drive.enabled():
        raise HttpError(400, 'Stel eerst OneDrive in bij Koppelingen.')
    fn = {'event': drive.sync_event, 'booking': drive.sync_booking, 'release': drive.sync_release, 'voyage': drive.sync_voyage}.get(kind)
    if not fn:
        raise HttpError(404, 'Onbekend soort map.')
    try:
        url = fn(ident)
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))
    return {'drive_url': url or ''}


@router.post('/events/{event_id}/files')
def event_file_upload(request, event_id: str, section: str = Form(...), file: UploadedFile = File(...)):
    """Upload straight into a section of the event folder on OneDrive."""
    require(request, 'production', write=True)
    from . import drive
    from .models import Event
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise HttpError(404, 'Evenement niet gevonden.')
    if not drive.enabled() or not e.drive_id:
        raise HttpError(400, 'Dit evenement heeft nog geen map op OneDrive.')
    content = file.read(drive.UPLOAD_LIMIT + 1)
    try:
        out = drive.upload_to_section(e, section, file.name or 'Bestand', content, file.content_type)
    except (ValueError, RuntimeError) as err:
        raise HttpError(400, str(err))
    from core.services import audit
    audit(actor(request), 'Bestand op OneDrive gezet', e.id, f"{section}/{out['name']}")
    return out


@router.get('/events/{event_id}/files')
def event_files(request, event_id: str, fresh: int = 0):
    """The event's OneDrive folder per section (finance, EPKs, riders, ...)."""
    require(request, 'production')
    from . import drive
    from .models import Event
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise HttpError(404, 'Evenement niet gevonden.')
    if not drive.enabled():
        return {'enabled': False, 'url': '', 'sections': [], 'other': []}
    try:
        files = drive.event_files(e, fresh=bool(fresh))
    except (ValueError, RuntimeError) as err:
        raise HttpError(400, str(err))
    from . import steps
    steps.auto_check(e, files)
    return {'enabled': True, **files}


# --- Crew list and guest list per event -----------------------------------------

@router.get('/events/{event_id}/people')
def event_people(request, event_id: str):
    require(request, 'production')
    from . import people
    return _steps_call(people.overview, event_id)


@router.post('/events/{event_id}/contacts')
def contact_add(request, event_id: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.contact_save, event_id, body(request), actor(request))


@router.patch('/venue-contacts/{ident}')
def contact_update(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.contact_save, None, body(request), actor(request), ident)


@router.delete('/venue-contacts/{ident}')
def contact_delete(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    from .models import VenueContact
    _steps_call(people.remove, VenueContact, ident, actor(request))
    return {'ok': True}


@router.post('/events/{event_id}/crew')
def crew_add(request, event_id: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.crew_save, event_id, body(request), actor(request))


@router.patch('/crew/{ident}')
def crew_update(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.crew_save, None, body(request), actor(request), ident)


@router.delete('/crew/{ident}')
def crew_delete(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    from .models import CrewMember
    _steps_call(people.remove, CrewMember, ident, actor(request))
    return {'ok': True}


@router.post('/events/{event_id}/guests')
def guest_add(request, event_id: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.guest_save, event_id, body(request), actor(request))


@router.patch('/guests/{ident}')
def guest_update(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    return _steps_call(people.guest_save, None, body(request), actor(request), ident)


@router.delete('/guests/{ident}')
def guest_delete(request, ident: str):
    require(request, 'production', write=True)
    from . import people
    from .models import Guest
    _steps_call(people.remove, Guest, ident, actor(request))
    return {'ok': True}


@router.post('/events/{event_id}/crew/copy')
def crew_copy(request, event_id: str):
    """Core crew from the previous event (or the template on OneDrive)."""
    require(request, 'production', write=True)
    from . import people
    try:
        return people.copy_crew(event_id, actor(request))
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))


@router.post('/events/{event_id}/people/import')
def people_import(request, event_id: str):
    require(request, 'production', write=True)
    from . import people
    try:
        return people.import_drive(event_id, actor(request), force=bool(body(request).get('force')))
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))


@router.get('/events/{event_id}/people.xlsx')
def people_xlsx(request, event_id: str):
    require(request, 'production')
    from . import people
    from .models import Event
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise HttpError(404, 'Evenement niet gevonden.')
    response = HttpResponse(people.export_xlsx(e), content_type=people.XLSX)
    response['Content-Disposition'] = f'attachment; filename="{people.file_name(e)}"'
    return response


# --- Team checklist per event -------------------------------------------------

def _steps_call(fn, *args):
    try:
        return fn(*args)
    except ValueError as e:
        raise HttpError(400, str(e))


@router.get('/events/{event_id}/steps')
def event_steps(request, event_id: str):
    require(request, 'production')
    from . import steps
    return _steps_call(steps.event_steps, event_id)


@router.post('/events/{event_id}/steps/check')
def event_steps_check(request, event_id: str):
    """Tick what is already on OneDrive (a few seconds: it reads the folders)."""
    require(request, 'production')
    from . import steps
    from .models import Event
    e = Event.objects.filter(id=event_id).first()
    if not e:
        raise HttpError(404, 'Evenement niet gevonden.')
    try:
        ticked = steps.auto_check(e)
    except (ValueError, RuntimeError):
        ticked = 0
    return {**steps.event_steps(event_id), 'ticked': ticked}


@router.post('/events/{event_id}/steps')
def event_step_add(request, event_id: str):
    require(request, 'production', write=True)
    from . import steps
    return _steps_call(steps.step_add, event_id, body(request), actor(request))


@router.patch('/event-steps/{ident}')
def event_step_update(request, ident: str):
    require(request, 'production', write=True)
    from . import steps
    return _steps_call(steps.step_update, ident, body(request), actor(request))


@router.delete('/event-steps/{ident}')
def event_step_delete(request, ident: str):
    require(request, 'production', write=True)
    from . import steps
    _steps_call(steps.step_delete, ident, actor(request))
    return {'ok': True}


@router.post('/event-steps/{ident}/task')
def event_step_task(request, ident: str):
    require(request, 'production', write=True)
    from . import steps
    return _steps_call(steps.make_task, ident, actor(request))


@router.get('/event-roles')
def event_roles(request):
    """Who does what by default; new checklists take their owners from this."""
    require(request, 'production')
    from . import steps
    current = steps.roles()
    return {'roles': [[k, label, current.get(k, '')] for k, label in steps.ROLE_LABELS.items()]}


@router.get('/my-event-steps')
def event_steps_mine(request):
    """Open checklist points of the signed-in person (for the overview)."""
    require(request, 'production')
    from . import steps
    return {'steps': steps.mine(request.auth.username)}


@router.get('/label/artists')
def label_artists(request):
    require(request, 'production')
    return {'artists': S.label_artists()}


@router.post('/label/pull')
def label_pull(request):
    require(request, 'admin', write=True)
    from integrations.providers import labelgrid_pull
    return labelgrid_pull()


@router.get('/contracts')
def contracts(request):
    require(request, 'production')
    return {'contracts': [{'id': c.id, 'title': c.title, 'status': c.status, 'signers': c.signers, 'created': c.created.timestamp()} for c in Contract.objects.all()[:200]]}


@router.post('/contracts')
def create_contract(request):
    require(request, 'production', write=True)
    from integrations.providers import opensign_create
    d = body(request)
    c = opensign_create(str(d.get('title', '')), d.get('signers', []), actor(request))
    return {'id': c.id, 'status': c.status}

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
    fn = {'event': drive.sync_event, 'booking': drive.sync_booking, 'release': drive.sync_release}.get(kind)
    if not fn:
        raise HttpError(404, 'Onbekend soort map.')
    try:
        url = fn(ident)
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))
    return {'drive_url': url or ''}


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

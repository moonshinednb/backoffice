"""Track feedback endpoints."""
from django.http import HttpResponseRedirect
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from core.access import actor, body, require
from core.services import audit
from . import services as S
from .models import Track, TrackLog

router = Router()


def _track(ident):
    t = Track.objects.filter(id=ident).select_related('release').first()
    if not t:
        raise HttpError(404, 'Track niet gevonden.')
    return t


@router.get('/feedback/tracks')
def tracks(request):
    require(request, 'production')
    rows = Track.objects.select_related('release').prefetch_related('reviews')[:3000]
    return {'tracks': [S.track_dict(t) for t in rows], 'statuses': list(S.STATUS.items()), 'reviewers': [(u, S.display(u)) for u in S.REVIEWERS]}


@router.post('/feedback/tracks')
def create(request):
    require(request, 'production', write=True)
    d = body(request)
    t = Track(scouted_by=d.get('scouted_by') or request.auth.display_name)
    try:
        S.apply(t, d, actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    TrackLog.objects.create(track=t, kind='version', body='Toegevoegd', author=actor(request))
    audit(actor(request), 'Track toegevoegd', t.id, f'{t.artist} - {t.title}')
    return S.track_dict(t, True)


@router.get('/feedback/tracks/{ident}')
def detail(request, ident: str):
    require(request, 'production')
    return S.track_dict(_track(ident), True)


@router.patch('/feedback/tracks/{ident}')
def update(request, ident: str):
    require(request, 'production', write=True)
    t = _track(ident)
    try:
        S.apply(t, body(request), actor(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return S.track_dict(t, True)


@router.delete('/feedback/tracks/{ident}')
def delete(request, ident: str):
    require(request, 'production', write=True)
    _track(ident).delete()
    audit(actor(request), 'Track verwijderd', ident)
    return {'ok': True}


@router.put('/feedback/tracks/{ident}/review')
def review(request, ident: str):
    """Your own grade and feedback on this track."""
    require(request, 'production', write=True)
    t = _track(ident)
    try:
        S.save_review(t, request.auth.username, body(request))
    except ValueError as e:
        raise HttpError(400, str(e))
    return S.track_dict(_track(ident), True)


@router.post('/feedback/tracks/{ident}/log')
def comment(request, ident: str):
    require(request, 'production', write=True)
    t = _track(ident)
    d = body(request)
    text = str(d.get('body') or '').strip()[:4000]
    if not text:
        raise HttpError(400, 'Leeg bericht.')
    TrackLog.objects.create(track=t, kind='version' if d.get('kind') == 'version' else 'comment', body=text, author=actor(request))
    return S.track_dict(t, True)


@router.post('/feedback/tracks/{ident}/file')
def upload(request, ident: str, file: File[UploadedFile]):
    """Store the audio on OneDrive under 3. Scouting/Demo's/<artist>/."""
    require(request, 'production', write=True)
    t = _track(ident)
    content = file.read(300 * 1024 * 1024 + 1)
    if len(content) > 300 * 1024 * 1024:
        raise HttpError(400, 'Maximaal 300 MB.')
    from integrations.graph import drive_upload
    from production import rules as R
    from production.drive import enabled
    if not enabled():
        raise HttpError(400, 'Stel eerst OneDrive in bij Koppelingen.')
    name = R.safe_name(file.name or f'{t.artist} - {t.title}', 'track')
    try:
        t.file_id, t.file_url = drive_upload(f"3. Scouting/Demo's/{R.safe_name(t.artist, 'Artiest')}/{name}", content, file.content_type or 'audio/mpeg')
    except (ValueError, RuntimeError) as e:
        raise HttpError(400, str(e))
    t.file_name = name
    t.save(update_fields=['file_id', 'file_url', 'file_name', 'updated'])
    TrackLog.objects.create(track=t, kind='version', body=f'Nieuwe versie: {name}', author=actor(request))
    return S.track_dict(t, True)


@router.get('/feedback/tracks/{ident}/stream')
def stream(request, ident: str):
    """Redirect to a short-lived OneDrive download link so the browser can play it."""
    require(request, 'production')
    t = _track(ident)
    if not t.file_id:
        raise HttpError(404, 'Geen bestand op OneDrive.')
    from integrations.graph import drive_item
    item = drive_item(t.file_id)
    if not item or not item.get('@microsoft.graph.downloadUrl'):
        raise HttpError(404, 'Bestand niet gevonden op OneDrive.')
    return HttpResponseRedirect(item['@microsoft.graph.downloadUrl'])

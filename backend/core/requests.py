"""Feature requests: anyone in the team sends one, the admin keeps an inbox."""
from django.http import HttpResponse
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from .access import actor, body, require
from .models import FeatureRequest, User
from .services import DATA, audit

router = Router()
SHOTS = DATA / 'feature-requests'
IMAGE_TYPES = {b'\x89PNG': ('png', 'image/png'), b'\xff\xd8\xff': ('jpg', 'image/jpeg'), b'RIFF': ('webp', 'image/webp')}
LIMITS = {'area': 80, 'sub': 80, 'feature': 200, 'title': 200, 'current': 4000, 'wanted': 4000, 'why': 2000, 'page': 300}


def request_dict(r, names=None):
    names = names or {}
    return {'id': r.id, 'author': r.author, 'author_name': names.get(r.author, r.author), 'area': r.area, 'sub': r.sub, 'feature': r.feature,
            'kind': r.kind, 'title': r.title, 'current': r.current, 'wanted': r.wanted, 'why': r.why, 'priority': r.priority, 'page': r.page,
            'has_screenshot': bool(r.screenshot), 'status': r.status, 'admin_note': r.admin_note,
            'created': r.created.timestamp(), 'updated': r.updated.timestamp()}


def _names():
    return {u.username: u.display_name for u in User.objects.all()}


def _visible(request, ident):
    r = FeatureRequest.objects.filter(id=ident).first()
    if not r or (request.auth.role != 'admin' and r.author != request.auth.username):
        raise HttpError(404, 'Verzoek niet gevonden.')
    return r


@router.get('/feature-requests')
def list_requests(request):
    """Admins see everything, everyone else their own requests."""
    rows = FeatureRequest.objects.all() if request.auth.role == 'admin' else FeatureRequest.objects.filter(author=request.auth.username)
    names = _names()
    return {'requests': [request_dict(r, names) for r in rows[:500]], 'new': rows.filter(status='new').count()}


@router.post('/feature-requests')
def create_request(request):
    user = require(request)
    d = body(request)
    r = FeatureRequest(author=user.username)
    for key, limit in LIMITS.items():
        setattr(r, key, str(d.get(key) or '').strip()[:limit])
    if not r.area or not r.title:
        raise HttpError(400, 'Kies het menu en geef je verzoek een korte titel.')
    if not (r.wanted or r.current):
        raise HttpError(400, 'Beschrijf hoe het nu werkt of hoe je het wilt.')
    r.kind = d.get('kind') if d.get('kind') in dict(FeatureRequest.KINDS) else 'change'
    r.priority = d.get('priority') if d.get('priority') in dict(FeatureRequest.PRIORITIES) else 'normal'
    r.save()
    audit(user.username, 'Feature request ingediend', r.id, r.title)
    from .notify import notify
    notify([u for u in User.objects.filter(role='admin', is_active=True) if u.username != user.username], 'feature', 'Nieuw feature request',
           f'{r.title} ({r.area}{" › " + r.sub if r.sub else ""}, van {user.display_name})', '/admin/requests', key=f'feature:{r.id}')
    return request_dict(r, _names())


@router.post('/feature-requests/{ident}/screenshot')
def add_screenshot(request, ident: str, file: UploadedFile = File(...)):
    require(request)
    r = _visible(request, ident)
    content = file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HttpError(400, 'Maximaal 5 MB.')
    kind = next((v for magic, v in IMAGE_TYPES.items() if content.startswith(magic) and (magic != b'RIFF' or content[8:12] == b'WEBP')), None)
    if not kind:
        raise HttpError(400, 'Gebruik een PNG-, JPG- of WebP-afbeelding.')
    SHOTS.mkdir(parents=True, exist_ok=True)
    name = f'{r.id}.{kind[0]}'
    (SHOTS / name).write_bytes(content)
    r.screenshot = name
    r.save(update_fields=['screenshot', 'updated'])
    return request_dict(r, _names())


@router.get('/feature-requests/{ident}/screenshot')
def screenshot(request, ident: str):
    r = _visible(request, ident)
    path = SHOTS / r.screenshot if r.screenshot else None
    if not path or not path.exists():
        raise HttpError(404, 'Geen screenshot.')
    mime = {'png': 'image/png', 'jpg': 'image/jpeg', 'webp': 'image/webp'}[r.screenshot.rsplit('.', 1)[1]]
    return HttpResponse(path.read_bytes(), content_type=mime)


@router.patch('/feature-requests/{ident}')
def update_request(request, ident: str):
    """The admin sets the status and leaves a note; the author gets a message."""
    require(request, 'admin', write=True)
    r = _visible(request, ident)
    d = body(request)
    before = r.status
    if 'status' in d:
        if d['status'] not in dict(FeatureRequest.STATUSES):
            raise HttpError(400, 'Onbekende status.')
        r.status = d['status']
    if 'admin_note' in d:
        r.admin_note = str(d.get('admin_note') or '')[:4000]
    r.save()
    audit(actor(request), 'Feature request bijgewerkt', r.id, r.status)
    if r.status != before:
        from .notify import notify
        author = User.objects.filter(username=r.author, is_active=True).first()
        if author and author.username != actor(request):
            notify([author], 'feature', f'Je verzoek: {dict(FeatureRequest.STATUSES)[r.status]}', r.title, '/admin/requests' if author.role == 'admin' else '/', key=f'feature:{r.id}:{r.status}')
    return request_dict(r, _names())

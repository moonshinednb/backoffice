"""Profile (with photo) and the team chat."""
import time
from django.db.models import Max, Q
from django.http import FileResponse, Http404
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from .access import body
from .models import ChatMessage, ChatRead, User
from .services import DATA, audit

router = Router()
AVATARS = DATA / 'avatars'
IMAGE = {b'\xff\xd8\xff': 'jpg', b'\x89PNG': 'png', b'RIFF': 'webp'}


def profile_dict(u):
    return {'id': u.id, 'username': u.username, 'name': u.display_name, 'role': u.role, 'active': u.is_active,
            'must_change_password': u.must_change_password, 'language': u.language, 'job_title': u.job_title,
            'phone': u.phone, 'email': u.email, 'avatar': f'/api/avatars/{u.id}?v={u.avatar}' if u.avatar else ''}


@router.patch('/profile')
def update_profile(request):
    u = request.auth
    d = body(request)
    if 'name' in d:
        name = str(d['name']).strip()[:100]
        if not name:
            raise HttpError(400, 'Vul je naam in.')
        u.first_name = name
    if 'language' in d:
        if d['language'] not in ('en', 'nl'):
            raise HttpError(400, 'Unknown language.')
        u.language = d['language']
    for key, size in (('job_title', 100), ('phone', 40), ('email', 254)):
        if key in d:
            setattr(u, key, str(d[key]).strip()[:size])
    u.save()
    return {'user': profile_dict(u)}


@router.post('/profile/avatar')
def upload_avatar(request, file: File[UploadedFile]):
    u = request.auth
    content = file.read(3 * 1024 * 1024 + 1)
    if len(content) > 3 * 1024 * 1024:
        raise HttpError(400, 'Maximaal 3 MB.')
    ext = next((e for magic, e in IMAGE.items() if content.startswith(magic)), None)
    if not ext or (ext == 'webp' and content[8:12] != b'WEBP'):
        raise HttpError(400, 'Gebruik een JPG-, PNG- of WebP-afbeelding.')
    AVATARS.mkdir(parents=True, exist_ok=True)
    old = u.avatar
    name = f'{u.id}-{int(time.time())}.{ext}'
    (AVATARS / name).write_bytes(content)
    u.avatar = name
    u.save(update_fields=['avatar'])
    if old and old != name:
        (AVATARS / old).unlink(missing_ok=True)
    return {'user': profile_dict(u)}


@router.delete('/profile/avatar')
def delete_avatar(request):
    u = request.auth
    if u.avatar:
        (AVATARS / u.avatar).unlink(missing_ok=True)
        u.avatar = ''
        u.save(update_fields=['avatar'])
    return {'user': profile_dict(u)}


@router.get('/avatars/{ident}')
def avatar(request, ident: str):
    u = User.objects.filter(id=ident).first()
    path = AVATARS / u.avatar if u and u.avatar else None
    if not path or not path.is_file():
        raise Http404()
    response = FileResponse(path.open('rb'), content_type={'jpg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}[path.suffix[1:]])
    response['Cache-Control'] = 'private, max-age=31536000, immutable'
    return response


# --- Chat ---------------------------------------------------------------------------

def _thread(me, conversation):
    if conversation == 'team':
        return ChatMessage.objects.filter(recipient__isnull=True)
    if not User.objects.filter(id=conversation, is_active=True).exists():
        raise HttpError(404, 'Gebruiker niet gevonden.')
    return ChatMessage.objects.filter(Q(sender=me, recipient_id=conversation) | Q(sender_id=conversation, recipient=me))


def _msg(m):
    return {'id': m.id, 'sender': m.sender_id, 'body': m.body, 'created': m.created.timestamp()}


@router.get('/chat')
def overview(request):
    """People, last message and unread count per conversation."""
    me = request.auth
    reads = dict(ChatRead.objects.filter(user=me).values_list('conversation', 'last_id'))
    convs = [('team', None)] + [(u.id, u) for u in User.objects.filter(is_active=True).exclude(id=me.id).order_by('first_name')]
    out = []
    for key, other in convs:
        thread = _thread(me, key)
        last = thread.order_by('-id').first()
        unread = thread.exclude(sender=me).filter(id__gt=reads.get(key, 0)).count()
        out.append({'id': key, 'name': 'Team' if key == 'team' else other.display_name,
                    'avatar': profile_dict(other)['avatar'] if other else '', 'unread': unread,
                    'last': _msg(last) if last else None})
    return {'conversations': out, 'unread': sum(c['unread'] for c in out)}


@router.get('/chat/{conversation}')
def messages(request, conversation: str, after: int = 0):
    me = request.auth
    rows = list(_thread(me, conversation).filter(id__gt=after).order_by('-id')[:200])[::-1]
    if rows:
        ChatRead.objects.update_or_create(user=me, conversation=conversation, defaults={'last_id': rows[-1].id})
    return {'messages': [_msg(m) for m in rows]}


@router.post('/chat/{conversation}')
def send(request, conversation: str):
    me = request.auth
    text = str(body(request).get('body', '')).strip()
    if not text:
        raise HttpError(400, 'Leeg bericht.')
    if len(text) > 4000:
        raise HttpError(400, 'Bericht is te lang (max. 4000 tekens).')
    _thread(me, conversation)
    m = ChatMessage.objects.create(sender=me, recipient_id=None if conversation == 'team' else conversation, body=text)
    ChatRead.objects.update_or_create(user=me, conversation=conversation, defaults={'last_id': m.id})
    return _msg(m)

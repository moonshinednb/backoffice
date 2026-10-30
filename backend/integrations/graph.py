"""Microsoft Graph: token, Outlook mail with attachments and OneDrive/SharePoint
file storage."""
import base64
import re
import threading
import time
import urllib.parse
from core.services import save_secrets, secret_values, settings
from .http import HttpError, UncertainSend, http

GRAPH = 'https://graph.microsoft.com/v1.0'
DRIVE_CHUNK = 320 * 1024 * 10   # OneDrive wants multiples of 320 KiB
MAIL_CHUNK = 3 * 1024 * 1024    # Outlook attachment ranges must stay under 4 MB
_TOKEN_LOCK = threading.Lock()
_FOLDERS = set()


def graph_token():
    with _TOKEN_LOCK:
        s = secret_values()
        cfg = settings()
        if s.get('microsoft_access_token') and s.get('microsoft_expires', 0) > time.time() + 90:
            return s['microsoft_access_token']
        if s.get('microsoft_refresh_token'):
            body = {'client_id': cfg.get('microsoft_client_id', ''), 'grant_type': 'refresh_token',
                    'refresh_token': s['microsoft_refresh_token'], 'scope': 'https://graph.microsoft.com/.default offline_access'}
            if s.get('microsoft_client_secret'):
                body['client_secret'] = s['microsoft_client_secret']
        elif s.get('microsoft_client_secret'):
            body = {'client_id': cfg.get('microsoft_client_id', ''), 'client_secret': s['microsoft_client_secret'],
                    'grant_type': 'client_credentials', 'scope': 'https://graph.microsoft.com/.default'}
        elif s.get('microsoft_access_token'):
            return s['microsoft_access_token']
        else:
            raise ValueError('Microsoft-verbinding is nog niet geconfigureerd.')
        tenant = cfg.get('microsoft_tenant', '')
        if not re.fullmatch(r'[a-zA-Z0-9.-]+', tenant or ''):
            raise ValueError('Microsoft tenant ontbreekt.')
        r = http(f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token', urllib.parse.urlencode(body).encode(),
                 {'Content-Type': 'application/x-www-form-urlencoded'})
        s['microsoft_access_token'] = r['access_token']
        s['microsoft_expires'] = time.time() + r.get('expires_in', 3600)
        if r.get('refresh_token'):
            s['microsoft_refresh_token'] = r['refresh_token']
        save_secrets(s)
        return s['microsoft_access_token']


def graph(path, payload=None, method=None, raw=False):
    if not path.startswith('/'):
        raise ValueError('Ongeldig Microsoft-pad')
    return http(GRAPH + path, payload, {'Authorization': 'Bearer ' + graph_token()}, method, raw)


def graph_pages(path):
    rows, seen = [], set()
    while path:
        if path in seen:
            raise ValueError('Herhaalde Microsoft-paginering.')
        seen.add(path)
        page = graph(path)
        rows.extend(page.get('value', []))
        following = page.get('@odata.nextLink', '')
        if following and not following.startswith(GRAPH + '/'):
            raise ValueError('Ongeldige Microsoft-paginering.')
        path = following.removeprefix(GRAPH) if following else ''
    return rows


def _upload_chunks(upload_url, content, chunk):
    """PUT one byte range at a time to a pre-authenticated upload URL. No
    Authorization header: the URL itself carries the grant."""
    total, result = len(content), {}
    for start in range(0, total, chunk):
        end = min(start + chunk, total) - 1
        result = http(upload_url, content[start:end + 1], {'Content-Range': f'bytes {start}-{end}/{total}',
                                                            'Content-Type': 'application/octet-stream'}, 'PUT')
    return result


def send_mail(sender, to, cc, subject, html, attachments):
    """Draft, attach, send. Files under 3 MB inline, larger ones through an
    upload session (up to 150 MB). Needs Mail.ReadWrite and Mail.Send on the
    sender mailbox. A failure before sending deletes the draft. A 5xx or no
    answer on the send call itself is uncertain and must not be retried
    blindly; a 4xx is a clear refusal and the draft is removed."""
    box = '/users/' + urllib.parse.quote(sender, safe='')
    message = {'subject': subject, 'body': {'contentType': 'HTML', 'content': html},
               'toRecipients': [{'emailAddress': {'address': a}} for a in to],
               'ccRecipients': [{'emailAddress': {'address': a}} for a in cc]}
    draft = graph(box + '/messages', message, 'POST')
    if not draft.get('id'):
        raise RuntimeError('Outlook gaf geen concept terug.')
    base = box + '/messages/' + urllib.parse.quote(draft['id'], safe='')
    try:
        for item in attachments:
            content = item['content']
            if len(content) < 3 * 1024 * 1024:
                graph(base + '/attachments', {'@odata.type': '#microsoft.graph.fileAttachment', 'name': item['name'],
                                              'contentType': item['mime'], 'contentBytes': base64.b64encode(content).decode()}, 'POST')
            else:
                session = graph(base + '/attachments/createUploadSession',
                                {'AttachmentItem': {'attachmentType': 'file', 'name': item['name'], 'size': len(content), 'contentType': item['mime']}}, 'POST')
                if not session.get('uploadUrl'):
                    raise RuntimeError('Outlook gaf geen uploadadres voor een bijlage.')
                _upload_chunks(session['uploadUrl'], content, MAIL_CHUNK)
    except Exception:
        try:
            graph(base, None, 'DELETE')
        except Exception:
            pass
        raise
    try:
        graph(base + '/send', b'', 'POST')
    except HttpError as e:
        if e.code >= 500:
            raise UncertainSend('Outlook gaf een serverfout tijdens het verzenden. Kijk in Verzonden items voordat je opnieuw verstuurt.') from None
        try:
            graph(base, None, 'DELETE')
        except Exception:
            pass
        raise
    except RuntimeError:
        raise UncertainSend('Outlook reageerde niet op het verzenden. Kijk in Verzonden items voordat je opnieuw verstuurt.') from None
    return 'accepted'


def _drive_base():
    drive = settings().get('onedrive_drive_id', '')
    if not drive:
        raise ValueError('Stel eerst de OneDrive-drive-ID in.')
    return GRAPH + '/drives/' + urllib.parse.quote(drive, safe='')


def _drive_token():
    return {'Authorization': 'Bearer ' + graph_token()}


def _ensure_folder(path):
    """Create each missing folder level once; known paths are cached."""
    path = path.strip('/')
    if not path or path in _FOLDERS:
        return
    parent, _, name = path.rpartition('/')
    _ensure_folder(parent)
    drive = _drive_base()
    try:
        http(drive + '/root:/' + urllib.parse.quote(path, safe='/'), None, _drive_token())
    except HttpError as e:
        if e.code != 404:
            raise
        url = drive + ('/root:/' + urllib.parse.quote(parent, safe='/') + ':/children' if parent else '/root/children')
        try:
            http(url, {'name': name, 'folder': {}, '@microsoft.graph.conflictBehavior': 'fail'},
                 {**_drive_token(), 'Content-Type': 'application/json'}, 'POST')
        except HttpError as conflict:
            if conflict.code != 409:
                raise
    _FOLDERS.add(path)


def drive_upload(path, content, mime):
    """Store a file at an exact path in the configured drive (OneDrive or a
    SharePoint library); replaces a file with the same name. Folders are
    created as needed. Returns (item id, web URL)."""
    drive = _drive_base()
    _ensure_folder(path.rpartition('/')[0])
    target = drive + '/root:/' + urllib.parse.quote(path, safe='/') + ':'
    if len(content) <= 4 * 1024 * 1024:
        item = http(target + '/content', content, {**_drive_token(), 'Content-Type': mime or 'application/octet-stream'}, 'PUT')
    else:
        session = http(target + '/createUploadSession', {'item': {'@microsoft.graph.conflictBehavior': 'replace'}}, _drive_token(), 'POST')
        if not session.get('uploadUrl'):
            raise RuntimeError('OneDrive gaf geen uploadadres.')
        item = _upload_chunks(session['uploadUrl'], content, DRIVE_CHUNK)
    return str(item.get('id', '')), str(item.get('webUrl', ''))

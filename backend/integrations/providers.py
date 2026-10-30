"""LabelGrid (read-only royalty statements), OpenSign (contracts) and
Microsoft To Do (shared tasks)."""
import json
import urllib.error
import urllib.parse
import urllib.request
from core.models import Task
from core.services import audit, secret_values, settings
from production.models import Contract, LabelStatement
from .graph import graph, graph_pages
from .http import NoCredentialRedirect, http, secure_url


def labelgrid_http(path, token):
    if not token:
        raise ValueError('LabelGrid API-sleutel ontbreekt.')
    if not path.startswith('/'):
        raise ValueError('Ongeldig LabelGrid-pad')
    req = urllib.request.Request('https://api.labelgrid.com/api/public' + path,
                                 headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json', 'User-Agent': 'MoonshineBackoffice/2.0'})
    try:
        with urllib.request.build_opener(NoCredentialRedirect()).open(req, timeout=60) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError:
        raise RuntimeError('LabelGrid gaf een fout; controleer sleutel en rechten.') from None
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError('LabelGrid is niet bereikbaar.') from None


def labelgrid_pull():
    """Read-only pull of royalty statements. Never posts or pays."""
    data = labelgrid_http('/statements', secret_values().get('labelgrid_api_key', ''))
    rows = data.get('data', data if isinstance(data, list) else [])
    added = 0
    for s in rows if isinstance(rows, list) else []:
        number = str(s.get('invoice_number') or s.get('invoice') or '')
        if not number:
            continue
        _, created = LabelStatement.objects.get_or_create(invoice_number=number, defaults={
            'period': str(s.get('period', '')), 'status': str(s.get('status', '')), 'currency': str(s.get('currency', 'USD')),
            'gross_usd': float(s.get('gross_usd') or 0), 'fee_usd': float(s.get('labelgrid_fee') or 0),
            'total_due_usd': float(s.get('total_due_usd') or 0), 'raw': s})
        added += created
    audit('LabelGrid', 'Statements opgehaald', detail=str(added))
    return {'added': added}


def opensign_http(path, payload=None, method=None):
    token = secret_values().get('opensign_api_key', '')
    if not token:
        raise ValueError('OpenSign API-sleutel ontbreekt.')
    base = settings().get('opensign_base') or 'https://eu-app.opensignlabs.com/api/v1.2'
    secure_url(base)
    return http(base.rstrip('/') + path, payload, {'x-api-token': token}, method)


def opensign_create(title, signers, actor):
    if not title.strip():
        raise ValueError('Geef het contract een titel.')
    clean = [{'name': str(s.get('name', ''))[:200], 'email': str(s.get('email', '')).strip()} for s in signers or []]
    clean = [s for s in clean if s['name'] and '@' in s['email']]
    if not clean:
        raise ValueError('Voeg minimaal één ondertekenaar met e-mail toe.')
    template = settings().get('opensign_template_id', '')
    path = '/createdocument/' + urllib.parse.quote(template, safe='') if template else '/draftdocument'
    result = opensign_http(path, {'title': title, 'signers': clean}, 'POST')
    contract = Contract.objects.create(title=title, opensign_id=str(result.get('id') or result.get('objectId') or ''), status='sent', signers=clean)
    audit(actor, 'Contract verstuurd', contract.id, title)
    return contract


def opensign_refresh(contract):
    if not contract.opensign_id:
        return contract
    try:
        remote = opensign_http('/document/' + urllib.parse.quote(contract.opensign_id, safe=''))
    except Exception:
        return contract
    contract.status = str(remote.get('status') or remote.get('signingStatus') or contract.status)[:40]
    contract.save(update_fields=['status', 'updated'])
    return contract


def sync_todo():
    """Push local task changes to one To Do list, then pull remote state."""
    cfg = settings()
    if not cfg.get('todo_enabled'):
        return
    if not cfg.get('todo_list_id'):
        raise ValueError('Microsoft To Do-lijst ontbreekt.')
    base = '/me/todo/lists/' + urllib.parse.quote(cfg['todo_list_id'], safe='') + '/tasks'
    local = list(Task.objects.all())
    recovery = graph_pages(base + '?$top=100') if any(not t.graph_id for t in local) else []
    for t in local:
        marker = '[moonshine:' + t.id + ']'
        payload = {'title': t.title, 'status': 'completed' if t.done else 'notStarted', 'importance': 'high' if t.priority == 'high' else 'normal',
                   'body': {'content': t.description if marker in t.description else (t.description + '\n' + marker).strip(), 'contentType': 'text'},
                   'dueDateTime': {'dateTime': t.due.isoformat() + 'T12:00:00', 'timeZone': 'Europe/Amsterdam'} if t.due else None}
        if not t.graph_id:
            remote = next((r for r in recovery if marker in r.get('body', {}).get('content', '')), None)
            result = remote or graph(base, payload, 'POST')
            Task.objects.filter(id=t.id).update(graph_id=result['id'], dirty=False)
        elif t.dirty:
            graph(base + '/' + urllib.parse.quote(t.graph_id, safe=''), payload, 'PATCH')
            Task.objects.filter(id=t.id).update(dirty=False)
    for r in graph_pages(base + '?$top=100'):
        values = {'title': r.get('title', 'Taak')[:300], 'description': r.get('body', {}).get('content', ''),
                  'due': (r.get('dueDateTime') or {}).get('dateTime', '')[:10] or None,
                  'priority': 'high' if r.get('importance') == 'high' else 'normal', 'done': r.get('status') == 'completed'}
        if not Task.objects.filter(graph_id=r['id'], dirty=False).update(**values) and not Task.objects.filter(graph_id=r['id']).exists():
            Task.objects.create(graph_id=r['id'], **values)

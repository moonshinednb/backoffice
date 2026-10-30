"""Webhooks: bank feed (bearer secret), Outlook notifications (clientState)
and OpenSign (HMAC). These are the only unauthenticated write endpoints."""
import hashlib
import hmac
import json
import secrets
from django.http import HttpResponse
from ninja import Router
from ninja.errors import HttpError
from .services import audit, secret_values

router = Router(auth=None)


@router.post('/bank')
def bank(request):
    from finance.services import insert_transactions, transaction_values
    secret = secret_values().get('bank_webhook_secret', '')
    if not secret or not secrets.compare_digest(request.headers.get('Authorization', ''), 'Bearer ' + secret):
        raise HttpError(401, 'Ongeldige webhook-sleutel.')
    d = json.loads(request.body or b'{}')
    source = d.get('source', 'ING')
    if source not in ('ING', 'SumUp'):
        raise HttpError(400, 'Onbekende bankbron.')
    rows = d.get('transactions', [])
    if not isinstance(rows, list) or len(rows) > 1000:
        raise HttpError(400, 'Maximaal 1000 transacties per webhook.')
    added = insert_transactions([transaction_values(x, source) for x in rows])
    audit(source, 'Bank-webhook ontvangen', detail=str(added))
    return {'added': added}


@router.post('/outlook')
def outlook(request):
    from jobs.queue import enqueue
    token = request.GET.get('validationToken')
    if token:
        return HttpResponse(token, content_type='text/plain; charset=utf-8')
    notifications = json.loads(request.body or b'{}').get('value', [])
    state = secret_values().get('mail_webhook_secret', '')
    if not state or not notifications or any(not secrets.compare_digest(str(n.get('clientState', '')), state) for n in notifications):
        raise HttpError(401, 'Ongeldige notificatie.')
    from jobs.models import Schedule
    Schedule.objects.filter(name='Outlook-facturen').update(last_run=None)
    return {'accepted': True}


@router.post('/opensign')
def opensign(request):
    from production.models import Contract
    secret = secret_values().get('opensign_webhook_secret', '')
    raw = request.body
    if secret:
        expect = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
        if not secrets.compare_digest(request.headers.get('x-webhook-signature', ''), expect):
            raise HttpError(401, 'Ongeldige handtekening.')
    try:
        d = json.loads(raw)
    except ValueError:
        raise HttpError(400, 'Ongeldige invoer.') from None
    doc_id = str((d.get('document') or {}).get('id') or d.get('documentId') or '')
    status = str(d.get('status') or d.get('event') or '')[:40]
    if doc_id and status:
        Contract.objects.filter(opensign_id=doc_id).update(status=status)
        audit('OpenSign', 'Contractstatus bijgewerkt', doc_id, status)
    return {'accepted': True}

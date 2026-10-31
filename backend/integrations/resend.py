"""Transactional email through Resend (password reset)."""
from core.services import secret_values, settings
from .http import http


def send_email(to, subject, html, text):
    key = secret_values().get('resend_api_key')
    sender = settings().get('resend_from')
    if not key or not sender:
        raise ValueError('Resend is nog niet ingesteld.')
    return http('https://api.resend.com/emails', {'from': sender, 'to': [to], 'subject': subject, 'html': html, 'text': text},
                headers={'Authorization': 'Bearer ' + key})


def check():
    """A send-only key cannot list domains; that still counts as a working key."""
    import json
    import urllib.error
    import urllib.request
    key = secret_values().get('resend_api_key')
    if not key:
        raise ValueError('Resend API-sleutel ontbreekt.')
    req = urllib.request.Request('https://api.resend.com/domains', headers={'Authorization': 'Bearer ' + key, 'User-Agent': 'MoonshineBackoffice/2.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            names = [f"{d.get('name')} ({d.get('status')})" for d in json.loads(r.read() or b'{}').get('data', [])]
    except urllib.error.HTTPError as e:
        detail = json.loads(e.read() or b'{}')
        if e.code == 401 and detail.get('name') == 'restricted_api_key':
            names = None
        else:
            raise ValueError('Resend weigert deze sleutel.')
    if not settings().get('resend_from'):
        raise ValueError('De sleutel werkt, maar vul nog het afzenderadres in (bijv. Moonshine <noreply@moonshinednb.nl>).')
    if names is None:
        return {'message': 'Resend-sleutel werkt (alleen versturen; domeinen niet zichtbaar met dit soort sleutel)'}
    return {'message': 'Resend-account geverifieerd', 'data': {'domains': names}}

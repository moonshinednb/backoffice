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
    key = secret_values().get('resend_api_key')
    if not key:
        raise ValueError('Resend API-sleutel ontbreekt.')
    if not settings().get('resend_from'):
        raise ValueError('Vul het afzenderadres in.')
    domains = http('https://api.resend.com/domains', headers={'Authorization': 'Bearer ' + key})
    names = [f"{d.get('name')} ({d.get('status')})" for d in (domains or {}).get('data', [])]
    return {'message': 'Resend-account geverifieerd', 'data': {'domains': names}}

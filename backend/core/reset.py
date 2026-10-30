"""Password reset by email (Resend). The request endpoint answers the same
whether or not the account exists, so it cannot be used to find usernames."""
import hashlib
import html
import logging
import secrets
from datetime import timedelta
from django.contrib.sessions.models import Session
from django.db import transaction
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from .access import body
from .models import PasswordReset, User
from .services import audit, settings

router = Router()
log = logging.getLogger(__name__)
VALID = timedelta(minutes=30)
DONE = {'ok': True, 'message': 'Als dit account een e-mailadres heeft, is er een herstellink verstuurd. Kijk ook in je spam.'}


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


@router.post('/auth/forgot', auth=None)
def forgot(request):
    login = str(body(request).get('login', '')).strip().lower()[:254]
    if not login:
        raise HttpError(400, 'Vul je gebruikersnaam of e-mailadres in.')
    user = User.objects.filter(is_active=True).filter(username=login).first() or User.objects.filter(is_active=True, email__iexact=login).first()
    if not user or not user.email:
        return DONE
    recent = PasswordReset.objects.filter(user=user, created__gte=timezone.now() - timedelta(hours=1)).count()
    if recent >= 3:
        return DONE
    token = secrets.token_urlsafe(32)
    PasswordReset.objects.create(token_hash=digest(token), user=user, expires=timezone.now() + VALID)
    base = (settings().get('public_url') or request.build_absolute_uri('/')).rstrip('/')
    link = f'{base}/reset-password?token={token}'
    name = html.escape(user.display_name)
    try:
        from integrations.resend import send_email
        send_email(user.email, 'Nieuw wachtwoord voor Moonshine',
                   f'<p>Hoi {name},</p><p>Klik op de link om een nieuw wachtwoord te kiezen. De link werkt 30 minuten en één keer.</p>'
                   f'<p><a href="{html.escape(link)}">Nieuw wachtwoord kiezen</a></p>'
                   '<p>Open de link op een apparaat waar Tailscale aan staat. Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>',
                   f'Hoi {user.display_name},\n\nKies een nieuw wachtwoord via deze link (30 minuten geldig, één keer te gebruiken):\n{link}\n\n'
                   'Open de link op een apparaat waar Tailscale aan staat. Niet aangevraagd? Negeer deze mail.')
        audit(user.username, 'Herstellink verstuurd')
    except Exception as error:  # never reveal to the requester whether sending worked
        log.warning('Password reset mail failed: %s', error)
        audit('systeem', 'Herstellink niet verstuurd', user.username, str(error)[:200])
    return DONE


@router.post('/auth/reset', auth=None)
def reset(request):
    d = body(request)
    token, password = str(d.get('token', '')), d.get('password')
    if not isinstance(password, str) or not 8 <= len(password) <= 1024:
        raise HttpError(400, 'Nieuw wachtwoord moet 8 tot 1024 tekens zijn.')
    with transaction.atomic():
        r = PasswordReset.objects.select_for_update().filter(token_hash=digest(token)).select_related('user').first()
        if not r or r.used or r.expires < timezone.now() or not r.user.is_active:
            raise HttpError(400, 'Deze herstellink is verlopen of al gebruikt. Vraag een nieuwe aan.')
        user = r.user
        user.set_password(password)
        user.must_change_password = False
        user.save()
        PasswordReset.objects.filter(user=user, used=False).update(used=True)
    for s in Session.objects.all():
        if s.get_decoded().get('_auth_user_id') == user.id:
            s.delete()
    audit(user.username, 'Wachtwoord hersteld via e-mail')
    return {'ok': True}

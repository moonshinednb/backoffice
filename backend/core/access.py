"""Request helpers: JSON body and role checks."""
import json
from ninja.errors import HttpError


def body(request):
    try:
        data = json.loads(request.body or b'{}')
    except (ValueError, UnicodeDecodeError):
        raise HttpError(400, 'Ongeldige invoer.') from None
    if not isinstance(data, dict):
        raise HttpError(400, 'Ongeldige invoer.')
    return data


def require(request, area=None, write=False):
    """area: None, 'admin', 'finance' or 'production'."""
    user = request.auth
    if area == 'admin' and user.role != 'admin':
        raise HttpError(403, 'Alleen beheerders hebben toegang.')
    if area == 'finance' and not user.can_finance:
        raise HttpError(403, 'Je hebt geen toegang tot financiën.')
    if area == 'production' and not user.can_production:
        raise HttpError(403, 'Je hebt geen toegang tot productie.')
    if write and not user.can_write:
        raise HttpError(403, 'Je hebt alleen leesrechten.')
    if write and user.must_change_password:
        raise HttpError(403, 'Kies eerst een eigen wachtwoord.')
    return user


def actor(request):
    return request.auth.username

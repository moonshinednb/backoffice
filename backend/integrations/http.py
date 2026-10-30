"""Outbound HTTPS for every provider. Errors never carry response bodies,
which may contain credentials; redirects are refused so a key is never sent
to another host."""
import json
import urllib.error
import urllib.parse
import urllib.request


class HttpError(RuntimeError):
    """An HTTP error status from a provider. `code` lets callers tell a 404
    or 409 apart from a real failure."""
    def __init__(self, code):
        super().__init__(f'Externe dienst gaf HTTP {code}; controleer rechten en configuratie.')
        self.code = code


class UncertainSend(RuntimeError):
    """The send call got no clear answer: Outlook may or may not have sent it."""


class NoCredentialRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('De externe dienst verwijst door. Configureer de definitieve HTTPS-URL.')


def secure_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError('Gebruik een HTTPS-URL zonder gebruikersgegevens of fragment.')
    return url


def http(url, payload=None, headers=None, method=None, raw=False):
    secure_url(url)
    headers = {'User-Agent': 'MoonshineBackoffice/2.0', **(headers or {})}
    body = None
    if isinstance(payload, dict):
        body = json.dumps(payload).encode()
        headers.setdefault('Content-Type', 'application/json')
    elif payload is not None:
        body = payload
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.build_opener(NoCredentialRedirect()).open(request, timeout=60) as response:
            data = response.read()
            return data if raw else (json.loads(data) if data else {})
    except urllib.error.HTTPError as e:
        raise HttpError(e.code) from None
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError('Externe dienst is niet bereikbaar.') from None

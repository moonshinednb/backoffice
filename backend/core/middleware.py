"""Strict browser security headers on every response."""

CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; worker-src 'self'")


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if not request.path.startswith('/django-admin/'):
            response.setdefault('Content-Security-Policy', CSP)
        response.setdefault('Referrer-Policy', 'same-origin')
        response.setdefault('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store'
        return response

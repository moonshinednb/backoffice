"""Serves the built React app: hashed assets cached for a year, everything
else revalidated, and index.html for client-side routes."""
import mimetypes
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse

mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('text/javascript', '.js')


def spa(request, path=''):
    if request.method not in ('GET', 'HEAD') or path.startswith('api/'):
        raise Http404()
    root = settings.FRONTEND_DIST
    target = (root / path).resolve() if path else root / 'index.html'
    if not str(target).startswith(str(root)) or not target.is_file():
        if '.' in path.rsplit('/', 1)[-1]:
            raise Http404()
        target = root / 'index.html'
    if not target.is_file():
        return HttpResponse('Frontend is nog niet gebouwd: draai `npm run build` in frontend/.', status=503, content_type='text/plain; charset=utf-8')
    response = FileResponse(target.open('rb'), content_type=mimetypes.guess_type(target.name)[0] or 'application/octet-stream')
    hashed = path.startswith('static/')
    response['Cache-Control'] = 'public, max-age=31536000, immutable' if hashed else 'no-cache'
    return response

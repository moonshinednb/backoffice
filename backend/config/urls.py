"""API under /api, Django admin under /django-admin, the React app for everything else."""
from django.contrib import admin
from django.urls import path, re_path
from .api import api
from django.http import JsonResponse
from .spa import spa


def api_missing(request, rest=''):
    return JsonResponse({'error': 'Onbekend adres. Ververs de pagina om de nieuwste versie te laden.'}, status=404)


def csrf_failure(request, reason=''):
    return JsonResponse({'error': 'Je sessie is verlopen of de pagina is verouderd. Ververs de pagina en probeer opnieuw.'}, status=403)

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', api.urls),
    re_path(r'^api/(?P<rest>.*)$', api_missing),
    re_path(r'^(?P<path>.*)$', spa),
]

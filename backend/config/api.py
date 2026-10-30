"""The Moonshine API (Django Ninja). Session cookie + CSRF header for every
write; roles decide what each endpoint allows. OpenAPI at /api/openapi.json
feeds the TypeScript types of the React app."""
import json
from django.http import HttpResponse
from ninja import NinjaAPI
from ninja.errors import AuthenticationError, HttpError
from ninja.security import django_auth
from core.services import safe_error
from core.views import router as core_router
from finance.views import router as finance_router
from production.views import router as production_router
from core.webhooks import router as webhook_router

api = NinjaAPI(title='Moonshine Backoffice', version='2.0', auth=django_auth, urls_namespace='api')


@api.exception_handler(ValueError)
def value_error(request, exc):
    return api.create_response(request, {'error': safe_error(exc)}, status=400)


@api.exception_handler(RuntimeError)
def runtime_error(request, exc):
    return api.create_response(request, {'error': safe_error(exc)}, status=400)


@api.exception_handler(HttpError)
def http_error(request, exc):
    return api.create_response(request, {'error': str(exc)}, status=exc.status_code)


@api.exception_handler(AuthenticationError)
def auth_error(request, exc):
    return api.create_response(request, {'error': 'Log in om verder te gaan.'}, status=401)


@api.exception_handler(Exception)
def unexpected(request, exc):
    import logging
    logging.getLogger('moonshine').exception('API-fout')
    return api.create_response(request, {'error': 'Deze handeling is niet gelukt. Je gegevens blijven bewaard.'}, status=500)


api.add_router('/', core_router)
api.add_router('/', finance_router)
api.add_router('/', production_router)
api.add_router('/webhooks', webhook_router)

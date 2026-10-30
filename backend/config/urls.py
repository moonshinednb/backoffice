"""API under /api, Django admin under /admin, the React app for everything else."""
from django.contrib import admin
from django.urls import path, re_path
from .api import api
from .spa import spa

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    re_path(r'^(?P<path>.*)$', spa),
]

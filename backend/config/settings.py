"""Moonshine backoffice settings.

Configuration comes from the environment so the same image runs in
development (SQLite, DEBUG) and production (PostgreSQL behind Tailscale).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BASE_DIR.parent
DATA_DIR = Path(os.environ.get('MOONSHINE_DATA', REPO_DIR / 'data')).resolve()
FRONTEND_DIST = Path(os.environ.get('MOONSHINE_FRONTEND', REPO_DIR / 'frontend' / 'dist')).resolve()


def env_bool(name, default=False):
    return os.environ.get(name, '1' if default else '0').lower() in ('1', 'true', 'yes', 'on')


DEBUG = env_bool('DJANGO_DEBUG')
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    # A stable key per installation, created once in the data directory.
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    key_file = DATA_DIR / 'django-secret.key'
    if not key_file.exists():
        import secrets
        key_file.touch(mode=0o600)
        key_file.write_text(secrets.token_urlsafe(64))
    SECRET_KEY = key_file.read_text().strip()

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',') if h.strip()]
CSRF_TRUSTED_ORIGINS = [o.strip() for o in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()]

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'core',
    'finance',
    'production',
    'jobs',
    'promo',
    'feedback',
    'meetings',
]

MIDDLEWARE = [
    'core.middleware.SecurityHeadersMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

if os.environ.get('DATABASE_URL', '').startswith('postgres'):
    from urllib.parse import urlsplit, unquote
    url = urlsplit(os.environ['DATABASE_URL'])
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': url.path.lstrip('/'), 'USER': unquote(url.username or ''), 'PASSWORD': unquote(url.password or ''),
        'HOST': url.hostname or 'localhost', 'PORT': url.port or 5432, 'CONN_MAX_AGE': 60,
    }}
else:
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('SQLITE_PATH', str(DATA_DIR / 'moonshine.db')),
        'OPTIONS': {'timeout': 30, 'init_command': 'PRAGMA journal_mode=WAL;'},
    }}

AUTH_USER_MODEL = 'core.User'
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.ScryptPasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'core.hashers.LegacyScryptHasher',
]
AUTH_PASSWORD_VALIDATORS = [{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}}]

SESSION_COOKIE_NAME = 'moonshine_session'
SESSION_COOKIE_AGE = 12 * 3600
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_SECURE = env_bool('MOONSHINE_SECURE_COOKIE')
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
CSRF_COOKIE_SAMESITE = 'Strict'
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
DATA_UPLOAD_MAX_MEMORY_SIZE = 22 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 22 * 1024 * 1024

LANGUAGE_CODE = 'nl'
TIME_ZONE = 'Europe/Amsterdam'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/django-static/'
STATIC_ROOT = DATA_DIR / 'django-static'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {'django.request': {'level': 'ERROR'}},
}

CSRF_FAILURE_VIEW = 'config.urls.csrf_failure'

"""Settings, server-only secrets, audit and safe error messages."""
import json
import os
import re
from pathlib import Path
from django.conf import settings as django_settings
from .models import AuditLog, Setting, uid  # noqa: F401  (uid re-exported)

DATA = Path(django_settings.DATA_DIR)
for folder in ('files', 'assets'):
    (DATA / folder).mkdir(parents=True, exist_ok=True)
    if os.name != 'nt':
        try:
            (DATA / folder).chmod(0o700)
        except OSError:
            pass


def settings():
    return {s.key: s.value for s in Setting.objects.all()}


def set_setting(key, value):
    Setting.objects.update_or_create(key=key, defaults={'value': value})


def secret_values():
    path = DATA / 'secrets.json'
    return json.loads(path.read_text('utf-8')) if path.exists() else {}


def save_secrets(values):
    path = DATA / 'secrets.json'
    tmp = DATA / ('secrets-' + uid() + '.tmp')
    tmp.touch(mode=0o600)
    tmp.write_text(json.dumps(values, ensure_ascii=False), 'utf-8')
    tmp.replace(path)
    try:
        path.chmod(0o600)
    except OSError:
        pass


def safe_error(message):
    """Errors may originate in provider responses. Never persist or return keys."""
    text = str(message)
    for value in secret_values().values():
        if isinstance(value, str) and value:
            text = text.replace(value, '[afgeschermd]')
    text = re.sub(r'(?i)(bearer\s+)[^\s,;]+', r'\1[afgeschermd]', text)
    return text[:2000]


def audit(actor, action, entity='', detail=''):
    AuditLog.objects.create(actor=str(actor)[:150], action=action[:200], entity=str(entity or '')[:100], detail=safe_error(detail))

"""Login, users, tasks, settings, connections, audit and the dashboard."""
import re
import secrets
import time
from datetime import date
from urllib.parse import urlsplit
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.db import transaction
from django.middleware.csrf import get_token
from ninja import Router
from ninja.errors import HttpError
from .access import actor, body, require
from .models import AuditLog, LoginAttempt, Task, User
from .services import audit, save_secrets, secret_values, set_setting, settings

router = Router()

SETTING_KEYS = {
    'finance_email', 'company_name', 'odoo_url', 'odoo_database', 'odoo_username', 'odoo_expense_account', 'odoo_purchase_journal',
    'odoo_bank_journal', 'odoo_bank_account', 'odoo_tax_map', 'odoo_sales_journal', 'odoo_sales_account', 'odoo_sumup_clearing_account',
    'odoo_fee_account', 'odoo_output_tax_map', 'auto_post', 'auto_match', 'auto_sumup', 'anthropic_model', 'microsoft_client_id',
    'microsoft_tenant', 'mail_enabled', 'onedrive_enabled', 'onedrive_drive_id', 'onedrive_folder', 'todo_enabled', 'todo_list_id',
    'bank_mode', 'odoo_bank_feed', 'labelgrid_label_id', 'opensign_base', 'opensign_template_id', 'advancing_sender',
    'production_folder', 'production_sync',
}
SECRET_KEYS = {'odoo_api_key', 'anthropic_api_key', 'microsoft_client_secret', 'microsoft_access_token', 'microsoft_refresh_token',
               'bank_webhook_secret', 'mail_webhook_secret', 'labelgrid_api_key', 'opensign_api_key', 'opensign_webhook_secret'}
BOOLEANS = ('auto_post', 'auto_match', 'auto_sumup', 'mail_enabled', 'onedrive_enabled', 'todo_enabled', 'odoo_bank_feed', 'production_sync')


def user_dict(u):
    return {'id': u.id, 'username': u.username, 'name': u.display_name, 'role': u.role, 'active': u.is_active,
            'must_change_password': u.must_change_password}


def check_origin(request):
    origin = request.headers.get('Origin')
    if origin and urlsplit(origin).netloc != request.get_host():
        raise HttpError(403, 'Verzoek van een andere website geweigerd.')


# --- Login -------------------------------------------------------------------

@router.post('/auth/login', auth=None)
def do_login(request):
    check_origin(request)
    d = body(request)
    username, password = d.get('username'), d.get('password')
    if not isinstance(username, str) or not isinstance(password, str) or len(username) > 100 or len(password) > 1024:
        raise HttpError(400, 'Ongeldige inloggegevens.')
    ip, now = request.META.get('REMOTE_ADDR', ''), time.time()
    attempt = LoginAttempt.objects.filter(ip=ip).first()
    if attempt and attempt.count >= 8 and attempt.until > now:
        raise HttpError(429, 'Te veel pogingen. Probeer het over 15 minuten opnieuw.')
    user = authenticate(request, username=username.strip().lower(), password=password)
    if not user or not user.is_active:
        count = (attempt.count if attempt and attempt.until > now else 0) + 1
        LoginAttempt.objects.update_or_create(ip=ip, defaults={'count': count, 'until': now + 900})
        raise HttpError(401, 'Gebruikersnaam of wachtwoord klopt niet.')
    LoginAttempt.objects.filter(ip=ip).delete()
    login(request, user)
    audit(user.username, 'Ingelogd')
    return {'user': user_dict(user), 'csrf': get_token(request)}


@router.get('/auth/me', auth=None)
def me(request):
    csrf = get_token(request)
    if not request.user.is_authenticated:
        return {'user': None, 'csrf': csrf}
    return {'user': user_dict(request.user), 'csrf': csrf}


@router.post('/auth/logout')
def do_logout(request):
    logout(request)
    return {'ok': True}


@router.post('/auth/password')
def change_password(request):
    d = body(request)
    user = request.auth
    if not user.check_password(str(d.get('current', ''))):
        raise HttpError(400, 'Huidig wachtwoord klopt niet.')
    new = d.get('password')
    if not isinstance(new, str) or not 8 <= len(new) <= 1024:
        raise HttpError(400, 'Nieuw wachtwoord moet 8 tot 1024 tekens zijn.')
    if new == d.get('current'):
        raise HttpError(400, 'Kies een ander wachtwoord dan het huidige.')
    user.set_password(new)
    user.must_change_password = False
    user.save()
    update_session_auth_hash(request, user)
    audit(user.username, 'Wachtwoord gewijzigd')
    return {'ok': True, 'user': user_dict(user)}


# --- Users ---------------------------------------------------------------------

@router.get('/users')
def list_users(request):
    return {'users': [user_dict(u) for u in User.objects.order_by('date_joined')]}


@router.post('/users')
def create_user(request):
    require(request, 'admin', write=True)
    d = body(request)
    username = str(d.get('username', '')).strip().lower()
    password = str(d.get('password', ''))
    if not re.fullmatch(r'[a-z0-9._-]{3,40}', username):
        raise HttpError(400, 'Gebruikersnaam: 3–40 letters, cijfers, punt, _ of -.')
    if not 8 <= len(password) <= 1024:
        raise HttpError(400, 'Gebruik een wachtwoord van 8 tot 1024 tekens.')
    if d.get('role') not in dict(User.ROLES):
        raise HttpError(400, 'Ongeldige rol.')
    if User.objects.filter(username=username).exists():
        raise HttpError(400, 'Deze gebruikersnaam bestaat al.')
    user = User(username=username, first_name=str(d.get('name') or username)[:100], role=d['role'], must_change_password=True)
    user.set_password(password)
    user.save()
    audit(actor(request), 'Gebruiker toegevoegd', username)
    return user_dict(user)


@router.patch('/users/{ident}')
def update_user(request, ident: str):
    require(request, 'admin', write=True)
    d = body(request)
    if ident == request.auth.id and ('active' in d or 'role' in d):
        raise HttpError(400, 'Je eigen beheerdersaccount kan niet worden gedeactiveerd of afgewaardeerd.')
    with transaction.atomic():
        user = User.objects.select_for_update().filter(id=ident).first()
        if not user:
            raise HttpError(404, 'Gebruiker niet gevonden.')
        if 'active' in d:
            if type(d['active']) is not bool:
                raise HttpError(400, 'Ongeldige accountstatus.')
            user.is_active = d['active']
        if 'role' in d:
            if d['role'] not in dict(User.ROLES):
                raise HttpError(400, 'Ongeldige rol.')
            user.role = d['role']
        if 'name' in d:
            user.first_name = str(d['name'])[:100]
        if d.get('password'):
            if not isinstance(d['password'], str) or not 8 <= len(d['password']) <= 1024:
                raise HttpError(400, 'Wachtwoord moet 8 tot 1024 tekens zijn.')
            user.set_password(d['password'])
            user.must_change_password = True
        user.save()
        if not User.objects.filter(is_active=True, role='admin').exists():
            raise HttpError(400, 'Minimaal één actieve beheerder is vereist.')
    from django.contrib.sessions.models import Session
    if 'active' in d or 'role' in d or d.get('password'):
        for s in Session.objects.all():
            if s.get_decoded().get('_auth_user_id') == user.id:
                s.delete()
    audit(actor(request), 'Gebruiker gewijzigd', user.username)
    return user_dict(user)


# --- Tasks -------------------------------------------------------------------------

def task_dict(t):
    return {'id': t.id, 'title': t.title, 'description': t.description, 'assignee': t.assignee_id, 'due': t.due.isoformat() if t.due else None,
            'priority': t.priority, 'done': t.done, 'created': t.created.timestamp()}


def _task_fields(d, task):
    title = str(d.get('title', '')).strip()[:300]
    if not title:
        raise HttpError(400, 'Vul een taaknaam in.')
    task.title = title
    task.description = str(d.get('description', ''))[:3000]
    task.due = date.fromisoformat(d['due']) if d.get('due') else None
    assignee = d.get('assignee') or None
    if assignee and not User.objects.filter(id=assignee, is_active=True).exists():
        raise HttpError(400, 'Kies een actieve gebruiker.')
    task.assignee_id = assignee
    task.priority = 'high' if d.get('priority') == 'high' else 'normal'


@router.get('/tasks')
def list_tasks(request):
    return {'tasks': [task_dict(t) for t in Task.objects.all()[:1000]]}


@router.post('/tasks')
def create_task(request):
    require(request, write=True)
    task = Task(dirty=True)
    _task_fields(body(request), task)
    task.save()
    audit(actor(request), 'Taak aangemaakt', task.id)
    return task_dict(task)


@router.patch('/tasks/{ident}')
def update_task(request, ident: str):
    require(request, write=True)
    d = body(request)
    task = Task.objects.filter(id=ident).first()
    if not task:
        raise HttpError(404, 'Taak niet gevonden.')
    if 'done' in d:
        if type(d['done']) is not bool:
            raise HttpError(400, 'Ongeldige taakstatus.')
        task.done = d['done']
    if 'title' in d:
        _task_fields(d, task)
    task.dirty = True
    task.save()
    audit(actor(request), ('Taak afgerond' if task.done else 'Taak heropend') if 'done' in d else 'Taak gewijzigd', ident)
    return task_dict(task)


# --- Settings and connections --------------------------------------------------------

@router.get('/settings')
def get_settings(request):
    require(request, 'admin')
    return {'settings': {k: v for k, v in settings().items() if k in SETTING_KEYS or k == 'connection_checks'},
            'configured_secrets': [k for k, v in secret_values().items() if v and k in SECRET_KEYS]}


@router.post('/settings')
def save_settings(request):
    require(request, 'admin', write=True)
    from integrations.http import secure_url
    from production import rules as R
    d = body(request)
    cfg, sv = d.get('settings', {}), d.get('secrets', {})
    if not isinstance(cfg, dict) or not isinstance(sv, dict):
        raise HttpError(400, 'Ongeldige instellingen.')
    if any(k not in SETTING_KEYS for k in cfg) or any(k not in SECRET_KEYS for k in sv):
        raise HttpError(400, 'Onbekende instelling.')
    if cfg.get('odoo_url'):
        secure_url(cfg['odoo_url'])
    if cfg.get('advancing_sender'):
        R._email(cfg['advancing_sender'], 'Verzendadres advancing')
    if 'production_folder' in cfg:
        cfg['production_folder'] = '/'.join(R.safe_name(p, '') for p in str(cfg['production_folder']).split('/') if R.safe_name(p, ''))[:300]
    for k in BOOLEANS:
        if k in cfg and type(cfg[k]) is not bool:
            raise HttpError(400, 'Ongeldige schakelaarinstelling.')
    if any(v is not None and (not isinstance(v, str) or len(v) > 16384) for v in sv.values()):
        raise HttpError(400, 'Ongeldige sleutel.')
    for key in ('odoo_tax_map', 'odoo_output_tax_map'):
        if key in cfg and (not isinstance(cfg[key], dict) or any(type(v) is not int or v <= 0 for v in cfg[key].values())):
            raise HttpError(400, 'Btw-mapping moet positieve Odoo-ID’s bevatten.')
    old = secret_values()
    for k, v in sv.items():
        if v is None:
            old.pop(k, None)
        elif v.strip():
            old[k] = v.strip()
    if 'microsoft_refresh_token' in sv or 'microsoft_client_secret' in sv:
        old['microsoft_expires'] = 0
    for k in ('bank_webhook_secret', 'mail_webhook_secret'):
        old.setdefault(k, secrets.token_urlsafe(40))
    save_secrets(old)
    for k, v in cfg.items():
        set_setting(k, v)
    set_setting('connection_checks', {})
    audit(actor(request), 'Koppelinstellingen opgeslagen')
    return {'ok': True}


def connections():
    cfg, sv = settings(), secret_values()
    microsoft = bool(sv.get('microsoft_refresh_token') or sv.get('microsoft_access_token') or sv.get('microsoft_client_secret'))
    providers = [
        ('odoo', 'Odoo', bool(cfg.get('odoo_url') and cfg.get('odoo_database') and sv.get('odoo_api_key'))),
        ('claude', 'Claude', bool(cfg.get('anthropic_model') and sv.get('anthropic_api_key'))),
        ('microsoft', 'Outlook', microsoft),
        ('advancing', 'Advancing', bool(cfg.get('advancing_sender') and microsoft)),
        ('onedrive', 'OneDrive', bool(cfg.get('onedrive_drive_id'))),
        ('todo', 'Microsoft To Do', bool(cfg.get('todo_list_id'))),
        ('labelgrid', 'LabelGrid', bool(sv.get('labelgrid_api_key'))),
        ('opensign', 'OpenSign', bool(sv.get('opensign_api_key'))),
        ('ing', 'ING', True),
        ('sumup', 'SumUp', True),
    ]
    checks = cfg.get('connection_checks') or {}
    return [{'id': k, 'name': name, 'status': 'verified' if checks.get(k, {}).get('ok') and configured else 'configured' if configured else 'not_connected',
             'checked': checks.get(k, {}).get('checked'), 'mode': 'CSV / webhook' if k in ('ing', 'sumup') else None} for k, name, configured in providers]


@router.get('/connections')
def list_connections(request):
    return {'connections': connections()}


@router.post('/connections/test')
def test_connection(request):
    require(request, 'admin', write=True)
    from integrations.checks import test_connection as run
    provider = body(request).get('provider')
    result = run(provider)
    checks = settings().get('connection_checks') or {}
    checks[provider] = {'checked': time.time(), 'ok': True}
    set_setting('connection_checks', checks)
    audit(actor(request), 'Koppeling gecontroleerd', provider)
    return result


@router.get('/audit')
def audit_log(request):
    require(request, 'admin')
    return {'audit': [{'id': a.id, 'created': a.created.timestamp(), 'actor': a.actor, 'action': a.action, 'entity': a.entity, 'detail': a.detail}
                      for a in AuditLog.objects.all()[:200]]}


@router.get('/dashboard')
def dashboard(request):
    from finance.models import Document
    from jobs.models import Job, Schedule
    from production.services import event_listing
    user = request.auth
    today = date.today().isoformat()
    upcoming = sorted(event_listing(lambda e: not e.date or e.date >= today), key=lambda e: e['date'] or '9999')[:4] if user.can_production else []
    cfg = settings()
    data = {'upcoming_events': upcoming, 'company': cfg.get('company_name') or 'Moonshine', 'finance_email': cfg.get('finance_email') or '',
            'tasks_open': Task.objects.filter(done=False).count(), 'connections': connections(),
            'jobs': {'queued': Job.objects.filter(status='queued').count(), 'failed': Job.objects.filter(status='failed').count()},
            'schedules': [{'name': s.name, 'last_ok': s.last_ok.timestamp() if s.last_ok else None, 'failures': s.failures, 'error': s.last_error}
                          for s in Schedule.objects.all()]}
    if user.can_finance:
        docs = Document.objects.all()
        data['finance'] = {'documents': docs.count(), 'posted': docs.filter(status='posted').count(),
                           'review': docs.filter(status='review').count(), 'pending': docs.exclude(status='posted').count(),
                           'total': sum((d.get('total') or 0) for d in docs.values_list('details', flat=True) if isinstance(d, dict))}
    if user.role == 'admin':
        data['admin'] = {
            'users': [{**user_dict(u), 'last_login': u.last_login.timestamp() if u.last_login else None} for u in User.objects.order_by('date_joined')],
            'audit': [{'id': a.id, 'created': a.created.timestamp(), 'actor': a.actor, 'action': a.action} for a in AuditLog.objects.all()[:5]],
            'failed_jobs': [{'id': j.id, 'kind': j.kind, 'error': j.last_error, 'attempts': j.attempts} for j in Job.objects.filter(status='failed').order_by('-created')[:5]],
        }
    return data

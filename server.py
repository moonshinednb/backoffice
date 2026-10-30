#!/usr/bin/env python3
"""Moonshine Backoffice: dependency-free private server for Python 3.10+."""
import os, json, time, secrets, hashlib, threading, signal, argparse, getpass, csv, io, re, mimetypes, urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from http.cookies import SimpleCookie
from email.parser import BytesParser
from email.policy import default
from pathlib import Path

def _install_sigterm():
    """systemd sends SIGTERM, not KeyboardInterrupt. Without this the
    daemon worker is killed mid-Odoo-post with no chance to release its
    claim, leaving documents stuck in 'processing' forever."""
    def handler(signum,frame):
        raise SystemExit(0)
    try:signal.signal(signal.SIGTERM,handler)
    except (ValueError,OSError,AttributeError):pass
_install_sigterm()

ROOT=Path(__file__).resolve().parent
if (ROOT/'.env').exists():
    for line in (ROOT/'.env').read_text('utf-8').splitlines():
        if line.strip() and not line.startswith('#') and '=' in line:
            key,value=line.split('=',1);os.environ.setdefault(key.strip(),value.strip().strip('"').strip("'"))
from store import db, init, uid, encode, hash_password, check_password, audit, settings, secret_values, save_secrets, document, ingest, DATA, safe_error
from accounting import cents, validate_invoice, suggest_matches, vat_report
from integrations import LOCK, worker, process_document, post_document, unlink_document, test_connection, Odoo, secure_url, push_event, pull_event
import events as events_module

SETTING_KEYS={'finance_email','company_name','odoo_url','odoo_database','odoo_username','odoo_expense_account','odoo_purchase_journal','odoo_bank_journal','odoo_bank_account','odoo_tax_map','odoo_sales_journal','odoo_sales_account','odoo_sumup_clearing_account','odoo_fee_account','odoo_output_tax_map','auto_post','auto_match','auto_sumup','anthropic_model','microsoft_client_id','microsoft_tenant','mail_enabled','onedrive_enabled','onedrive_drive_id','onedrive_folder','todo_enabled','todo_list_id'}
SETTING_KEYS.update({'bank_mode','odoo_bank_feed'})
SETTING_KEYS.update({'calendar_enabled','calendar_id','promo_sender','promo_sending','labelgrid_label_id','opensign_base','opensign_template_id'})
SECRET_KEYS={'odoo_api_key','anthropic_api_key','microsoft_client_secret','microsoft_access_token','microsoft_refresh_token','bank_webhook_secret','mail_webhook_secret'}
SECRET_KEYS.update({'labelgrid_api_key','opensign_api_key','opensign_webhook_secret'})
MAX_BODY=22*1024*1024

class ApiError(Exception):
    def __init__(self,message,status=400):self.message=message;self.status=status

class Handler(BaseHTTPRequestHandler):
    server_version='Moonshine'
    def setup(self):
        super().setup()
        self.connection.settimeout(20)
    def log_message(self,format,*args):
        # Do not log request bodies, cookies, URL queries or passwords.
        print(f'{self.client_address[0]} {self.command} {urllib.parse.urlsplit(self.path).path} {args[1] if len(args)>1 else ""}',flush=True)
    def cache_policy(self,name):
        """Vendored libs and fonts are versioned by URL path and never change
        in place, so they get a long immutable cache. Everything else is
        revalidated with an ETag. Previously every asset was sent as
        `no-cache` with no validator, which browsers treat as "no-store":
        the full 1.15 MB was re-downloaded on every single page load."""
        if name.startswith('vendor/') or name.startswith('fonts/'):return 'public, max-age=31536000, immutable'
        return 'no-cache'
    def etag_for(self,body):
        return '"'+hashlib.sha256(body).hexdigest()[:20]+'"'
    def send(self,status=200,data=None,body=None,mime='application/json',headers=None,cache=None):
        if body is None:body=encode(data if data is not None else {}).encode()
        if self.path.startswith('/api'):policy='no-store'
        elif cache:policy=cache
        else:policy='no-cache'
        # Decide 304 before any status line is written. send_response() already
        # emits one, so the check cannot live after it.
        tag=self.etag_for(body) if policy!='no-store' else None
        if tag and self.headers.get('If-None-Match')==tag:
            self.send_response(304)
            self.send_header('ETag',tag)
            self.send_header('Cache-Control',policy)
            self.send_header('X-Content-Type-Options','nosniff')
            self.end_headers()
            return
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control',policy)
        if tag:self.send_header('ETag',tag)
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Referrer-Policy','same-origin')
        self.send_header('Permissions-Policy','camera=(), microphone=(), geolocation=()')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        for key,value in (headers or {}).items():self.send_header(key,value)
        self.end_headers();self.wfile.write(body)
    def json_body(self):
        try:
            body=json.loads(self.read_body())
            if not isinstance(body,dict):raise ValueError()
            return body
        except (ValueError,UnicodeDecodeError):raise ApiError('Ongeldige invoer.')
    def read_body(self):
        if self.headers.get('Transfer-Encoding'):raise ApiError('Ongeldige verzoekcodering.',400)
        try:n=int(self.headers.get('Content-Length','0'))
        except ValueError:raise ApiError('Ongeldige bestandsgrootte.')
        if n<0 or n>MAX_BODY:raise ApiError('Bestand is te groot. Maximaal 15 MB per factuur.',413)
        if urllib.parse.urlsplit(self.path).path in ('/api/login','/api/password','/api/users') and n>16384:raise ApiError('Te veel invoer.',413)
        return self.rfile.read(n)
    def session(self,write=False,role=None):
        cookie=SimpleCookie()
        try:cookie.load(self.headers.get('Cookie',''))
        except Exception:raise ApiError('Log opnieuw in.',401)
        token=cookie.get('moonshine_session')
        if not token:raise ApiError('Log in om verder te gaan.',401)
        digest=hashlib.sha256(token.value.encode()).hexdigest()
        with db() as c:r=c.execute('SELECT u.id,u.username,u.name,u.role,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>? AND u.active=1',(digest,time.time())).fetchone()
        if not r:raise ApiError('Je sessie is verlopen. Log opnieuw in.',401)
        user=dict(r)
        if write:
            self.check_origin()
            if not secrets.compare_digest(self.headers.get('X-CSRF-Token',''),user['csrf']):raise ApiError('Vernieuw de pagina en probeer opnieuw.',403)
            if user['role']=='viewer' and urllib.parse.urlsplit(self.path).path not in ('/api/logout','/api/password'):raise ApiError('Je hebt alleen leesrechten.',403)
        if role=='admin' and user['role']!='admin':raise ApiError('Alleen beheerders hebben toegang.',403)
        return user
    def check_origin(self):
        origin=self.headers.get('Origin')
        if origin and urllib.parse.urlsplit(origin).netloc!=self.headers.get('Host',''):raise ApiError('Verzoek van een andere website geweigerd.',403)
    def do_GET(self):self.handle_request('GET')
    def do_POST(self):self.handle_request('POST')
    def do_PATCH(self):self.handle_request('PATCH')
    def do_PUT(self):self.handle_request('PUT')
    def do_DELETE(self):self.handle_request('DELETE')
    def do_HEAD(self):self.handle_request('GET')
    def handle_request(self,method):
        try:self.route(method)
        except ApiError as e:self.send(e.status,{'error':e.message})
        except (ValueError,RuntimeError) as e:self.send(400,{'error':safe_error(e)})
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception:
            # No traceback or exception payload: providers may embed credentials.
            print('Moonshine: onverwachte fout tijdens verzoekverwerking',flush=True)
            self.send(500,{'error':'Deze handeling is niet gelukt. Je gegevens blijven bewaard.'})
    def route(self,method):
        url=urllib.parse.urlsplit(self.path);path=url.path;query=urllib.parse.parse_qs(url.query)
        if path=='/api/health' and method=='GET':return self.send(data={'ok':True,'service':'moonshine'})
        if path=='/api/login' and method=='POST':return self.login()
        if path.startswith('/api/webhooks/'):
            return self.webhook(path,method)
        if not path.startswith('/api/'):
            if method!='GET':raise ApiError('Niet gevonden.',404)
            name=path.lstrip('/') or 'index.html'
            target=(ROOT/'public'/name).resolve()
            if not target.is_relative_to((ROOT/'public').resolve()) or not target.is_file():raise ApiError('Niet gevonden.',404)
            mime=mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
            if mime.startswith('text/') or mime=='application/javascript':mime+='; charset=utf-8'
            return self.send(body=target.read_bytes(),mime=mime,cache=self.cache_policy(name))
        user=self.session(write=method!='GET')
        actor=user['username']
        if path=='/api/me' and method=='GET':
            # Same response shape as login: boot must recover CSRF after reload.
            csrf=user.pop('csrf')
            return self.send(data={'user':user,'csrf':csrf})
        if path=='/api/logout' and method=='POST':
            cookie=SimpleCookie(self.headers.get('Cookie',''));token=cookie.get('moonshine_session')
            with db() as c:c.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(token.value.encode()).hexdigest(),))
            return self.send(headers={'Set-Cookie':'moonshine_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'})
        if path=='/api/state' and method=='GET':
            # Every table was previously materialised in full on every poll,
            # and suggest_matches() ran O(transactions x documents) with a
            # regex inside the inner loop - on a 20 second timer, per tab.
            # Both are now bounded and independently paged.
            limit=min(2000,max(1,int((query.get('limit') or ['400'])[0])))
            offset=max(0,int((query.get('offset') or ['0'])[0]))
            with db() as c:
                total_documents=c.execute('SELECT COUNT(*) FROM documents').fetchone()[0]
                docs=[document(r) for r in c.execute('SELECT * FROM documents ORDER BY created DESC LIMIT ? OFFSET ?',(limit,offset))]
                tasks=[dict(r) for r in c.execute('SELECT * FROM tasks ORDER BY done,due,created DESC LIMIT ?',(limit,))]
                transactions=[dict(r) for r in c.execute('SELECT * FROM transactions WHERE status=? ORDER BY date DESC,created DESC LIMIT ?',('open',limit))]
                users=[dict(r) for r in c.execute('SELECT id,username,name,role,active FROM users ORDER BY created')]
                history=[dict(r) for r in c.execute('SELECT id,created,actor,action,entity,detail FROM audit ORDER BY id DESC LIMIT 80')]
                # Match only within the page actually being sent. The full
                # ledger scan belongs on the bank endpoint, not the poll.
                match_pool=[document(r) for r in c.execute("SELECT * FROM documents WHERE status='posted' ORDER BY created DESC LIMIT ?",(limit,))]
                calendar=[dict(r) for r in c.execute('SELECT * FROM calendar_events ORDER BY start LIMIT 200')]
                campaigns=[dict(r) for r in c.execute('SELECT * FROM promo_campaigns ORDER BY created DESC LIMIT 50')]
                promo_counts={r['status']:r['n'] for r in c.execute('SELECT status,COUNT(*) n FROM promo_recipients GROUP BY status')}
                statements=[dict(r) for r in c.execute('SELECT id,invoice_number,period,status,currency,gross_usd,fee_usd,total_due_usd,created FROM label_statements ORDER BY created DESC LIMIT 100')]
                contracts=[dict(r) for r in c.execute('SELECT * FROM contracts ORDER BY created DESC LIMIT 100')]
                releases=[dict(r) for r in c.execute('SELECT * FROM releases ORDER BY release_date DESC,created DESC LIMIT 200')]
            cfg=settings();sv=secret_values()
            connections=self.connections(cfg,sv)
            return self.send(data={'documents':docs,'tasks':tasks,'transactions':transactions,'users':users,'audit':history,'matches':suggest_matches(transactions,match_pool),'connections':connections,'company':cfg.get('company_name','Moonshine'),'finance_email':cfg.get('finance_email','finance@moonshinednb.nl'),'paging':{'documents':{'limit':limit,'offset':offset,'total':total_documents}},'calendar':calendar,'promo_campaigns':campaigns,'promo_counts':promo_counts,'label_statements':statements,'contracts':contracts,'releases':releases})
        if path=='/api/odoo/overview' and method=='GET':
            from integrations import odoo_overview
            return self.send(data=odoo_overview())
        if path=='/api/settings':
            self.session(role='admin')
            if method=='GET':return self.send(data={'settings':{k:v for k,v in settings().items() if k in SETTING_KEYS or k=='connection_checks'},'configured_secrets':[k for k,v in secret_values().items() if v and k in SECRET_KEYS]})
            if method=='POST':
                data=self.json_body()
                cfg=data.get('settings',{});sv=data.get('secrets',{})
                if not isinstance(cfg,dict) or not isinstance(sv,dict):raise ApiError('Ongeldige instellingen.')
                if any(k not in SETTING_KEYS for k in cfg) or any(k not in SECRET_KEYS for k in sv):raise ApiError('Onbekende instelling.')
                if cfg.get('odoo_url'):secure_url(cfg['odoo_url'])
                for k in ('auto_post','auto_match','auto_sumup','mail_enabled','onedrive_enabled','todo_enabled','odoo_bank_feed','calendar_enabled','promo_sending'):
                    if k in cfg and type(cfg[k]) is not bool:raise ApiError('Ongeldige schakelaarinstelling.')
                if any(v is not None and (not isinstance(v,str) or len(v)>16384) for v in sv.values()):raise ApiError('Ongeldige sleutel.')
                for key in ('odoo_tax_map','odoo_output_tax_map'):
                    if key in cfg and (not isinstance(cfg[key],dict) or any(type(v) is not int or v<=0 for v in cfg[key].values())):raise ApiError('Btw-mapping moet positieve Odoo-ID’s bevatten.')
                with LOCK:
                    old=secret_values()
                    for k,v in sv.items():
                        if v is None:old.pop(k,None)
                        elif isinstance(v,str) and v.strip():old[k]=v.strip()
                    if 'microsoft_refresh_token' in sv or 'microsoft_client_secret' in sv:old['microsoft_expires']=0
                    if not old.get('bank_webhook_secret'):old['bank_webhook_secret']=secrets.token_urlsafe(40)
                    if not old.get('mail_webhook_secret'):old['mail_webhook_secret']=secrets.token_urlsafe(40)
                    save_secrets(old)
                    with db() as c:
                        for k,v in cfg.items():c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',(k,encode(v)))
                        # Saving a changed configuration invalidates previous test results.
                        c.execute('DELETE FROM settings WHERE key=?',('connection_checks',))
                audit(actor,'Koppelinstellingen opgeslagen');return self.send(data={'ok':True})
        if path=='/api/connections/test' and method=='POST':
            self.session(role='admin');provider=self.json_body().get('provider')
            result=test_connection(provider)
            with LOCK:
                checks=settings().get('connection_checks',{});checks[provider]={'checked':time.time(),'ok':True}
                with db() as c:c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',('connection_checks',encode(checks)))
            audit(actor,'Koppeling gecontroleerd',provider);return self.send(data=result)
        if path=='/api/upload' and method=='POST':return self.upload(actor)
        match=re.fullmatch('/api/documents/([a-f0-9]{24})(?:/(file|retry|post|unlink))?',path)
        if match:
            ident,action=match.groups()
            with db() as c:r=c.execute('SELECT * FROM documents WHERE id=?',(ident,)).fetchone()
            if not r:raise ApiError('Factuur niet gevonden.',404)
            if action=='file' and method=='GET':return self.send(body=(DATA/'files'/ident).read_bytes(),mime=r['mime'],headers={'Content-Disposition':"attachment; filename*=UTF-8''"+urllib.parse.quote(r['name'])})
            if action=='retry' and method=='POST':
                if r['status']=='processing':raise ApiError('Deze factuur wordt al verwerkt.')
                threading.Thread(target=process_document,args=(ident,True),daemon=True).start();return self.send(data={'ok':True})
            if action=='post' and method=='POST':return self.send(data={'ok':True,'odoo_id':post_document(ident,actor)})
            if action=='unlink' and method=='POST':return self.send(data={'ok':unlink_document(ident,actor)})
            if not action and method=='PATCH':
                d=self.json_body().get('details')
                if not isinstance(d,dict):raise ApiError('Ongeldige factuurgegevens.')
                with LOCK:
                    with db() as c:
                        fresh=c.execute('SELECT status,odoo_id FROM documents WHERE id=?',(ident,)).fetchone()
                        if fresh['status'] in ('posted','processing') or fresh['odoo_id']:raise ApiError('Deze factuur is al in verwerking of gekoppeld aan Odoo. Corrigeer de bestaande Odoo-boeking.')
                        errors=validate_invoice(d)
                        c.execute("UPDATE documents SET details=?,status='review',error=?,updated=? WHERE id=?",(encode(d),'; '.join(errors) or None,time.time(),ident))
                audit(actor,'Factuur gecontroleerd',ident);return self.send(data={'ok':True,'warnings':errors})
        if path=='/api/tasks' and method=='POST':
            d=self.json_body();title=str(d.get('title','')).strip()[:300]
            if not title:raise ApiError('Vul een taaknaam in.')
            due=d.get('due') or None
            if due:
                from datetime import date;date.fromisoformat(due)
            ident=uid()
            with db() as c:
                if d.get('assignee') and not c.execute('SELECT 1 FROM users WHERE id=? AND active=1',(d['assignee'],)).fetchone():raise ApiError('Kies een actieve gebruiker.')
                c.execute('INSERT INTO tasks(id,title,description,assignee,due,priority,created) VALUES(?,?,?,?,?,?,?)',(ident,title,str(d.get('description',''))[:3000],d.get('assignee') or None,due,'high' if d.get('priority')=='high' else 'normal',time.time()))
            audit(actor,'Taak aangemaakt',ident);return self.send(data={'id':ident})
        match=re.fullmatch('/api/tasks/([a-f0-9]{24})',path)
        if match and method=='PATCH':
            ident=match[1];d=self.json_body()
            with LOCK:
                with db() as c:
                    if not c.execute('SELECT id FROM tasks WHERE id=?',(ident,)).fetchone():raise ApiError('Taak niet gevonden.',404)
                    if 'done' in d:
                        if type(d['done']) is not bool:raise ApiError('Ongeldige taakstatus.')
                        c.execute('UPDATE tasks SET done=? WHERE id=?',(int(d['done']),ident))
                    elif 'title' not in d:raise ApiError('Geen taakwijziging ontvangen.')
                    if 'title' in d:
                        title=str(d['title']).strip()[:300]
                        if not title:raise ApiError('Vul een taaknaam in.')
                        due=d.get('due') or None
                        if due:
                            from datetime import date;date.fromisoformat(due)
                        assignee=d.get('assignee') or None
                        if assignee and not c.execute('SELECT 1 FROM users WHERE id=? AND active=1',(assignee,)).fetchone():raise ApiError('Kies een actieve gebruiker.')
                        c.execute('UPDATE tasks SET title=?,description=?,assignee=?,due=?,priority=? WHERE id=?',(title,str(d.get('description',''))[:3000],assignee,due,'high' if d.get('priority')=='high' else 'normal',ident))
                    dirty=settings().get('todo_dirty',{});dirty[ident]=True
                    c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',('todo_dirty',encode(dirty)))
            audit(actor,('Taak afgerond' if d['done'] else 'Taak heropend') if 'done' in d else 'Taak gewijzigd',ident);return self.send(data={'ok':True})
        if path=='/api/users' and method=='POST':
            self.session(role='admin');d=self.json_body();username=str(d.get('username','')).strip().lower();password=str(d.get('password',''))
            if not re.fullmatch(r'[a-z0-9._-]{3,40}',username):raise ApiError('Gebruikersnaam: 3–40 letters, cijfers, punt, _ of -.')
            if not 8<=len(password)<=1024:raise ApiError('Gebruik een wachtwoord van 8 tot 1024 tekens.')
            if d.get('role') not in ('admin','finance','viewer'):raise ApiError('Ongeldige rol.')
            with db() as c:
                if c.execute('SELECT 1 FROM users WHERE username=?',(username,)).fetchone():raise ApiError('Deze gebruikersnaam bestaat al.')
                c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(uid(),username,str(d.get('name') or username)[:100],d['role'],hash_password(password),1,time.time()))
            audit(actor,'Gebruiker toegevoegd',username);return self.send(data={'ok':True})
        match=re.fullmatch('/api/users/([a-f0-9]{24})',path)
        if match and method=='PATCH':
            self.session(role='admin');ident=match[1];d=self.json_body()
            if ident==user['id'] and ('active' in d or 'role' in d):raise ApiError('Je eigen beheerdersaccount kan niet worden gedeactiveerd of afgewaardeerd.')
            with db() as c:
                c.execute('BEGIN IMMEDIATE')
                if not c.execute('SELECT id FROM users WHERE id=?',(ident,)).fetchone():raise ApiError('Gebruiker niet gevonden.',404)
                if 'active' in d and type(d['active']) is not bool:raise ApiError('Ongeldige accountstatus.')
                if 'active' in d:c.execute('UPDATE users SET active=? WHERE id=?',(int(bool(d['active'])),ident))
                if 'role' in d:
                    if d['role'] not in ('admin','finance','viewer'):raise ApiError('Ongeldige rol.')
                    c.execute('UPDATE users SET role=? WHERE id=?',(d['role'],ident))
                if d.get('password'):
                    if not isinstance(d['password'],str) or not 8<=len(d['password'])<=1024:raise ApiError('Wachtwoord moet 8 tot 1024 tekens zijn.')
                    c.execute('UPDATE users SET password_hash=? WHERE id=?',(hash_password(d['password']),ident))
                if not c.execute("SELECT 1 FROM users WHERE active=1 AND role='admin'").fetchone():raise ApiError('Minimaal één actieve beheerder is vereist.')
                c.execute('DELETE FROM sessions WHERE user_id=?',(ident,))
            audit(actor,'Gebruiker gewijzigd',ident);return self.send(data={'ok':True})
        if path=='/api/password' and method=='POST':
            d=self.json_body()
            with db() as c:
                r=c.execute('SELECT password_hash FROM users WHERE id=?',(user['id'],)).fetchone()
                if not check_password(str(d.get('current','')),r['password_hash']):raise ApiError('Huidig wachtwoord klopt niet.')
                if not isinstance(d.get('password'),str) or not 8<=len(d['password'])<=1024:raise ApiError('Nieuw wachtwoord moet 8 tot 1024 tekens zijn.')
                c.execute('UPDATE users SET password_hash=? WHERE id=?',(hash_password(d['password']),user['id']))
                c.execute('DELETE FROM sessions WHERE user_id=?',(user['id'],))
            audit(actor,'Wachtwoord gewijzigd');return self.send(data={'ok':True})
        if path=='/api/transactions/import' and method=='POST':return self.import_csv(actor)
        if path=='/api/sumup/settle' and method=='POST':
            from integrations import settle_sumup
            ident=self.json_body().get('transaction_id');settle_sumup(ident,actor)
            return self.send(data={'ok':True})
        if path=='/api/transactions/match' and method=='POST':
            d=self.json_body()
            with LOCK:
                with db() as c:
                    t=c.execute('SELECT * FROM transactions WHERE id=?',(d.get('transaction_id'),)).fetchone();doc=c.execute('SELECT * FROM documents WHERE id=?',(d.get('document_id'),)).fetchone()
                    if not t or not doc or t['status']!='open' or doc['status']!='posted':raise ApiError('Selecteer een open transactie en een geboekte factuur.')
                    if t['amount']>=0 or abs(t['amount'])!=document(doc)['details'].get('total'):raise ApiError('Bedragen sluiten niet aan.')
                    if c.execute("SELECT id FROM transactions WHERE document_id=? AND status='matched'",(doc['id'],)).fetchone():raise ApiError('Factuur is al afgeletterd.')
                odoo_id=Odoo().reconcile(dict(t),document(doc))
                with db() as c:c.execute("UPDATE transactions SET status='matched',document_id=?,odoo_id=? WHERE id=?",(doc['id'],odoo_id,t['id']))
            audit(actor,'Banktransactie afgeletterd in Odoo',t['id']);return self.send(data={'ok':True})
        match=re.fullmatch('/api/transactions/([a-f0-9]{24})',path)
        if match and method=='PATCH':
            d=self.json_body()
            if d.get('category') not in ('sales','settlement','fee','unknown'):raise ApiError('Ongeldige categorie.')
            rate=d.get('vat_rate')
            if rate not in (None,0,9,21):raise ApiError('Ongeldig btw-tarief.')
            with db() as c:
                c.execute('BEGIN IMMEDIATE')
                current=c.execute('SELECT status,odoo_id FROM transactions WHERE id=?',(match[1],)).fetchone()
                if not current:raise ApiError('Transactie niet gevonden.',404)
                if current['status']!='open' or current['odoo_id']:raise ApiError('Een geboekte of afgeletterde transactie kan niet worden gewijzigd.')
                c.execute('UPDATE transactions SET category=?,vat_rate=? WHERE id=?',(d['category'],rate,match[1]))
                if 'payout_id' in d:c.execute('UPDATE transactions SET payout_id=? WHERE id=?',(str(d['payout_id']).strip()[:200],match[1]))
            audit(actor,'Transactie geclassificeerd',match[1]);return self.send(data={'ok':True})
        if path=='/api/vat' and method=='GET':
            from datetime import date
            today=date.today();year=int(query.get('year',[today.year])[0]);quarter=int(query.get('quarter',[(today.month-1)//3+1])[0])
            if quarter not in (1,2,3,4) or not 2000<=year<=2100:raise ApiError('Ongeldig kwartaal.')
            with db() as c:docs=[document(r) for r in c.execute('SELECT * FROM documents')];tx=[dict(r) for r in c.execute('SELECT * FROM transactions')]
            return self.send(data=vat_report(docs,tx,year,quarter))
        if path=='/api/export' and method=='GET':
            stream=io.StringIO();w=csv.writer(stream,delimiter=';');w.writerow(['id','bestand','crediteur','factuurnummer','datum','totaal_eur','status','odoo_id'])
            with db() as c:
                for r in c.execute('SELECT * FROM documents ORDER BY created'):
                    d=document(r);i=d['details'];values=[d['id'],d['name'],i.get('supplier',''),i.get('number',''),i.get('date',''),f"{i.get('total',0)/100:.2f}",d['status'],d['odoo_id'] or '']
                    w.writerow(["'"+str(v) if str(v).startswith(('=','+','-','@','\t','\r')) else v for v in values])
            return self.send(body=('\ufeff'+stream.getvalue()).encode(),mime='text/csv; charset=utf-8',headers={'Content-Disposition':'attachment; filename="moonshine-facturen.csv"'})

        # --- Calendar ----------------------------------------------------
        if path=='/api/calendar' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM calendar_events ORDER BY start LIMIT 500')]
            return self.send(data={'events':rows})
        match=re.fullmatch('/api/events/([a-f0-9]{24})/calendar',path)
        if match and method=='POST':
            from integrations import push_event_to_calendar
            return self.send(data=push_event_to_calendar(match[1]))

        # --- Promo mail (Graph sendMail, queue-based) ----------------------
        if path=='/api/promo/contacts' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM promo_contacts ORDER BY created DESC LIMIT 2000')]
            return self.send(data={'contacts':rows})
        if path=='/api/promo/contacts' and method=='POST':
            d=self.json_body();email=str(d.get('email','')).strip().lower()[:320]
            if '@' not in email or len(email)<5:raise ApiError('Vul een geldig e-mailadres in.')
            with db() as c:
                c.execute('INSERT OR IGNORE INTO promo_contacts(id,name,email,tag,source,handle,created) VALUES(?,?,?,?,?,?,?)',(uid(),str(d.get('name',''))[:200],email,str(d.get('tag',''))[:100],str(d.get('source',''))[:100],str(d.get('handle',''))[:100],time.time()))
            audit(actor,'Promocontact toegevoegd',email);return self.send(data={'ok':True})
        if path=='/api/promo/import' and method=='POST':
            d=self.json_body();rows=d.get('rows',[])
            if not isinstance(rows,list) or len(rows)>5000:raise ApiError('Maximaal 5000 contacten per import.')
            added=0
            with db() as c:
                for r in rows:
                    if not isinstance(r,dict):continue
                    email=str(r.get('email') or r.get('Email') or '').strip().lower()[:320]
                    if '@' not in email:continue
                    c.execute('INSERT OR IGNORE INTO promo_contacts(id,name,email,tag,source,handle,created) VALUES(?,?,?,?,?,?,?)',(uid(),str(r.get('name') or r.get('Name') or '')[:200],email,str(r.get('tag') or r.get('Tag') or '')[:100],str(r.get('source') or r.get('Source') or 'import')[:100],str(r.get('handle') or r.get('Handle') or '')[:100],time.time()))
                    added+=c.execute('SELECT changes()').fetchone()[0]
            audit(actor,'Promolijst geïmporteerd',detail=str(added));return self.send(data={'added':added})
        if path=='/api/promo/templates' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM promo_templates ORDER BY created DESC')]
            return self.send(data={'templates':rows})
        if path=='/api/promo/templates' and method=='POST':
            d=self.json_body();name=str(d.get('name','')).strip()[:200]
            if not name:raise ApiError('Geef de template een naam.')
            ident=uid()
            with db() as c:c.execute('INSERT INTO promo_templates(id,name,subject,body,created) VALUES(?,?,?,?,?)',(ident,name,str(d.get('subject',''))[:400],str(d.get('body',''))[:20000],time.time()))
            return self.send(data={'id':ident})
        if path=='/api/promo/campaigns' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM promo_campaigns ORDER BY created DESC LIMIT 100')]
            return self.send(data={'campaigns':rows})
        if path=='/api/promo/campaigns' and method=='POST':
            d=self.json_body();name=str(d.get('name','')).strip()[:200]
            if not name:raise ApiError('Geef de campagne een naam.')
            ident=uid()
            with db() as c:c.execute('INSERT INTO promo_campaigns(id,name,subject,body,sender,status,created) VALUES(?,?,?,?,?,?,?)',(ident,name,str(d.get('subject',''))[:400],str(d.get('body',''))[:20000],str(d.get('sender',''))[:320],'draft',time.time()))
            audit(actor,'Promocampagne aangemaakt',ident);return self.send(data={'id':ident})
        match=re.fullmatch('/api/promo/campaigns/([a-f0-9]{24})(?:/(recipients|send|stop|preview))?',path)
        if match:
            ident,action=match.groups()
            with db() as c:row=c.execute('SELECT * FROM promo_campaigns WHERE id=?',(ident,)).fetchone()
            if not row:raise ApiError('Campagne niet gevonden.',404)
            if not action and method=='GET':
                with db() as c:recips=[dict(r) for r in c.execute('SELECT r.*,c.email,c.name FROM promo_recipients r JOIN promo_contacts c ON c.id=r.contact_id WHERE r.campaign_id=? ORDER BY r.sent',(ident,))]
                return self.send(data={'campaign':dict(row),'recipients':recips})
            if action=='recipients' and method=='POST':
                contact_ids=self.json_body().get('contact_ids',[])
                if not isinstance(contact_ids,list) or len(contact_ids)>5000:raise ApiError('Ongeldige ontvangerslijst.')
                with db() as c:
                    for cid in contact_ids:
                        if not isinstance(cid,str):continue
                        if not c.execute('SELECT 1 FROM promo_contacts WHERE id=? AND unsubscribed=0',(cid,)).fetchone():continue
                        c.execute('INSERT OR IGNORE INTO promo_recipients(id,campaign_id,contact_id) VALUES(?,?,?)',(uid(),ident,cid))
                return self.send(data={'ok':True})
            if action=='preview' and method=='GET':
                email=(query.get('email') or [''])[0]
                with db() as c:contact=c.execute('SELECT * FROM promo_contacts WHERE email=?',(email.strip().lower(),)).fetchone()
                body=dict(row)['body']
                if contact:body=body.replace('{{Naam}}',contact['name'] or '').replace('{{Email}}',contact['email'])
                return self.send(data={'subject':dict(row)['subject'],'body':body})
            if action=='send' and method=='POST':
                with db() as c:
                    n=c.execute("SELECT COUNT(*) FROM promo_recipients WHERE campaign_id=? AND status='queued'",(ident,)).fetchone()[0]
                    if not n:raise ApiError('Voeg eerst ontvangers toe.')
                    c.execute("UPDATE promo_campaigns SET status='sending',sent=? WHERE id=?",(time.time(),ident))
                audit(actor,'Promocampagne gestart',ident,str(n));return self.send(data={'ok':True,'queued':n})
            if action=='stop' and method=='POST':
                with db() as c:c.execute("UPDATE promo_campaigns SET status='stopped' WHERE id=?",(ident,))
                audit(actor,'Promocampagne gestopt',ident);return self.send(data={'ok':True})

        # --- LabelGrid statements (read-only pull) -------------------------
        if path=='/api/label/statements' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT id,invoice_number,period,status,currency,gross_usd,fee_usd,total_due_usd,created FROM label_statements ORDER BY created DESC LIMIT 200')]
            return self.send(data={'statements':rows})
        if path=='/api/label/pull' and method=='POST':
            from integrations import labelgrid_pull
            return self.send(data=labelgrid_pull())

        # --- OpenSign contracts --------------------------------------------
        if path=='/api/contracts' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM contracts ORDER BY created DESC LIMIT 200')]
            return self.send(data={'contracts':rows})
        if path=='/api/contracts' and method=='POST':
            from integrations import opensign_create
            d=self.json_body()
            return self.send(data=opensign_create(str(d.get('title','')),d.get('signers',[])))
        match=re.fullmatch('/api/contracts/([a-f0-9]{24})/refresh',path)
        if match and method=='POST':
            from integrations import opensign_refresh
            return self.send(data=opensign_refresh(match[1]))

        # --- Releases --------------------------------------------------------
        if path=='/api/releases' and method=='GET':
            with db() as c:rows=[dict(r) for r in c.execute('SELECT * FROM releases ORDER BY release_date DESC,created DESC LIMIT 200')]
            return self.send(data={'releases':rows})
        if path=='/api/releases' and method=='POST':
            d=self.json_body();title=str(d.get('title','')).strip()[:300]
            if not title:raise ApiError('Geef de release een titel.')
            ident=uid();now=time.time()
            with db() as c:c.execute('INSERT INTO releases(id,title,artist,release_date,status,labelgrid_release_id,notes,created,updated) VALUES(?,?,?,?,?,?,?,?,?)',(ident,title,str(d.get('artist',''))[:300],str(d.get('release_date',''))[:10],str(d.get('status') or 'planned')[:40],str(d.get('labelgrid_release_id',''))[:100],str(d.get('notes',''))[:4000],now,now))
            audit(actor,'Release aangemaakt',ident);return self.send(data={'id':ident})
        match=re.fullmatch('/api/releases/([a-f0-9]{24})',path)
        if match and method in ('PATCH','DELETE'):
            ident=match[1]
            if method=='DELETE':
                with db() as c:
                    if not c.execute('DELETE FROM releases WHERE id=?',(ident,)).rowcount:raise ApiError('Release niet gevonden.',404)
                audit(actor,'Release verwijderd',ident);return self.send(data={'ok':True})
            d=self.json_body();fields,values=[],[]
            for key in ('title','artist','release_date','status','labelgrid_release_id','notes'):
                if key in d:fields.append(key+'=?');values.append(str(d[key])[:4000 if key=='notes' else 300])
            if not fields:raise ApiError('Geen wijziging ontvangen.')
            values.extend([time.time(),ident])
            with db() as c:
                if not c.execute('UPDATE releases SET '+','.join(fields)+',updated=? WHERE id=?',values).rowcount:raise ApiError('Release niet gevonden.',404)
            audit(actor,'Release bijgewerkt',ident);return self.send(data={'ok':True})

        # --- Events ------------------------------------------------------
        # One folder per event night in OneDrive. Locally these are plain
        # rows so the workspace stays fast and works without a connection.
        if path=='/api/events' and method=='GET':
            return self.send(data={'events':events_module.listing()})
        if path=='/api/events' and method=='POST':
            return self.send(data=events_module.create(self.json_body()))
        match=re.fullmatch('/api/events/([a-f0-9]{24})(?:/(advancing|artists|posts|notes|documents|manifest|itinerary|push|pull))?',path)
        if match:
            ident,action=match.groups()
            if not action and method in ('GET','PATCH','DELETE'):
                if method=='GET':return self.send(data=events_module.get(ident))
                if method=='PATCH':
                    audit(actor,'Evenement bijgewerkt',ident);return self.send(data=events_module.update(ident,self.json_body()))
                events_module.remove(ident);return self.send(data={'ok':True})
            if action=='advancing' and method=='PUT':return self.send(data=events_module.upsert_slots(ident,self.json_body().get('slots',[])))
            if action=='artists' and method=='PUT':return self.send(data=events_module.upsert_artists(ident,self.json_body().get('artists',[])))
            if action=='posts' and method=='PUT':return self.send(data=events_module.upsert_posts(ident,self.json_body().get('posts',[])))
            if action=='notes' and method in ('GET','POST'):
                if method=='GET':return self.send(data={'notes':events_module.notes(ident)})
                events_module.add_note(ident,self.json_body().get('body',''));return self.send(data={'notes':events_module.notes(ident)})
            if action=='documents' and method=='POST':
                d=self.json_body();return self.send(data=events_module.attach_document(ident,str(d.get('document_id','')),str(d.get('label',''))))
            if action=='documents' and method=='DELETE':
                link=self.json_body().get('id','');events_module.detach_document(ident,link);return self.send(data=events_module.get(ident))
            if action in ('push','pull') and method=='POST':
                # Network calls deliberately run outside the global lock.
                if action=='push':result=push_event(ident,actor)
                else:result=pull_event(ident)
                return self.send(data=result)
            if action=='manifest' and method=='GET':return self.send(data=events_module.manifest(ident))
            if action=='itinerary' and method=='GET':
                payload=events_module.manifest(ident)
                lines=[payload['name']+' · '+payload.get('date','')+' · '+payload.get('venue',''),'Deuren: '+payload.get('doors',''),'','TIJDEN']
                for slot in payload.get('advancing',[]):
                    window=(slot.get('start','')+'-'+slot.get('end','')).strip('-')
                    lines.append(((window+'  ') if window else '  ')+slot.get('act','')+(('  ['+slot.get('note','')+']') if slot.get('note') else ''))
                lines+=['','ARTIESTEN']
                for artist in payload.get('artists',[]):
                    lines.append('- '+artist.get('name','')+(('  fee €%.2f' % (artist.get('fee',0)/100)) if artist.get('fee') else '')+(('  contact: '+artist.get('contact','')) if artist.get('contact') else ''))
                lines+=['','NOTITIES']+['- '+n for n in payload.get('notes',[])]
                return self.send(body='\n'.join(lines).encode('utf-8'),mime='text/plain; charset=utf-8',headers={'Content-Disposition':'attachment; filename="itinerary-'+ident+'.txt"'})
        raise ApiError('Niet gevonden.',404)

    def login(self):
        self.check_origin();d=self.json_body();ip=self.client_address[0];now=time.time()
        if not isinstance(d.get('username'),str) or not isinstance(d.get('password'),str) or len(d['username'])>100 or len(d['password'])>1024:raise ApiError('Ongeldige inloggegevens.',400)
        with db() as c:
            c.execute('BEGIN IMMEDIATE')
            attempt=c.execute('SELECT * FROM login_attempts WHERE ip=?',(ip,)).fetchone()
            if attempt and attempt['count']>=8 and attempt['until']>now:raise ApiError('Te veel pogingen. Probeer het over 15 minuten opnieuw.',429)
            user=c.execute('SELECT * FROM users WHERE username=? AND active=1',(str(d.get('username','')).strip(),)).fetchone()
            valid=check_password(str(d.get('password','')),user['password_hash'] if user else '0'*32+':'+'0'*64)
            if not user or not valid:
                count=(attempt['count'] if attempt and attempt['until']>now else 0)+1
                c.execute('INSERT OR REPLACE INTO login_attempts VALUES(?,?,?)',(ip,count,now+900))
        if not user or not valid:raise ApiError('Gebruikersnaam of wachtwoord klopt niet.',401)
        token=secrets.token_urlsafe(40);csrf=secrets.token_urlsafe(32)
        with db() as c:
            c.execute('BEGIN IMMEDIATE')
            fresh=c.execute('SELECT active,password_hash FROM users WHERE id=?',(user['id'],)).fetchone()
            if not fresh or not fresh['active'] or fresh['password_hash']!=user['password_hash']:raise ApiError('Log opnieuw in.',401)
            c.execute('DELETE FROM login_attempts WHERE ip=?',(ip,));c.execute('DELETE FROM sessions WHERE expires<?',(now,))
            c.execute('INSERT INTO sessions VALUES(?,?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),user['id'],csrf,now+12*3600))
        secure='; Secure' if os.environ.get('MOONSHINE_SECURE_COOKIE','0')=='1' else ''
        audit(user['username'],'Ingelogd')
        return self.send(data={'user':{k:user[k] for k in ('id','username','name','role')},'csrf':csrf},headers={'Set-Cookie':f'moonshine_session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200{secure}'})

    def upload(self,actor):
        ct=self.headers.get('Content-Type','')
        if not ct.startswith('multipart/form-data;'):raise ApiError('Selecteer een PDF of afbeelding.')
        message=BytesParser(policy=default).parsebytes(('Content-Type: '+ct+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+self.read_body())
        result=[]
        for part in message.iter_parts():
            name=part.get_filename()
            if not name:continue
            content=part.get_payload(decode=True)
            mime=self.file_type(content)
            if len(content)>15*1024*1024:raise ApiError('Maximaal 15 MB per bestand.',413)
            name=Path(name.replace('\\','/')).name[:180]
            ident,duplicate=ingest(name,mime,content)
            result.append({'id':ident,'duplicate':duplicate,'name':name})
            if not duplicate:audit(actor,'Factuur geüpload',ident,name)
        if not result:raise ApiError('Geen bestanden ontvangen.')
        return self.send(data={'files':result})
    @staticmethod
    def file_type(content):
        if content.startswith(b'%PDF-'):return 'application/pdf'
        if content.startswith(b'\xff\xd8\xff'):return 'image/jpeg'
        if content.startswith(b'\x89PNG\r\n\x1a\n'):return 'image/png'
        if content[:4]==b'RIFF' and content[8:12]==b'WEBP':return 'image/webp'
        raise ApiError('Alleen PDF, JPG, PNG en WebP worden ondersteund.')
    def import_csv(self,actor):
        d=self.json_body();text=str(d.get('csv',''));source=d.get('source','ING')
        if source not in ('ING','SumUp'):raise ApiError('Kies ING of SumUp.')
        try:dialect=csv.Sniffer().sniff(text[:4096],delimiters=';,\t')
        except csv.Error:raise ApiError('Gebruik het CSV-template uit de bankpagina.')
        reader=csv.DictReader(io.StringIO(text.lstrip('\ufeff')),dialect=dialect)
        if not {'date','description','amount'}.issubset(reader.fieldnames or []):raise ApiError('CSV-kolommen vereist: date, description, amount. Download het template.')
        rows=[]
        for raw in reader:
            if len(rows)>=10000:raise ApiError('Maximaal 10.000 transacties per import.')
            rows.append(self.transaction_values(raw,source))
        if not rows:raise ApiError('Geen transacties gevonden.')
        added=self.insert_transactions(rows)
        audit(actor,'Bankexport geïmporteerd',source,str(added));return self.send(data={'added':added,'duplicates':len(rows)-added})
    @staticmethod
    def transaction_values(raw,source):
        from datetime import date
        day=str(raw.get('date',''));date.fromisoformat(day)
        amount=cents(raw.get('amount',''));fee=cents(raw.get('fee') or '0')
        if fee<0:raise ApiError('Kosten moeten positief zijn.')
        description=str(raw.get('description','')).strip()[:1000]
        if not description:raise ApiError('Transactieomschrijving ontbreekt.')
        # Require stable IDs: identical legitimate purchases must not silently disappear.
        external=str(raw.get('external_id','')).strip()
        if not external:raise ApiError('Elke transactie vereist een uniek external_id uit je bankexport.')
        category=raw.get('category') or ('sales' if source=='SumUp' and amount>0 else 'unknown')
        if category not in ('sales','settlement','fee','unknown'):raise ApiError('Ongeldige transactiecategorie.')
        rate=int(raw['vat_rate']) if raw.get('vat_rate') not in (None,'') else None
        if rate not in (None,0,9,21):raise ApiError('Btw-tarief moet 0, 9 of 21 zijn.')
        statement=int(raw['odoo_statement_id']) if raw.get('odoo_statement_id') else None
        return (uid(),source+'/'+external,source,day,description,amount,fee,rate,category,str(raw.get('payout_id','')).strip()[:200],statement,time.time())
    @staticmethod
    def insert_transactions(rows):
        added=0
        with db() as c:
            for row in rows:
                c.execute('INSERT OR IGNORE INTO transactions(id,external_id,source,date,description,amount,fee,vat_rate,category,payout_id,statement_id,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',row)
                added+=c.execute('SELECT changes()').fetchone()[0]
        return added
    def webhook(self,path,method):
        if method!='POST':raise ApiError('Alleen POST toegestaan.',405)
        sv=secret_values()
        if path=='/api/webhooks/bank':
            secret=sv.get('bank_webhook_secret','')
            if not secret or not secrets.compare_digest(self.headers.get('Authorization',''),'Bearer '+secret):raise ApiError('Ongeldige webhook-sleutel.',401)
            d=self.json_body();source=d.get('source','ING')
            if source not in ('ING','SumUp'):raise ApiError('Onbekende bankbron.')
            transactions=d.get('transactions',[])
            if not isinstance(transactions,list) or len(transactions)>1000:raise ApiError('Maximaal 1000 transacties per webhook.')
            rows=[self.transaction_values(x,source) for x in transactions]
            added=self.insert_transactions(rows);audit(source,'Bank-webhook ontvangen',detail=str(added))
            return self.send(data={'added':added})
        if path=='/api/webhooks/outlook':
            # Microsoft Graph validation uses a POST with a validationToken query.
            token=urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get('validationToken',[''])[0]
            if token:return self.send(body=token.encode(),mime='text/plain; charset=utf-8')
            d=self.json_body();notifications=d.get('value',[])
            state=sv.get('mail_webhook_secret','')
            if not state or not notifications or any(not secrets.compare_digest(str(n.get('clientState','')),state) for n in notifications):raise ApiError('Ongeldige notificatie.',401)
            from integrations import poll_mail
            def poll():
                try:
                    with LOCK:poll_mail()
                except Exception:audit('Outlook','Webhook-verwerking vraagt controle')
            threading.Thread(target=poll,daemon=True).start();return self.send(status=202,data={'accepted':True})
        if path=='/api/webhooks/opensign':
            import hmac as _hmac
            secret=sv.get('opensign_webhook_secret','')
            raw=self.read_body()
            if secret:
                given=self.headers.get('x-webhook-signature','')
                expect=_hmac.new(secret.encode(),raw,hashlib.sha256).hexdigest()
                if not secrets.compare_digest(given,expect):raise ApiError('Ongeldige handtekening.',401)
            try:d=json.loads(raw)
            except ValueError:raise ApiError('Ongeldige invoer.')
            doc_id=str((d.get('document') or {}).get('id') or d.get('documentId') or '')
            status=str(d.get('status') or d.get('event') or '')[:40]
            if doc_id and status:
                with db() as c:c.execute('UPDATE contracts SET status=?,updated=? WHERE opensign_id=?',(status,time.time(),doc_id))
                audit('OpenSign','Contractstatus bijgewerkt',doc_id,status)
            return self.send(data={'accepted':True})
        raise ApiError('Niet gevonden.',404)
    @staticmethod
    def connections(cfg,sv):
        providers=[('odoo','Odoo',bool(cfg.get('odoo_url') and cfg.get('odoo_database') and sv.get('odoo_api_key'))),('claude','Claude',bool(cfg.get('anthropic_model') and sv.get('anthropic_api_key'))),('microsoft','Outlook',bool(sv.get('microsoft_refresh_token') or sv.get('microsoft_access_token') or sv.get('microsoft_client_secret'))),('onedrive','OneDrive',bool(cfg.get('onedrive_drive_id'))),('todo','Microsoft To Do',bool(cfg.get('todo_list_id'))),('ing','ING',bool(cfg.get('odoo_bank_feed') and cfg.get('odoo_bank_journal'))),('sumup','SumUp',bool(cfg.get('odoo_sumup_clearing_account'))),('calendar','Agenda',bool(cfg.get('calendar_enabled') and cfg.get('calendar_id'))),('promo','Promo-mail',bool(cfg.get('promo_sender') or cfg.get('finance_email'))),('labelgrid','LabelGrid',bool(sv.get('labelgrid_api_key'))),('opensign','OpenSign',bool(sv.get('opensign_api_key'))),('releases','Releases',True),('contracts','Contracten',bool(sv.get('opensign_api_key')))]
        checks=cfg.get('connection_checks',{})
        return [{'id':k,'name':name,'status':'verified' if checks.get(k,{}).get('ok') and configured else 'configured' if configured else 'not_connected','checked':checks.get(k,{}).get('checked'),'mode':'CSV / webhook' if k in ('ing','sumup') else ('Lokaal' if k in ('releases',) else None)} for k,name,configured in providers]

def main():
    init()
    parser=argparse.ArgumentParser();parser.add_argument('action',nargs='?',default='serve',choices=['serve','init-admin']);parser.add_argument('--username',default='peppy');args=parser.parse_args()
    if args.action=='init-admin':
        password=getpass.getpass('Wachtwoord voor '+args.username+': ')
        if len(password)<8:raise SystemExit('Minimaal 8 tekens.')
        with db() as c:
            if c.execute('SELECT 1 FROM users').fetchone():raise SystemExit('Er bestaat al een gebruiker. Gebruik Gebruikersbeheer.')
            c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(uid(),args.username,'Peppy','admin',hash_password(password),1,time.time()))
        print('Beheerdersaccount aangemaakt.');return
    with db() as c:
        c.execute("UPDATE documents SET status='awaiting_ai' WHERE status='processing'")
        if not c.execute('SELECT 1 FROM users').fetchone():raise SystemExit('Maak eerst een beheerder aan: python3 server.py init-admin')
    stop=threading.Event()
    if os.environ.get('MOONSHINE_WORKER','1')=='1':threading.Thread(target=worker,args=(stop,),daemon=True).start()
    server=ThreadingHTTPServer((os.environ.get('MOONSHINE_HOST','127.0.0.1'),int(os.environ.get('MOONSHINE_PORT','8765'))),Handler)
    server.daemon_threads=True
    print('Moonshine luistert op http://%s:%s'%server.server_address,flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:stop.set();server.server_close()

if __name__=='__main__':main()

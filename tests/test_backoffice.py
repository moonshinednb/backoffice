import os, tempfile, unittest, threading, time, json, urllib.request, urllib.error, http.cookiejar, sys
from pathlib import Path
from unittest.mock import patch
TEST_ROOT=Path(__file__).resolve().parents[1]/'data'
TEST_ROOT.mkdir(exist_ok=True)
TEST_DATA=tempfile.TemporaryDirectory(prefix='test-',dir=TEST_ROOT)
os.environ['MOONSHINE_DATA']=TEST_DATA.name
os.environ['MOONSHINE_SECURE_COOKIE']='0'
os.environ['MOONSHINE_WORKER']='0'
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import store, accounting, server, integrations

def invoice(tax='21',net=10000,total=12100,country='NL',**kw):
    return {'supplier':'Moonshine Test Supplier','number':'TEST-01','date':'2026-10-01','currency':'EUR','country':country,'total':total,'lines':[{'net':net,'tax':tax,'description':'Techniek'}],**kw}

class OdooConfigurationTests(unittest.TestCase):
    def test_overview_reads_bounded_invoices_and_counts_without_writes(self):
        with patch('integrations.Odoo') as adapter,patch('integrations.settings',return_value={'odoo_api_key':'never-return-this'}):
            o=adapter.return_value
            def call(model,method,args,kwargs=None):
                if method=='fields_get':return {'active':{}}
                if method=='search_count':return 7
                if method=='search_read':return []
                self.fail('Unexpected Odoo method: '+method)
            o.call.side_effect=call;o.search.return_value=[]
            result=integrations.odoo_overview()
            self.assertEqual(result['counts']['total'],7)
            self.assertNotIn('odoo_api_key',result['mapping'])
            invoice_call=next(c for c in o.call.call_args_list if c.args[1]=='search_read')
            self.assertEqual(invoice_call.args[3]['limit'],50)
            self.assertEqual(invoice_call.args[2],[[['move_type','in',['in_invoice','in_refund']]]])
    def test_connection_uses_available_account_lifecycle_field(self):
        for fields,domain in [({'active':{}},[['active','=',True]]),({'deprecated':{}},[['deprecated','=',False]]),({'active':{},'deprecated':{}},[['active','=',True]])]:
            with self.subTest(fields=fields):
                with patch('integrations.Odoo') as adapter:
                    adapter.return_value.call.return_value=fields
                    adapter.return_value.search.return_value=[]
                    result=integrations.test_connection('odoo')
                    self.assertEqual(result['message'],'Odoo-account geverifieerd')
                    adapter.return_value.search.assert_any_call('account.account',domain,['id','code','name','account_type'])
    def test_connection_rejects_unknown_account_schema(self):
        with patch('integrations.Odoo') as adapter:
            adapter.return_value.call.return_value={}
            with self.assertRaisesRegex(ValueError,'Odoo-rekeningvelden worden niet ondersteund'):
                integrations.test_connection('odoo')
            adapter.return_value.search.assert_not_called()

    def test_reports_only_the_missing_field_before_network_request(self):
        cases=[('odoo_database','databasenaam'),('odoo_username','login'),('odoo_api_key','API-sleutel')]
        for field,label in cases:
            with self.subTest(field=field):
                cfg={'odoo_url':'https://moonshine.odoo.com','odoo_database':'moonshine','odoo_username':'test@example.nl'}
                keys={'odoo_api_key':'private-test-key'}
                if field in cfg:cfg[field]='  '
                else:keys[field]=''
                with patch('integrations.settings',return_value=cfg),patch('integrations.secret_values',return_value=keys),patch.object(integrations.Odoo,'rpc') as rpc:
                    with self.assertRaisesRegex(ValueError,'^Odoo: vul de volgende gegevens in: '+label+r'\.$'):
                        integrations.Odoo()
                    rpc.assert_not_called()

class AccountingTests(unittest.TestCase):
    @unittest.skipIf(os.name=='nt','Unix file permissions')
    def test_private_upload_permissions(self):
        store.init()
        ident,_=store.ingest('permission-test.pdf','application/pdf',b'%PDF-permission-test')
        self.assertEqual((store.DATA/'files'/ident).stat().st_mode & 0o777,0o600)
        self.assertEqual((store.DATA/'files').stat().st_mode & 0o777,0o700)
        self.assertEqual((store.DATA/'moonshine.sqlite3').stat().st_mode & 0o777,0o600)
    def test_euro_decimal(self):self.assertEqual(accounting.cents('€ 1.234,56'),123456)
    def test_half_up(self):self.assertEqual(accounting.cents('0.005'),1)
    def test_non_finite(self):
        with self.assertRaises(ValueError):accounting.cents('NaN')
    def test_valid_invoice(self):self.assertEqual(accounting.validate_invoice(invoice()),[])
    def test_unbalanced_invoice(self):self.assertTrue(any('Totaal' in x for x in accounting.validate_invoice(invoice(total=12000))))
    def test_reverse_requires_confirmation(self):self.assertTrue(any('verlegging' in x for x in accounting.validate_invoice(invoice(tax='reverse_eu',total=10000,country='DE'))))
    def test_iban_valid(self):self.assertEqual(accounting.validate_invoice(invoice(iban='NL91ABNA0417164300')),[])
    def test_iban_invalid(self):self.assertTrue(any('IBAN' in x for x in accounting.validate_invoice(invoice(iban='NL91ABNA0417164301'))))
    def test_credit_requires_review(self):self.assertTrue(accounting.validate_invoice(invoice(net=-10000,total=-12100)))
    def test_vat_eu_and_non_eu(self):
        docs=[{'status':'posted','details':invoice(tax=tax,total=10000,reverse_confirmed=True)} for tax in ('reverse_eu','reverse_non_eu')]
        r=accounting.vat_report(docs,[],2026,4)
        self.assertEqual(r['boxes']['4a']['tax'],2100);self.assertEqual(r['boxes']['4b']['tax'],2100);self.assertEqual(r['boxes']['5b']['tax'],4200);self.assertEqual(r['due'],0)
    def test_vat_excludes_drafts(self):self.assertEqual(accounting.vat_report([{'status':'review','details':invoice()}],[],2026,4)['boxes']['5b']['tax'],0)
    def test_vat_excludes_non_deductible(self):
        d=invoice();d['lines'][0]['deductible']=False
        self.assertEqual(accounting.vat_report([{'status':'posted','details':d}],[],2026,4)['boxes']['5b']['tax'],0)
    def test_settlement_not_double_counted(self):
        tx=[{'date':'2026-10-01','category':category,'amount':12100,'vat_rate':21} for category in ('sales','settlement')]
        self.assertEqual(accounting.vat_report([],tx,2026,4)['boxes']['1a']['tax'],2100)
    def test_ambiguous_bank_match(self):
        docs=[{'id':str(i),'status':'posted','details':invoice()} for i in range(2)]
        matches=accounting.suggest_matches([{'id':'bank','amount':-12100,'status':'open','description':'TEST-01'}],docs)
        self.assertTrue(matches[0]['ambiguous'])
    def test_exact_match(self):
        docs=[{'id':'i','status':'posted','details':invoice()}]
        matches=accounting.suggest_matches([{'id':'bank','amount':-12100,'status':'open','description':'TEST-01'}],docs)
        self.assertEqual(matches[0]['score'],99)
    def test_invoice_number_prefix_is_not_exact_match(self):
        docs=[{'id':'i','status':'posted','details':invoice(number='TEST-01')}]
        matches=accounting.suggest_matches([{'id':'bank','amount':-12100,'status':'open','description':'TEST-012'}],docs)
        self.assertEqual(matches[0]['score'],65)
    def test_alias_is_suggestion(self):
        docs=[{'id':'i','status':'posted','details':invoice(aliases=['DJ Peppy'])}]
        matches=accounting.suggest_matches([{'id':'bank','amount':-12100,'status':'open','description':'DJ Peppy gage'}],docs)
        self.assertEqual(matches[0]['score'],94)

class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        store.init()
        cls.admin=store.uid();cls.viewer=store.uid()
        with store.db() as c:
            for ident,name,role in [(cls.admin,'testadmin','admin'),(cls.viewer,'testviewer','viewer')]:c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(ident,name,name,role,store.hash_password('TestPass!123'),1,time.time()))
        cls.server=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
    def setUp(self):
        with store.db() as c:c.execute('DELETE FROM login_attempts')
        self.jar=http.cookiejar.CookieJar();self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.csrf=''
    def request(self,path,body=None,method=None,headers=None):
        hdr={'Content-Type':'application/json','X-CSRF-Token':self.csrf,**(headers or {})};data=json.dumps(body).encode() if body is not None else None
        request=urllib.request.Request(self.base+'/api'+path,data=data,headers=hdr,method=method)
        try:
            with self.client.open(request) as r:return r.status,json.loads(r.read())
        except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
    def login(self,username='testadmin'):
        code,r=self.request('/login',{'username':username,'password':'TestPass!123'});self.assertEqual(code,200);self.csrf=r['csrf'];return r
    def test_protected_state(self):self.assertEqual(self.request('/state')[0],401)
    def test_odoo_overview_requires_login(self):
        with patch('integrations.odoo_overview') as read:
            self.assertEqual(self.request('/odoo/overview')[0],401);read.assert_not_called()
    def test_odoo_overview_is_readable_by_viewer(self):
        self.login('testviewer')
        with patch('integrations.odoo_overview',return_value={'counts':{'total':3}}):
            code,result=self.request('/odoo/overview')
            self.assertEqual(code,200);self.assertEqual(result['counts']['total'],3)
    def test_login_and_state(self):
        self.login();code,r=self.request('/state');self.assertEqual(code,200);self.assertNotIn('password_hash',str(r));self.assertNotIn('csrf',r)
    def test_csrf_required(self):
        self.login();self.csrf='';self.assertEqual(self.request('/tasks',{'title':'No CSRF'})[0],403)
    def test_origin_blocked(self):self.assertEqual(self.request('/login',{'username':'testadmin','password':'TestPass!123'},headers={'Origin':'https://other-site.invalid'})[0],403)
    def test_task_persistence(self):
        self.login();code,r=self.request('/tasks',{'title':'Persistent task','priority':'high'});self.assertEqual(code,200)
        self.assertEqual(self.request('/tasks/'+r['id'],{'done':True},method='PATCH')[0],200)
        self.assertTrue(next(t for t in self.request('/state')[1]['tasks'] if t['id']==r['id'])['done'])
    def test_viewer_cannot_write(self):
        self.login('testviewer');self.assertEqual(self.request('/tasks',{'title':'Forbidden'})[0],403)
    def test_viewer_can_logout(self):
        self.login('testviewer');self.assertEqual(self.request('/logout',{})[0],200);self.assertEqual(self.request('/me')[0],401)
    def test_reloaded_session_can_logout(self):
        for username in ('testadmin','testviewer'):
            with self.subTest(username=username):
                login=self.login(username)
                self.csrf=''
                code,restored=self.request('/me')
                self.assertEqual(code,200)
                self.assertEqual(restored['csrf'],login['csrf'])
                self.assertEqual(restored['user'],login['user'])
                self.csrf=restored['csrf']
                self.assertEqual(self.request('/logout',{})[0],200)
                self.assertEqual(self.request('/me')[0],401)
    def test_logout_still_requires_csrf(self):
        self.login();self.csrf='wrong-token'
        self.assertEqual(self.request('/logout',{})[0],403)
        self.assertEqual(self.request('/me')[0],200)
    def test_non_admin_cannot_settings(self):
        self.login('testviewer');self.assertEqual(self.request('/settings')[0],403)
    def test_self_deactivation_blocked(self):
        self.login();self.assertEqual(self.request('/users/'+self.admin,{'active':False},method='PATCH')[0],400)
    def test_secret_not_returned(self):
        self.login();self.assertEqual(self.request('/settings',{'settings':{},'secrets':{'anthropic_api_key':'secret-test-key'}})[0],200)
        r=self.request('/settings')[1];self.assertIn('anthropic_api_key',r['configured_secrets']);self.assertNotIn('secret-test-key',json.dumps(r))
        self.assertNotIn('secret-test-key',json.dumps(self.request('/state')[1]))
    def test_finance_cannot_manage_users_or_read_secrets(self):
        ident=store.uid();name='finance-'+ident[:8]
        with store.db() as c:c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(ident,name,name,'finance',store.hash_password('TestPass!123'),1,time.time()))
        self.login(name)
        self.assertEqual(self.request('/settings')[0],403)
        self.assertEqual(self.request('/users',{'username':'intruder','password':'TestPass!123','role':'admin'})[0],403)
        self.assertEqual(self.request('/users/'+ident,{'role':'admin'},method='PATCH')[0],403)
        self.assertEqual(self.request('/connections/test',{'provider':'odoo'})[0],403)
    def test_deactivated_session_rejected(self):
        ident=store.uid();name='inactive-'+ident[:8]
        with store.db() as c:c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(ident,name,name,'viewer',store.hash_password('TestPass!123'),1,time.time()))
        self.login(name)
        with store.db() as c:c.execute('UPDATE users SET active=0 WHERE id=?',(ident,))
        self.assertEqual(self.request('/state')[0],401)
    def test_password_change_invalidates_session(self):
        ident=store.uid();name='password-'+ident[:8]
        with store.db() as c:c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(ident,name,name,'viewer',store.hash_password('TestPass!123'),1,time.time()))
        self.login(name)
        self.assertEqual(self.request('/password',{'current':'TestPass!123','password':'NewTestPass!456'})[0],200)
        self.assertEqual(self.request('/me')[0],401)
    def test_role_change_invalidates_session(self):
        ident=store.uid();name='role-'+ident[:8]
        with store.db() as c:c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?)',(ident,name,name,'finance',store.hash_password('TestPass!123'),1,time.time()))
        self.login(name);old_client=self.client
        self.jar=http.cookiejar.CookieJar();self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.login()
        self.assertEqual(self.request('/users/'+ident,{'role':'viewer'},method='PATCH')[0],200)
        self.client=old_client;self.assertEqual(self.request('/me')[0],401)
    def test_secret_transport_requires_https(self):
        self.login()
        self.assertEqual(self.request('/settings',{'settings':{'odoo_url':'http://odoo.example'},'secrets':{}})[0],400)
        self.assertEqual(self.request('/settings',{'settings':{'odoo_url':'https://user:password@odoo.example'},'secrets':{}})[0],400)
    def test_redirect_does_not_forward_credentials(self):
        request=urllib.request.Request('https://odoo.example',headers={'Authorization':'Bearer sentinel'})
        with self.assertRaisesRegex(RuntimeError,'definitieve HTTPS'):
            integrations.NoCredentialRedirect().redirect_request(request,None,302,'Found',{},'https://other.example')
    def test_error_redaction(self):
        with patch('store.secret_values',return_value={'odoo_api_key':'sentinel-private-key'}):
            self.assertNotIn('sentinel-private-key',store.safe_error('Provider: sentinel-private-key'))
            self.assertNotIn('sensitive-token',store.safe_error('Bearer sensitive-token'))
    def test_graph_pagination_rejects_foreign_origin(self):
        with patch('integrations.graph',return_value={'value':[],'@odata.nextLink':'https://evil.example/v1.0/tasks'}):
            with self.assertRaisesRegex(ValueError,'paginering'):integrations.graph_pages('/me/todo/lists')
    def test_task_can_be_edited(self):
        self.login();ident=self.request('/tasks',{'title':'Before'})[1]['id']
        self.assertEqual(self.request('/tasks/'+ident,{'title':'After','description':'Context','due':'2026-10-20','assignee':self.admin,'priority':'high'},method='PATCH')[0],200)
        item=next(t for t in self.request('/state')[1]['tasks'] if t['id']==ident)
        self.assertEqual((item['title'],item['due'],item['assignee'],item['priority']),('After','2026-10-20',self.admin,'high'))
    def test_invalid_assignee_rejected(self):
        self.login();self.assertEqual(self.request('/tasks',{'title':'Invalid','assignee':'no-such-user'})[0],400)
    def test_matched_transaction_is_immutable(self):
        self.login();row=server.Handler.transaction_values({'external_id':'immutable','date':'2026-10-01','description':'Posted','amount':'121'},'ING');server.Handler.insert_transactions([row])
        with store.db() as c:c.execute("UPDATE transactions SET status='matched' WHERE id=?",(row[0],))
        self.assertEqual(self.request('/transactions/'+row[0],{'category':'sales','vat_rate':21},method='PATCH')[0],400)
    def test_oversized_password_rejected(self):
        self.assertEqual(self.request('/login',{'username':'testadmin','password':'x'*1025})[0],400)
    def test_static_files_cannot_read_data(self):
        for path in ('/../store.py','/%2e%2e/store.py','/data/secrets.json','/.env'):
            with self.assertRaises(urllib.error.HTTPError) as error:self.client.open(self.base+path)
            self.assertEqual(error.exception.code,404)
    def test_secure_cookie_and_headers(self):
        with patch.dict(os.environ,{'MOONSHINE_SECURE_COOKIE':'1'}):
            req=urllib.request.Request(self.base+'/api/login',data=json.dumps({'username':'testadmin','password':'TestPass!123'}).encode(),headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(req) as response:
                cookie=response.headers['Set-Cookie'];self.assertIn('Secure',cookie);self.assertIn('HttpOnly',cookie);self.assertIn('SameSite=Strict',cookie)
                self.assertEqual(response.headers['Cache-Control'],'no-store')
                self.assertIn("frame-ancestors 'none'",response.headers['Content-Security-Policy'])
    def test_bank_import_idempotency(self):
        self.login();payload={'source':'ING','csv':'external_id;date;description;amount\nTEST-ID;2026-10-01;Gage;-121.00\n'}
        self.assertEqual(self.request('/transactions/import',payload)[1]['added'],1)
        self.assertEqual(self.request('/transactions/import',payload)[1]['duplicates'],1)
    def test_bank_import_missing_id_rejected(self):
        self.login();payload={'source':'ING','csv':'date;description;amount\n2026-10-01;Gage;-121.00\n'}
        self.assertEqual(self.request('/transactions/import',payload)[0],400)
    def test_bank_webhook_auth(self):self.assertEqual(self.request('/webhooks/bank',{'transactions':[]})[0],401)
    def test_duplicate_file(self):
        a,duplicate=store.ingest('invoice.pdf','application/pdf',b'%PDF-test-unique')
        b,duplicate=store.ingest('invoice-copy.pdf','application/pdf',b'%PDF-test-unique')
        self.assertEqual(a,b);self.assertTrue(duplicate)
    def test_sumup_total_mismatch_stops_before_odoo(self):
        rows=[server.Handler.transaction_values({'external_id':'sumup-test','date':'2026-10-01','description':'Pin','amount':'121','fee':'1','vat_rate':'21','category':'sales','payout_id':'TEST-PAYOUT'},'SumUp'),server.Handler.transaction_values({'external_id':'payout-test','date':'2026-10-02','description':'Uitbetaling','amount':'119','category':'settlement','payout_id':'TEST-PAYOUT'},'ING')]
        server.Handler.insert_transactions(rows)
        with patch('integrations.Odoo') as odoo:
            with self.assertRaisesRegex(ValueError,'sluit niet aan'):integrations.settle_sumup(rows[1][0],'test')
            odoo.assert_not_called()
    def test_login_throttle(self):
        for _ in range(8):self.assertEqual(self.request('/login',{'username':'notreal','password':'wrong'})[0],401)
        self.assertEqual(self.request('/login',{'username':'notreal','password':'wrong'})[0],429)

if __name__=='__main__':unittest.main()

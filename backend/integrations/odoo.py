"""Odoo over authenticated JSON-RPC (execute_kw). Odoo stays the ledger:
this posts supplier invoices, reconciles bank lines and books SumUp payouts.
Ported unchanged from the first backoffice; only persistence moved to Django."""
import base64
import re
import time
from decimal import Decimal, ROUND_HALF_UP
from core.models import uid
from core.services import DATA, secret_values, settings
from finance.accounting import validate_invoice
from finance.models import Document, Transaction
from .http import http, secure_url


class Odoo:
    def __init__(self):
        self.cfg=settings();self.secret=secret_values();self.db=self.cfg.get('odoo_database') or '';self.key=self.secret.get('odoo_api_key') or '';self.user=self.cfg.get('odoo_username') or ''
        self.url=self.cfg.get('odoo_url') or ''
        self.url=self.url.rstrip('/')
        missing=[]
        if not self.url.strip():missing.append('Odoo-URL (bijv. https://moonshine.odoo.com)')
        if not self.db.strip():missing.append('databasenaam')
        if not self.user.strip():missing.append('login')
        if not self.key.strip():missing.append('API-sleutel')
        if missing:raise ValueError('Odoo: vul bij Admin → Koppelingen → Odoo nog in: '+', '.join(missing)+'.')
        try:secure_url(self.url)
        except ValueError:raise ValueError('Odoo-URL moet met https:// beginnen, zonder gebruikersnaam of # erin.')
        self.uid=self.rpc('common','authenticate',[self.db,self.user,self.key,{}])
        if not self.uid:raise ValueError('Odoo-login mislukt.')
    def rpc(self,service,method,args):
        r=http(self.url+'/jsonrpc',{'jsonrpc':'2.0','method':'call','params':{'service':service,'method':method,'args':args},'id':uid()})
        if r.get('error'):raise RuntimeError('Odoo kon de handeling niet uitvoeren. Controleer toegangsrechten, rekeningen en btw-codes.')
        return r.get('result')
    def call(self,model,method,args,kwargs=None):return self.rpc('object','execute_kw',[self.db,self.uid,self.key,model,method,args,kwargs or {}])
    def search(self,model,domain,fields):return self.call(model,'search_read',[domain],{'fields':fields,'limit':1000})
    def post(self,doc):
        d=doc['details'];errors=validate_invoice(d)
        if errors:raise ValueError('; '.join(errors))
        cfg=self.cfg;mapping=cfg.get('odoo_tax_map',{})
        if not cfg.get('odoo_expense_account') or not cfg.get('odoo_purchase_journal'):raise ValueError('Kies de kostenrekening en het inkoopdagboek.')
        for line in d['lines']:
            if line['tax'] not in mapping or type(mapping[line['tax']]) is not int:raise ValueError('Odoo-btw-code ontbreekt voor '+line['tax'])
        vat=str(d.get('vat_id','')).replace(' ','').upper()
        domain=[['vat','=',vat]] if vat else [['name','=',d['supplier']]]
        partners=self.search('res.partner',domain,['id','name'])
        if len(partners)>1:raise ValueError('Meerdere Odoo-relaties gevonden; controleer crediteur.')
        partner=partners[0]['id'] if partners else self.call('res.partner','create',[{'name':d['supplier'],'supplier_rank':1,**({'vat':vat} if vat else {})}])
        if d.get('iban'):
            iban=re.sub(r'\s','',d['iban'].upper())
            banks=self.search('res.partner.bank',[['partner_id','=',partner],['acc_number','=',iban]],['id'])
            if not banks:self.call('res.partner.bank','create',[{'partner_id':partner,'acc_number':iban}])
        marker='MOONSHINE/'+doc['id']
        moves=self.search('account.move',[['move_type','=','in_invoice'],['partner_id','=',partner],['ref','=',d['number']]],['id','state','narration'])
        if moves and marker not in (moves[0].get('narration') or '') and moves[0]['id']!=doc.get('odoo_id'):raise ValueError('Factuurnummer bestaat al in Odoo. Controleer dubbele factuur.')
        move_id=doc.get('odoo_id') or (moves[0]['id'] if moves else None)
        if not move_id:
            lines=[]
            for line in d['lines']:
                lines.append([0,0,{'name':line.get('description') or d['supplier'],'quantity':1,'price_unit':line['net']/100,'account_id':int(cfg['odoo_expense_account']),'tax_ids':[[6,0,[mapping[line['tax']]]]]}])
            move_id=self.call('account.move','create',[{'move_type':'in_invoice','partner_id':partner,'ref':d['number'],'invoice_date':d['date'],'journal_id':int(cfg['odoo_purchase_journal']),'narration':marker,'invoice_line_ids':lines}])
            Document.objects.filter(id=doc['id']).update(odoo_id=move_id)
        attachments=self.search('ir.attachment',[['res_model','=','account.move'],['res_id','=',move_id],['name','=',doc['name']]],['id'])
        if not attachments:
            self.call('ir.attachment','create',[{'name':doc['name'],'type':'binary','mimetype':doc['mime'],'res_model':'account.move','res_id':move_id,'datas':base64.b64encode((DATA/'files'/doc['id']).read_bytes()).decode()}])
        actual=self.call('account.move','read',[[move_id]],{'fields':['state','amount_total','currency_id']})[0]
        currency=self.call('res.currency','read',[[actual['currency_id'][0]]],{'fields':['name']})[0]
        if currency['name']!='EUR':raise ValueError('Alleen EUR-boeking ondersteund; controleer vreemde valuta.')
        if abs(round(actual['amount_total']*100)-d['total'])>2:raise ValueError('Odoo-totaal wijkt af; controleer btw-mapping in Odoo.')
        if actual['state']=='draft':self.call('account.move','action_post',[[move_id]])
        elif actual['state']!='posted':raise ValueError('Odoo-factuur heeft een ongeldige status.')
        return move_id

    def reconcile(self,transaction,doc):
        cfg=self.cfg
        if not cfg.get('odoo_bank_journal') or not cfg.get('odoo_bank_account'):raise ValueError('Configureer het ING-bankdagboek en de bankrekening in Odoo.')
        invoice=self.call('account.move','read',[[doc['odoo_id']]],{'fields':['state','partner_id','currency_id','company_id','amount_residual']})[0]
        if invoice['state']!='posted':raise ValueError('Factuur is niet geboekt in Odoo.')
        currency=self.call('res.currency','read',[[invoice['currency_id'][0]]],{'fields':['name']})[0]
        if currency['name']!='EUR':raise ValueError('Afletteren ondersteunt uitsluitend EUR.')
        if cfg.get('bank_mode') not in ('existing_feed','exclusive_import'):raise ValueError('Kies eerst of ING-transacties al via Odoo binnenkomen, of uitsluitend via deze backoffice.')
        ref='MOONSHINE/BANK/'+transaction['id']
        existing=self.search('account.move',[['ref','=',ref],['company_id','=',invoice['company_id'][0]]],['id','state'])
        if invoice['amount_residual']==0 and existing and existing[0]['state']=='posted':
            pending=self.search('account.move.line',[['move_id','=',existing[0]['id']],['account_id.account_type','=','liability_payable'],['reconciled','=',False]],['id'])
            if not pending:return existing[0]['id']
        if abs(round(invoice['amount_residual']*100)-abs(transaction['amount']))>1:raise ValueError('Openstaand Odoo-bedrag sluit niet aan op banktransactie.')
        payable=self.search('account.move.line',[['move_id','=',doc['odoo_id']],['account_id.account_type','=','liability_payable'],['reconciled','=',False]],['id','account_id','partner_id'])
        if len(payable)!=1:raise ValueError('Gesplitste betaaltermijnen vereisen controle in Odoo.')
        counterpart=int(cfg['odoo_bank_account']);statement_line=None
        if cfg['bank_mode']=='existing_feed':
            if not transaction.get('statement_id'):raise ValueError('Deze transactie heeft geen Odoo-bankregel-ID. Gebruik de Odoo-bankfeed of map de bestaande bankregel vóór aflettering.')
            statement=self.call('account.bank.statement.line','read',[[transaction['statement_id']]],{'fields':['move_id','amount','date','journal_id']})[0]
            if round(statement['amount']*100)!=transaction['amount'] or statement['date']!=transaction['date'] or statement['journal_id'][0]!=int(cfg['odoo_bank_journal']):raise ValueError('Odoo-bankregel sluit niet aan op deze transactie.')
            lines=self.search('account.move.line',[['move_id','=',statement['move_id'][0]],['account_id','!=',int(cfg['odoo_bank_account'])]],['id','account_id','debit','credit','reconciled'])
            if len(lines)!=1 or round(lines[0]['debit']*100)!=abs(transaction['amount']) or (lines[0]['reconciled'] and not existing):raise ValueError('Odoo-bankregel is al verwerkt of bevat meerdere tegenboekingen.')
            statement_line=lines[0];counterpart=statement_line['account_id'][0]
            account=self.call('account.account','read',[[counterpart]],{'fields':['reconcile']})[0]
            if not account['reconcile']:raise ValueError('De Odoo-tussenrekening voor banktransacties is niet afletterbaar.')
        if existing:move=existing[0]['id']
        else:
            amount=abs(transaction['amount'])/100;partner=invoice['partner_id'][0]
            move=self.call('account.move','create',[{'move_type':'entry','journal_id':int(cfg['odoo_bank_journal']),'date':transaction['date'],'ref':ref,'line_ids':[[0,0,{'name':transaction['description'],'account_id':payable[0]['account_id'][0],'partner_id':partner,'debit':amount,'credit':0}],[0,0,{'name':transaction['description'],'account_id':counterpart,'credit':amount,'debit':0}]]}])
        if not existing or existing[0]['state']=='draft':self.call('account.move','action_post',[[move]])
        bank_lines=self.search('account.move.line',[['move_id','=',move],['account_id','=',payable[0]['account_id'][0]],['reconciled','=',False]],['id'])
        if not bank_lines:raise ValueError('Bankboeking is al afgeletterd; controleer in Odoo.')
        if statement_line:
            suspense=self.search('account.move.line',[['move_id','=',move],['account_id','=',counterpart],['reconciled','=',False]],['id'])
            if suspense:self.call('account.move.line','reconcile',[[statement_line['id'],suspense[0]['id']]])
        self.call('account.move.line','reconcile',[[payable[0]['id'],bank_lines[0]['id']]])
        return move

    def journal_entry(self,ref,day,journal,lines):
        existing=self.search('account.move',[['ref','=',ref]],['id','state'])
        if len(existing)>1:raise ValueError('Meerdere Odoo-bankboekingen met hetzelfde kenmerk gevonden.')
        move=existing[0]['id'] if existing else self.call('account.move','create',[{'move_type':'entry','journal_id':int(journal),'date':day,'ref':ref,'line_ids':[[0,0,line] for line in lines]}])
        if not existing or existing[0]['state']=='draft':self.call('account.move','action_post',[[move]])
        elif existing[0]['state']!='posted':raise ValueError('Bankboeking is geannuleerd in Odoo.')
        return move

    def sumup_sale(self,t):
        cfg=self.cfg
        required=('odoo_sales_journal','odoo_sales_account','odoo_sumup_clearing_account','odoo_fee_account','odoo_bank_journal','odoo_bank_account')
        if any(not cfg.get(k) for k in required):raise ValueError('Configureer eerst alle SumUp-rekeningen en dagboeken.')
        if t['amount']<=0 or t['vat_rate'] not in (9,21):raise ValueError('SumUp-boeking vereist positieve EUR-omzet met 9% of 21% btw.')
        mapping=cfg.get('odoo_output_tax_map',{});tax=mapping.get(str(t['vat_rate']))
        if type(tax) is not int:raise ValueError('Odoo-verkoop-btw-mapping ontbreekt.')
        clearing=int(cfg['odoo_sumup_clearing_account'])
        account=self.call('account.account','read',[[clearing]],{'fields':['account_type','reconcile']})[0]
        if account['account_type']!='asset_receivable' or not account['reconcile']:raise ValueError('SumUp-tussenrekening moet in Odoo een afletterbare debiteurenrekening zijn.')
        partners=self.search('res.partner',[['name','=','Moonshine SumUp pinomzet']],['id'])
        if len(partners)>1:raise ValueError('Meerdere SumUp-relaties gevonden.')
        partner=partners[0]['id'] if partners else self.call('res.partner','create',[{'name':'Moonshine SumUp pinomzet','customer_rank':1}])
        ref='MOONSHINE/SUMUP/'+t['id']
        existing=self.search('account.move',[['ref','=',ref]],['id','state'])
        if len(existing)>1:raise ValueError('Dubbele SumUp-boeking gevonden.')
        net=int((Decimal(t['amount'])*100/(100+t['vat_rate'])).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
        currency=self.search('res.currency',[['name','=','EUR']],['id'])
        if not currency:raise ValueError('EUR-valuta ontbreekt in Odoo.')
        move=existing[0]['id'] if existing else self.call('account.move','create',[{'move_type':'out_invoice','partner_id':partner,'journal_id':int(cfg['odoo_sales_journal']),'currency_id':currency[0]['id'],'invoice_date':t['date'],'ref':ref,'invoice_line_ids':[[0,0,{'name':t['description'],'quantity':1,'price_unit':net/100,'account_id':int(cfg['odoo_sales_account']),'tax_ids':[[6,0,[tax]]]}]]}])
        actual=self.call('account.move','read',[[move]],{'fields':['state','amount_total']})[0]
        if abs(round(actual['amount_total']*100)-t['amount'])>1:raise ValueError('SumUp-totaal wijkt in Odoo af; controleer verkoop-btw-code.')
        if actual['state']=='draft':
            receivable=self.search('account.move.line',[['move_id','=',move],['account_id.account_type','=','asset_receivable']],['id'])
            self.call('account.move.line','write',[[x['id'] for x in receivable],{'account_id':clearing}])
            self.call('account.move','action_post',[[move]])
        elif actual['state']!='posted':raise ValueError('SumUp-boeking heeft een ongeldige status.')
        if t['fee']:
            self.journal_entry(ref+'/FEE',t['date'],cfg['odoo_bank_journal'],[{'name':'SumUp transactiekosten','account_id':int(cfg['odoo_fee_account']),'debit':t['fee']/100,'credit':0},{'name':'SumUp transactiekosten','account_id':clearing,'partner_id':partner,'debit':0,'credit':t['fee']/100}])
        return move,partner

    def sumup_settlement(self,t,sales):
        cfg=self.cfg
        if not cfg.get('odoo_sumup_clearing_account'):raise ValueError('Configureer eerst de SumUp-tussenrekening onder Koppelingen.')
        clearing=int(cfg['odoo_sumup_clearing_account']);partners=[]
        if cfg.get('bank_mode') not in ('existing_feed','exclusive_import'):raise ValueError('Kies eerst de ING-aanvoermodus onder Odoo.')
        if cfg['bank_mode']=='existing_feed' and not t.get('statement_id'):raise ValueError('Koppel de uitbetaling aan een bestaande Odoo-bankregel vóór verwerking.')
        for sale in sales:
            if sale['amount']<=0 or sale['vat_rate'] not in (9,21):raise ValueError('Alle pintransacties vereisen een positieve omzet en een bekend btw-tarief.')
        for sale in sales:
            move,partner=self.sumup_sale(sale);partners.append(partner)
            Transaction.objects.filter(id=sale['id']).update(odoo_id=move,status='posted')
        if len(set(partners))!=1:raise ValueError('SumUp-relaties sluiten niet aan.')
        partner=partners[0]
        if cfg.get('bank_mode') not in ('existing_feed','exclusive_import'):raise ValueError('Kies eerst de ING-aanvoermodus onder Odoo.')
        counterpart=int(cfg['odoo_bank_account']);statement_line=None
        if cfg['bank_mode']=='existing_feed':
            if not t.get('statement_id'):raise ValueError('Koppel de uitbetaling aan een bestaande Odoo-bankregel vóór verwerking.')
            statement=self.call('account.bank.statement.line','read',[[t['statement_id']]],{'fields':['move_id','amount','date','journal_id']})[0]
            if round(statement['amount']*100)!=t['amount'] or statement['date']!=t['date'] or statement['journal_id'][0]!=int(cfg['odoo_bank_journal']):raise ValueError('Odoo-uitbetaling sluit niet aan.')
            lines=self.search('account.move.line',[['move_id','=',statement['move_id'][0]],['account_id','!=',int(cfg['odoo_bank_account'])]],['id','account_id','debit','credit','reconciled'])
            if len(lines)!=1 or round(lines[0]['credit']*100)!=t['amount']:raise ValueError('Odoo-uitbetaling bevat meerdere tegenboekingen.')
            statement_line=lines[0];counterpart=statement_line['account_id'][0]
            account=self.call('account.account','read',[[counterpart]],{'fields':['reconcile']})[0]
            if not account['reconcile']:raise ValueError('Odoo-banktussenrekening is niet afletterbaar.')
        move=self.journal_entry('MOONSHINE/PAYOUT/'+t['id'],t['date'],cfg['odoo_bank_journal'],[{'name':t['description'],'account_id':counterpart,'debit':t['amount']/100,'credit':0},{'name':t['description'],'account_id':clearing,'partner_id':partner,'debit':0,'credit':t['amount']/100}])
        if statement_line and not statement_line['reconciled']:
            suspense=self.search('account.move.line',[['move_id','=',move],['account_id','=',counterpart],['reconciled','=',False]],['id'])
            if suspense:self.call('account.move.line','reconcile',[[statement_line['id'],suspense[0]['id']]])
        refs=['MOONSHINE/SUMUP/'+s['id'] for s in sales]+['MOONSHINE/SUMUP/'+s['id']+'/FEE' for s in sales]+['MOONSHINE/PAYOUT/'+t['id']]
        moves=self.search('account.move',[['ref','in',refs],['state','=','posted']],['id'])
        lines=self.search('account.move.line',[['move_id','in',[x['id'] for x in moves]],['account_id','=',clearing],['reconciled','=',False]],['id','amount_residual'])
        if lines:
            if abs(sum(round(l['amount_residual']*100) for l in lines))>1:raise ValueError('Odoo-tussenrekening sluit niet op nul; controleer de uitbetaling.')
            self.call('account.move.line','reconcile',[[l['id'] for l in lines]])
        return move


def odoo_catalog(o):
    account_fields=o.call('account.account','fields_get',[],{'attributes':['type']})
    if 'active' in account_fields:domain=[['active','=',True]]
    elif 'deprecated' in account_fields:domain=[['deprecated','=',False]]
    else:raise ValueError('Odoo-rekeningvelden worden niet ondersteund. Controleer de Odoo-versie.')
    return {'journals':o.search('account.journal',[['type','in',['purchase','bank']]],['id','name','type']),
            'accounts':o.search('account.account',domain,['id','code','name','account_type']),
            'taxes':o.search('account.tax',[['type_tax_use','=','purchase'],['active','=',True]],['id','name','amount'])}

def odoo_overview():
    """Live, bounded read view. Never imports documents or writes to Odoo."""
    o=Odoo();cfg=settings()
    domain=[['move_type','in',['in_invoice','in_refund']]]
    counts={name:o.call('account.move','search_count',[domain+extra]) for name,extra in (
        ('total',[]),('draft',[['state','=','draft']]),('posted',[['state','=','posted']]),
        ('unpaid',[['state','=','posted'],['payment_state','in',['not_paid','partial','in_payment']]]))}
    invoices=o.call('account.move','search_read',[domain],{'fields':['id','name','ref','move_type','partner_id','invoice_date','amount_total','amount_residual','currency_id','state','payment_state'],'limit':50,'order':'invoice_date desc, id desc'})
    return {'checked':time.time(),'counts':counts,'invoices':invoices,'catalog':odoo_catalog(o),
            'mapping':{k:cfg.get(k) for k in ('odoo_purchase_journal','odoo_expense_account','odoo_bank_journal','odoo_bank_account','odoo_tax_map')}}

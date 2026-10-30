"""Conservative classification, matching and VAT reporting; Odoo remains the ledger."""
from decimal import Decimal, ROUND_HALF_UP
import re
from datetime import date

def cents(value):
    if isinstance(value,bool): raise ValueError('Bedrag ongeldig')
    text=str(value).strip().replace('€','').replace(' ','')
    if ',' in text: text=text.replace('.','').replace(',','.')
    d=Decimal(text)
    if not d.is_finite():raise ValueError('Bedrag ongeldig')
    return int((d*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))

def validate_invoice(d):
    errors=[]
    for key,label in [('supplier','Crediteur'),('number','Factuurnummer'),('date','Factuurdatum')]:
        if not str(d.get(key,'')).strip():errors.append(label+' ontbreekt')
    try:date.fromisoformat(d.get('date',''))
    except (ValueError,TypeError):errors.append('Factuurdatum is ongeldig')
    lines=d.get('lines',[])
    if not lines:errors.append('Factuurregels ontbreken')
    subtotal=0; vat=0
    for line in lines:
        if type(line.get('net')) is not int or line['net']<=0:errors.append('Regelbedrag moet positief zijn');continue
        if line.get('tax') not in ('9','21','0','reverse_eu','reverse_non_eu','exempt'):errors.append('Kies een geldige btw-code');continue
        subtotal+=line['net']; vat+=int((Decimal(line['net'])*Decimal(line.get('tax') if line.get('tax') in ('9','21') else '0')/100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
    if type(d.get('total')) is not int or abs(subtotal+vat-d.get('total',0))>2:errors.append('Totaal sluit niet aan op factuurregels en btw')
    iban=re.sub(r'\s','',str(d.get('iban','')).upper())
    if iban:
        if not re.fullmatch(r'[A-Z]{2}\d{2}[A-Z0-9]{11,30}',iban):errors.append('IBAN is ongeldig')
        else:
            translated=''.join(str(ord(x)-55) if x.isalpha() else x for x in iban[4:]+iban[:4])
            if int(translated)%97!=1:errors.append('IBAN-controle mislukt')
    if any(x.get('tax') in ('reverse_eu','reverse_non_eu') for x in lines) and not d.get('reverse_confirmed'):errors.append('Bevestig dat btw-verlegging van toepassing is')
    return list(dict.fromkeys(errors))

def suggest_matches(transactions,documents):
    suggestions=[]
    for t in transactions:
        if t['amount']>=0 or t['status']!='open':continue
        candidates=[]
        for d in documents:
            if d['status']!='posted':continue
            info=d['details']
            if abs(abs(t['amount'])-info.get('total',-999))>1:continue
            text=t['description'].casefold()
            number=str(info.get('number','')).casefold()
            names=[info.get('supplier',''),*info.get('aliases',[])]
            evidence=[];score=65
            if number and len(number)>2 and re.search(r'(?<!\w)'+re.escape(number)+r'(?!\w)',text):score=99;evidence.append('Factuurnummer')
            elif any(n and len(n)>3 and n.casefold() in text for n in names):score=94;evidence.append('Naam of alias')
            evidence.append('Exact bedrag')
            candidates.append({'transaction_id':t['id'],'document_id':d['id'],'score':score,'reasons':evidence,'supplier':info.get('supplier') or d.get('name','Factuur')})
        candidates.sort(key=lambda x:-x['score'])
        if candidates:
            top=candidates[0]; top['ambiguous']=len(candidates)>1 and candidates[1]['score']==top['score']; suggestions.append(top)
    return suggestions

def vat_report(documents,transactions,year,quarter):
    start=f'{year}-{(quarter-1)*3+1:02d}-01'
    end=f'{year+1}-01-01' if quarter==4 else f'{year}-{quarter*3+1:02d}-01'
    boxes={k:{'base':0,'tax':0} for k in ('1a','1b','4a','4b','5b')}
    exclusions=0
    for d in documents:
        info=d['details']
        if d['status']!='posted' or not start<=info.get('date','')<end:continue
        for line in info.get('lines',[]):
            net=line['net'];tax=line['tax']
            if tax in ('9','21') and line.get('deductible',True):boxes['5b']['tax']+=int((Decimal(net)*Decimal(tax)/100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
            elif tax.startswith('reverse_'):
                if not info.get('reverse_confirmed'):exclusions+=1;continue
                key='4b' if tax=='reverse_eu' else '4a'
                rate=Decimal(str(line.get('reverse_rate',21)))
                v=int((Decimal(net)*rate/100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
                boxes[key]['base']+=net;boxes[key]['tax']+=v
                if line.get('deductible',True):boxes['5b']['tax']+=v
    for t in transactions:
        if not start<=t['date']<end or t['category']!='sales':continue
        rate=t['vat_rate']
        if rate not in (9,21):exclusions+=1;continue
        gross=t['amount']
        if gross<=0:continue
        net=int((Decimal(gross)*100/(100+rate)).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
        key='1a' if rate==21 else '1b';boxes[key]['base']+=net;boxes[key]['tax']+=gross-net
    due=sum(boxes[k]['tax'] for k in ('1a','1b','4a','4b'))-boxes['5b']['tax']
    return {'year':year,'quarter':quarter,'boxes':boxes,'due':due,'excluded':exclusions,'provisional':True,'note':'Werkoverzicht: alleen geboekte facturen en geclassificeerde omzet. Controleer met het btw-rapport in Odoo vóór indiening.'}

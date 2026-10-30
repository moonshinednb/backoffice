"""Invoice intake, reading, posting to Odoo, bank lines and the archive.

Claims are conditional updates (`filter(status=...).update(...)`), so two
workers or a user and a worker can never post the same invoice twice; this
works the same on SQLite and PostgreSQL."""
import base64
import csv
import hashlib
import io
import os
import urllib.parse
from datetime import date
from pathlib import Path
from django.db import IntegrityError, transaction
from core.services import DATA, audit, safe_error, settings
from integrations.http import HttpError
from .accounting import cents, suggest_matches, validate_invoice, vat_report
from .models import Document, ProcessedMessage, Transaction

MAX_FILE = 15 * 1024 * 1024
MIMES = ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')


def as_dict(doc):
    return {'id': doc.id, 'name': doc.name, 'mime': doc.mime, 'size': doc.size, 'source': doc.source, 'status': doc.status,
            'details': doc.details or {}, 'odoo_id': doc.odoo_id, 'error': doc.error,
            'created': doc.created.timestamp(), 'updated': doc.updated.timestamp()}


def tx_dict(t):
    return {'id': t.id, 'external_id': t.external_id, 'source': t.source, 'date': t.date.isoformat(), 'description': t.description,
            'amount': t.amount, 'fee': t.fee, 'vat_rate': t.vat_rate, 'category': t.category, 'status': t.status,
            'document_id': t.document_id, 'odoo_id': t.odoo_id, 'payout_id': t.payout_id, 'statement_id': t.statement_id}


def file_type(content):
    if content.startswith(b'%PDF-'):
        return 'application/pdf'
    if content.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if content.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        return 'image/webp'
    raise ValueError('Alleen PDF, JPG, PNG en WebP worden ondersteund.')


def ingest(name, mime, content, source='upload'):
    """Store an original once (exact-file dedupe) and queue it for reading."""
    from jobs.queue import enqueue
    if len(content) > MAX_FILE:
        raise ValueError('Maximaal 15 MB per bestand.')
    sha = hashlib.sha256(content).hexdigest()
    existing = Document.objects.filter(sha=sha).first()
    if existing:
        return existing.id, True
    doc = Document(name=Path(name.replace('\\', '/')).name[:180] or 'Factuur', mime=mime, sha=sha, size=len(content), source=source)
    path = DATA / 'files' / doc.id
    with path.open('xb') as output:
        if os.name != 'nt':
            os.fchmod(output.fileno(), 0o600)
        output.write(content)
    try:
        doc.save()
    except IntegrityError:
        path.unlink(missing_ok=True)
        return Document.objects.get(sha=sha).id, True
    enqueue('read_invoice', {'document_id': doc.id}, key=doc.id)
    return doc.id, False


def process_document(ident, retry=False):
    """Read one invoice with Claude. Claimed atomically so a retry landing
    while the worker is busy never causes a second paid API call."""
    from integrations.claude import extract
    statuses = ['awaiting_ai', 'review'] if retry else ['awaiting_ai']
    if not Document.objects.filter(id=ident, status__in=statuses).update(status='processing', error=None):
        return
    doc = as_dict(Document.objects.get(id=ident))
    try:
        details = extract(doc)
        errors = validate_invoice(details)
        if details.get('currency') != 'EUR':
            errors.append('Vreemde valuta vereist handmatige verwerking in Odoo')
        if Document.objects.exclude(id=ident).filter(details__supplier=details.get('supplier'), details__number=details.get('number')).exists():
            errors.append('Mogelijke dubbele factuur')
        Document.objects.filter(id=ident).update(details=details, status='review', error='; '.join(errors) or None)
        audit('worker', 'Factuur uitgelezen', ident)
        if not errors and float(details.get('confidence', 0)) >= .98 and settings().get('auto_post'):
            post_document(ident, 'worker')
    except Exception as e:
        message = safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else 'Verwerking mislukt. Controleer de koppeling en probeer opnieuw.'
        Document.objects.filter(id=ident).update(status='review', error=message)
        audit('worker', 'Verwerking vraagt controle', ident, message)


def save_review(ident, details, actor):
    with transaction.atomic():
        doc = Document.objects.select_for_update().get(id=ident)
        if doc.status in ('posted', 'processing') or doc.odoo_id:
            raise ValueError('Deze factuur is al in verwerking of gekoppeld aan Odoo. Corrigeer de bestaande Odoo-boeking.')
        errors = validate_invoice(details)
        doc.details, doc.status, doc.error = details, 'review', '; '.join(errors) or None
        doc.save()
    audit(actor, 'Factuur gecontroleerd', ident)
    return errors


def post_document(ident, actor):
    """Post to Odoo. The claim is local and short; the Odoo calls run without
    any lock held."""
    from integrations.odoo import Odoo
    doc = Document.objects.filter(id=ident).first()
    if not doc:
        raise ValueError('Factuur niet gevonden.')
    if doc.status == 'posted':
        return doc.odoo_id
    if Document.objects.exclude(id=ident).filter(status='posted', details__supplier=doc.details.get('supplier'),
                                                 details__number=doc.details.get('number')).exists():
        raise ValueError('Deze factuur is al geboekt.')
    if not Document.objects.filter(id=ident).exclude(status__in=['processing', 'posted']).update(status='processing'):
        raise ValueError('Deze factuur wordt al verwerkt.')
    doc.refresh_from_db()
    if doc.details.get('currency', 'EUR') != 'EUR':
        Document.objects.filter(id=ident).update(status='review')
        raise ValueError('Vreemde valuta vereist verwerking in Odoo.')
    try:
        move = Odoo().post(as_dict(doc))
    except Exception:
        Document.objects.filter(id=ident).update(status='review', odoo_id=None)
        raise
    Document.objects.filter(id=ident).update(status='posted', odoo_id=move, error=None)
    audit(actor, 'Geboekt in Odoo', ident, str(move))
    if settings().get('onedrive_enabled'):
        from jobs.queue import enqueue
        enqueue('archive_invoice', {'document_id': ident}, key=ident)
    return move


def unlink_document(ident, actor):
    doc = Document.objects.filter(id=ident).first()
    if not doc:
        raise ValueError('Factuur niet gevonden.')
    if doc.status == 'posted' and doc.odoo_id:
        raise ValueError('Deze factuur is geboekt. Verwijder de boeking eerst in Odoo.')
    Document.objects.filter(id=ident).update(status='review', odoo_id=None)
    audit(actor, 'Boekkoppeling verbroken', ident)


def archive_onedrive(ident):
    """Copy a posted invoice to <archive folder>/<year>/ in OneDrive."""
    from integrations.graph import drive_upload
    cfg = settings()
    if not cfg.get('onedrive_enabled'):
        return
    doc = Document.objects.get(id=ident)
    year = (doc.details.get('date') or '')[:4] or 'Onbekend'
    folder = (cfg.get('onedrive_folder') or 'Moonshine/Administratie').strip('/')
    name = doc.id + '-' + doc.name.replace('/', '_').replace('\\', '_')
    _, url = drive_upload(f'{folder}/{year}/{name}', (DATA / 'files' / doc.id).read_bytes(), doc.mime)
    details = dict(doc.details)
    details['onedrive_url'] = url
    Document.objects.filter(id=ident).update(details=details)


def poll_mail():
    """Fetch invoice attachments from the finance inbox (latest 50)."""
    from integrations.graph import graph
    cfg = settings()
    if not cfg.get('mail_enabled'):
        return
    base = '/users/' + urllib.parse.quote(cfg.get('finance_email', 'finance@moonshinednb.nl'), safe='')
    r = graph(base + '/mailFolders/inbox/messages?$filter=hasAttachments%20eq%20true&$select=id,subject,receivedDateTime&$top=50&$orderby=receivedDateTime%20desc')
    for message in reversed(r.get('value', [])):
        ext = 'mail/' + message['id']
        if ProcessedMessage.objects.filter(external_id=ext).exists():
            continue
        for a in graph(base + '/messages/' + urllib.parse.quote(message['id'], safe='') + '/attachments').get('value', []):
            mime, data = a.get('contentType', ''), a.get('contentBytes')
            if mime not in MIMES or not data or a.get('isInline'):
                continue
            ident, duplicate = ingest(a.get('name', 'Factuur'), mime, base64.b64decode(data), 'Outlook')
            if not duplicate:
                audit('Outlook', 'Factuur ontvangen', ident)
        ProcessedMessage.objects.get_or_create(external_id=ext)


def poll_odoo_bank():
    """Import unreconciled ING statement lines from the Odoo bank journal."""
    from integrations.odoo import Odoo
    cfg = settings()
    if not cfg.get('odoo_bank_feed'):
        return
    if not cfg.get('odoo_bank_journal'):
        raise ValueError('Kies eerst het ING-bankdagboek in Odoo.')
    rows = Odoo().search('account.bank.statement.line', [['journal_id', '=', int(cfg['odoo_bank_journal'])], ['is_reconciled', '=', False]],
                         ['id', 'date', 'payment_ref', 'amount'])
    for r in rows:
        Transaction.objects.get_or_create(external_id='ING/ODOO-' + str(r['id']), defaults={
            'source': 'ING', 'date': r['date'], 'description': r.get('payment_ref') or 'Odoo banktransactie',
            'amount': round(r['amount'] * 100), 'statement_id': r['id']})


def transaction_values(raw, source):
    day = date.fromisoformat(str(raw.get('date', '')))
    amount, fee = cents(raw.get('amount', '')), cents(raw.get('fee') or '0')
    if fee < 0:
        raise ValueError('Kosten moeten positief zijn.')
    description = str(raw.get('description', '')).strip()[:1000]
    if not description:
        raise ValueError('Transactieomschrijving ontbreekt.')
    external = str(raw.get('external_id', '')).strip()
    if not external:
        raise ValueError('Elke transactie vereist een uniek external_id uit je bankexport.')
    category = raw.get('category') or ('sales' if source == 'SumUp' and amount > 0 else 'unknown')
    if category not in ('sales', 'settlement', 'fee', 'unknown'):
        raise ValueError('Ongeldige transactiecategorie.')
    rate = int(raw['vat_rate']) if raw.get('vat_rate') not in (None, '') else None
    if rate not in (None, 0, 9, 21):
        raise ValueError('Btw-tarief moet 0, 9 of 21 zijn.')
    return Transaction(external_id=source + '/' + external, source=source, date=day, description=description, amount=amount, fee=fee,
                       vat_rate=rate, category=category, payout_id=str(raw.get('payout_id', '')).strip()[:200],
                       statement_id=int(raw['odoo_statement_id']) if raw.get('odoo_statement_id') else None)


def insert_transactions(rows):
    existing = set(Transaction.objects.filter(external_id__in=[r.external_id for r in rows]).values_list('external_id', flat=True))
    fresh = {r.external_id: r for r in rows if r.external_id not in existing}
    Transaction.objects.bulk_create(fresh.values(), ignore_conflicts=True)
    return len(fresh)


def import_csv(text, source, actor):
    if source not in ('ING', 'SumUp'):
        raise ValueError('Kies ING of SumUp.')
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=';,\t')
    except csv.Error:
        raise ValueError('Gebruik het CSV-template uit de bankpagina.') from None
    reader = csv.DictReader(io.StringIO(text.lstrip('﻿')), dialect=dialect)
    if not {'date', 'description', 'amount'}.issubset(reader.fieldnames or []):
        raise ValueError('CSV-kolommen vereist: date, description, amount. Download het template.')
    rows = []
    for raw in reader:
        if len(rows) >= 10000:
            raise ValueError('Maximaal 10.000 transacties per import.')
        rows.append(transaction_values(raw, source))
    if not rows:
        raise ValueError('Geen transacties gevonden.')
    added = insert_transactions(rows)
    audit(actor, 'Bankexport geïmporteerd', source, str(added))
    return {'added': added, 'duplicates': len(rows) - added}


def match(transaction_id, document_id, actor):
    from integrations.odoo import Odoo
    t = Transaction.objects.filter(id=transaction_id, status='open').first()
    doc = Document.objects.filter(id=document_id, status='posted').first()
    if not t or not doc:
        raise ValueError('Selecteer een open transactie en een geboekte factuur.')
    if t.amount >= 0 or abs(t.amount) != doc.details.get('total'):
        raise ValueError('Bedragen sluiten niet aan.')
    if Transaction.objects.filter(document_id=doc.id, status='matched').exists():
        raise ValueError('Factuur is al afgeletterd.')
    odoo_id = Odoo().reconcile(tx_dict(t), as_dict(doc))
    Transaction.objects.filter(id=t.id).update(status='matched', document_id=doc.id, odoo_id=odoo_id)
    audit(actor, 'Banktransactie afgeletterd in Odoo', t.id)


def auto_match():
    tx = [tx_dict(t) for t in Transaction.objects.filter(status='open', amount__lt=0)[:500]]
    docs = [as_dict(d) for d in Document.objects.filter(status='posted')[:500]]
    for m in suggest_matches(tx, docs):
        if m['score'] < 99 or m['ambiguous']:
            continue
        try:
            match(m['transaction_id'], m['document_id'], 'worker')
            audit('worker', 'Banktransactie automatisch afgeletterd', m['transaction_id'])
        except (ValueError, RuntimeError) as e:
            audit('worker', 'Bankmatch vraagt controle', m['transaction_id'], str(e))


def settle_sumup(ident, actor):
    from integrations.odoo import Odoo
    t = Transaction.objects.filter(id=ident).first()
    if not t:
        raise ValueError('Uitbetaling niet gevonden.')
    if t.status == 'matched':
        return t.odoo_id
    if t.source != 'ING' or t.category != 'settlement' or t.amount <= 0 or not t.payout_id:
        raise ValueError('Kies een positieve ING-uitbetaling met payout_id.')
    sales = list(Transaction.objects.filter(source='SumUp', category='sales', payout_id=t.payout_id))
    if not sales:
        raise ValueError('Geen SumUp-transacties met hetzelfde payout_id gevonden.')
    if any(s.status == 'matched' for s in sales):
        raise ValueError('Deze pintransacties zijn al afgeletterd.')
    if Transaction.objects.exclude(id=t.id).filter(source='ING', category='settlement', payout_id=t.payout_id).exists():
        raise ValueError('Meerdere ING-uitbetalingen voor hetzelfde payout_id: handmatige controle vereist.')
    if sum(s.amount - s.fee for s in sales) != t.amount:
        raise ValueError('Bruto pinomzet min kosten sluit niet aan op de ING-uitbetaling.')
    move = Odoo().sumup_settlement(tx_dict(t), [tx_dict(s) for s in sales])
    Transaction.objects.filter(id=ident).update(status='matched', odoo_id=move)
    Transaction.objects.filter(id__in=[s.id for s in sales]).update(status='matched')
    audit(actor, 'SumUp-uitbetaling geboekt en afgeletterd', ident, str(move))
    return move


def vat(year, quarter):
    if quarter not in (1, 2, 3, 4) or not 2000 <= year <= 2100:
        raise ValueError('Ongeldig kwartaal.')
    docs = [as_dict(d) for d in Document.objects.filter(status='posted')]
    tx = [tx_dict(t) for t in Transaction.objects.filter(category='sales')]
    return vat_report(docs, tx, year, quarter)


def export_csv():
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')
    writer.writerow(['id', 'bestand', 'crediteur', 'factuurnummer', 'datum', 'totaal_eur', 'status', 'odoo_id'])
    for d in Document.objects.order_by('created'):
        i = d.details or {}
        values = [d.id, d.name, i.get('supplier', ''), i.get('number', ''), i.get('date', ''), f"{(i.get('total') or 0) / 100:.2f}", d.status, d.odoo_id or '']
        writer.writerow(["'" + str(v) if str(v).startswith(('=', '+', '-', '@', '\t', '\r')) else v for v in values])
    return '﻿' + stream.getvalue()


def matches():
    tx = [tx_dict(t) for t in Transaction.objects.filter(status='open')[:400]]
    docs = [as_dict(d) for d in Document.objects.filter(status='posted')[:400]]
    return suggest_matches(tx, docs)


__all__ = ['HttpError']

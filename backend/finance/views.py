"""Finance endpoints: invoices, bank, VAT, Odoo. Admin, finance and viewer
(read-only) only; the production role has no finance access."""
from datetime import date
from django.http import FileResponse, HttpResponse
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from core.access import actor, body, require
from core.services import DATA, audit
from . import services as S
from .models import Document, Transaction

router = Router()


@router.get('/documents')
def documents(request, limit: int = 400, offset: int = 0):
    require(request, 'finance')
    limit = min(2000, max(1, limit))
    rows = Document.objects.all()[offset:offset + limit]
    return {'documents': [S.as_dict(d) for d in rows], 'total': Document.objects.count()}


@router.post('/documents/upload')
def upload(request, files: list[UploadedFile] = File(...)):
    require(request, 'finance', write=True)
    result = []
    for f in files:
        content = f.read()
        ident, duplicate = S.ingest(f.name, S.file_type(content), content)
        result.append({'id': ident, 'duplicate': duplicate, 'name': f.name})
        if not duplicate:
            audit(actor(request), 'Factuur geüpload', ident, f.name)
    if not result:
        raise HttpError(400, 'Geen bestanden ontvangen.')
    return {'files': result}


def _doc(ident):
    doc = Document.objects.filter(id=ident).first()
    if not doc:
        raise HttpError(404, 'Factuur niet gevonden.')
    return doc


@router.get('/documents/{ident}/file')
def document_file(request, ident: str):
    require(request, 'finance')
    doc = _doc(ident)
    response = FileResponse((DATA / 'files' / doc.id).open('rb'), content_type=doc.mime, as_attachment=True, filename=doc.name)
    return response


@router.patch('/documents/{ident}')
def review(request, ident: str):
    require(request, 'finance', write=True)
    details = body(request).get('details')
    if not isinstance(details, dict):
        raise HttpError(400, 'Ongeldige factuurgegevens.')
    _doc(ident)
    return {'ok': True, 'warnings': S.save_review(ident, details, actor(request))}


@router.post('/documents/{ident}/retry')
def retry(request, ident: str):
    require(request, 'finance', write=True)
    from jobs.queue import enqueue
    doc = _doc(ident)
    if doc.status == 'processing':
        raise HttpError(400, 'Deze factuur wordt al verwerkt.')
    Document.objects.filter(id=ident, status='review').update(status='awaiting_ai')
    enqueue('read_invoice', {'document_id': ident}, key=ident)
    return {'ok': True}


@router.post('/documents/{ident}/post')
def post(request, ident: str):
    require(request, 'finance', write=True)
    return {'ok': True, 'odoo_id': S.post_document(ident, actor(request))}


@router.post('/documents/{ident}/unlink')
def unlink(request, ident: str):
    require(request, 'finance', write=True)
    S.unlink_document(ident, actor(request))
    return {'ok': True}


@router.get('/export')
def export(request):
    require(request, 'finance')
    response = HttpResponse(S.export_csv().encode(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="moonshine-facturen.csv"'
    return response


@router.get('/transactions')
def transactions(request, status: str = 'all', limit: int = 1000):
    require(request, 'finance')
    rows = Transaction.objects.all() if status == 'all' else Transaction.objects.filter(status=status)
    rows = rows.order_by('-date')[:min(2000, max(1, limit))]
    return {'transactions': [S.tx_dict(t) for t in rows], 'matches': S.matches() if status in ('open', 'all') else []}


@router.post('/transactions/import')
def import_transactions(request):
    require(request, 'finance', write=True)
    d = body(request)
    return S.import_csv(str(d.get('csv', '')), d.get('source', 'ING'), actor(request))


@router.patch('/transactions/{ident}')
def classify(request, ident: str):
    require(request, 'finance', write=True)
    d = body(request)
    if d.get('category') not in ('sales', 'settlement', 'fee', 'unknown'):
        raise HttpError(400, 'Ongeldige categorie.')
    if d.get('vat_rate') not in (None, 0, 9, 21):
        raise HttpError(400, 'Ongeldig btw-tarief.')
    t = Transaction.objects.filter(id=ident).first()
    if not t:
        raise HttpError(404, 'Transactie niet gevonden.')
    if t.status != 'open' or t.odoo_id:
        raise HttpError(400, 'Een geboekte of afgeletterde transactie kan niet worden gewijzigd.')
    t.category, t.vat_rate = d['category'], d.get('vat_rate')
    if 'payout_id' in d:
        t.payout_id = str(d['payout_id']).strip()[:200]
    t.save()
    audit(actor(request), 'Transactie geclassificeerd', ident)
    return S.tx_dict(t)


@router.post('/transactions/match')
def match(request):
    require(request, 'finance', write=True)
    d = body(request)
    S.match(d.get('transaction_id'), d.get('document_id'), actor(request))
    return {'ok': True}


@router.post('/sumup/settle')
def settle(request):
    require(request, 'finance', write=True)
    return {'ok': True, 'odoo_id': S.settle_sumup(body(request).get('transaction_id'), actor(request))}


@router.get('/vat')
def vat(request, year: int = 0, quarter: int = 0):
    require(request, 'finance')
    today = date.today()
    return S.vat(year or today.year, quarter or (today.month - 1) // 3 + 1)


@router.get('/odoo/overview')
def odoo_overview(request):
    require(request, 'finance')
    from integrations.odoo import odoo_overview as overview
    return overview()

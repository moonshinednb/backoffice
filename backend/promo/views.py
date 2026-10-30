"""Promo endpoints: contacts, templates, campaigns."""
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from core.access import actor, body, require
from . import services as S
from .models import Campaign, Contact, Recipient, Template

router = Router()


def _campaign(ident):
    c = Campaign.objects.filter(id=ident).first()
    if not c:
        raise HttpError(404, 'Campagne niet gevonden.')
    return c


@router.get('/promo/contacts')
def contacts(request):
    require(request, 'production')
    return {'contacts': [S.contact_dict(c) for c in Contact.objects.all()[:5000]]}


@router.post('/promo/contacts')
def add_contact(request):
    require(request, 'production', write=True)
    return S.contact_save(body(request))


@router.patch('/promo/contacts/{ident}')
def edit_contact(request, ident: str):
    require(request, 'production', write=True)
    return S.contact_save(body(request), ident)


@router.delete('/promo/contacts/{ident}')
def delete_contact(request, ident: str):
    require(request, 'production', write=True)
    Contact.objects.filter(id=ident).delete()
    return {'ok': True}


@router.post('/promo/import')
def import_contacts(request, file: File[UploadedFile]):
    require(request, 'production', write=True)
    content = file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HttpError(400, 'Maximaal 10 MB.')
    if not content.startswith(b'PK'):
        raise HttpError(400, 'Gebruik een Excel-bestand (.xlsx).')
    try:
        result = S.import_excel(content, file.name or 'import.xlsx')
    except Exception:
        raise HttpError(400, 'Dit Excel-bestand kon niet worden gelezen.')
    from core.services import audit
    audit(actor(request), 'Promocontacten geïmporteerd', detail=f"{result['added']} nieuw, {result['updated']} bijgewerkt")
    return result


@router.get('/promo/templates')
def templates(request):
    require(request, 'production')
    S.ensure_templates()
    return {'templates': [{'id': t.id, 'name': t.name, 'channel': t.channel, 'subject': t.subject, 'body': t.body} for t in Template.objects.all()]}


@router.post('/promo/templates')
def save_template(request):
    require(request, 'production', write=True)
    d = body(request)
    t = Template.objects.filter(id=d.get('id') or '').first() or Template()
    t.name = str(d.get('name') or '').strip()[:100]
    t.channel = 'instagram' if d.get('channel') == 'instagram' else 'email'
    t.subject = str(d.get('subject') or '')[:300]
    t.body = str(d.get('body') or '')[:20000]
    if not t.name or not t.body.strip():
        raise HttpError(400, 'Geef het sjabloon een naam en tekst.')
    t.save()
    return {'id': t.id}


@router.delete('/promo/templates/{ident}')
def delete_template(request, ident: str):
    require(request, 'production', write=True)
    Template.objects.filter(id=ident).delete()
    return {'ok': True}


@router.get('/promo/campaigns')
def campaigns(request):
    require(request, 'production')
    return {'campaigns': [S.campaign_dict(c) for c in Campaign.objects.select_related('release')[:200]]}


@router.post('/promo/campaigns')
def create_campaign(request):
    require(request, 'production', write=True)
    return S.campaign_create(body(request), actor(request))


@router.get('/promo/campaigns/{ident}')
def campaign(request, ident: str):
    require(request, 'production')
    return S.campaign_dict(_campaign(ident), True)


@router.patch('/promo/campaigns/{ident}')
def update_campaign(request, ident: str):
    require(request, 'production', write=True)
    c = _campaign(ident)
    S.campaign_update(c, body(request))
    return S.campaign_dict(c, True)


@router.delete('/promo/campaigns/{ident}')
def delete_campaign(request, ident: str):
    require(request, 'production', write=True)
    c = _campaign(ident)
    if c.status == 'sending':
        raise HttpError(400, 'Deze campagne wordt nu verstuurd.')
    c.delete()
    return {'ok': True}


@router.post('/promo/campaigns/{ident}/recipients')
def recipients(request, ident: str):
    require(request, 'production', write=True)
    c = _campaign(ident)
    d = body(request)
    ids = d.get('contact_ids') if isinstance(d.get('contact_ids'), list) else []
    S.set_recipients(c, [str(i) for i in ids], 'instagram' if d.get('channel') == 'instagram' else 'email')
    return S.campaign_dict(c, True)


@router.post('/promo/campaigns/{ident}/preview')
def preview(request, ident: str):
    require(request, 'production')
    c = _campaign(ident)
    contact = Contact.objects.filter(id=body(request).get('contact_id') or '').first()
    return {'subject': S.render(c, c.subject, contact), 'body': S.render(c, c.body, contact), 'dm': S.render(c, c.dm_body, contact)}


@router.post('/promo/campaigns/{ident}/test')
def test_mail(request, ident: str):
    require(request, 'production', write=True)
    c = _campaign(ident)
    S.check_ready(c)
    to = request.auth.email
    if not to:
        raise HttpError(400, 'Vul eerst je eigen e-mailadres in bij Mijn profiel.')
    S.send_one(c, None, to=to)
    return {'ok': True, 'to': to}


@router.post('/promo/campaigns/{ident}/send')
def send(request, ident: str):
    require(request, 'production', write=True)
    c = _campaign(ident)
    if c.status == 'sending':
        raise HttpError(400, 'Deze campagne wordt al verstuurd.')
    n = S.start_sending(c, actor(request))
    return {'queued': n, **S.campaign_dict(c, True)}


@router.post('/promo/recipients/{ident}/dm')
def dm_done(request, ident: int):
    require(request, 'production', write=True)
    r = Recipient.objects.filter(id=ident, channel='instagram').first()
    if not r:
        raise HttpError(404, 'Niet gevonden.')
    r.status = 'selected' if r.status == 'done' else 'done'
    r.save(update_fields=['status'])
    return {'status': r.status}

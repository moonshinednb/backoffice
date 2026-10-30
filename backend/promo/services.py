import html as html_lib
import io
import re
import time
from django.db import transaction
from django.utils import timezone
from core.services import audit, safe_error, settings
from .models import Campaign, Contact, Recipient, Template

EMAIL_RE = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
INSTA_RE = re.compile(r'instagram\.com/([A-Za-z0-9_.]+)', re.I)
URL_RE = re.compile(r'(https?://[^\s<]+)')
SIGNATURE = 'Cheers,\n{{Sender}}Team Moonshine\n\nWEB: moonshinednb.nl\nIG: @moonshinednb\nFB: facebook.com/moonshinednb'
DEFAULTS = [
    ('Premiere / promo', 'email', 'Premiere: {{Release}} — {{Artist}}',
     "Hi {{Name}},\n\nWe’ve got some new music coming up that we’d love to pitch to you:\n\n{{Promo}}\n\n{{Releases}}\n\n"
     "Would you be interested in hosting a premiere or offering support on this one? We’d be happy to share any additional info or assets if needed.\n\n"
     "Let me know if anything stands out.\n" + SIGNATURE),
    ('Spotify-pitch', 'email', 'Playlist pitch: {{Release}} — {{Artist}}',
     "Hi {{Name}},\n\nWe just released the following and think it could be a great fit for your playlist:\n\n{{Releases}}\n\n{{Promo}}\n\n"
     "If you like it, we'd love a placement. Thanks for your time!\n\n" + SIGNATURE),
    ('Instagram DM', 'instagram', '',
     "Hey {{Name}}! 🙌\n\nFresh music we think fits your playlist:\n\n{{Releases}}\n\nWould love a spot if you're feeling it 🎧\n\n" + SIGNATURE),
]


def senders():
    return settings().get('promo_senders') or ['info@moonshinednb.nl', 'label@moonshinednb.nl']


def ensure_templates():
    if not Template.objects.exists():
        for name, channel, subject, body in DEFAULTS:
            Template.objects.create(name=name, channel=channel, subject=subject, body=body)


def contact_dict(c):
    return {'id': c.id, 'name': c.name, 'email': c.email, 'handle': c.handle, 'group': c.group, 'tag': c.tag,
            'source': c.source, 'notes': c.notes, 'active': c.active}


def norm_handle(value):
    value = str(value or '').strip()
    m = INSTA_RE.search(value)
    value = m.group(1) if m else value.lstrip('@').strip('/')
    return '@' + value if re.fullmatch(r'[A-Za-z0-9_.]{1,30}', value or '') else ''


def contact_save(payload, ident=None):
    c = Contact.objects.filter(id=ident).first() if ident else Contact()
    if ident and not c:
        raise ValueError('Contact niet gevonden.')
    for key, limit in (('name', 200), ('tag', 100), ('notes', 4000), ('source', 200)):
        if key in payload:
            setattr(c, key, str(payload[key] or '').strip()[:limit])
    if 'email' in payload:
        email = str(payload['email'] or '').strip().lower()
        if email and not EMAIL_RE.fullmatch(email):
            raise ValueError('Ongeldig e-mailadres.')
        c.email = email
    if 'handle' in payload:
        c.handle = norm_handle(payload['handle'])
    if 'group' in payload:
        if payload['group'] not in ('promo', 'playlists', 'other'):
            raise ValueError('Onbekende groep.')
        c.group = payload['group']
    if 'active' in payload:
        c.active = bool(payload['active'])
    if not c.name:
        raise ValueError('Geef het contact een naam.')
    if not c.email and not c.handle:
        raise ValueError('Vul een e-mailadres of Instagram-handle in.')
    c.save()
    return contact_dict(c)


def import_excel(content, filename):
    """Read every sheet: a header row, a name column, all e-mail addresses
    and an Instagram handle. Sheets named like 'Spotify'/'playlist' go to the
    playlist group. Existing contacts (same e-mail or handle) are updated."""
    from openpyxl import load_workbook
    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    added = updated = 0
    by_email = {c.email: c for c in Contact.objects.exclude(email='')}
    by_handle = {c.handle.lower(): c for c in Contact.objects.exclude(handle='')}
    for ws in wb.worksheets:
        rows = [[('' if v is None else str(v).strip()) for v in r] for r in ws.iter_rows(values_only=True)]
        hdr = next((i for i, r in enumerate(rows) if sum(1 for v in r if v) >= 2), None)
        if hdr is None:
            continue
        cols = [h or f'Kolom {j + 1}' for j, h in enumerate(rows[hdr])]
        low = [c.lower() for c in cols]
        name_col = next((j for j, c in enumerate(low) if any(k in c for k in ('company', 'name', 'naam', 'playlist', 'artist', 'kanaal'))), 0)
        insta_col = next((j for j, c in enumerate(low) if any(k in c for k in ('instagram', 'insta', 'handle'))), None)
        group = 'playlists' if re.search(r'spotify|playlist', ws.title, re.I) else 'promo'
        for r in rows[hdr + 1:]:
            r = r + [''] * (len(cols) - len(r))
            name = r[name_col] if name_col < len(r) else ''
            if not name:
                continue
            handle = norm_handle(r[insta_col]) if insta_col is not None else ''
            if not handle:
                for v in r:
                    m = INSTA_RE.search(v)
                    if m:
                        handle = '@' + m.group(1)
                        break
            emails = {e.lower() for v in r for e in EMAIL_RE.findall(v)}
            for email in (emails or {''}):
                if not email and not handle:
                    continue
                c = by_email.get(email) if email else by_handle.get(handle.lower())
                if c:
                    c.name, c.handle = name[:200], handle or c.handle
                    c.save(update_fields=['name', 'handle'])
                    updated += 1
                else:
                    c = Contact.objects.create(name=name[:200], email=email, handle=handle, group=group, tag=ws.title[:100], source=filename[:200])
                    if email:
                        by_email[email] = c
                    if handle:
                        by_handle[handle.lower()] = c
                    added += 1
    return {'added': added, 'updated': updated}


def campaign_dict(c, full=False):
    counts = {}
    for status, channel in c.recipients.values_list('status', 'channel'):
        counts[f'{channel}:{status}'] = counts.get(f'{channel}:{status}', 0) + 1
    out = {'id': c.id, 'name': c.name, 'kind': c.kind, 'release_id': c.release_id, 'release': c.release.title if c.release else '',
           'artist': c.artist, 'status': c.status, 'created': c.created.timestamp(), 'created_by': c.created_by, 'counts': counts}
    if full:
        out.update({'links': c.links, 'promo_text': c.promo_text, 'sender': c.sender, 'sender_name': c.sender_name,
                    'subject': c.subject, 'body': c.body, 'dm_body': c.dm_body, 'senders': senders(),
                    'recipients': [{'id': r.id, 'contact_id': r.contact_id, 'name': r.contact.name, 'email': r.contact.email, 'handle': r.contact.handle,
                                    'channel': r.channel, 'status': r.status, 'error': r.error, 'sent_at': r.sent_at.timestamp() if r.sent_at else None}
                                   for r in c.recipients.select_related('contact').order_by('contact__name')]})
    return out


def campaign_create(payload, actor):
    from production.models import Release
    ensure_templates()
    kind = payload.get('kind') if payload.get('kind') in ('premiere', 'pitch', 'other') else 'premiere'
    release = Release.objects.filter(id=payload.get('release_id') or '').first()
    tpl = Template.objects.filter(channel='email', name__icontains='pitch' if kind == 'pitch' else 'premiere').first() or Template.objects.filter(channel='email').first()
    dm = Template.objects.filter(channel='instagram').first()
    name = str(payload.get('name') or '').strip()[:200] or (f"{release.title} · {'playlist-pitch' if kind == 'pitch' else 'premiere'}" if release else 'Nieuwe campagne')
    c = Campaign.objects.create(name=name, kind=kind, release=release, artist=release.artist if release else '',
                                links=[{'title': release.title, 'link': ''}] if release else [{'title': '', 'link': ''}],
                                sender=senders()[0], subject=tpl.subject if tpl else '', body=tpl.body if tpl else '',
                                dm_body=dm.body if dm else '', created_by=actor)
    audit(actor, 'Promocampagne aangemaakt', c.id, name)
    return campaign_dict(c, True)


def campaign_update(c, payload):
    if c.status == 'sending':
        raise ValueError('Deze campagne wordt nu verstuurd.')
    for key, limit in (('name', 200), ('artist', 300), ('promo_text', 6000), ('sender_name', 100), ('subject', 300), ('body', 20000), ('dm_body', 6000)):
        if key in payload:
            setattr(c, key, str(payload[key] or '')[:limit])
    if 'sender' in payload:
        if payload['sender'] not in senders():
            raise ValueError('Kies een van de ingestelde verzendadressen.')
        c.sender = payload['sender']
    if 'links' in payload:
        links = payload['links'] if isinstance(payload['links'], list) else []
        c.links = [{'title': str(l.get('title', ''))[:200], 'link': str(l.get('link', ''))[:1000]} for l in links if isinstance(l, dict)][:20]
    c.save()


def set_recipients(c, contact_ids, channel):
    if c.status == 'sending':
        raise ValueError('Deze campagne wordt nu verstuurd.')
    ids = set(Contact.objects.filter(id__in=contact_ids, active=True).values_list('id', flat=True))
    with transaction.atomic():
        c.recipients.filter(channel=channel, status='selected').exclude(contact_id__in=ids).delete()
        existing = set(c.recipients.filter(channel=channel).values_list('contact_id', flat=True))
        Recipient.objects.bulk_create([Recipient(campaign=c, contact_id=i, channel=channel) for i in ids - existing])


def render(c, text, contact):
    releases = '\n'.join(f"{l['title']}: {l['link']}".strip(': ') for l in c.links if l.get('title') or l.get('link'))
    first = next((l for l in c.links if l.get('title') or l.get('link')), {})
    values = {'Name': contact.name if contact else 'Naam', 'Artist': c.artist, 'Release': first.get('title', ''), 'Link': first.get('link', ''),
              'Releases': releases, 'Promo': c.promo_text, 'Sender': (c.sender_name + '\n') if c.sender_name else '', 'Email': contact.email if contact else ''}
    out = text
    for k, v in values.items():
        out = out.replace('{{' + k + '}}', v or '')
    out = out.replace('{{Logo}}', '')
    return re.sub(r'\n{3,}', '\n\n', out).strip()


def to_html(text):
    esc = html_lib.escape(text)
    esc = URL_RE.sub(lambda m: f'<a href="{m.group(1)}">{m.group(1)}</a>', esc)
    return '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">' + esc.replace('\n', '<br>\n') + '</div>'


def check_ready(c):
    if not c.subject.strip() or not c.body.strip():
        raise ValueError('Vul onderwerp en tekst in.')
    if not c.sender:
        raise ValueError('Kies een verzendadres.')
    if re.search(r'\{\{\w+\}\}', render(c, c.subject + '\n' + c.body, None)):
        raise ValueError('Er staat een onbekend veld tussen {{ }} in de tekst.')


def send_one(c, contact, to=None):
    from integrations.graph import send_mail
    send_mail(c.sender, [to or contact.email], [], render(c, c.subject, contact), to_html(render(c, c.body, contact)), [])


def start_sending(c, actor):
    from jobs.queue import enqueue
    check_ready(c)
    n = c.recipients.filter(channel='email', status__in=['selected', 'failed']).exclude(contact__email='').update(status='queued', error='')
    if not n:
        raise ValueError('Vink eerst ontvangers aan.')
    c.status = 'sending'
    c.save(update_fields=['status'])
    enqueue('promo_send', {'campaign_id': c.id}, key=c.id)
    audit(actor, 'Promocampagne gestart', c.id, f'{n} mails')
    return n


def send_batch(campaign_id, batch=8, pause=4):
    """Worker job: a few mails at a time with a pause, so Outlook and spam
    filters stay happy. A send without a clear answer is never retried."""
    from integrations.http import UncertainSend
    from jobs.queue import enqueue
    c = Campaign.objects.filter(id=campaign_id).first()
    if not c:
        return
    for r in c.recipients.filter(channel='email', status='queued').select_related('contact')[:batch]:
        if not Recipient.objects.filter(id=r.id, status='queued').update(status='sending'):
            continue
        try:
            send_one(c, r.contact)
            r.status, r.error, r.sent_at = 'sent', '', timezone.now()
        except UncertainSend as e:
            r.status, r.error = 'uncertain', safe_error(e)[:500]
        except Exception as e:
            r.status, r.error = 'failed', (safe_error(e) if isinstance(e, (ValueError, RuntimeError)) else type(e).__name__)[:500]
        r.save(update_fields=['status', 'error', 'sent_at'])
        time.sleep(pause)
    if c.recipients.filter(channel='email', status='queued').exists():
        enqueue('promo_send', {'campaign_id': c.id}, key=c.id + ':' + str(time.time()), delay=5)
    else:
        c.status = 'done'
        c.save(update_fields=['status'])
        sent = c.recipients.filter(channel='email', status='sent').count()
        failed = c.recipients.filter(channel='email', status__in=['failed', 'uncertain']).count()
        audit('worker', 'Promocampagne verstuurd', c.id, f'{sent} verstuurd, {failed} mislukt')
        from core.notify import notify
        from core.models import User
        users = User.objects.filter(username=c.created_by)
        notify(users, 'done', f'Campagne verstuurd: {c.name}', f'{sent} mails verstuurd' + (f', {failed} mislukt' if failed else ''), f'/label/promo/{c.id}', key=f'promo:{c.id}:{sent}')

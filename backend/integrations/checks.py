"""'Verbinding testen' per provider: one harmless read call each."""
import urllib.parse
from core.services import secret_values, settings
from .graph import _ensure_folder, graph


def test_connection(provider):
    cfg = settings()
    if provider == 'resend':
        from .resend import check
        return check()
    if provider == 'sumup':
        from .http import http
        key = secret_values().get('sumup_api_key')
        if not key:
            raise ValueError('SumUp API-sleutel ontbreekt.')
        me = http('https://api.sumup.com/v0.1/me', headers={'Authorization': 'Bearer ' + key})
        return {'message': 'SumUp-account geverifieerd', 'data': {'account': (me.get('merchant_profile') or {}).get('company_name') or me.get('account', {}).get('username', '')}}
    if provider == 'odoo':
        from .odoo import Odoo, odoo_catalog
        return {'message': 'Odoo-account geverifieerd', 'data': odoo_catalog(Odoo())}
    if provider in ('ai', 'claude'):
        from .claude import PROVIDERS, config, models
        return {'message': f'{PROVIDERS[config()[0]]} geverifieerd', 'data': {'models': models()}}
    if provider == 'microsoft':
        mailbox = urllib.parse.quote(cfg.get('finance_email') or 'finance@moonshinednb.nl', safe='')
        graph('/users/' + mailbox + '/mailFolders/inbox?$select=id,displayName')
        return {'message': 'Outlook-inbox geverifieerd'}
    if provider == 'onedrive':
        if not cfg.get('onedrive_drive_id'):
            raise ValueError('OneDrive drive-ID ontbreekt.')
        graph('/drives/' + urllib.parse.quote(cfg['onedrive_drive_id'], safe='') + '?$select=id,name')
        return {'message': 'OneDrive geverifieerd'}
    if provider == 'advancing':
        sender = cfg.get('advancing_sender', '')
        if not sender:
            raise ValueError('Vul het verzendadres voor advancing in.')
        graph('/users/' + urllib.parse.quote(sender, safe='') + '/mailFolders/drafts?$select=id')
        message = 'Verzendmailbox ' + sender + ' bereikbaar'
        if cfg.get('production_sync'):
            _ensure_folder((cfg.get('production_folder') or 'Moonshine/Productie').strip('/'))
            message += ' · OneDrive-map bereikbaar'
        return {'message': message}
    if provider == 'todo':
        return {'message': 'Microsoft To Do geverifieerd', 'data': {'lists': graph('/me/todo/lists').get('value', [])}}
    if provider == 'labelgrid':
        from .providers import labelgrid_http
        data = labelgrid_http('/statements', secret_values().get('labelgrid_api_key', ''))
        rows = data.get('data', data if isinstance(data, list) else [])
        return {'message': 'LabelGrid geverifieerd', 'data': {'statements': len(rows) if isinstance(rows, list) else 1}}
    if provider == 'opensign':
        from .providers import opensign_http
        try:
            me = opensign_http('/getuser', None, 'GET')
        except Exception:
            me = opensign_http('/credits', None, 'GET')
        return {'message': 'OpenSign geverifieerd', 'data': me if isinstance(me, dict) else {}}
    raise ValueError('Voor ING en SumUp: importeer een export of sluit de beveiligde bank-webhook aan.')

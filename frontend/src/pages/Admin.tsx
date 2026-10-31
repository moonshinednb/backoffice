import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router';
import { api } from '../lib/api';
import { useAuth, User } from '../lib/auth';
import { ROLE, stamp } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, Modal, Orb, PageTitle, Tabs, formValues, useToast } from '../lib/ui';
import { AdminPanel } from './Work';
import { PasswordDialog } from '../shell/PasswordDialog';
import { FormDialog } from '../production/common';
import { ConnectionBadge, Connection, useConnections, useUsers } from './shared';
import { useOdoo } from './Finance';

/* --- Koppelingen ---------------------------------------------------------------- */

const TEXT: Record<string, [string, string, string]> = {
  odoo: ['OD', 'De boekhouding', 'Crediteuren, inkoopfacturen en originele bijlagen. Boek vanuit de backoffice rechtstreeks in Odoo.'],
  ai: ['AI', 'Facturen lezen', 'Leest PDF’s en foto’s uit met de AI-aanbieder die je kiest (Claude, Gemini of een OpenAI-compatibele). De code rekent alles na; twijfelgevallen gaan naar controle.'],
  microsoft: ['OU', 'De finance-inbox', 'Ontvangt facturen uit de finance-inbox. De worker kijkt elke minuut; webhook optioneel.'],
  advancing: ['AD', 'Riders en advancing', 'Verstuurt advancing via Outlook en bewaart riders, EPK’s en promo in OneDrive. Werkt lokaal door zonder koppeling.'],
  onedrive: ['ON', 'Het documentarchief', 'Archiveert geboekte facturen in de ingestelde Moonshine-map.'],
  todo: ['TO', 'Samen aan het werk', 'Synchroniseert taken met een Microsoft To Do-lijst via jouw Microsoft-account.'],
  labelgrid: ['LG', 'Royalties', 'Haalt LabelGrid-statements op voor halfjaarlijkse afrekeningen. Alleen lezen.'],
  opensign: ['OS', 'Contracten', 'Verstuurt contracten via OpenSign en volgt ondertekening.'],
  calendar: ['AG', 'Gedeelde agenda', 'Synchroniseert onze planning (events, posts, voyages, releases, meetings) met de Outlook-agenda van de teammailbox, en toont afspraken uit Outlook in de backoffice.'],
  resend: ['RE', 'Wachtwoordmails', 'Verstuurt herstellinks voor vergeten wachtwoorden. Alleen voor wachtwoordherstel.'],
  ing: ['IN', 'Banktransacties', 'Leest de bestaande ING-bankfeed vanuit Odoo. CSV-import en een beveiligde webhook zijn ook beschikbaar.'],
  sumup: ['SU', 'Pin & uitbetalingen', 'Importeer omzet, kosten en uitbetalingen. Groepeer via payout_id; de flow boekt omzet en kosten en lettert de uitbetaling af.'],
};

type Settings = { settings: Record<string, any>; configured_secrets: string[] };

export function IntegrationsPage() {
  const q = useConnections();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const config = params.get('config') || '';
  const [testing, setTesting] = useState('');
  const [result, setResult] = useState<{ message: string; data?: unknown; error?: boolean } | null>(null);
  async function test(id: string) {
    setTesting(id);
    try { setResult(await api('/connections/test', { method: 'POST', body: { provider: id } })); }
    catch (e) { setResult({ message: (e as Error).message, error: true }); }
    finally { setTesting(''); qc.invalidateQueries({ queryKey: ['connections'] }); qc.invalidateQueries({ queryKey: ['odoo'] }); }
  }
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  return <>
    <PageTitle title="Koppelingen" sub="Accounts en administratiestromen" />
    <div className="panel-grid">{q.data.connections.map((c: Connection) => {
      const [logo, sub, desc] = TEXT[c.id] || [c.name.slice(0, 2), '', ''];
      return <section key={c.id} className="card integration-card">
        <div className="integration-title"><span className="conn-logo">{logo}</span><div><h2>{c.name}</h2><small>{sub}</small></div><ConnectionBadge c={c} /></div>
        <p>{desc}</p>
        {c.checked ? <p className="helper">Laatst gecontroleerd {stamp(c.checked)}</p> : null}
        {c.status === 'failed' && c.error ? <div className="error-box">{c.error}</div> : null}
        <footer><button onClick={() => setParams({ config: c.id })}><Icon name="settings" /> Instellen</button>
          {c.id !== 'ing' ? <button className="ghost" onClick={() => test(c.id)} disabled={!!testing}>{testing === c.id ? <><Orb state="connecting" /> Testen…</> : <><Icon name="refresh" /> Verbinding testen</>}</button> : null}</footer>
      </section>;
    })}</div>
    <p className="helper">Een koppeling krijgt pas de status Geverifieerd na een geslaagde accountcontrole.</p>
    {config ? <ConfigDialog provider={config} onClose={() => setParams({})} /> : null}
    <Modal title="Verbinding gecontroleerd" open={!!result} onClose={() => setResult(null)} footer={<button onClick={() => setResult(null)}>Sluiten</button>}>
      {result ? <><div className={result.error ? 'error-box' : 'notice'}>{result.message}</div>
        {result.data ? <><p className="helper">Beschikbare gegevens voor je configuratie:</p><pre className="test-results">{JSON.stringify(result.data, null, 2)}</pre></> : null}</> : null}
    </Modal>
  </>;
}

type Kind = 'text' | 'url' | 'email' | 'number' | 'secret' | 'bool' | 'json' | 'select' | 'odoo' | 'lines';
type Spec = { key: string; label: string; kind?: Kind; placeholder?: string; options?: [string, string][]; rows?: (c: any) => { id: number; name: string; code?: string }[] };
type Provider = { title: string; fields: Spec[]; help?: ReactNode };

const purchase = (c: any) => c.journals.filter((j: any) => j.type === 'purchase');
const bankJ = (c: any) => c.journals.filter((j: any) => j.type === 'bank');
const expense = (c: any) => c.accounts.filter((a: any) => String(a.account_type || '').startsWith('expense'));
const cash = (c: any) => c.accounts.filter((a: any) => a.account_type === 'asset_cash');
const BANK_HELP = <><p className="helper">CSV-import werkt direct. Voor automatische aanvoer kan jouw bank- of SumUp-adapter transacties naar de beveiligde webhook sturen.</p><p className="helper mono">POST /api/webhooks/bank</p><p className="helper">Elke transactie heeft een stabiel external_id, datum, omschrijving, bedrag en optioneel kosten, omzetcategorie en btw-tarief. De webhook-sleutel blijft alleen op de server opgeslagen.</p></>;

const PROVIDERS: Record<string, Provider> = {
  odoo: { title: 'Odoo aansluiten', fields: [
    { key: 'odoo_url', label: 'Odoo-URL', kind: 'url', placeholder: 'https://jouw-odoo.nl' }, { key: 'odoo_database', label: 'Databasenaam', placeholder: 'bijv. moonshine' },
    { key: 'odoo_username', label: 'Odoo-login' }, { key: 'odoo_api_key', label: 'Odoo API-sleutel', kind: 'secret' },
    { key: 'odoo_purchase_journal', label: 'Inkoopdagboek', kind: 'odoo', rows: purchase }, { key: 'odoo_expense_account', label: 'Kostenrekening', kind: 'odoo', rows: expense },
    { key: 'odoo_bank_journal', label: 'ING-bankdagboek', kind: 'odoo', rows: bankJ }, { key: 'odoo_bank_account', label: 'ING-bankrekening', kind: 'odoo', rows: cash },
    { key: 'bank_mode', label: 'ING-aanvoer', kind: 'select', options: [['existing_feed', 'ING-bankfeed is al in Odoo aanwezig'], ['exclusive_import', 'Alleen import via deze backoffice']] },
    { key: 'odoo_bank_feed', label: 'Open ING-bankregels uit Odoo ophalen', kind: 'bool' },
    { key: 'odoo_tax_map', label: 'Btw-mapping (Odoo tax-ID per code)', kind: 'json', placeholder: '{"9": 12, "21": 14, "reverse_eu": 18, "reverse_non_eu": 19}' }],
    help: <p className="helper">Vul bij Databasenaam de naam van je Odoo-database in, zonder URL. Een opgeslagen API-sleutel blijft bewaard als je het sleutelveld leeg laat. Sla eerst de accountgegevens op en test de verbinding; daarna kun je dagboeken, rekeningen en btw-codes kiezen.</p> },
  ai: { title: 'AI-aanbieder instellen', fields: [
    { key: 'ai_provider', label: 'Aanbieder', kind: 'select', options: [['anthropic', 'Claude (Anthropic)'], ['gemini', 'Google Gemini'], ['openai', 'OpenAI-compatibel (NIM, Groq, OpenRouter, Ollama)']] },
    { key: 'ai_api_key', label: 'API-sleutel', kind: 'secret' },
    { key: 'ai_model', label: 'Model-ID', placeholder: 'Bijv. gemini-2.5-flash of een Claude-model' },
    { key: 'ai_base_url', label: 'API-adres (alleen OpenAI-compatibel)', kind: 'url', placeholder: 'https://integrate.api.nvidia.com/v1' }],
    help: <p className="helper">Test na het opslaan de verbinding om de beschikbare modellen te zien. Gemini en Claude lezen PDF’s en foto’s; OpenAI-compatibele aanbieders hier alleen afbeeldingen. Let op: bij gratis aanbieders kan de invoer gebruikt worden om te trainen, en facturen bevatten bedragen en bankgegevens. Bedragen en btw worden altijd in code nagerekend.</p> },
  microsoft: { title: 'Outlook / Microsoft aansluiten', fields: [
    { key: 'microsoft_tenant', label: 'Microsoft tenant-ID' }, { key: 'microsoft_client_id', label: 'App client-ID' },
    { key: 'microsoft_client_secret', label: 'Client secret (optioneel bij gedelegeerde toegang)', kind: 'secret' },
    { key: 'microsoft_refresh_token', label: 'Refresh-token voor jouw Microsoft-account', kind: 'secret' },
    { key: 'microsoft_access_token', label: 'Access-token (optioneel / tijdelijk)', kind: 'secret' },
    { key: 'finance_email', label: 'Finance-inbox', kind: 'email' }, { key: 'mail_enabled', label: 'Facturen elke minuut uit Outlook ophalen', kind: 'bool' }],
    help: <p className="helper">De app heeft leesrechten op de finance-inbox nodig. Een gedelegeerde verbinding met refresh-token ondersteunt ook Microsoft To Do. Een app-only verbinding ondersteunt To Do niet.</p> },
  advancing: { title: 'Advancing en productie-opslag', fields: [
    { key: 'advancing_sender', label: 'Verzendadres voor advancing', kind: 'email', placeholder: 'events@moonshinednb.nl' },
    { key: 'production_sync', label: 'Geüploade riders, EPK’s en promobestanden in de eventmap op OneDrive zetten', kind: 'bool' }],
    help: <p className="helper">Gebruikt de Microsoft-verbinding en dezelfde drive als het OneDrive-archief. De app heeft <strong>Mail.Send</strong> en <strong>Mail.ReadWrite</strong> nodig op dit verzendadres en <strong>Files.ReadWrite.All</strong> of <strong>Sites.Selected</strong> op de drive. Een rider komt in 03 Riders van het event, EPK-materiaal in 02 EPKs/&lt;artiest&gt;, bestanden van onze eigen artiesten in Artists/&lt;naam&gt;.</p> },
  onedrive: { title: 'OneDrive instellen', fields: [{ key: 'onedrive_drive_id', label: 'Drive-ID' }, { key: 'onedrive_folder', label: 'Archiefmap facturen', placeholder: 'Moonshine/Administratie' },
    { key: 'drive_events_folder', label: 'Hoofdmap events', placeholder: '2. Events' }, { key: 'drive_releases_folder', label: 'Hoofdmap releases', placeholder: '4. Releases' },
    { key: 'onedrive_enabled', label: 'Geboekte facturen naar OneDrive archiveren', kind: 'bool' },
    { key: 'drive_past_events_folder', label: 'Map voor afgelopen events', placeholder: '2. Events/_Past Events' },
    { key: 'drive_artists_folder', label: 'Map voor onze eigen artiesten (EPK-overzicht)', placeholder: 'Artists' },
    { key: 'drive_event_tree', label: 'Submappen per event (één per regel)', kind: 'lines', placeholder: '01 Finance\n02 EPKs\n03 Riders\n04 Artwork/Artist Announcements\n05 Content/Reels & TikToks\n05 Content/Countdown\n05 Content/Giveaway\n06 Productie\n07 Na afloop' },
    { key: 'drive_artist_tree', label: 'Submappen per artiest (in 02 EPKs)', kind: 'lines', placeholder: '(geen: één map per artiest)' },
    { key: 'drive_release_tree', label: 'Submappen per release', kind: 'lines', placeholder: 'Artworks\nContent\nContracts/SIGNED\nMasters\nPress Kits' }],
    help: <p className="helper">Bij een nieuw event, een artiest in de line-up of een nieuwe release maakt de backoffice deze mappen vanzelf aan op OneDrive. Bestaande mappen worden niet aangeraakt; een hernoemd event wordt hernoemd, en een week na de datum gaat de eventmap naar de map voor afgelopen events. Leeg laten = de standaardindeling.</p> },
  todo: { title: 'Microsoft To Do instellen', fields: [{ key: 'todo_list_id', label: 'To Do-lijst-ID' }, { key: 'microsoft_todo_refresh_token', label: 'To Do refresh-token (eenmalige inlog)', kind: 'secret' }, { key: 'todo_enabled', label: 'Taken synchroniseren met Microsoft To Do', kind: 'bool' }],
    help: <p className="helper">Test de verbinding om jouw lijsten te zien. Vereist gedelegeerde Microsoft-toegang met Tasks.ReadWrite.</p> },
  labelgrid: { title: 'LabelGrid aansluiten', fields: [{ key: 'labelgrid_api_key', label: 'LabelGrid API-sleutel', kind: 'secret' }, { key: 'labelgrid_label_id', label: 'Label-ID (optioneel)' }],
    help: <p className="helper">Alleen lezen: haalt royalty-statements op voor halfjaarlijkse artiestenafrekeningen.</p> },
  opensign: { title: 'OpenSign aansluiten', fields: [{ key: 'opensign_base', label: 'OpenSign API-basis', placeholder: 'https://eu-app.opensignlabs.com/api/v1.2' }, { key: 'opensign_template_id', label: 'Standaard template-ID' },
    { key: 'opensign_api_key', label: 'OpenSign API-sleutel', kind: 'secret' }, { key: 'opensign_webhook_secret', label: 'Webhook-handtekeningssleutel', kind: 'secret' }],
    help: <p className="helper">EU-cloud aanbevolen. Test eerst met een niet-vertrouwelijk document in de sandbox.</p> },
  calendar: { title: 'Agenda instellen', fields: [{ key: 'calendar_mailbox', label: 'Mailbox van de agenda', kind: 'email', placeholder: 'info@moonshinednb.nl' },
    { key: 'calendar_push', label: 'Wat naar Outlook gaat (één per regel)', kind: 'lines', placeholder: 'event\nvoyage\nrelease\ncontent\nmeeting' },
    { key: 'calendar_enabled', label: 'Onze planning naar de Outlook-agenda schrijven (elke 10 minuten)', kind: 'bool' }],
    help: <p className="helper">Vereist het Microsoft-recht <strong>Calendars.ReadWrite</strong> (Application) met admin consent. Mogelijke waarden per regel: event, voyage, release, content, meeting, step (releasestappen), task (taken). Items uit de backoffice krijgen in Outlook de categorie “Moonshine”.</p> },
  resend: { title: 'Resend aansluiten', fields: [{ key: 'resend_api_key', label: 'Resend API-sleutel', kind: 'secret' },
    { key: 'resend_from', label: 'Afzender', placeholder: 'Moonshine <noreply@moonshinednb.nl>' },
    { key: 'public_url', label: 'Adres van de backoffice (voor de link)', kind: 'url', placeholder: 'http://100.111.153.38:8096' }],
    help: <p className="helper">Het afzenderdomein moet in Resend geverifieerd zijn (DNS-records bij je domein). Test daarna de verbinding; je ziet dan welke domeinen klaarstaan. De link in de mail werkt alleen op een apparaat met Tailscale aan.</p> },
  ing: { title: 'ING aanvoer instellen', fields: [{ key: 'bank_webhook_secret', label: 'Webhook bearer-sleutel (optioneel vervangen)', kind: 'secret' }], help: BANK_HELP },
  sumup: { title: 'SumUp aanvoer instellen', fields: [{ key: 'sumup_api_key', label: 'SumUp API-sleutel', kind: 'secret' }, { key: 'bank_webhook_secret', label: 'Webhook bearer-sleutel (optioneel vervangen)', kind: 'secret' },
    { key: 'odoo_sales_journal', label: 'Verkoopdagboek-ID', kind: 'number' }, { key: 'odoo_sales_account', label: 'Omzetrekening-ID', kind: 'number' },
    { key: 'odoo_sumup_clearing_account', label: 'SumUp-tussenrekening-ID', kind: 'number' }, { key: 'odoo_fee_account', label: 'Kostenrekening-ID', kind: 'number' },
    { key: 'odoo_output_tax_map', label: 'Verkoop-btw-mapping (JSON)', kind: 'json', placeholder: '{"9": 30, "21": 31}' }],
    help: <>{BANK_HELP}<p className="helper">De tussenrekening moet een afletterbare debiteurenrekening zijn. Pintransacties en de uitbetaling moeten hetzelfde payout_id bevatten.</p></> },
  automation: { title: 'Automatische verwerking', fields: [{ key: 'auto_post', label: 'Automatisch boeken bij minimaal 98% zekerheid', kind: 'bool' },
    { key: 'auto_match', label: 'Unieke bankmatches automatisch afletteren', kind: 'bool' }, { key: 'auto_sumup', label: 'Sluitende SumUp-uitbetalingen automatisch verwerken', kind: 'bool' }],
    help: <div className="notice">Activeer pas nadat Odoo-rekeningen en btw-codes getest zijn. Ontbrekende gegevens, verlegging, vreemde valuta en mogelijke duplicaten vragen altijd controle.</div> },
};

export function ConfigDialog({ provider, onClose }: { provider: string; onClose: () => void }) {
  const p = PROVIDERS[provider];
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/settings') });
  const odoo = useOdoo(provider === 'odoo' && !!q.data?.configured_secrets.includes('odoo_api_key'));
  if (!p) return null;
  const s = q.data?.settings || {};
  const field = (f: Spec) => {
    const id = 'cfg-' + f.key;
    const v = s[f.key];
    if (f.kind === 'bool') return <label key={f.key}><input type="checkbox" name={f.key} defaultChecked={!!v} /> {f.label}</label>;
    if (f.kind === 'secret') return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><input id={id} name={f.key} type="password" autoComplete="new-password" placeholder={q.data?.configured_secrets.includes(f.key) ? 'Ingesteld — leeg laten om te bewaren' : 'Nog niet ingesteld'} /></div>;
    if (f.kind === 'lines') return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><textarea id={id} name={f.key} rows={6} spellCheck={false} placeholder={f.placeholder} defaultValue={Array.isArray(v) ? v.join('\n') : ''} /></div>;
    if (f.kind === 'json') return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><textarea id={id} name={f.key} spellCheck={false} placeholder={f.placeholder} defaultValue={v ? JSON.stringify(v, null, 2) : ''} /></div>;
    if (f.kind === 'select') return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><select id={id} name={f.key} defaultValue={v || f.options![0][0]}>{f.options!.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>;
    if (f.kind === 'odoo' && odoo.data) {
      const rows = f.rows!(odoo.data.catalog);
      return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><select id={id} name={f.key} defaultValue={v ? String(v) : ''}><option value="">Kies {f.label.toLowerCase()}</option>
        {v && !rows.some((r) => r.id === +v) ? <option value={String(v)}>ID {v} · niet gevonden</option> : null}
        {rows.map((r) => <option key={r.id} value={r.id}>{(r.code ? r.code + ' · ' : '') + r.name}</option>)}</select></div>;
    }
    const type = f.kind === 'odoo' || f.kind === 'number' ? 'number' : f.kind || 'text';
    return <div key={f.key} className="field"><label htmlFor={id}>{f.label}</label><input id={id} name={f.key} type={type} min={type === 'number' ? 1 : undefined} placeholder={f.placeholder} defaultValue={v ?? ''} autoComplete="off" /></div>;
  };
  return <FormDialog id="config-form" title={p.title} open onClose={onClose} submit={async (form) => {
    const values = formValues(form);
    const settings: Record<string, unknown> = {}, secrets: Record<string, string> = {};
    for (const f of p.fields) {
      const raw = (values[f.key] || '').trim();
      if (f.kind === 'secret') { if (raw) secrets[f.key] = raw; }
      else if (f.kind === 'bool') settings[f.key] = f.key in values;
      else if (f.kind === 'lines') settings[f.key] = raw ? raw.split('\n').map((x) => x.trim()).filter(Boolean) : [];
      else if (f.kind === 'json') { try { settings[f.key] = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`${f.label}: geen geldige JSON.`); } }
      else if (f.kind === 'number' || f.kind === 'odoo') settings[f.key] = raw ? Number(raw) : null;
      else settings[f.key] = raw;
    }
    await api('/settings', { method: 'POST', body: { settings, secrets } });
    toast('Instellingen opgeslagen. Test de verbinding opnieuw.');
    ['settings', 'connections', 'odoo', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    onClose();
  }}>{q.isPending ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : <><div className="form-grid">{p.fields.filter((f) => !['bool', 'json', 'lines'].includes(f.kind || '')).map(field)}</div>
    {p.fields.filter((f) => ['json', 'bool', 'lines'].includes(f.kind || '')).map(field)}{p.help}</>}</FormDialog>;
}

/* --- Gebruikers ------------------------------------------------------------------- */

const ROLES: [string, string][] = [['staff', 'Team'], ['admin', 'Beheerder']];

export function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useUsers();
  const [dialog, setDialog] = useState<User | null | undefined>(undefined);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const u = dialog || null;
  return <>
    <PageTitle title="Gebruikers" sub="Team, toegang en rechten" actions={<button className="primary" onClick={() => setDialog(null)}><Icon name="plus" /> Gebruiker toevoegen</button>} />
    <section className="card"><div className="table-wrap"><table><thead><tr><th>Gebruiker</th><th>Gebruikersnaam</th><th>Rol</th><th>Status</th><th /></tr></thead><tbody>
      {q.data.users.map((x) => <tr key={x.id}><td><div className="supplier"><span className="avatar">{x.name.slice(0, 2).toUpperCase()}</span><strong>{x.name}</strong></div></td><td>{x.username}</td><td>{ROLE[x.role]}</td>
        <td>{!x.active ? <Badge>Inactief</Badge> : x.must_change_password ? <Badge color="amber">Tijdelijk wachtwoord</Badge> : <Badge color="lime">Actief</Badge>}</td>
        <td>{x.id !== me?.id ? <button className="small" onClick={() => setDialog(x)}>Beheren</button> : 'Jij'}</td></tr>)}
    </tbody></table></div></section>
    <div className="panel-grid section-gap">
      <section className="card card-pad"><h2>Beheerder</h2><p className="helper">Alles, plus de admin-omgeving: koppelingen, sleutels, gebruikers, activiteit en instellingen.</p></section>
      <section className="card card-pad"><h2>Team</h2><p className="helper">Kan overal in en alles gebruiken: planning, productie, financiën en analyse. Alleen de admin-omgeving is afgeschermd. Nieuwe accounts en gereset wachtwoorden zijn tijdelijk: bij de eerste login kiest iemand een eigen wachtwoord.</p></section>
    </div>
    <FormDialog id="user-form" title={u ? 'Gebruiker beheren' : 'Gebruiker toevoegen'} open={dialog !== undefined} onClose={() => setDialog(undefined)} label={u ? 'Opslaan' : 'Gebruiker toevoegen'} submit={async (form) => {
      const v = formValues(form);
      if (u) await api(`/users/${u.id}`, { method: 'PATCH', body: { name: v.name, role: v.role, active: 'active' in v, ...(v.password ? { password: v.password } : {}) } });
      else await api('/users', { method: 'POST', body: v });
      toast(u ? 'Gebruiker bijgewerkt.' : 'Gebruiker toegevoegd. Geef het tijdelijke wachtwoord persoonlijk door.');
      qc.invalidateQueries({ queryKey: ['users'] }); qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDialog(undefined);
    }}><div key={u?.id || 'new'}>
      <div className="form-grid">
        <div className="field"><label htmlFor="u-name">Naam</label><input id="u-name" name="name" defaultValue={u?.name} required /></div>
        {u ? null : <div className="field"><label htmlFor="u-username">Gebruikersnaam</label><input id="u-username" name="username" required pattern="[a-zA-Z0-9._\-]{3,40}" /></div>}
        <div className="field"><label htmlFor="u-password">{u ? 'Tijdelijk wachtwoord (optioneel)' : 'Tijdelijk wachtwoord'}</label><input id="u-password" name="password" type="password" minLength={8} required={!u} autoComplete="new-password" /></div>
        <div className="field"><label htmlFor="u-role">Rol</label><select id="u-role" name="role" defaultValue={u?.role || 'staff'}>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      {u ? <label><input type="checkbox" name="active" defaultChecked={u.active} /> Gebruiker heeft toegang</label> : null}
      <p className="helper">Het wachtwoord wordt alleen als hash opgeslagen. De gebruiker kiest bij de volgende login een eigen wachtwoord.</p>
    </div></FormDialog>
  </>;
}

/* --- Instellingen -------------------------------------------------------------------- */

export function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [password, setPassword] = useState(false);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/settings') });
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [q.data]);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const s = q.data.settings;
  return <>
    <PageTitle title="Instellingen" sub="Bedrijfsgegevens, verwerking en beveiliging" />
    <div className="settings-wide">
      <section className="card card-pad"><h2>Moonshine</h2>
        <form key={key} onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try { await api('/settings', { method: 'POST', body: { settings: formValues(e.currentTarget), secrets: {} } }); toast('Opgeslagen.'); qc.invalidateQueries({ queryKey: ['settings'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); }
          catch (err) { toast((err as Error).message, true); } finally { setBusy(false); }
        }}>
          <div className="form-grid"><div className="field"><label htmlFor="s-company">Bedrijfsnaam</label><input id="s-company" name="company_name" defaultValue={s.company_name || 'Moonshine'} required /></div>
            <div className="field"><label htmlFor="s-mail">Finance e-mailadres</label><input id="s-mail" name="finance_email" type="email" defaultValue={s.finance_email || ''} required /></div></div>
          <button type="submit" className="primary" disabled={busy}>Opslaan</button>
        </form></section>
      <section className="card card-pad section-gap"><h2>Automatische verwerking</h2><p className="helper">Claude leest facturen uit zodra de koppeling is ingesteld. Automatisch boeken kun je aanzetten na controle van de Odoo-rekeningen en btw-mapping. Onzekere gevallen blijven altijd in de controle-inbox.</p>
        <button onClick={() => setAuto(true)}>Automatisering instellen</button></section>
      <section className="card card-pad section-gap"><h2>Beveiliging</h2><p className="helper">Wachtwoorden worden gehasht opgeslagen. Inlogsessies verlopen na 12 uur. De server is alleen bereikbaar via het Moonshine-tailnet.</p>
        <button onClick={() => setPassword(true)}><Icon name="lock" /> Wachtwoord wijzigen</button></section>
    </div>
    <PasswordDialog open={password} onClose={() => setPassword(false)} />
    {auto ? <ConfigDialog provider="automation" onClose={() => setAuto(false)} /> : null}
  </>;
}

/* --- Sleutels ------------------------------------------------------------------------ */

const KEYS: [string, string, string][] = [
  ['microsoft_client_secret', 'Microsoft client secret', 'Outlook, OneDrive en mail (app-toegang)'],
  ['microsoft_todo_refresh_token', 'Microsoft To Do refresh-token', 'Alleen To Do (eenmalige inlog)'],
  ['odoo_api_key', 'Odoo API-sleutel', 'Boekhouding'], ['ai_api_key', 'AI API-sleutel', 'Facturen uitlezen (gekozen aanbieder)'],
  ['sumup_api_key', 'SumUp API-sleutel', 'Pinomzet en uitbetalingen'], ['resend_api_key', 'Resend API-sleutel', 'Wachtwoordmails'],
  ['bank_webhook_secret', 'Bank-webhooksleutel', 'ING / SumUp-aanvoer'], ['mail_webhook_secret', 'Mail-webhooksleutel', 'Outlook-notificaties'],
];

/** Which integration proves that a key works. Keys without a provider are only
    used by us (webhook secrets) and cannot be tested from here. */
const KEY_PROVIDER: Record<string, string> = {
  odoo_api_key: 'odoo', ai_api_key: 'ai', anthropic_api_key: 'ai', microsoft_client_secret: 'microsoft', microsoft_refresh_token: 'microsoft',
  microsoft_access_token: 'microsoft', microsoft_todo_refresh_token: 'todo', sumup_api_key: 'sumup', labelgrid_api_key: 'labelgrid',
  opensign_api_key: 'opensign', resend_api_key: 'resend',
};

/** All API keys in one place, with a test per key. Values are stored only on
    the server (secrets.json in the data folder) and are never sent back. */
export function KeysPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [edit, setEdit] = useState<[string, string, string] | null>(null);
  const [testing, setTesting] = useState('');
  const [fresh, setFresh] = useState<Record<string, { ok: boolean; message: string }>>({});
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/settings') });
  const conns = useConnections();
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const set = new Set(q.data.configured_secrets);
  const refresh = () => ['settings', 'connections', 'dashboard'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  async function save(key: string, value: string | null) {
    await api('/settings', { method: 'POST', body: { settings: {}, secrets: { [key]: value } } });
    refresh();
  }
  async function test(provider: string) {
    setTesting(provider);
    try { const r = await api<{ message: string }>('/connections/test', { method: 'POST', body: { provider } }); setFresh((f) => ({ ...f, [provider]: { ok: true, message: r.message } })); }
    catch (e) { setFresh((f) => ({ ...f, [provider]: { ok: false, message: (e as Error).message } })); }
    finally { setTesting(''); refresh(); }
  }
  async function testAll() { for (const p of [...new Set(KEYS.filter((k) => set.has(k[0])).map((k) => KEY_PROVIDER[k[0]]).filter(Boolean))]) await test(p); }
  const state = (key: string) => {
    const provider = KEY_PROVIDER[key];
    if (!set.has(key)) return { badge: <Badge>Niet ingesteld</Badge>, note: '' };
    if (!provider) return { badge: <Badge color="lime">Ingesteld</Badge>, note: 'Wordt alleen door de backoffice zelf gebruikt; niet te testen.' };
    const live = fresh[provider];
    const saved = conns.data?.connections.find((c) => c.id === provider);
    if (live) return { badge: live.ok ? <Badge color="lime">✓ Werkt</Badge> : <Badge color="red">✗ Werkt niet</Badge>, note: live.message };
    if (saved?.status === 'verified') return { badge: <Badge color="lime">✓ Werkt</Badge>, note: `${saved.message || 'Getest'}${saved.checked ? ' · ' + stamp(saved.checked) : ''}` };
    if (saved?.status === 'failed') return { badge: <Badge color="red">✗ Werkt niet</Badge>, note: `${saved.error || ''}${saved.checked ? ' · ' + stamp(saved.checked) : ''}` };
    return { badge: <Badge color="amber">Nog niet getest</Badge>, note: '' };
  };
  return <>
    <PageTitle title="Sleutels" sub="API-sleutels en tokens van alle koppelingen" actions={<button onClick={testAll} disabled={!!testing}><Icon name="refresh" /> Alles testen</button>} />
    <div className="notice"><Icon name="lock" /> Sleutels worden alleen op de server bewaard. Na het opslaan zijn ze hier niet meer te zien; je kunt ze alleen vervangen of verwijderen. “Testen” doet één onschuldige aanroep bij de dienst.</div>
    <section className="card"><div className="table-wrap"><table><thead><tr><th>Sleutel</th><th>Gebruikt voor</th><th>Status</th><th /></tr></thead><tbody>
      {KEYS.map((k) => { const st = state(k[0]); const provider = KEY_PROVIDER[k[0]]; return <tr key={k[0]}>
        <td><strong>{k[1]}</strong></td><td>{k[2]}</td>
        <td>{st.badge}{st.note ? <small className="block key-note">{st.note}</small> : null}</td>
        <td className="row-tools">
          {set.has(k[0]) && provider ? <button className="small" disabled={!!testing} onClick={() => test(provider)}>{testing === provider ? <><Orb state="connecting" /> Testen…</> : 'Testen'}</button> : null}
          <button className="small ghost" onClick={() => setEdit(k)}>{set.has(k[0]) ? 'Vervangen' : 'Instellen'}</button>
          {set.has(k[0]) ? <button className="small ghost" onClick={async () => { if (!confirm(`${k[1]} verwijderen? De koppeling stopt dan.`)) return; try { await save(k[0], null); toast('Sleutel verwijderd.'); } catch (e) { toast((e as Error).message, true); } }}>Verwijderen</button> : null}</td></tr>; })}
    </tbody></table></div></section>
    <FormDialog id="key-form" title={edit ? edit[1] : ''} open={!!edit} onClose={() => setEdit(null)} submit={async (form) => {
      const v = (formValues(form).value || '').trim();
      if (!v) throw new Error('Vul een waarde in.');
      await save(edit![0], v); toast('Sleutel opgeslagen. Klik op Testen om te controleren of hij werkt.'); setEdit(null);
    }}><div className="field"><label htmlFor="key-value">Nieuwe waarde</label><input id="key-value" name="value" type="password" autoComplete="new-password" required /></div>
      <p className="helper">Na opslaan test je de koppeling meteen met de Testen-knop.</p></FormDialog>
  </>;
}

/* --- Admin-omgeving -------------------------------------------------------------------- */

export function AdminLayout() {
  return <>
    <Tabs items={[{ to: '/admin', label: 'Overzicht' }, { to: '/admin/koppelingen', label: 'Koppelingen' }, { to: '/admin/sleutels', label: 'Sleutels' },
      { to: '/admin/gebruikers', label: 'Gebruikers' }, { to: '/admin/activiteit', label: 'Activiteit' }, { to: '/admin/instellingen', label: 'Instellingen' }]} />
    <Outlet />
  </>;
}

export function AdminHome() {
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api<any>('/dashboard') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  return <><PageTitle eyebrow="Admin" title="Beheer" sub="Koppelingen, sleutels, gebruikers en de gezondheid van het systeem. Alleen voor beheerders." />{q.data.admin ? <AdminPanel d={q.data} /> : null}</>;
}

export function ActivityPage() {
  const [actor, setActor] = useState('');
  const q = useQuery({ queryKey: ['audit'], queryFn: () => api<{ audit: { id: number; created: number; actor: string; action: string; entity: string; detail: string }[] }>('/audit'), refetchInterval: 30000 });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const actors = [...new Set(q.data.audit.map((a) => a.actor))].sort();
  const rows = q.data.audit.filter((a) => !actor || a.actor === actor);
  return <>
    <PageTitle eyebrow="Admin" title="Activiteit" sub="Wie wat wanneer deed: logins, wijzigingen, boekingen en verzendingen." />
    <div className="toolbar"><label htmlFor="act-actor">Gebruiker</label><select id="act-actor" className="vat-select" value={actor} onChange={(e) => setActor(e.target.value)}><option value="">Iedereen</option>{actors.map((a) => <option key={a}>{a}</option>)}</select></div>
    <section className="card">{rows.length ? <div className="table-wrap"><table><thead><tr><th>Moment</th><th>Gebruiker</th><th>Handeling</th><th>Details</th></tr></thead><tbody>
      {rows.map((a) => <tr key={a.id}><td>{stamp(a.created)}</td><td>{a.actor}</td><td>{a.action}</td><td className="helper">{[a.entity, a.detail].filter(Boolean).join(' · ')}</td></tr>)}
    </tbody></table></div> : <Empty title="Nog geen activiteit" sub="Handelingen verschijnen hier." icon="clock" />}</section>
  </>;
}

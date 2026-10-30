import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { stamp } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, Orb, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from './common';

type Contact = { id: string; name: string; email: string; handle: string; group: string; tag: string; source: string; notes: string; active: boolean };
type CampaignRow = { id: string; name: string; kind: string; release: string; artist: string; status: string; created: number; created_by: string; counts: Record<string, number> };
type Recipient = { id: number; contact_id: string; name: string; email: string; handle: string; channel: string; status: string; error: string; sent_at: number | null };
type Campaign = CampaignRow & { release_id: string | null; links: { title: string; link: string }[]; promo_text: string; sender: string; sender_name: string; subject: string; body: string; dm_body: string; senders: string[]; recipients: Recipient[] };
const GROUP: Record<string, string> = { promo: 'Promo-kanalen', playlists: 'Spotify-playlists', other: 'Overig' };
const KIND: Record<string, string> = { premiere: 'Premiere (voor release)', pitch: 'Playlist-pitch (na release)', other: 'Overig' };
const STATUS: Record<string, [string, string]> = { draft: ['Concept', ''], sending: ['Wordt verstuurd', 'purple'], done: ['Verstuurd', 'lime'] };

const useContacts = () => useQuery({ queryKey: ['promo-contacts'], queryFn: () => api<{ contacts: Contact[] }>('/promo/contacts') });

export function PromoTabs() {
  return <nav className="sub-tabs"><Link to="/label/promo">Campagnes</Link><Link to="/label/promo/contacten">Contacten</Link></nav>;
}

export function PromoCampaigns() {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['promo-campaigns'], queryFn: () => api<{ campaigns: CampaignRow[] }>('/promo/campaigns') });
  const releases = useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: { id: string; title: string; artist: string }[] }>('/releases') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuwe campagne</button> : null;
  return <>
    <div className="toolbar"><p className="helper">Premieres vóór de release, playlist-pitches erna. Mails gaan vanuit info@ of label@ via Microsoft en staan in Verzonden.</p><div className="row-actions" style={{ marginLeft: 'auto' }}><Link className="button" to="/label/promo/contacten"><Icon name="users" /> Contacten</Link>{button}</div></div>
    <section className="card">{q.data.campaigns.length ? <div className="table-wrap"><table><thead><tr><th>Campagne</th><th>Soort</th><th>Status</th><th>Verstuurd</th><th>Instagram</th><th /></tr></thead><tbody>
      {q.data.campaigns.map((c) => { const [l, col] = STATUS[c.status] || [c.status, '']; const sent = c.counts['email:sent'] || 0; const total = Object.entries(c.counts).filter(([k]) => k.startsWith('email:')).reduce((s, [, v]) => s + v, 0);
        return <tr key={c.id} className="clickable" tabIndex={0} onClick={() => navigate(`/label/promo/${c.id}`)} onKeyDown={(k) => k.key === 'Enter' && navigate(`/label/promo/${c.id}`)}>
          <td><strong>{c.name}</strong><small className="block">{c.release || c.artist || '—'} · {stamp(c.created)}</small></td><td>{KIND[c.kind]}</td><td><Badge color={col}>{l}</Badge></td>
          <td>{total ? `${sent}/${total}` : '—'}</td><td>{(c.counts['instagram:done'] || 0) + '/' + ((c.counts['instagram:done'] || 0) + (c.counts['instagram:selected'] || 0))}</td><td><Icon name="chevron" /></td></tr>; })}
    </tbody></table></div> : <Empty title="Nog geen campagnes" sub="Maak een campagne voor een release: kies wie hem krijgt, controleer het voorbeeld en verstuur." action={button} icon="mail" />}</section>
    <FormDialog id="campaign-form" title="Nieuwe campagne" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const c = await api<Campaign>('/promo/campaigns', { method: 'POST', body: formValues(form) });
      setOpen(false); navigate(`/label/promo/${c.id}`);
    }}>
      <div className="field"><label htmlFor="pc-release">Release</label><select id="pc-release" name="release_id"><option value="">Geen release</option>{(releases.data?.releases || []).map((r) => <option key={r.id} value={r.id}>{r.title}{r.artist ? ' — ' + r.artist : ''}</option>)}</select></div>
      <div className="field"><label htmlFor="pc-kind">Soort</label><select id="pc-kind" name="kind">{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="field"><label htmlFor="pc-name">Naam (optioneel)</label><input id="pc-name" name="name" placeholder="Leeg laten: release + soort" /></div>
    </FormDialog>
  </>;
}

export function PromoCampaign() {
  const { id = '' } = useParams();
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['promo-campaign', id], queryFn: () => api<Campaign>(`/promo/campaigns/${id}`), refetchInterval: (query) => (query.state.data?.status === 'sending' ? 3000 : false) });
  const contacts = useContacts();
  const [preview, setPreview] = useState<{ subject: string; body: string; dm: string } | null>(null);
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [links, setLinks] = useState<{ title: string; link: string }[]>([]);
  useEffect(() => { if (q.data) setLinks(q.data.links.length ? q.data.links : [{ title: '', link: '' }]); }, [q.data?.id]); // eslint-disable-line
  const c = q.data;
  const chosen = useMemo(() => new Set((c?.recipients || []).filter((r) => r.channel === 'email').map((r) => r.contact_id)), [c]);
  const chosenDm = useMemo(() => new Set((c?.recipients || []).filter((r) => r.channel === 'instagram').map((r) => r.contact_id)), [c]);
  if (q.isPending) return <Loading />;
  if (q.error || !c) return <><BackLink to="/label/promo">Campagnes</BackLink><ErrorBox error={q.error} /></>;
  const locked = c.status === 'sending' || !edit;
  const set = (next: Campaign) => { qc.setQueryData(['promo-campaign', id], next); qc.invalidateQueries({ queryKey: ['promo-campaigns'] }); };
  async function save(form?: HTMLFormElement) {
    const f = form || (document.getElementById('campaign-edit') as HTMLFormElement);
    set(await api<Campaign>(`/promo/campaigns/${id}`, { method: 'PATCH', body: { ...formValues(f), links } }));
  }
  const all = (contacts.data?.contacts || []).filter((x) => x.active && (group === 'all' || x.group === group) && (!search || [x.name, x.email, x.handle, x.tag].join(' ').toLowerCase().includes(search.toLowerCase())));
  const mailable = all.filter((x) => x.email);
  const dmOnly = all.filter((x) => x.handle && !x.email);
  const statusOf = (cid: string, ch: string) => c.recipients.find((r) => r.contact_id === cid && r.channel === ch);
  async function toggle(ids: string[], on: boolean, channel: 'email' | 'instagram') {
    const current = channel === 'email' ? chosen : chosenDm;
    const next = new Set(current);
    ids.forEach((i) => (on ? next.add(i) : next.delete(i)));
    set(await api<Campaign>(`/promo/campaigns/${id}/recipients`, { method: 'POST', body: { contact_ids: [...next], channel } }));
  }
  const queuedOrSelected = c.recipients.filter((r) => r.channel === 'email' && ['selected', 'failed'].includes(r.status)).length;
  return <>
    <BackLink to="/label/promo">Campagnes</BackLink>
    <PageTitle eyebrow="Promo" title={c.name} sub={<>{KIND[c.kind]}{c.release ? ' · ' + c.release : ''} <Badge color={(STATUS[c.status] || ['', ''])[1]}>{(STATUS[c.status] || [c.status])[0]}</Badge></>}
      actions={edit ? <>
        <button className="ghost" disabled={!!busy} onClick={() => run(async () => { await save(); setPreview(await api(`/promo/campaigns/${id}/preview`, { method: 'POST', body: { contact_id: [...chosen][0] || '' } })); })}><Icon name="eye" /> Voorbeeld</button>
        <button className="ghost" disabled={!!busy || locked} onClick={() => run(async () => { setBusy('test'); try { await save(); const r = await api<{ to: string }>(`/promo/campaigns/${id}/test`, { method: 'POST' }); toast(`Testmail verstuurd naar ${r.to}.`); } finally { setBusy(''); } })}>{busy === 'test' ? <Orb state="composing" /> : <Icon name="send" />} Testmail</button>
        <button className="primary" disabled={!!busy || locked || !queuedOrSelected} onClick={() => confirm(`Campagne versturen naar ${queuedOrSelected} ontvangers vanaf ${c.sender}?\n\nDe mails gaan rustig achter elkaar de deur uit.`) && run(async () => { await save(); set(await api(`/promo/campaigns/${id}/send`, { method: 'POST' })); }, 'Campagne wordt verstuurd.')}><Icon name="send" /> Versturen ({queuedOrSelected})</button>
      </> : null} />
    {c.status === 'sending' ? <div className="notice"><Orb state="composing" /> Wordt verstuurd: {c.counts['email:sent'] || 0} van {Object.entries(c.counts).filter(([k]) => k.startsWith('email:')).reduce((s, [, v]) => s + v, 0)}. Je kunt deze pagina gerust sluiten.</div> : null}
    <div className="promo-grid">
      <form id="campaign-edit" className="card card-pad" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(() => save(f), 'Opgeslagen.'); }} key={c.id}>
        <fieldset disabled={locked} className="plain-fieldset">
          <h2>Bericht</h2>
          <div className="form-grid">
            <div className="field"><label htmlFor="pm-name">Naam campagne</label><input id="pm-name" name="name" defaultValue={c.name} /></div>
            <div className="field"><label htmlFor="pm-artist">Artiest</label><input id="pm-artist" name="artist" defaultValue={c.artist} /></div>
            <div className="field"><label htmlFor="pm-sender">Verzenden vanaf</label><select id="pm-sender" name="sender" defaultValue={c.sender}>{c.senders.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label htmlFor="pm-sname">Jouw naam onder de mail</label><input id="pm-sname" name="sender_name" defaultValue={c.sender_name} placeholder="Bijv. Peppy" /></div>
          </div>
          <h3>Tracks en links</h3>
          {links.map((l, i) => <div className="form-grid link-row" key={i}>
            <div className="field"><input aria-label="Titel" placeholder="Titel" value={l.title} onChange={(e) => setLinks(links.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} /></div>
            <div className="field link-field"><input aria-label="Link" placeholder="https://… (privé SoundCloud, Spotify, Dropbox)" value={l.link} onChange={(e) => setLinks(links.map((x, j) => j === i ? { ...x, link: e.target.value } : x))} />
              {links.length > 1 ? <button type="button" className="icon-btn ghost tiny" aria-label="Link verwijderen" onClick={() => setLinks(links.filter((_, j) => j !== i))}><Icon name="close" /></button> : null}</div>
          </div>)}
          <button type="button" className="small ghost" onClick={() => setLinks([...links, { title: '', link: '' }])}><Icon name="plus" /> Track toevoegen</button>
          <div className="field section-gap"><label htmlFor="pm-promo">Promotekst ({'{{Promo}}'})</label><textarea id="pm-promo" name="promo_text" rows={4} defaultValue={c.promo_text} placeholder="Korte pitch over de release" /></div>
          <div className="field"><label htmlFor="pm-subject">Onderwerp</label><input id="pm-subject" name="subject" defaultValue={c.subject} /></div>
          <div className="field"><label htmlFor="pm-body">Tekst</label><textarea id="pm-body" name="body" rows={14} defaultValue={c.body} /></div>
          <p className="field-hint">Velden: {'{{Name}} {{Artist}} {{Release}} {{Link}} {{Releases}} {{Promo}} {{Sender}}'}. Ze worden per ontvanger ingevuld.</p>
          <details className="optional-block"><summary>Tekst voor Instagram-DM’s</summary><div className="field"><textarea name="dm_body" rows={8} defaultValue={c.dm_body} aria-label="Tekst voor Instagram-DM’s" /></div></details>
          {edit ? <button className="primary" type="submit">Opslaan</button> : null}
        </fieldset>
      </form>
      <section className="card">
        <div className="card-head"><div><h2>Ontvangers</h2><p>{chosen.size} per mail · {chosenDm.size} via Instagram</p></div></div>
        <div className="toolbar recipient-tools"><select className="vat-select" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Groep"><option value="all">Alle groepen</option>{Object.entries(GROUP).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input className="recipient-search" placeholder="Zoeken" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Zoek contact" />
          {!locked ? <><button className="small ghost" onClick={() => run(() => toggle(mailable.map((x) => x.id), true, 'email'))}>Alles</button><button className="small ghost" onClick={() => run(() => toggle(mailable.map((x) => x.id), false, 'email'))}>Niets</button></> : null}</div>
        {contacts.isPending ? <Loading /> : <ul className="recipient-list">
          {mailable.map((x) => { const r = statusOf(x.id, 'email'); return <li key={x.id}><label>
            <input type="checkbox" checked={chosen.has(x.id)} disabled={locked || (r && !['selected', 'failed'].includes(r.status))} onChange={(e) => run(() => toggle([x.id], e.target.checked, 'email'))} />
            <span><strong>{x.name}</strong><small>{x.email}{x.tag ? ' · ' + x.tag : ''}</small></span>
            {r && r.status !== 'selected' ? <Badge color={r.status === 'sent' ? 'lime' : r.status === 'queued' || r.status === 'sending' ? 'purple' : 'red'}>{({ sent: 'Verstuurd', queued: 'In de rij', sending: 'Bezig', failed: 'Mislukt', uncertain: 'Onzeker' } as Record<string, string>)[r.status] || r.status}</Badge> : null}
          </label>{r?.error ? <small className="recipient-error">{r.error}</small> : null}</li>; })}
          {!mailable.length ? <li className="helper">Geen contacten met e-mail in deze selectie. <Link className="text-link" to="/label/promo/contacten">Contacten importeren</Link></li> : null}
        </ul>}
        {dmOnly.length ? <><div className="card-head"><div><h2>Alleen Instagram</h2><p>Deze contacten hebben geen e-mail. Open hun profiel, stuur de DM en vink af.</p></div></div>
          <ul className="recipient-list">{dmOnly.map((x) => { const r = statusOf(x.id, 'instagram'); return <li key={x.id}><label>
            <input type="checkbox" checked={chosenDm.has(x.id)} disabled={locked} onChange={(e) => run(() => toggle([x.id], e.target.checked, 'instagram'))} />
            <span><strong>{x.name}</strong><small>{x.handle}</small></span>
            {r ? <><a className="small-btn" href={`https://ig.me/m/${x.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={() => navigator.clipboard?.writeText(c.dm_body.replace('{{Name}}', x.name)).catch(() => {})}>DM openen</a>
              <button type="button" className={`small ${r.status === 'done' ? 'primary' : 'ghost'}`} onClick={() => run(async () => { await api(`/promo/recipients/${r.id}/dm`, { method: 'POST' }); qc.invalidateQueries({ queryKey: ['promo-campaign', id] }); })}>{r.status === 'done' ? 'Gestuurd' : 'Afvinken'}</button></> : null}
          </label></li>; })}</ul>
          <p className="field-hint card-pad-x">“DM openen” kopieert ook de DM-tekst; plak hem in Instagram en pas de naam aan waar nodig.</p></> : null}
      </section>
    </div>
    {preview ? <div className="dialog-shim" onClick={() => setPreview(null)}><div className="card card-pad preview-card" onClick={(e) => e.stopPropagation()}>
      <div className="card-head"><h2>Voorbeeld</h2><button className="icon-btn ghost" onClick={() => setPreview(null)} aria-label="Sluiten"><Icon name="close" /></button></div>
      <p className="helper">Onderwerp</p><p><strong>{preview.subject}</strong></p><pre className="mail-preview">{preview.body}</pre>
    </div></div> : null}
    {edit && c.status !== 'sending' ? <p className="helper"><button className="text-link" onClick={() => confirm('Campagne verwijderen?') && run(async () => { await api(`/promo/campaigns/${id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['promo-campaigns'] }); navigate('/label/promo'); })}>Campagne verwijderen</button></p> : null}
  </>;
}

export function PromoContacts() {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const toast = useToast();
  const run = useAction();
  const q = useContacts();
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<Contact | null | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const body = new FormData(); body.append('file', file);
    setImporting(true);
    try { const r = await api<{ added: number; updated: number }>('/promo/import', { method: 'POST', body }); toast(`${r.added} nieuw, ${r.updated} bijgewerkt.`); qc.invalidateQueries({ queryKey: ['promo-contacts'] }); }
    catch (err) { toast((err as Error).message, true); } finally { setImporting(false); }
  }
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const rows = q.data.contacts.filter((x) => (group === 'all' || x.group === group) && (!search || [x.name, x.email, x.handle, x.tag].join(' ').toLowerCase().includes(search.toLowerCase())));
  const d = dialog || null;
  return <>
    <BackLink to="/label/promo">Campagnes</BackLink>
    <div className="toolbar">
      <select className="vat-select" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Groep"><option value="all">Alle groepen ({q.data.contacts.length})</option>{Object.entries(GROUP).map(([k, l]) => <option key={k} value={k}>{l} ({q.data.contacts.filter((x) => x.group === k).length})</option>)}</select>
      <div className="search"><Icon name="search" /><input placeholder="Zoek naam, e-mail of handle" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Zoek contact" /></div>
      {edit ? <div className="row-actions" style={{ marginLeft: 'auto' }}>
        <label className="button ghost">{importing ? <Orb state="weaving" /> : <Icon name="upload" />} Excel importeren<input type="file" accept=".xlsx" className="visually-hidden" onChange={upload} /></label>
        <button className="primary" onClick={() => setDialog(null)}><Icon name="plus" /> Contact</button></div> : null}
    </div>
    <p className="helper">Import leest elk tabblad: een naamkolom, alle e-mailadressen en Instagram-handles. Tabbladen met “Spotify” of “playlist” in de naam komen bij Spotify-playlists. Bestaande contacten worden bijgewerkt, niet dubbel aangemaakt.</p>
    <section className="card">{rows.length ? <div className="table-wrap"><table><thead><tr><th>Naam</th><th>E-mail</th><th>Instagram</th><th>Groep</th><th>Tag</th><th /></tr></thead><tbody>
      {rows.map((x) => <tr key={x.id} className={x.active ? '' : 'muted-row'}><td><strong>{x.name}</strong>{x.active ? null : <small className="block">Niet meer mailen</small>}</td><td>{x.email || '—'}</td><td>{x.handle || '—'}</td><td>{GROUP[x.group]}</td><td>{x.tag}</td>
        <td className="row-tools">{edit ? <><button className="icon-btn ghost" onClick={() => setDialog(x)} aria-label={`${x.name} bewerken`}><Icon name="edit" /></button>
          <button className="icon-btn ghost" aria-label={`${x.name} verwijderen`} onClick={() => confirm(`${x.name} verwijderen?`) && run(async () => { await api(`/promo/contacts/${x.id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['promo-contacts'] }); })}><Icon name="trash" /></button></> : null}</td></tr>)}
    </tbody></table></div> : <Empty title="Nog geen contacten" sub="Importeer je bestaande Excel-lijsten (zoals de database van de Moonshine Mailer) of voeg een contact toe." icon="users" />}</section>
    <FormDialog id="contact-form" title={d ? 'Contact bewerken' : 'Nieuw contact'} open={dialog !== undefined} onClose={() => setDialog(undefined)} submit={async (form) => {
      const v = formValues(form);
      await api(d ? `/promo/contacts/${d.id}` : '/promo/contacts', { method: d ? 'PATCH' : 'POST', body: { ...v, active: 'active' in v } });
      setDialog(undefined); qc.invalidateQueries({ queryKey: ['promo-contacts'] });
    }}><div key={d?.id || 'new'}>
      <div className="form-grid">
        <div className="field"><label htmlFor="ct-name">Naam / kanaal</label><input id="ct-name" name="name" defaultValue={d?.name} required /></div>
        <div className="field"><label htmlFor="ct-group">Groep</label><select id="ct-group" name="group" defaultValue={d?.group || 'promo'}>{Object.entries(GROUP).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="field"><label htmlFor="ct-email">E-mail</label><input id="ct-email" name="email" type="email" defaultValue={d?.email} /></div>
        <div className="field"><label htmlFor="ct-handle">Instagram</label><input id="ct-handle" name="handle" defaultValue={d?.handle} placeholder="@kanaal" /></div>
        <div className="field"><label htmlFor="ct-tag">Tag</label><input id="ct-tag" name="tag" defaultValue={d?.tag} /></div>
      </div>
      <div className="field"><label htmlFor="ct-notes">Notities</label><textarea id="ct-notes" name="notes" rows={2} defaultValue={d?.notes} /></div>
      <label><input type="checkbox" name="active" defaultChecked={d ? d.active : true} /> Mag gemaild worden</label>
    </div></FormDialog>
  </>;
}

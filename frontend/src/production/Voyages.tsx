import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { euroInput, fullDate, stamp, today } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, PageTitle, Stat, formValues, useAction, useToast } from '../lib/ui';
import { DriveButton, FormDialog, useCanEdit, useDirty } from './common';

type Voyage = { id: string; performer: string; artist_id: string | null; event_name: string; venue: string; city: string; country: string; date: string; set_time: string;
  status: string; fee: number; currency: string; deal: string; travel: string; promoter_name: string; promoter_email: string; promoter_phone: string; mail_link: string;
  drive_url: string; updated: number; notes?: string; log?: { id: number; kind: string; body: string; author: string; created: number }[] };
export const VOYAGE_STATUS: Record<string, [string, string]> = {
  lead: ['Aanvraag', ''], offer: ['Voorstel verstuurd', 'blue'], negotiating: ['In onderhandeling', 'amber'], confirmed: ['Bevestigd', 'lime'],
  contracted: ['Contract getekend', 'lime'], advanced: ['Advancing rond', 'purple'], played: ['Gespeeld', 'purple'], declined: ['Afgewezen', 'red'], cancelled: ['Geannuleerd', 'red'],
};
const money = (cents: number, cur: string) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'EUR' }).format((cents || 0) / 100); } catch { return `${(cents || 0) / 100} ${cur}`; } };
const OPEN = ['lead', 'offer', 'negotiating'];

export function VoyagesPage() {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<'upcoming' | 'pipeline' | 'past' | 'all'>('upcoming');
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['voyages'], queryFn: () => api<{ voyages: Voyage[] }>('/voyages') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const now = today();
  const all = q.data.voyages;
  const rows = all.filter((v) => tab === 'all' || (tab === 'pipeline' ? OPEN.includes(v.status)
    : tab === 'past' ? (v.date && v.date < now) || ['played', 'declined', 'cancelled'].includes(v.status)
      : (!v.date || v.date >= now) && !['played', 'declined', 'cancelled'].includes(v.status)));
  const confirmed = all.filter((v) => ['confirmed', 'contracted', 'advanced'].includes(v.status) && (!v.date || v.date >= now));
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuwe voyage</button> : null;
  return <>
    <PageTitle eyebrow="Productie" title="Voyages" sub="Shows buiten het Moonshine-programma: andere events, buitenland. Van eerste contact tot gespeeld." actions={button} />
    <div className="stats">
      <Stat label="In de pijplijn" value={all.filter((v) => OPEN.includes(v.status)).length} sub="Aanvraag, voorstel of onderhandeling" icon="send" />
      <Stat label="Bevestigd" value={confirmed.length} sub="Komende shows" icon="check" />
      <Stat label="Gespeeld" value={all.filter((v) => v.status === 'played').length} sub="Totaal" icon="music" />
      <Stat label="Landen" value={new Set(all.map((v) => v.country).filter(Boolean)).size} sub="Waar we speelden of spelen" icon="plane" />
    </div>
    <div className="toolbar"><div className="tabs">{([['upcoming', 'Komend'], ['pipeline', 'Pijplijn'], ['past', 'Afgelopen'], ['all', 'Alles']] as const).map(([v, l]) => <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>)}</div></div>
    <section className="card">{rows.length ? <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Wie</th><th>Event</th><th>Waar</th><th>Status</th><th className="amount">Gage</th><th /></tr></thead><tbody>
      {rows.map((v) => { const [l, c] = VOYAGE_STATUS[v.status] || [v.status, '']; const go = () => navigate(`/voyages/${v.id}`);
        return <tr key={v.id} className="clickable" tabIndex={0} onClick={go} onKeyDown={(k) => k.key === 'Enter' && go()}>
          <td className="nowrap">{v.date ? fullDate(v.date) : 'Nog onbekend'}</td><td><strong>{v.performer}</strong></td>
          <td>{v.event_name}{v.venue ? <small className="block">{v.venue}</small> : null}</td><td>{[v.city, v.country].filter(Boolean).join(', ') || '—'}</td>
          <td><Badge color={c}>{l}</Badge></td><td className="amount">{v.fee ? money(v.fee, v.currency) : '—'}</td><td><Icon name="chevron" /></td></tr>; })}
    </tbody></table></div> : <Empty title="Geen voyages in deze lijst" sub="Leg elke aanvraag vast, ook als het nog niets is; zo zie je wat er loopt." action={button} icon="plane" />}</section>
    <FormDialog id="voyage-new" title="Nieuwe voyage" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const v = await api<Voyage>('/voyages', { method: 'POST', body: formValues(form) });
      setOpen(false); toast('Voyage aangemaakt.'); navigate(`/voyages/${v.id}`);
    }}>
      <div className="form-grid">
        <div className="field"><label htmlFor="vn-perf">Wie speelt</label><input id="vn-perf" name="performer" required placeholder="Bijv. PEPPY" /></div>
        <div className="field"><label htmlFor="vn-event">Event</label><input id="vn-event" name="event_name" required /></div>
        <div className="field"><label htmlFor="vn-city">Stad</label><input id="vn-city" name="city" /></div>
        <div className="field"><label htmlFor="vn-country">Land</label><input id="vn-country" name="country" /></div>
        <div className="field"><label htmlFor="vn-date">Datum</label><input id="vn-date" name="date" type="date" /></div>
        <div className="field"><label htmlFor="vn-status">Status</label><select id="vn-status" name="status" defaultValue="lead">{Object.entries(VOYAGE_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
    </FormDialog>
  </>;
}

export function VoyagePage() {
  const { id = '' } = useParams();
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const { setDirty, track } = useDirty();
  const q = useQuery({ queryKey: ['voyage', id], queryFn: () => api<Voyage>(`/voyages/${id}`) });
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/voyages">Voyages</BackLink><ErrorBox error={q.error} /></>;
  const v = q.data;
  const set = (n: Voyage) => { qc.setQueryData(['voyage', id], n); qc.invalidateQueries({ queryKey: ['voyages'] }); };
  const reload = () => qc.invalidateQueries({ queryKey: ['voyage', id] });
  const [label, color] = VOYAGE_STATUS[v.status] || [v.status, ''];
  const input = (name: keyof Voyage, text: string, type = 'text', extra: Record<string, unknown> = {}) =>
    <div className="field"><label htmlFor={`vy-${name}`}>{text}</label><input id={`vy-${name}`} name={name} type={type} defaultValue={String(v[name] ?? '')} disabled={!edit} {...extra} /></div>;
  return <>
    <BackLink to="/voyages">Alle voyages</BackLink>
    <PageTitle eyebrow="Voyage" title={`${v.performer} @ ${v.event_name}`} sub={<>{v.date ? fullDate(v.date) : 'Datum onbekend'}{v.city ? ' · ' + [v.city, v.country].filter(Boolean).join(', ') : ''} <Badge color={color}>{label}</Badge></>}
      actions={<><DriveButton kind="voyage" id={v.id} url={v.drive_url} onDone={reload} />{v.mail_link ? <a className="button ghost" href={v.mail_link} target="_blank" rel="noopener noreferrer"><Icon name="mail" /> Mailcontact</a> : null}
        {edit ? <button className="primary" type="submit" form="voyage-form">Opslaan</button> : null}</>} />
    <div className="promo-grid">
      <form id="voyage-form" className="card card-pad" key={v.updated} {...track} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/voyages/${id}`, { method: 'PATCH', body: formValues(f) })); setDirty(false); }, 'Opgeslagen.'); }}>
        <h2>Show</h2>
        <div className="form-grid">
          {input('performer', 'Wie speelt')}{input('event_name', 'Event')}{input('venue', 'Venue')}{input('city', 'Stad')}{input('country', 'Land')}
          {input('date', 'Datum', 'date')}{input('set_time', 'Set time', 'text', { placeholder: '02:00–03:30' })}
          <div className="field"><label htmlFor="vy-status">Status</label><select id="vy-status" name="status" defaultValue={v.status} disabled={!edit}>{Object.entries(VOYAGE_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        <h2 className="sub">Deal</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="vy-fee">Gage</label><input id="vy-fee" name="fee" defaultValue={euroInput(v.fee)} inputMode="decimal" placeholder="0,00" disabled={!edit} /></div>
          {input('currency', 'Valuta', 'text', { maxLength: 3 })}{input('deal', 'Soort deal', 'text', { placeholder: 'Flat fee, door split, guarantee + bonus' })}{input('travel', 'Reis en hotel', 'text', { placeholder: 'Wie regelt en betaalt' })}
        </div>
        <h2 className="sub">Contact</h2>
        <div className="form-grid">
          {input('promoter_name', 'Promoter / booker')}{input('promoter_email', 'E-mail', 'email')}{input('promoter_phone', 'Telefoon', 'tel')}{input('mail_link', 'Link naar mailthread', 'url', { placeholder: 'https://outlook.office.com/…' })}
        </div>
        <div className="field"><label htmlFor="vy-notes">Notities</label><textarea id="vy-notes" name="notes" rows={4} defaultValue={v.notes} disabled={!edit} /></div>
        {edit ? <p className="helper"><button type="button" className="text-link" onClick={() => confirm('Voyage verwijderen?') && run(async () => { await api(`/voyages/${id}`, { method: 'DELETE' }); setDirty(false); qc.invalidateQueries({ queryKey: ['voyages'] }); navigate('/voyages'); })}>Voyage verwijderen</button></p> : null}
      </form>
      <section className="card card-pad">
        <h2>Contactlog</h2><p className="helper">Elke mail, call of afspraak, zodat iedereen weet waar het staat. Statuswijzigingen komen er vanzelf bij.</p>
        {edit ? <form className="log-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/voyages/${id}/log`, { method: 'POST', body: formValues(f) })); f.reset(); toast('Toegevoegd.'); }); }}>
          <select name="kind" aria-label="Soort" defaultValue="mail"><option value="mail">Mail</option><option value="call">Call</option><option value="note">Notitie</option></select>
          <textarea name="body" rows={2} required placeholder="Bijv. offerte gestuurd, wachten op tijden" aria-label="Bericht" />
          <button className="primary small" type="submit">Toevoegen</button>
        </form> : null}
        <ul className="voyage-log">{(v.log || []).map((n) => <li key={n.id} className={`log-${n.kind}`}><span className="log-kind">{({ mail: 'Mail', call: 'Call', note: 'Notitie', status: 'Status' } as Record<string, string>)[n.kind] || n.kind}</span>
          <div><p>{n.body}</p><small>{n.author} · {stamp(n.created)}</small></div></li>)}</ul>
      </section>
    </div>
  </>;
}

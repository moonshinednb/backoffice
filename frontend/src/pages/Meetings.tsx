import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { fullDate, today } from '../lib/format';
import { BackLink, Empty, ErrorBox, Icon, Loading, Orb, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from '../production/common';

type Action = { id: number; meeting_id: string; meeting_date: string; owner: string; text: string; due: string; done: boolean; source: string; task_id: string };
type Meeting = { id: string; date: string; title: string; drive_url: string; file_name: string; open: number; actions_count: number; read_at: number | null; extracted_at: number | null; text?: string; actions?: Action[] };
const NAMES: Record<string, string> = { peppy: 'Pepijn', bram: 'Bram', shoroy: 'Shoroy' };

function Sticky({ a, onChange }: { a: Action; onChange: () => void }) {
  const run = useAction();
  const edit = useCanEdit();
  return <li className={`sticky ${a.done ? 'done' : ''}`}>
    <label><input type="checkbox" checked={a.done} disabled={!edit} onChange={(e) => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'PATCH', body: { done: e.target.checked } }); onChange(); })} /> <span>{a.text}</span></label>
    <div className="sticky-foot"><small>{a.due ? `voor ${fullDate(a.due)} · meeting ${fullDate(a.meeting_date)}` : `meeting ${fullDate(a.meeting_date)}`}</small>
      {edit && !a.task_id ? <button className="text-link" onClick={() => run(async () => { await api(`/meeting-actions/${a.id}/task`, { method: 'POST' }); onChange(); }, 'Taak aangemaakt.')}>Maak taak</button> : a.task_id ? <small className="sticky-task">✓ Taak</small> : null}</div>
  </li>;
}

const SHOWN = 4;

/** Open action points per person, as sticky notes (newest first, a few per person). */
export function StickyBoard() {
  const qc = useQueryClient();
  const [all, setAll] = useState<Record<string, boolean>>({});
  const q = useQuery({ queryKey: ['meeting-board'], queryFn: () => api<{ actions: Action[] }>('/meetings/board') });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['meeting-board'] }); qc.invalidateQueries({ queryKey: ['meeting'] }); qc.invalidateQueries({ queryKey: ['meetings'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); };
  if (q.isPending) return <Loading />;
  const rows = q.data?.actions || [];
  const cols: [string, string][] = [['peppy', 'Pepijn'], ['bram', 'Bram'], ['shoroy', 'Shoroy'], ['__other', 'Overig / team']];
  return <div className="sticky-board">{cols.map(([key, name]) => {
    const mine = rows.filter((a) => key === '__other' ? !NAMES[a.owner] : a.owner === key);
    const shown = all[key] ? mine : mine.slice(0, SHOWN);
    return <section key={key} className={`sticky-col col-${key.replace('__', '')}`}><h3>TODO · {name} <span>{mine.length}</span></h3>
      {mine.length ? <ul>{shown.map((a) => <Sticky key={a.id} a={a} onChange={refresh} />)}</ul> : <p className="helper">Niets open.</p>}
      {mine.length > SHOWN ? <button className="text-link sticky-more" onClick={() => setAll({ ...all, [key]: !all[key] })}>{all[key] ? 'Minder tonen' : `+${mine.length - SHOWN} meer`}</button> : null}</section>;
  })}</div>;
}

const OWNERS: [string, string][] = [['peppy', 'Pepijn'], ['bram', 'Bram'], ['shoroy', 'Shoroy'], ['', 'Team']];

/** One action point of a single meeting: a small note in the side column. */
function MiniAction({ a, onChange }: { a: Action; onChange: () => void }) {
  const run = useAction();
  const edit = useCanEdit();
  const patch = (body: object) => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'PATCH', body }); onChange(); });
  return <li className={`mini-note col-${NAMES[a.owner] ? a.owner : 'other'} ${a.done ? 'done' : ''}`}>
    <label><input type="checkbox" checked={a.done} disabled={!edit} onChange={(e) => patch({ done: e.target.checked })} /><span>{a.text}</span></label>
    <div className="mini-meta">
      <select value={a.owner} disabled={!edit} aria-label="Voor wie" onChange={(e) => patch({ owner: e.target.value })}>
        {OWNERS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}{a.owner && !NAMES[a.owner] ? <option value={a.owner}>{a.owner}</option> : null}</select>
      {a.due ? <small>{`voor ${fullDate(a.due)}`}</small> : null}
      {a.task_id ? <small className="sticky-task">✓ bij Taken</small> : edit ? <button className="text-link" onClick={() => run(async () => { await api(`/meeting-actions/${a.id}/task`, { method: 'POST' }); onChange(); }, 'Taak aangemaakt.')}>Maak taak</button> : null}
      {edit ? <button className="icon-btn ghost tiny" aria-label="Verwijderen" onClick={() => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'DELETE' }); onChange(); })}><Icon name="close" /></button> : null}
    </div>
  </li>;
}

export function MeetingsPage() {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['meetings'], queryFn: () => api<{ meetings: Meeting[] }>('/meetings') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuwe meeting</button> : null;
  return <>
    <PageTitle title="Meetings" sub="Notulen van de wekelijkse meetings, met de actiepunten per persoon. De notulen zelf staan als Word-bestand op OneDrive." actions={button} />
    <StickyBoard />
    <section className="card section-gap"><div className="card-head"><h2>Alle meetings</h2></div>
      {q.data.meetings.length ? <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Meeting</th><th>Actiepunten</th><th /></tr></thead><tbody>
        {q.data.meetings.map((m) => <tr key={m.id} className="clickable" tabIndex={0} onClick={() => navigate(`/meetings/${m.id}`)} onKeyDown={(k) => k.key === 'Enter' && navigate(`/meetings/${m.id}`)}>
          <td className="nowrap">{fullDate(m.date)}</td><td><strong>{m.title}</strong></td><td>{m.actions_count ? `${m.open} open van ${m.actions_count}` : '—'}</td><td><Icon name="chevron" /></td></tr>)}
      </tbody></table></div> : <Empty title="Nog geen meetings" sub="Maak een nieuwe meeting aan; de backoffice zet het Word-sjabloon klaar op OneDrive." action={button} icon="calendar" />}</section>
    <FormDialog id="meeting-new" title="Nieuwe meeting" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const m = await api<Meeting>('/meetings', { method: 'POST', body: formValues(form) });
      setOpen(false); toast('Notulen klaargezet op OneDrive.'); navigate(`/meetings/${m.id}`);
    }}>
      <div className="field"><label htmlFor="mt-date">Datum</label><input id="mt-date" name="date" type="date" defaultValue={today()} required /></div>
      <p className="helper">De backoffice kopieert het sjabloon “Template vergaderingen Moonshine Label” naar 1. Vergaderingen/&lt;jaar&gt;/&lt;maand&gt;/MS Meeting &lt;datum&gt;. Je schrijft de notulen in Word; daarna haalt de backoffice de actiepunten eruit.</p>
    </FormDialog>
  </>;
}

export function MeetingPage() {
  const { id = '' } = useParams();
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const q = useQuery({ queryKey: ['meeting', id], queryFn: () => api<Meeting>(`/meetings/${id}`) });
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/meetings">Meetings</BackLink><ErrorBox error={q.error} /></>;
  const m = q.data;
  const actions = m.actions || [];
  const set = (n: Meeting) => { qc.setQueryData(['meeting', id], n); qc.invalidateQueries({ queryKey: ['meetings'] }); qc.invalidateQueries({ queryKey: ['meeting-board'] }); };
  const refresh = () => { for (const k of ['meeting', 'meetings', 'meeting-board', 'tasks']) qc.invalidateQueries({ queryKey: [k] }); };
  async function act(kind: 'read' | 'extract') {
    setBusy(kind);
    try {
      const r = await api<Meeting & { found?: number; how?: string }>(`/meetings/${id}/${kind}`, { method: 'POST' });
      set(r);
      toast(kind === 'read' ? 'Notulen opnieuw ingelezen.' : `${r.found} actiepunten gevonden${r.how === 'ai' ? ' met AI' : ' (zonder AI: alleen regels met “Actie:” en namen)'}.`);
    } catch (e) { toast((e as Error).message, true); } finally { setBusy(''); }
  }
  return <>
    <BackLink to="/meetings">Alle meetings</BackLink>
    <PageTitle eyebrow="Meeting" title={m.title} sub={fullDate(m.date)}
      actions={<>{m.drive_url ? <a className="button ghost" href={m.drive_url} target="_blank" rel="noopener noreferrer"><Icon name="file" /> Open in Word</a> : null}
        {edit ? <><button className="ghost" disabled={!!busy} onClick={() => act('read')}>{busy === 'read' ? <Orb state="searching" /> : <Icon name="refresh" />} Opnieuw inlezen</button>
          <button className="primary" disabled={!!busy} onClick={() => act('extract')}>{busy === 'extract' ? <Orb state="solving" /> : <Icon name="spark" />} Actiepunten eruit halen</button></> : null}</>} />
    <div className="meeting-layout">
      <section className="card card-pad"><h2>Notulen</h2>{m.text ? <pre className="minutes">{m.text}</pre> : <p className="helper">Nog leeg. Schrijf de notulen in Word en klik daarna op “Opnieuw inlezen”.</p>}</section>
      <aside className="card card-pad meeting-side"><div className="side-head"><h2>Actiepunten</h2>{actions.length ? <span>{`${m.open} open van ${actions.length}`}</span> : null}</div>
        {actions.length ? <ul className="mini-notes">{actions.map((a) => <MiniAction key={a.id} a={a} onChange={refresh} />)}</ul> : <p className="helper">Nog geen actiepunten. Klik op “Actiepunten eruit halen” of voeg er zelf een toe.</p>}
        {edit ? <form className="mini-add" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/meetings/${id}/actions`, { method: 'POST', body: formValues(f) })); f.reset(); }); }}>
          <select name="owner" aria-label="Voor wie" defaultValue="peppy">{OWNERS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
          <input name="text" required placeholder="Actiepunt" aria-label="Actiepunt" /><button className="primary small" type="submit" aria-label="Toevoegen"><Icon name="plus" /></button></form> : null}
        <p className="helper small">Controleer wie wat doet; “Maak taak” zet het ook in Taken en Microsoft To Do.</p>
      </aside>
    </div>
  </>;
}

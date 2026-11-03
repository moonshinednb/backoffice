import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { dayNumber, fullDate, monthShort, shortDate, today } from '../lib/format';
import { BackLink, ErrorBox, Icon, Loading, Orb, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from '../production/common';

type Action = { id: number; meeting_id: string; meeting_date: string; owner: string; text: string; due: string; done: boolean; source: string; task_id: string };
type Meeting = { id: string; date: string; title: string; drive_url: string; file_name: string; open: number; actions_count: number; read_at: number | null; extracted_at: number | null; text?: string; actions?: Action[] };
const NAMES: Record<string, string> = { peppy: 'Pepijn', bram: 'Bram', shoroy: 'Shoroy' };

function ActionRow({ a, onChange }: { a: Action; onChange: () => void }) {
  const run = useAction();
  const edit = useCanEdit();
  const late = !a.done && !!a.due && a.due < today();
  return <li className={`mt-row ${a.done ? 'done' : ''}`}>
    <input type="checkbox" checked={a.done} disabled={!edit} aria-label={`${a.text} afvinken`} onChange={(e) => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'PATCH', body: { done: e.target.checked } }); onChange(); })} />
    <span className="act-text"><span>{a.text}</span><small>{`meeting ${shortDate(a.meeting_date)}`}{a.task_id ? ' · in Taken' : ''}</small></span>
    {edit ? <input type="date" className={`due-input ${late ? 'late' : ''} ${a.due ? '' : 'empty'}`} value={a.due || ''} aria-label={`Deadline voor ${a.text}`} title="Deadline"
      onChange={(e) => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'PATCH', body: { due: e.target.value } }); onChange(); })} />
      : <span className={`mt-due ${late ? 'late' : ''}`}>{a.due ? shortDate(a.due) : ''}</span>}
    {!a.task_id && edit ? <button className="small ghost mt-task" onClick={() => run(async () => { const r = await api<{ for: string }>(`/meeting-actions/${a.id}/task`, { method: 'POST' }); onChange(); return r; }, (r) => r?.for ? `Staat nu bij Taken van ${r.for}.` : 'Staat nu bij Taken (nog niemand toegewezen).')}>Maak taak</button> : <span />}
  </li>;
}

const SHOWN = 5;

/** Open action points per person: one list per person, newest first. */
export function ActionBoard() {
  const qc = useQueryClient();
  const [all, setAll] = useState<Record<string, boolean>>({});
  const q = useQuery({ queryKey: ['meeting-board'], queryFn: () => api<{ actions: Action[] }>('/meetings/board') });
  const refresh = () => { for (const k of ['meeting-board', 'meeting', 'meetings', 'tasks', 'my-work']) qc.invalidateQueries({ queryKey: [k] }); };
  if (q.isPending) return <Loading />;
  const rows = q.data?.actions || [];
  const cols: [string, string][] = [['peppy', 'Pepijn'], ['bram', 'Bram'], ['shoroy', 'Shoroy'], ['__other', 'Team']];
  return <section className="block"><div className="block-head"><h2>Open actiepunten</h2><span className="n">{rows.length || ''}</span></div>
    <div className="person-grid">{cols.map(([key, name]) => {
      const mine = rows.filter((a) => key === '__other' ? !NAMES[a.owner] : a.owner === key);
      const shown = all[key] ? mine : mine.slice(0, SHOWN);
      return <div key={key} className="panel person-list"><h3>{name}<span>{mine.length}</span></h3>
        {mine.length ? <ul className="rows">{shown.map((a) => <ActionRow key={a.id} a={a} onChange={refresh} />)}</ul> : <p className="empty-line">Niets open.</p>}
        {mine.length > SHOWN ? <button className="text-link person-more" onClick={() => setAll({ ...all, [key]: !all[key] })}>{all[key] ? 'Minder' : `+${mine.length - SHOWN} meer`}</button> : null}</div>;
    })}</div></section>;
}

const OWNERS: [string, string][] = [['peppy', 'Pepijn'], ['bram', 'Bram'], ['shoroy', 'Shoroy'], ['', 'Team']];

/** One action point of a single meeting: a small note in the side column. */
function MiniAction({ a, onChange }: { a: Action; onChange: () => void }) {
  const run = useAction();
  const edit = useCanEdit();
  const patch = (body: object) => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'PATCH', body }); onChange(); });
  return <li className={`mini-note ${a.done ? 'done' : ''}`}>
    <label><input type="checkbox" checked={a.done} disabled={!edit} onChange={(e) => patch({ done: e.target.checked })} /><span>{a.text}</span></label>
    <div className="mini-meta">
      <select value={a.owner} disabled={!edit} aria-label="Voor wie" onChange={(e) => patch({ owner: e.target.value })}>
        {OWNERS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}{a.owner && !NAMES[a.owner] ? <option value={a.owner}>{a.owner}</option> : null}</select>
      {edit ? <input type="date" className={`due-input ${a.due ? '' : 'empty'}`} value={a.due || ''} aria-label="Deadline" title="Deadline" onChange={(e) => patch({ due: e.target.value })} />
        : a.due ? <small>{`voor ${shortDate(a.due)}`}</small> : null}
      {a.task_id ? <small className="act-task">In Taken</small> : edit ? <button className="text-link" onClick={() => run(async () => { const r = await api<{ for: string }>(`/meeting-actions/${a.id}/task`, { method: 'POST' }); onChange(); return r; }, (r) => r?.for ? `Staat nu bij Taken van ${r.for}.` : 'Staat nu bij Taken (nog niemand toegewezen).')}>Maak taak</button> : null}
      {edit ? <button className="icon-btn ghost tiny" aria-label="Verwijderen" onClick={() => run(async () => { await api(`/meeting-actions/${a.id}`, { method: 'DELETE' }); onChange(); })}><Icon name="close" /></button> : null}
    </div>
  </li>;
}

type Next = { date: string; time: string; place: string; source: 'planned' | 'set' | 'expected'; meeting_id: string | null; every?: number } | null;

/** "Upcoming meeting" bar: the next date, how far away, and quick actions. */
function NextMeeting({ onCreate }: { onCreate: (date: string) => void }) {
  const qc = useQueryClient();
  const run = useAction();
  const edit = useCanEdit();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const q = useQuery({ queryKey: ['meeting-next'], queryFn: () => api<{ next: Next }>('/meetings/next') });
  if (q.isPending) return null;
  const n = q.data?.next;
  const days = n ? Math.round((Date.parse(n.date) - Date.parse(today())) / 86400000) : 0;
  const when = !n ? '' : days === 0 ? 'vandaag' : days === 1 ? 'morgen' : `over ${days} dagen`;
  return <section className="panel next-meeting">
    {n && !editing ? <span className="att-date"><strong>{dayNumber(n.date)}</strong><span>{monthShort(n.date)}</span></span> : null}
    {editing || !n ? <form className="nm-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { await api('/meetings/next', { method: 'PUT', body: formValues(f) }); setEditing(false); qc.invalidateQueries({ queryKey: ['meeting-next'] }); }, ); }}>
      <strong>Upcoming meeting</strong>
      <input name="date" type="date" required defaultValue={n?.date || today()} aria-label="Datum" />
      <input name="time" type="time" defaultValue={n?.time || ''} aria-label="Tijd" />
      <input name="place" placeholder="Waar (bijv. Discord)" defaultValue={n?.place || ''} aria-label="Waar" />
      <button className="primary small" type="submit">Opslaan</button>{n ? <button type="button" className="ghost small" onClick={() => setEditing(false)}>Annuleren</button> : null}
    </form> : <>
      <div className="nm-text"><span className="nm-label">Upcoming meeting</span>
        <strong>{`${fullDate(n.date)}${n.time ? ', ' + n.time : ''}`}</strong>
        <small>{[when, n.place, n.source === 'expected' ? `verwacht, elke ${n.every} dagen` : n.source === 'planned' ? 'notulen staan klaar' : '']
          .filter(Boolean).map((part, i) => <span key={i}>{i ? ' · ' : ''}<span>{part}</span></span>)}</small></div>
      <div className="nm-actions">
        {n.meeting_id ? <button className="ghost small" onClick={() => navigate(`/meetings/${n.meeting_id}`)}>Notulen openen</button>
          : edit ? <button className="ghost small" onClick={() => onCreate(n.date)}>Notulen klaarzetten</button> : null}
        {edit ? <button className="ghost small" onClick={() => setEditing(true)}>Wijzigen</button> : null}
      </div>
    </>}
  </section>;
}

export function MeetingsPage() {
  const qc = useQueryClient();
  const edit = useCanEdit();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(today());
  const q = useQuery({ queryKey: ['meetings'], queryFn: () => api<{ meetings: Meeting[] }>('/meetings') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuwe meeting</button> : null;
  return <>
    <PageTitle title="Meetings" actions={button} />
    <NextMeeting onCreate={(d) => { setDay(d); setOpen(true); }} />
    <ActionBoard />
    <section className="block"><div className="block-head"><h2>Alle meetings</h2></div>
      {q.data.meetings.length ? <div className="panel"><ul className="rows">{q.data.meetings.map((m) => <li key={m.id}><Link className="ev-row meeting-row" to={`/meetings/${m.id}`}>
        <span className="att-date"><strong>{dayNumber(m.date)}</strong><span>{monthShort(m.date)}</span></span>
        <span className="att-name"><strong>{m.title}</strong><small>{m.actions_count ? `${m.open} open van ${m.actions_count} actiepunten` : 'Geen actiepunten'}</small></span>
        <Icon name="chevron" /></Link></li>)}</ul></div>
        : <div className="panel"><p className="empty-line">Nog geen meetings.</p></div>}</section>
    <FormDialog id="meeting-new" title="Nieuwe meeting" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const m = await api<Meeting>('/meetings', { method: 'POST', body: formValues(form) });
      setOpen(false); navigate(`/meetings/${m.id}`);
      qc.invalidateQueries({ queryKey: ['meeting-next'] });
    }}>
      <div className="field"><label htmlFor="mt-date">Datum</label><input id="mt-date" key={day} name="date" type="date" defaultValue={day} required /></div>
      <p className="helper">Zet het Word-sjabloon klaar in 1. Vergaderingen op OneDrive.</p>
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
    <PageTitle title={m.title} sub={fullDate(m.date)}
      actions={<>{m.drive_url ? <a className="button ghost" href={m.drive_url} target="_blank" rel="noopener noreferrer">Open in Word</a> : null}
        {edit ? <><button className="ghost" disabled={!!busy} onClick={() => act('read')}>{busy === 'read' ? <Orb /> : <Icon name="refresh" />} Opnieuw inlezen</button>
          <button className="primary" disabled={!!busy} onClick={() => act('extract')}>{busy === 'extract' ? <Orb /> : null} Actiepunten eruit halen</button></> : null}</>} />
    <div className="meeting-layout">
      <section className="panel card-pad"><h2>Notulen</h2>{m.text ? <pre className="minutes">{m.text}</pre> : <p className="helper">Nog leeg. Schrijf de notulen in Word en klik daarna op “Opnieuw inlezen”.</p>}</section>
      <aside className="panel card-pad meeting-side"><div className="side-head"><h2>Actiepunten</h2>{actions.length ? <span>{`${m.open} open van ${actions.length}`}</span> : null}</div>
        {actions.length ? <ul className="mini-notes">{actions.map((a) => <MiniAction key={a.id} a={a} onChange={refresh} />)}</ul> : <p className="helper">Nog geen actiepunten. Klik op “Actiepunten eruit halen” of voeg er zelf een toe.</p>}
        {edit ? <form className="mini-add" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/meetings/${id}/actions`, { method: 'POST', body: formValues(f) })); f.reset(); }); }}>
          <select name="owner" aria-label="Voor wie" defaultValue="peppy">{OWNERS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
          <input name="text" required placeholder="Actiepunt" aria-label="Actiepunt" /><button className="primary small" type="submit" aria-label="Toevoegen"><Icon name="plus" /></button></form> : null}
      </aside>
    </div>
  </>;
}

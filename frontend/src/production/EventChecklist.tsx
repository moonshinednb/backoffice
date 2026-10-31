import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fullDate, today } from '../lib/format';
import { Empty, Icon, Loading, Orb, ErrorBox, formValues, useAction } from '../lib/ui';
import { useUsers } from '../pages/shared';
import { useCanEdit } from './common';

export type Step = { id: string; key: string; phase: string; label: string; owner: string; due: string; manual_due: boolean; auto: string; done: boolean; done_by: string; task_id: string };
type Steps = { steps: Step[]; phases: [string, string][]; seeded: boolean; ticked?: number };
type Mine = Step & { event_id: string; event_name: string; event_date: string };

const AUTO_LABEL: Record<string, string> = { finance: '01 Finance', epks: '02 EPKs', riders: '03 Riders', artwork: '04 Artwork', content: '05 Content', productie: '06 Productie', 'na afloop': '07 Na afloop' };

function autoFolder(auto: string) {
  const [key, ...rest] = auto.split('/');
  return [AUTO_LABEL[key] || key, ...rest].join('/');
}

/** "over 5 dagen", "vandaag", "3 dagen te laat" */
export function relative(due: string) {
  if (!due) return { text: 'geen deadline', late: false, soon: false };
  const days = Math.round((Date.parse(due) - Date.parse(today())) / 86400000);
  if (days === 0) return { text: 'vandaag', late: false, soon: true };
  if (days < 0) return { text: days === -1 ? '1 dag te laat' : `${-days} dagen te laat`, late: true, soon: false };
  return { text: days === 1 ? 'morgen' : days < 15 ? `over ${days} dagen` : fullDate(due), late: false, soon: days <= 7 };
}

function Owner({ s, names, edit, onChange }: { s: Step; names: [string, string][]; edit: boolean; onChange: (owner: string) => void }) {
  const label = names.find(([u]) => u === s.owner)?.[1] || (s.owner || 'Team');
  if (!edit) return <span className={`owner-chip o-${s.owner || 'team'}`}>{label}</span>;
  return <select className={`owner-chip o-${s.owner || 'team'}`} value={s.owner} aria-label="Wie" onChange={(e) => onChange(e.target.value)}>
    <option value="">Team</option>{names.map(([u, n]) => <option key={u} value={u}>{n}</option>)}</select>;
}

/** The team checklist of one event: per phase who does what, and before when. */
export function EventChecklist({ eventId, hasDrive }: { eventId: string; hasDrive: boolean }) {
  const qc = useQueryClient();
  const run = useAction();
  const edit = useCanEdit();
  const { user } = useAuth();
  const users = useUsers();
  const [who, setWho] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const [checking, setChecking] = useState(false);
  const key = ['event-steps', eventId];
  const q = useQuery({ queryKey: key, queryFn: () => api<Steps>(`/events/${eventId}/steps`) });
  useEffect(() => {
    if (!hasDrive) return;
    let live = true;
    setChecking(true);
    api<Steps>(`/events/${eventId}/steps/check`, { method: 'POST' }).then((r) => { if (live) qc.setQueryData(key, r); }).catch(() => undefined).finally(() => live && setChecking(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, hasDrive]);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data;
  const names: [string, string][] = (users.data?.users || []).filter((u) => u.active).map((u) => [u.username, u.name]);
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['my-event-steps'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); };
  const patch = (s: Step, body: object) => run(async () => { await api(`/event-steps/${s.id}`, { method: 'PATCH', body }); refresh(); });
  if (!d.seeded && !d.steps.length) return <section className="card"><Empty title="Geen checklist" sub="Voor afgelopen events is geen teamchecklist bijgehouden. Bekijk de bestanden in de tab Bestanden." icon="check" /></section>;
  const shown = d.steps.filter((s) => (!who || s.owner === who) && (!hideDone || !s.done));
  const done = d.steps.filter((s) => s.done).length;
  return <>
    <div className="steps-head">
      <div className="steps-progress"><strong>{`${done}/${d.steps.length} klaar`}</strong><progress max={d.steps.length || 1} value={done} />
        {checking ? <span className="helper"><Orb state="searching" size={20} /> OneDrive controleren…</span> : null}</div>
      <div className="steps-filters">
        <button className={!who ? 'chip-btn active' : 'chip-btn'} onClick={() => setWho('')}>Iedereen</button>
        {user ? <button className={who === user.username ? 'chip-btn active' : 'chip-btn'} onClick={() => setWho(who === user.username ? '' : user.username)}>Alleen ik</button> : null}
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter op persoon"><option value="">Per persoon…</option>{names.map(([u, n]) => <option key={u} value={u}>{n}</option>)}</select>
        <label className="check-inline"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Verberg afgerond</label>
      </div>
    </div>
    <div className="steps-board">{d.phases.map(([phase, title]) => {
      const rows = shown.filter((s) => s.phase === phase);
      const all = d.steps.filter((s) => s.phase === phase);
      return <section key={phase} className={`steps-col phase-${phase}`}>
        <h3>{title} <span>{`${all.filter((s) => s.done).length}/${all.length}`}</span></h3>
        {rows.length ? <ul>{rows.map((s) => {
          const r = relative(s.due);
          return <li key={s.id} className={`step ${s.done ? 'done' : ''} ${!s.done && r.late ? 'late' : ''}`}>
            <label><input type="checkbox" checked={s.done} disabled={!edit} onChange={(e) => patch(s, { done: e.target.checked })} /><span>{s.label}</span></label>
            <div className="step-meta">
              <Owner s={s} names={names} edit={edit} onChange={(owner) => patch(s, { owner })} />
              {s.done ? <small className="step-by">{s.done_by === 'OneDrive' ? '✓ staat op OneDrive' : s.done_by === 'Advancingmail' ? '✓ advancing verstuurd' : '✓ ' + (names.find(([u]) => u === s.done_by)?.[1] || s.done_by)}</small>
                : <small className={r.late ? 'due late' : r.soon ? 'due soon' : 'due'} title={s.due ? fullDate(s.due) : ''}>{r.text}</small>}
              {s.auto && !s.done ? <small className="step-auto" title={`Vinkt vanzelf af zodra er bestanden staan in ${autoFolder(s.auto)}`}><Icon name="folder" />{autoFolder(s.auto)}</small> : null}
              {edit && !s.done ? (s.task_id ? <small className="step-task">in Taken</small> : <button className="text-link" onClick={() => run(async () => { await api(`/event-steps/${s.id}/task`, { method: 'POST' }); refresh(); }, 'Staat bij Taken.')}>Maak taak</button>) : null}
              {edit ? <button className="icon-btn ghost tiny" aria-label="Verwijderen" onClick={() => { if (confirm(`“${s.label}” van de checklist halen?`)) run(async () => { await api(`/event-steps/${s.id}`, { method: 'DELETE' }); refresh(); }); }}><Icon name="close" /></button> : null}
            </div>
          </li>;
        })}</ul> : <p className="helper">{all.length ? 'Niets te tonen met dit filter.' : 'Nog geen punten.'}</p>}
        {edit ? <form className="step-add" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { await api(`/events/${eventId}/steps`, { method: 'POST', body: { ...formValues(f), phase } }); f.reset(); refresh(); }); }}>
          <input name="label" required placeholder="Punt toevoegen" aria-label={`Punt toevoegen aan ${title}`} />
          <select name="owner" aria-label="Wie" defaultValue=""><option value="">Team</option>{names.map(([u, n]) => <option key={u} value={u}>{n}</option>)}</select>
          <button className="ghost small" type="submit" aria-label="Toevoegen"><Icon name="plus" /></button>
        </form> : null}
      </section>;
    })}</div>
    <p className="helper steps-help">Deadlines schuiven mee met de eventdatum. Een punt met een mapje vinkt zichzelf af zodra er bestanden in die OneDrive-map staan. Wie wat standaard doet, staat bij Admin → Instellingen.</p>
  </>;
}

/** Open checklist points of the signed-in person, across upcoming events. */
export function MyEventSteps() {
  const qc = useQueryClient();
  const run = useAction();
  const q = useQuery({ queryKey: ['my-event-steps'], queryFn: () => api<{ steps: Mine[] }>('/my-event-steps') });
  const rows = q.data?.steps || [];
  if (!rows.length) return null;
  return <section className="card my-steps"><div className="card-head"><div><h2>Mijn eventpunten</h2><p>Wat jij nog moet doen voor de komende events</p></div></div>
    <ul>{rows.slice(0, 8).map((s) => {
      const r = relative(s.due);
      return <li key={s.id} className={r.late ? 'late' : ''}>
        <input type="checkbox" aria-label={`${s.label} afvinken`} onChange={() => run(async () => { await api(`/event-steps/${s.id}`, { method: 'PATCH', body: { done: true } }); qc.invalidateQueries({ queryKey: ['my-event-steps'] }); qc.invalidateQueries({ queryKey: ['event-steps', s.event_id] }); })} />
        <Link to={`/events/${s.event_id}`}><strong>{s.label}</strong><small>{s.event_name}</small></Link>
        <small className={r.late ? 'due late' : r.soon ? 'due soon' : 'due'}>{r.text}</small>
      </li>;
    })}</ul>
    {rows.length > 8 ? <p className="helper my-steps-more">{`+${rows.length - 8} meer in de checklists van de events`}</p> : null}
  </section>;
}

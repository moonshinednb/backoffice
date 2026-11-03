import { locale } from '../lib/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { can, useAuth } from '../lib/auth';
import { dayNumber, eur, fullDate, monthShort, ROLE, shortDate, stamp, today } from '../lib/format';
import { Badge, ErrorBox, Icon, Loading, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog } from '../production/common';
import { EventRow } from '../production/Events';
import { Connection, Doc, DocumentBadge, Task, useDocuments, useTasks, useUsers } from './shared';
import { InvoiceDialog } from './Finance';
import { WorkRow, useMyWork, type WorkItem } from './MyWork';

type Dashboard = {
  upcoming_events: EventRow[]; finance_email: string; tasks_open: number; connections: Connection[];
  jobs: { queued: number; failed: number }; schedules: { name: string; last_ok: number | null; failures: number; error: string }[];
  finance?: { documents: number; posted: number; review: number; pending: number; total: number };
  admin?: { users: { id: string; name: string; username: string; role: string; active: boolean; must_change_password: boolean; last_login: number | null }[];
    audit: { id: number; created: number; actor: string; action: string }[]; failed_jobs: { id: string; kind: string; error: string; attempts: number }[] };
};

type AttEvent = { id: string; name: string; date: string; venue: string; days: number; steps: number; done: number; late: number; status: string; cover: boolean;
  next: { id: string; label: string; owner: string; due: string; late: boolean }[] };
type Attention = { events: AttEvent[];
  meeting: { date: string; time: string; place: string; meeting_id: string | null; source: string } | null };

function days(n: number) { return n === 0 ? 'vandaag' : n === 1 ? 'morgen' : `over ${n} dagen`; }

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const work = useMyWork();
  const focus = work.data?.focus || [];
  const finance = can.finance(user) && (focus.includes('finance') || focus.includes('admin'));
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard'), refetchInterval: 30000, enabled: finance || user?.role === 'admin' });
  const att = useQuery({ queryKey: ['attention'], queryFn: () => api<Attention>('/attention'), refetchInterval: 60000 });
  const docs = useDocuments(finance);
  const [doc, setDoc] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const items = work.data?.items || [];
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const urgent = items.filter((i) => i.due && i.due <= week);
  const c = work.data?.counts;
  const all = docs.data?.documents || [];
  const review = all.filter((x) => x.status === 'review');
  const d = q.data;
  const verified = d ? d.connections.filter((x) => x.status === 'verified').length : 0;
  const m = att.data?.meeting;
  return <>
    <PageTitle title="Overzicht" sub={new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })} />
    <div className="kpis" role="list">
      <Link role="listitem" to="/tasks" className={`kpi ${c?.late ? 'is-late' : ''}`}><i className="kpi-icon"><Icon name="clock" /></i><span className="kpi-body"><strong>{c ? c.late : '–'}</strong><span>Te laat</span></span></Link>
      <Link role="listitem" to="/tasks" className="kpi"><i className="kpi-icon"><Icon name="calendar" /></i><span className="kpi-body"><strong>{c ? c.week : '–'}</strong><span>Deze week</span></span></Link>
      <Link role="listitem" to="/events" className="kpi"><i className="kpi-icon"><Icon name="check" /></i><span className="kpi-body"><strong>{att.data ? att.data.events.length : '–'}</strong><span>Komende events</span></span></Link>
      {finance ? <Link role="listitem" to="/invoices" className={`kpi ${review.length ? 'is-warn' : ''}`}><i className="kpi-icon"><Icon name="invoice" /></i><span className="kpi-body"><strong>{docs.data ? review.length : '–'}</strong><span>Facturen te controleren</span></span></Link>
        : <Link role="listitem" to="/tasks" className="kpi"><i className="kpi-icon"><Icon name="tasks" /></i><span className="kpi-body"><strong>{c ? c.all : '–'}</strong><span>Open in totaal</span></span></Link>}
    </div>
    <div className="dash">
      <section className="block dash-now">
        <div className="block-head"><h2>Nu doen</h2>{c?.late ? <span className="n late">{`${c.late} te laat`}</span> : <span className="n">{urgent.length || ''}</span>}
          <span className="act"><Link className="text-link" to="/tasks">{`Alles${items.length ? ` (${items.length})` : ''}`}</Link></span></div>
        <div className="panel">{work.isPending ? <p className="empty-line">Laden…</p> : urgent.length
          ? <ul className="rows">{urgent.slice(0, 7).map((i) => <WorkRow key={i.kind + i.id} item={i} />)}</ul>
          : <p className="empty-line">{items.length ? 'Niets deze week. Kijk bij Taken voor later.' : 'Niets dat op jou wacht.'}</p>}</div>
      </section>
      <section className="block dash-events">
        {att.isPending ? <Loading /> : att.data?.events.length ? <>
          <NextEvent e={att.data.events[0]} onChange={() => att.refetch()} />
          {att.data.events.length > 1 ? <div className="panel later-events"><ul className="rows">{att.data.events.slice(1).map((e) => <li key={e.id}><Link to={`/events/${e.id}`} className="ev-row">
            <span className="att-date"><strong>{dayNumber(e.date)}</strong><span>{monthShort(e.date)}</span></span>
            <span className="att-name"><strong>{e.name}</strong><small>{[days(e.days), e.venue].filter(Boolean).join(' · ')}</small></span>
            <span />
            <span className="ev-progress"><span className="bar" aria-hidden="true"><i style={{ width: `${e.steps ? Math.round((e.done / e.steps) * 100) : 0}%` }} /></span>
              <small className={e.late ? 'late' : ''}>{e.late ? `${e.late} te laat` : `${e.done}/${e.steps}`}</small></span>
          </Link></li>)}</ul></div> : null}
        </> : <div className="panel"><p className="empty-line">Geen komende events. <button className="text-link" onClick={() => navigate('/events')}>Naar events</button></p></div>}
      </section>
      {m ? <section className="block dash-meeting">
        <div className="block-head"><h2>Meeting</h2></div>
        <Link to={m.meeting_id ? `/meetings/${m.meeting_id}` : '/meetings'} className="panel meeting-line">
          <span className="att-date"><strong>{dayNumber(m.date)}</strong><span>{monthShort(m.date)}</span></span>
          <span className="att-name"><strong>{`${shortDate(m.date)}${m.time ? ' · ' + m.time : ''}`}</strong><small>{[m.place, m.source === 'expected' ? 'verwacht' : m.meeting_id ? 'notulen staan klaar' : ''].filter(Boolean).join(' · ') || 'Volgende teammeeting'}</small></span>
          <Icon name="chevron" />
        </Link>
      </section> : null}
      {finance ? <section className="block dash-finance">
        <div className="block-head"><h2>Facturen</h2>{review.length ? <span className="n late">{`${review.length} te controleren`}</span> : null}<span className="act"><Link className="text-link" to="/invoices">Alle facturen</Link></span></div>
        <div className="panel"><InvoiceTable docs={all.slice(0, 5)} compact onOpen={setDoc} /></div>
      </section> : null}
    </div>
    {user?.role === 'admin' && d ? <p className="dash-system"><Link to="/admin/integrations">{`${verified} van ${d.connections.length} koppelingen werken`}</Link>{d.jobs.failed ? <span className="late">{` · ${d.jobs.failed} achtergrondtaken mislukt`}</span> : null}</p> : null}
    <InvoiceDialog id={doc} onClose={() => setDoc(null)} />
    <TaskDialog task={task} onClose={() => setTask(undefined)} />
  </>;
}

export function AdminPanel({ d }: { d: Dashboard }) {
  const a = d.admin!;
  const pending = a.users.filter((u) => u.active && u.must_change_password);
  return <section className="card admin-panel"><div className="card-head"><div><h2>Beheer</h2><p>Alleen zichtbaar voor beheerders</p></div><Link className="text-link" to="/admin/gebruikers">Gebruikers beheren</Link></div>
    <div className="admin-grid">
      <div><h3>Team</h3><ul className="admin-list">{a.users.map((u) => <li key={u.id}><span className="avatar" aria-hidden="true">{u.name.slice(0, 2).toUpperCase()}</span>
        <span><strong>{u.name}</strong><small>{ROLE[u.role]} · {u.last_login ? 'laatst ' + stamp(u.last_login) : 'nog nooit ingelogd'}</small></span>
        {!u.active ? <Badge>Inactief</Badge> : u.must_change_password ? <Badge color="amber">Tijdelijk wachtwoord</Badge> : <Badge color="lime">Actief</Badge>}</li>)}</ul>
        {pending.length ? <p className="helper">{pending.length} {pending.length === 1 ? 'persoon moet' : 'personen moeten'} bij de eerste login nog een eigen wachtwoord kiezen.</p> : null}</div>
      <div><h3>Achtergrondwerk</h3><ul className="admin-list">{d.schedules.map((s) => <li key={s.name}><span><strong>{s.name}</strong><small>{s.last_ok ? 'laatst gelukt ' + stamp(s.last_ok) : 'nog niet gedraaid'}{s.error ? ' · ' + s.error : ''}</small></span>
          {s.failures ? <Badge color="amber">{`${s.failures}× mislukt`}</Badge> : <Badge color="lime">OK</Badge>}</li>)}
        {a.failed_jobs.map((j) => <li key={j.id}><span><strong>{j.kind}</strong><small>{j.error || 'Mislukt'} · {j.attempts} pogingen</small></span><Badge color="red">Mislukt</Badge></li>)}</ul>
        <p className="helper">{d.jobs.queued} in de wachtrij · {d.jobs.failed} mislukt</p></div>
      <div><h3>Laatste activiteit</h3><ul className="admin-list">{a.audit.map((x) => <li key={x.id}><span><strong>{x.action}</strong><small>{x.actor} · {stamp(x.created)}</small></span></li>)}</ul></div>
    </div></section>;
}

export function InvoiceTable({ docs, compact = false, onOpen, empty }: { docs: Doc[]; compact?: boolean; onOpen: (id: string) => void; empty?: React.ReactNode }) {
  if (!docs.length) return <>{empty || <p className="empty-line">Nog geen facturen. Upload er een of mail ze naar het finance-adres.</p>}</>;
  return <div className="table-wrap"><table><thead><tr><th>Crediteur / factuur</th>{compact ? null : <><th>Datum</th><th>Kanaal</th></>}<th className="amount">Bedrag</th><th>Status</th><th aria-label="Details" /></tr></thead><tbody>
    {docs.map((d) => <tr key={d.id} className="clickable" tabIndex={0} role="button" onClick={() => onOpen(d.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(d.id))}>
      <td><div className="supplier"><div className="supplier-icon"><Icon name="invoice" /></div><div><strong>{d.details.supplier || d.name}</strong><small>{d.details.number || 'Nog niet uitgelezen'}</small></div></div></td>
      {compact ? null : <><td className="muted-cell">{shortDate(d.details.date)}</td><td className="muted-cell">{d.source}</td></>}
      <td className="amount">{d.details.total ? eur(d.details.total) : '—'}</td><td><DocumentBadge d={d} /></td><td className="row-go"><Icon name="chevron" /></td></tr>)}
  </tbody></table></div>;
}

function TaskRow({ t, onEdit }: { t: Task; onEdit: (t: Task) => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const users = useUsers();
  const names = (t.assignees || []).map((id) => users.data?.users.find((u) => u.id === id)?.name).filter(Boolean).join(', ');
  async function toggle(done: boolean) {
    try { await api(`/tasks/${t.id}`, { method: 'PATCH', body: { done } }); toast(done ? 'Taak afgerond.' : 'Taak heropend.'); } catch (e) { toast((e as Error).message, true); }
    qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['dashboard'] });
  }
  const late = !t.done && !!t.due && t.due < today();
  return <li className={`work-row ${t.done ? 'done' : ''} ${late ? 'late' : ''}`}>
    <input type="checkbox" checked={t.done} onChange={(e) => toggle(e.target.checked)} aria-label={`${t.title} afronden`} />
    <button className="work-main as-link" onClick={() => onEdit(t)}><strong>{t.title}</strong><small>{names || 'Niet toegewezen'}</small></button>
    {t.priority === 'high' && !t.done ? <Badge color="amber">Prioriteit</Badge> : <span />}
    <span className={`work-due ${late ? 'late' : ''}`}>{t.due ? (late ? `${shortDate(t.due)}, te laat` : shortDate(t.due)) : ''}</span>
  </li>;
}

/** task: undefined = closed, null = new, Task = edit. */
export function TaskDialog({ task, onClose, release = '', releases }: { task: Task | null | undefined; onClose: () => void; release?: string; releases?: { id: string; title: string }[] }) {
  const qc = useQueryClient();
  const toast = useToast();
  const users = useUsers();
  const t = task || null;
  return <FormDialog id="task-form" title={t ? 'Taak bewerken' : 'Nieuwe taak'} open={task !== undefined} onClose={onClose} submit={async (form) => {
    const v = formValues(form);
    const assignees = new FormData(form).getAll('assignees').map(String);
    await api(t ? `/tasks/${t.id}` : '/tasks', { method: t ? 'PATCH' : 'POST', body: { ...v, assignees, priority: v.high ? 'high' : 'normal' } });
    toast(t ? 'Taak bijgewerkt.' : 'Taak toegevoegd.');
    qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['dashboard'] });
    onClose();
  }}>
    <div key={(t?.id || 'new') + release}>
      <div className="field"><label htmlFor="f-title">Wat moet er gebeuren?</label><input id="f-title" name="title" defaultValue={t?.title} required /></div>
      <div className="field"><label htmlFor="task-description">Toelichting</label><textarea id="task-description" name="description" defaultValue={t?.description} placeholder="Extra informatie voor het team" /></div>
      <div className="field"><label htmlFor="f-due">Deadline</label><input id="f-due" name="due" type="date" defaultValue={t?.due || ''} /></div>
      <fieldset className="field assignee-picks"><legend>Voor wie (één of meer)</legend>
        <div>{(users.data?.users || []).filter((u) => u.active).map((u) => <label key={u.id} className="pick"><input type="checkbox" name="assignees" value={u.id} defaultChecked={(t?.assignees || []).map(String).includes(String(u.id))} /><span>{u.name}</span></label>)}</div>
      </fieldset>
      {releases ? <div className="field"><label htmlFor="task-release">Release</label><select id="task-release" name="release" defaultValue={(t as any)?.release || release}><option value="">Geen release</option>{releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div> : null}
      <label><input type="checkbox" name="high" defaultChecked={t?.priority === 'high'} /> Hoge prioriteit</label>
    </div>
  </FormDialog>;
}

export function TasksPage() {
  const [view, setView] = useState<'mine' | 'team' | 'done'>('mine');
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const q = useTasks();
  const work = useMyWork();
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const tasks = q.data.tasks;
  const done = tasks.filter((t) => t.done).slice(0, 100);
  const items = work.data?.items || [];
  const c = work.data?.counts;
  const now = today();
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const groups: [string, typeof items][] = [['Te laat', items.filter((i) => i.due && i.due < now)], ['Deze week', items.filter((i) => i.due && i.due >= now && i.due <= week)],
    ['Later', items.filter((i) => i.due && i.due > week)], ['Zonder datum', items.filter((i) => !i.due)]];
  const edit = (id: string) => setTask(tasks.find((t) => t.id === id) || undefined);
  return <>
    <PageTitle title="Taken" actions={<button className="primary" onClick={() => setTask(null)}><Icon name="plus" /> Nieuwe taak</button>} />
    <div className="seg tasks-seg" role="tablist">{([['mine', 'Van mij', items.length, 'tasks'], ['team', 'Team', null, 'users'], ['done', 'Afgerond', null, 'ok']] as const).map(([k, l, n, ic]) =>
      <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'active' : ''} onClick={() => setView(k)}><Icon name={ic} />{l}{n ? <span className="count">{n}</span> : null}</button>)}</div>
    {view === 'mine' ? <>
      <div className="kpis task-kpis" role="list">
        <div role="listitem" className="kpi"><i className="kpi-icon"><Icon name="tasks" /></i><span className="kpi-body"><strong>{c ? c.all : '–'}</strong><span>Mijn open punten</span></span></div>
        <div role="listitem" className={`kpi ${c?.late ? 'is-late' : ''}`}><i className="kpi-icon"><Icon name="clock" /></i><span className="kpi-body"><strong>{c ? c.late : '–'}</strong><span>Te laat</span></span></div>
        <div role="listitem" className="kpi"><i className="kpi-icon"><Icon name="calendar" /></i><span className="kpi-body"><strong>{c ? c.week : '–'}</strong><span>Deze week</span></span></div>
        <div role="listitem" className="kpi"><i className="kpi-icon"><Icon name="ok" /></i><span className="kpi-body"><strong>{c?.done_month ?? '–'}</strong><span>Afgerond deze maand</span></span></div>
      </div>
      {items.length ? groups.filter(([, rows]) => rows.length).map(([name, rows]) => <section key={name} className="block">
        <div className="block-head"><h2 className={name === 'Te laat' ? 'late-head' : ''}>{name}</h2><span className="count-chip">{rows.length}</span></div>
        <div className="panel"><ul className="rows">{rows.map((i) => <WorkRow key={i.kind + i.id} item={i} onTask={edit} wide />)}</ul></div>
      </section>) : <div className="panel block"><p className="empty-line">{work.isPending ? 'Laden…' : 'Niets dat op jou wacht.'}</p></div>}
    </>
      : view === 'team' ? <TeamWork onTask={edit} />
      : <section className="block"><div className="panel"><ul className="rows">{done.map((t) => <TaskRow key={t.id} t={t} onEdit={setTask} />)}</ul>
        {!done.length ? <p className="empty-line">Nog niets afgerond.</p> : null}</div></section>}
    <TaskDialog task={task} onClose={() => setTask(undefined)} />
  </>;
}

type TeamWorkData = { people: { username: string; name: string; late: number; items: WorkItem[] }[]; unassigned: WorkItem[] };
const TEAM_SHOWN = 6;

/** Everyone's open work side by side: tasks, event points, meeting actions and content, per person. */
function TeamWork({ onTask }: { onTask: (id: string) => void }) {
  const { user } = useAuth();
  const [who, setWho] = useState('');
  const [all, setAll] = useState<Record<string, boolean>>({});
  const q = useQuery({ queryKey: ['team-work'], queryFn: () => api<TeamWorkData>('/team-work') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const groups = [...q.data.people.filter((p) => p.username !== user?.username && p.items.length), ...(q.data.unassigned.length ? [{ username: '', name: 'Niet toegewezen', late: 0, items: q.data.unassigned }] : [])]
    .filter((p) => !who || p.username === who);
  return <section className="block">
    <div className="block-head"><h2>Wat de rest open heeft</h2>
      <span className="act"><select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Persoon"><option value="">Iedereen</option>
        {q.data.people.filter((p) => p.username !== user?.username).map((p) => <option key={p.username} value={p.username}>{p.name}</option>)}</select></span></div>
    {groups.length ? <div className="person-grid">{groups.map((p) => {
      const key = p.username || '_';
      const rows = all[key] || who ? p.items : p.items.slice(0, TEAM_SHOWN);
      return <div key={key} className="panel person-list"><h3>{p.name}<span>{p.late ? <em className="late-count">{`${p.late} te laat`}</em> : null}{` ${p.items.length}`}</span></h3>
        <ul className="rows">{rows.map((i) => <WorkRow key={i.kind + i.id} item={i} onTask={onTask} wide />)}</ul>
        {!who && p.items.length > TEAM_SHOWN ? <button className="text-link person-more" onClick={() => setAll({ ...all, [key]: !all[key] })}>{all[key] ? 'Minder' : `+${p.items.length - TEAM_SHOWN} meer`}</button> : null}</div>;
    })}</div> : <div className="panel"><p className="empty-line">Niemand anders heeft iets open.</p></div>}
  </section>;
}

/** The next event, featured: its poster from OneDrive, progress of the team checklist and the next points to tick off. */
function NextEvent({ e, onChange }: { e: AttEvent; onChange: () => void }) {
  const run = useAction();
  const qc = useQueryClient();
  const [cover, setCover] = useState(e.cover);
  const pct = e.steps ? Math.round((e.done / e.steps) * 100) : 0;
  const tick = (id: string) => run(async () => { await api(`/event-steps/${id}`, { method: 'PATCH', body: { done: true } }); onChange(); for (const k of ['my-work', 'event-steps']) qc.invalidateQueries({ queryKey: [k] }); });
  return <article className="panel next-event">
    {cover ? <Link to={`/events/${e.id}`} className="ne-hero">
      <img src={`/api/events/${e.id}/cover`} alt="" onError={() => setCover(false)} />
      <span className="ne-hero-top"><h2>Volgend event</h2><span className="pill">{days(e.days)}</span></span>
      <span className="ne-hero-text"><h3>{e.name}</h3><span className="ne-meta">{[fullDate(e.date), e.venue].filter(Boolean).join(' · ')}</span></span>
    </Link> : <div className="ne-head"><h2>Volgend event</h2><span className="pill">{days(e.days)}</span></div>}
    <div className="ne-body">
      {cover ? null : <><Link to={`/events/${e.id}`} className="ne-title"><h3>{e.name}</h3></Link>
        <p className="ne-meta">{[fullDate(e.date), e.venue].filter(Boolean).join(' · ')}</p></>}
      <div className="ne-progress"><span>{`${e.done} van ${e.steps} punten klaar`}</span>{e.late ? <span className="pill bad">{`${e.late} te laat`}</span> : null}</div>
      <div className="ne-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      {e.next.length ? <ul className="ne-steps">{e.next.map((n) => <li key={n.id}>
        <input type="checkbox" aria-label={`${n.label} afvinken`} onChange={() => tick(n.id)} />
        <span className="ne-step"><span>{n.label}</span><small>{n.owner}</small></span>
        <span className={n.late ? 'ne-due late' : 'ne-due'}>{n.late ? 'Te laat' : n.due ? shortDate(n.due) : ''}</span></li>)}</ul> : <p className="empty-line">Alles van de checklist is klaar.</p>}
      <Link to={`/events/${e.id}`} className="ne-link">Eventdetails <Icon name="arrow" /></Link>
    </div>
  </article>;
}

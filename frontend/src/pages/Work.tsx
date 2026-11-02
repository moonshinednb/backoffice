import { locale } from '../lib/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { can, useAuth } from '../lib/auth';
import { dayNumber, eur, monthShort, ROLE, shortDate, stamp, today } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, Orb, PageTitle, Stat, formValues, useToast } from '../lib/ui';
import { FormDialog } from '../production/common';
import { EventRow } from '../production/Events';
import { ConnectionBadge, Connection, Doc, DocumentBadge, Task, UploadZone, useConnections, useDocuments, useTasks, useUpload, useUsers } from './shared';
import { InvoiceDialog } from './Finance';
import { MyWork, useMyWork } from './MyWork';

type Dashboard = {
  upcoming_events: EventRow[]; finance_email: string; tasks_open: number; connections: Connection[];
  jobs: { queued: number; failed: number }; schedules: { name: string; last_ok: number | null; failures: number; error: string }[];
  finance?: { documents: number; posted: number; review: number; pending: number; total: number };
  admin?: { users: { id: string; name: string; username: string; role: string; active: boolean; must_change_password: boolean; last_login: number | null }[];
    audit: { id: number; created: number; actor: string; action: string }[]; failed_jobs: { id: string; kind: string; error: string; attempts: number }[] };
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { upload } = useUpload();
  const work = useMyWork();
  const focus = work.data?.focus || [];
  // Finance on the overview only for those who do the books (and admins); everyone can still open Financiën.
  const finance = can.finance(user) && (focus.includes('finance') || focus.includes('admin'));
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard'), refetchInterval: 30000 });
  const docs = useDocuments(finance);
  const [doc, setDoc] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  if (q.isPending) return <Loading text="Moonshine openen…" />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data;
  const all = docs.data?.documents || [];
  const review = all.filter((x) => x.status === 'review');
  const verified = d.connections.filter((c) => c.status === 'verified').length;
  const f = d.finance;
  const c = work.data?.counts;
  const status = !c ? '' : c.late ? `${c.late} ${c.late === 1 ? 'ding' : 'dingen'} te laat, ${c.week} deze week` : c.week ? `${c.week} ${c.week === 1 ? 'ding' : 'dingen'} deze week, niets te laat` : 'Niets te laat. Lekker bezig.';
  return <>
    <PageTitle title={`Goedendag, ${user?.name.split(' ')[0]}`} sub={status}
      actions={<><button onClick={() => setTask(null)}><Icon name="plus" /> Nieuwe taak</button>
        {finance ? <button className="primary" onClick={() => upload()}><Icon name="plus" /> Nieuwe factuur</button> : null}</>} />
    <div className="dash-grid">
      <MyWork />
      <section className="card dash-events"><div className="card-head"><div><h2>Komende evenementen</h2><p>Voortgang van de teamchecklist</p></div><Link className="text-link" to="/events">Alle evenementen</Link></div>
        {d.upcoming_events.length ? <div className="dash-event-list">{d.upcoming_events.map((e) => {
          const p = e.progress || { artists: 0, complete: 0 };
          const pct = p.steps ? Math.round(((p.steps_done || 0) / p.steps) * 100) : 0;
          return <Link key={e.id} className="dash-event" to={`/events/${e.id}`}>
            <span className="date-block"><strong>{e.date ? dayNumber(e.date) : '?'}</strong><span>{e.date ? monthShort(e.date) : 'datum'}</span></span>
            <span className="event-name"><strong>{e.name}</strong><small>{e.venue || 'Locatie nog onbekend'}</small></span>
            {p.steps ? <span className="dash-progress" title={`${p.steps_done}/${p.steps} punten van de checklist klaar`}><span className="bar"><i style={{ width: pct + '%' }} /></span><small>{`${p.steps_done}/${p.steps}`}</small></span>
              : <small className="helper">Nog geen checklist</small>}
          </Link>;
        })}</div> : <Empty title="Geen komende evenementen" sub="Plan het volgende evenement bij Evenementen." action={<button onClick={() => navigate('/events')}>Naar evenementen</button>} icon="calendar" />}
      </section>
    </div>
    {finance && f ? <>
      <div className="stats section-gap">
        <Stat label="Ontvangen facturen" value={f.documents} sub={`${eur(f.total)} totaal`} icon="invoice" />
        <Stat label="Geboekt in Odoo" value={f.posted} sub={f.documents ? `${Math.round(f.posted / f.documents * 100)}% verwerkt` : 'Nog geen boekingen'} icon="check" />
        <Stat label="Te controleren" value={f.review} sub="In de controle-inbox" icon="clock" />
        <Stat label="In behandeling" value={f.pending} sub="Worden uitgelezen" icon="refresh" />
      </div>
      <div className="dashboard-secondary">
        <section className="card"><div className="card-head"><div><h2>Recente facturen</h2><p>{review.length ? `${review.length} wachten op controle` : 'Alles gecontroleerd'}</p></div><Link className="text-link" to="/invoices">Alle facturen</Link></div>
          <InvoiceTable docs={all.slice(0, 5)} compact onOpen={setDoc} /><div className="table-foot"><Icon name="mail" /> {d.finance_email}</div></section>
        <aside className="stack"><section className="card card-pad"><UploadZone /><div className="mail-info"><Icon name="mail" />{d.finance_email}</div></section>
          <section className="card card-pad"><h2>Uitgaven</h2><ExpenseChart docs={all} /></section></aside>
      </div>
    </> : null}
    {user?.role === 'admin' ? <div className="automation-strip section-gap"><Orb state="breathing" size={32} tone={verified >= 3 ? 'ok' : 'ink'} paused={verified < 3} label={verified >= 3 ? 'Verwerking actief' : 'Verwerking nog niet actief'} />
      <div><strong>{`${verified} van ${d.connections.length} koppelingen werken`}</strong><p>{f ? `${f.pending} facturen in behandeling · ` : ''}{d.jobs.queued} achtergrondtaken in de wachtrij{d.jobs.failed ? ` · ${d.jobs.failed} mislukt` : ''}</p></div>
      <Link className="button" to="/admin/integrations">Koppelingen</Link></div> : null}
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

function ExpenseChart({ docs }: { docs: Doc[] }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + k, 1);
    return { key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString(locale(), { month: 'short' }), value: 0 };
  });
  for (const d of docs) { if (d.status !== 'posted') continue; const m = months.find((x) => x.key === (d.details.date || '').slice(0, 7)); if (m) m.value += d.details.total || 0; }
  const max = Math.max(10000, ...months.map((m) => m.value));
  const total = months.reduce((v, m) => v + m.value, 0);
  return <>
    <div className="chart-total">{eur(total)}</div><p className="chart-caption">Geboekte inkoopfacturen · afgelopen 6 maanden</p>
    <svg className="expense-chart" viewBox="0 0 610 200" role="img" aria-label={'Inkoopbedragen per maand: ' + months.map((m) => m.label + ' ' + eur(m.value)).join(', ')}>
      {[0, 1, 2, 3].map((i) => <g key={i}><line className="chart-grid" x1="65" y1={18 + i * 48} x2="591" y2={18 + i * 48} /><text className="chart-label" x="55" y={22 + i * 48} textAnchor="end">{eur(max * (1 - i / 3)).replace(',00', '')}</text></g>)}
      {months.map((m, i) => { const h = m.value / max * 140; return <g key={m.key}><rect className={`chart-bar ${i === 5 ? 'current' : ''}`} x={86 + i * 86} y={162 - h} width="42" height={h} rx="3" /><text className="chart-label" x={107 + i * 86} y="185" textAnchor="middle">{m.label}</text></g>; })}
    </svg>
    {total ? null : <div className="chart-zero">Nog geen geboekte facturen in deze periode</div>}
  </>;
}

export function InvoiceTable({ docs, compact = false, onOpen, empty }: { docs: Doc[]; compact?: boolean; onOpen: (id: string) => void; empty?: React.ReactNode }) {
  if (!docs.length) return <>{empty || <Empty title="Je inbox staat klaar" sub="Upload je eerste factuur of sluit finance@ aan." icon="invoice" />}</>;
  return <div className="table-wrap"><table><thead><tr><th>Crediteur / factuur</th>{compact ? null : <><th>Datum</th><th>Kanaal</th></>}<th className="amount">Bedrag</th><th>Status</th><th aria-label="Details" /></tr></thead><tbody>
    {docs.map((d) => <tr key={d.id} className="clickable" tabIndex={0} role="button" onClick={() => onOpen(d.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(d.id))}>
      <td><div className="supplier"><div className="supplier-icon"><Icon name="invoice" /></div><div><strong>{d.details.supplier || d.name}</strong><small>{d.details.number || 'Nog niet uitgelezen'}</small></div></div></td>
      {compact ? null : <><td>{shortDate(d.details.date)}</td><td>{d.source}</td></>}
      <td className="amount">{d.details.total ? eur(d.details.total) : '—'}</td><td><DocumentBadge d={d} /></td><td><Icon name="chevron" /></td></tr>)}
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
  return <div className={`task-row ${t.done ? 'done' : ''} ${late ? 'late' : ''}`}>
    <input type="checkbox" checked={t.done} onChange={(e) => toggle(e.target.checked)} aria-label={`${t.title} afronden`} />
    <div><strong>{t.title}</strong><small><span className={late ? 'due late' : ''}>{t.due ? (late ? `${shortDate(t.due)} · te laat` : shortDate(t.due)) : 'Geen deadline'}</span>{names ? ' · ' + names : ''}</small></div>
    {t.priority === 'high' && !t.done ? <Badge color="amber">Prioriteit</Badge> : null}
    <button className="icon-btn ghost task-edit" onClick={() => onEdit(t)} aria-label={`${t.title} bewerken`}><Icon name="edit" /></button>
  </div>;
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
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open');
  const [who, setWho] = useState<'me' | 'all'>('me');
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const q = useTasks();
  const conns = useConnections();
  const { user } = useAuth();
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const mine = (t: Task) => (t.assignees || []).map(String).includes(String(user?.id));
  const list = q.data.tasks.filter((t) => (filter === 'all' || (filter === 'done' ? t.done : !t.done)) && (who === 'all' || mine(t)))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due || '9999').localeCompare(b.due || '9999'));
  return <>
    <PageTitle title="Taken" sub="Taken die je zelf maakt of die uit meetings en eventchecklists komen" actions={<button className="primary" onClick={() => setTask(null)}><Icon name="plus" /> Nieuwe taak</button>} />
    <div className="toolbar"><div className="tabs">{([['me', 'Mijn taken'], ['all', 'Iedereen']] as const).map(([v, l]) => <button key={v} className={who === v ? 'active' : ''} onClick={() => setWho(v)}>{l}</button>)}</div>
      <div className="tabs">{([['open', 'Openstaand'], ['done', 'Afgerond'], ['all', 'Alle taken']] as const).map(([v, l]) => <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{l}</button>)}</div>
      <div className="task-filters"><ConnectionBadge c={conns.data?.connections.find((c) => c.id === 'todo')} /></div></div>
    <section className="card"><div className="card-head"><h2>{list.length} {list.length === 1 ? 'taak' : 'taken'}</h2>{user?.role === 'admin' ? <Link className="text-link" to="/admin/koppelingen">Microsoft To Do instellen</Link> : null}</div>
      {list.length ? list.map((t) => <TaskRow key={t.id} t={t} onEdit={setTask} />) : <Empty title="Geen taken in deze lijst" sub="Voeg een taak toe en wijs hem toe aan je team." action={<button onClick={() => setTask(null)}>Nieuwe taak</button>} icon="tasks" />}</section>
    <p className="helper">Lokale taken worden direct opgeslagen. Synchronisatie met Microsoft To Do start zodra de verbinding is ingesteld.</p>
    <TaskDialog task={task} onClose={() => setTask(undefined)} />
  </>;
}

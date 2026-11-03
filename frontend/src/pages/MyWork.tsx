import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { fullDate, today } from '../lib/format';
import { Avatar, Empty, Icon, Loading, MoreMenu, useAction } from '../lib/ui';
import { useUsers } from './shared';
import { relative } from '../production/EventChecklist';

export type WorkItem = { kind: 'task' | 'step' | 'action' | 'content'; id: string; title: string; due: string; context: string; link: string; high: boolean; status?: string; people?: string[] };
export type Work = { items: WorkItem[]; focus: string[]; counts: { late: number; week: number; all: number; done_month?: number } };

export const useMyWork = () => useQuery({ queryKey: ['my-work'], queryFn: () => api<Work>('/my-work'), refetchInterval: 60000 });

const KIND: Record<WorkItem['kind'], [string, string]> = { task: ['Taak', 'tasks'], step: ['Event', 'calendar'], action: ['Meeting', 'users'], content: ['Content', 'calendar'] };
const CONTENT_STATUS: Record<string, string> = { idea: 'Idee', making: 'In de maak', review: 'Ter controle', ready: 'Klaar om te posten' };

function done(item: WorkItem) {
  if (item.kind === 'task') return api(`/tasks/${item.id}`, { method: 'PATCH', body: { done: true } });
  if (item.kind === 'step') return api(`/event-steps/${item.id}`, { method: 'PATCH', body: { done: true } });
  if (item.kind === 'action') return api(`/meeting-actions/${item.id}`, { method: 'PATCH', body: { done: true } });
  return Promise.resolve();
}

/** Small faces of the people who worked on an item (most recent first). */
export function People({ names, size = 24 }: { names?: string[]; size?: number }) {
  const users = useUsers();
  const list = (names || []).map((n) => users.data?.users.find((u) => u.username === n) || { name: n, avatar: '' });
  if (!list.length) return <span className="people" />;
  return <span className="people" title={`Gewerkt door ${list.map((u) => u.name).join(', ')}`}>{list.slice(0, 3).map((u, i) => <Avatar key={i} user={u} size={size} />)}
    {list.length > 3 ? <span className="people-more">{`+${list.length - 3}`}</span> : null}</span>;
}

export function WorkRow({ item, onTask, wide = false }: { item: WorkItem; onTask?: (id: string) => void; wide?: boolean }) {
  const qc = useQueryClient();
  const run = useAction();
  const navigate = useNavigate();
  const [gone, setGone] = useState(false);
  const r = relative(item.due);
  const [label, icon] = KIND[item.kind];
  if (gone) return null;
  const tick = () => run(async () => {
    setGone(true); await done(item);
    for (const k of ['my-work', 'team-work', 'tasks', 'event-steps', 'meeting-board', 'meeting', 'dashboard', 'attention']) qc.invalidateQueries({ queryKey: [k] });
  }, 'Afgevinkt.');
  const open = (ev?: { preventDefault: () => void }) => { if (onTask && item.kind === 'task') { ev?.preventDefault(); onTask(item.id); } else if (!ev) navigate(item.link); };
  const where = `${item.context ? `${label} · ${item.context}` : label}${item.kind === 'content' && item.status ? ` · ${CONTENT_STATUS[item.status] || item.status}` : ''}`;
  const check = item.kind === 'content' ? <span className="work-check-spacer" /> : <input type="checkbox" aria-label={`${item.title} afvinken`} onChange={tick} />;
  if (wide) return <li className={`work-row wide ${r.late ? 'late' : ''}`}>
    {check}
    <Link to={item.link} className="work-title" onClick={open}>{item.title}{item.high ? <span className="badge amber">Prioriteit</span> : null}</Link>
    <span className="work-ctx"><Icon name={icon} />{where}</span>
    <span className={`work-due ${r.late ? 'late' : r.soon ? 'soon' : ''}`} title={item.due ? fullDate(item.due) : ''}>{item.due ? <><Icon name="clock" />{r.text}</> : null}</span>
    <People names={item.people} />
    <MoreMenu label={`Meer bij ${item.title}`} items={[
      { label: item.kind === 'task' ? 'Bewerken' : 'Openen', icon: item.kind === 'task' ? 'edit' : 'arrow', onSelect: () => open() },
      item.kind !== 'content' && { label: 'Afvinken', icon: 'ok', onSelect: tick }]} />
  </li>;
  return <li className={`work-row ${r.late ? 'late' : ''}`}>
    {check}
    <Link to={item.link} className="work-main" onClick={open}><strong>{item.title}</strong>
      <small><Icon name={icon} /> {where}</small></Link>
    {item.high ? <span className="badge amber">Prioriteit</span> : null}
    <span className={`work-due ${r.late ? 'late' : r.soon ? 'soon' : ''}`} title={item.due ? fullDate(item.due) : ''}>{r.text}</span>
  </li>;
}

/** Everything the signed-in person still has to do, from tasks, event checklists, meetings and content. */
export function MyWork() {
  const q = useMyWork();
  const [all, setAll] = useState(false);
  if (q.isPending) return <section className="card my-work"><Loading /></section>;
  const items = q.data?.items || [];
  const now = today();
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const groups: [string, WorkItem[]][] = [
    ['Te laat', items.filter((i) => i.due && i.due < now)],
    ['Deze week', items.filter((i) => i.due && i.due >= now && i.due <= week)],
    ['Later', items.filter((i) => i.due && i.due > week)],
    ['Zonder datum', items.filter((i) => !i.due)],
  ];
  const limit = all ? Infinity : 12;
  let shown = 0;
  return <section className="card my-work">
    <div className="card-head"><div><h2>Mijn werk</h2><p>Taken, eventpunten, meeting-acties en content die bij jou liggen</p></div>
      <Link className="text-link" to="/tasks">Alle taken</Link></div>
    {items.length ? groups.map(([name, rows]) => {
      if (!rows.length || shown >= limit) return null;
      const take = rows.slice(0, Math.max(0, limit - shown));
      shown += take.length;
      return <div key={name} className={`work-group ${name === 'Te laat' ? 'is-late' : ''}`}>
        <h3>{name} <span>{rows.length}</span></h3>
        <ul className="rows">{take.map((i) => <WorkRow key={i.kind + i.id} item={i} />)}</ul>
      </div>;
    }) : <Empty title="Niets dat op jou wacht" sub="Nieuwe taken, eventpunten en meeting-acties voor jou verschijnen hier." icon="check" />}
    {items.length > 12 ? <button className="ghost small work-more" onClick={() => setAll(!all)}>{all ? 'Minder tonen' : `Alles tonen (${items.length})`}</button> : null}
  </section>;
}

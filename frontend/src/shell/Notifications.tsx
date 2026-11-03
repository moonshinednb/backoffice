import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { stamp } from '../lib/format';
import { Icon } from '../lib/ui';

type Note = { id: number; kind: string; title: string; body: string; link: string; created: number; read: boolean };
const ICON: Record<string, string> = { done: 'check', assigned: 'tasks', deadline: 'clock', activity: 'users' };

/** The bell: finished work you were part of, tasks for you, deadlines. */
export function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api<{ unread: number; notifications: Note[] }>('/notifications'), refetchInterval: 30000 });
  const unread = q.data?.unread || 0;
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  async function readAll() { await api('/notifications/read', { method: 'POST', body: {} }).catch(() => {}); qc.invalidateQueries({ queryKey: ['notifications'] }); }
  async function go(n: Note) {
    setOpen(false);
    if (!n.read) { await api('/notifications/read', { method: 'POST', body: { ids: [n.id] } }).catch(() => {}); qc.invalidateQueries({ queryKey: ['notifications'] }); }
    if (n.link) navigate(n.link);
  }
  return <div className="notify-control" ref={box}>
    <button className="icon-btn ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={unread ? `${unread} nieuwe meldingen` : 'Meldingen'}><Icon name="bell" />{unread ? <span className="notify-badge">{unread > 9 ? '9+' : unread}</span> : null}</button>
    {open ? <div className="notify-menu">
      <div className="notify-head"><strong>Meldingen</strong>{unread ? <button className="text-link" onClick={readAll}>Alles gelezen</button> : null}</div>
      {q.data?.notifications.length ? <ul>{q.data.notifications.map((n) => <li key={n.id}><button className={n.read ? '' : 'unread'} onClick={() => go(n)}>
        <span className={`notify-icon ${n.kind}`}><Icon name={ICON[n.kind] || 'bell'} /></span>
        <span className="notify-text"><strong>{n.title}</strong>{n.body ? <small>{n.body}</small> : null}<time>{stamp(n.created)}</time></span>
      </button></li>)}</ul> : <p className="helper notify-empty">Geen meldingen. Je krijgt hier bericht als iets waar jij aan werkte af is, als er een taak voor je klaarstaat of als een deadline nadert.</p>}
    </div> : null}
  </div>;
}

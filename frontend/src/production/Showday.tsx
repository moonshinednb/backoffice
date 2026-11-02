import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../lib/api';
import { longDate, today } from '../lib/format';
import { BackLink, ErrorBox, Icon, Loading } from '../lib/ui';
import { useOverview } from './Event';

type Guest = { id: string; name: string; plus: number; relation: string; arrived: number };
type People = { guests: Guest[]; totals: { guests: number; people: number; arrived: number } };

/** Minutes in the night: 00:00–05:59 counts after 23:59 of the evening. */
const night = (t: string) => { const [h, m] = t.split(':').map(Number); return (h < 6 ? h + 24 : h) * 60 + m; };

function nowMinutes() {
  const d = new Date();
  return (d.getHours() < 6 ? d.getHours() + 24 : d.getHours()) * 60 + d.getMinutes();
}

/** Is it the night of the event (from the morning of the date until 06:00 the day after)? */
function isShowNight(date: string) {
  if (!date) return false;
  const d = new Date();
  const ymd = (x: Date) => x.toISOString().slice(0, 10);
  if (today() === date) return true;
  const yesterday = new Date(d.getTime() - 86400000);
  return d.getHours() < 6 && ymd(yesterday) === date;
}

/** Show day on a phone: who plays now and next, the door list with check-in, and who to call. */
export function ShowdayPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [view, setView] = useState<'now' | 'door' | 'call'>('now');
  const [find, setFind] = useState('');
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  const q = useOverview(id);
  const people = useQuery({ queryKey: ['event-people', id], queryFn: () => api<People>(`/events/${id}/people`), refetchInterval: view === 'door' ? 15000 : false });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const o = q.data;
  const e = o.event;
  const slots = o.acts.filter((a) => a.start).sort((a, b) => night(a.start) - night(b.start));
  const live = isShowNight(e.date);
  const now = nowMinutes();
  const current = live ? slots.filter((a) => night(a.start) <= now && (!a.end || night(a.end) > now)) : [];
  const next = live ? slots.find((a) => night(a.start) > now) : slots[0];
  const p = people.data;
  const guests = (p?.guests || []).filter((g) => !find.trim() || `${g.name} ${g.relation}`.toLowerCase().includes(find.trim().toLowerCase()));
  const setArrived = async (g: Guest, n: number) => {
    qc.setQueryData<People>(['event-people', id], (old) => old && { ...old, guests: old.guests.map((x) => (x.id === g.id ? { ...x, arrived: n } : x)),
      totals: { ...old.totals, arrived: old.totals.arrived - Math.min(g.arrived, 1 + g.plus) + n } });
    await api(`/guests/${g.id}`, { method: 'PATCH', body: { arrived: n } }).catch(() => qc.invalidateQueries({ queryKey: ['event-people', id] }));
  };
  const showday = o.bookings.filter((b) => b.status !== 'cancelled' && (b as any).showday_phone);
  return <div className="showday">
    <BackLink to={`/events/${id}`}>{e.name}</BackLink>
    <header className="sd-head"><h1>{e.name}</h1><p>{`${longDate(e.date)}${e.doors ? ` · deuren ${e.doors}` : ''}`}</p></header>
    <nav className="sd-tabs" aria-label="Showdag">{([['now', 'Timetable'], ['door', `Deur ${p ? `${p.totals.arrived}/${p.totals.people}` : ''}`], ['call', 'Bellen']] as const).map(([k, l]) =>
      <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>{l}</button>)}</nav>
    {view === 'now' ? <>
      {live ? <section className="sd-now">
        <div className="sd-slot is-now"><small>Nu</small>{current.length ? current.map((a) => <strong key={a.id}>{a.name}<span>{`${a.start}–${a.end || '?'}${a.stage ? ' · ' + a.stage : ''}`}</span></strong>) : <strong>Niemand op dit moment</strong>}</div>
        {next ? <div className="sd-slot"><small>Hierna</small><strong>{next.name}<span>{`${next.start}${next.stage ? ' · ' + next.stage : ''}`}</span></strong></div> : null}
      </section> : <p className="helper">Op de avond zelf zie je hier wie er nu speelt en wie hierna komt.</p>}
      <ol className="sd-timetable">{slots.map((a) => {
        const past = live && a.end && night(a.end) <= now;
        const playing = current.includes(a);
        return <li key={a.id} className={`${past ? 'past' : ''} ${playing ? 'playing' : ''}`}><time>{a.start}</time><span><strong>{a.name}</strong>{a.stage ? <small>{a.stage}</small> : null}</span></li>;
      })}</ol>
    </> : view === 'door' ? <section className="sd-door">
      <div className="sd-count"><strong>{p ? p.totals.arrived : '–'}</strong><span>{p ? `van ${p.totals.people} binnen (${p.totals.guests} op de lijst)` : ''}</span></div>
      <input className="sd-find" value={find} onChange={(ev) => setFind(ev.target.value)} placeholder="Zoek een naam" aria-label="Zoek een gast" autoComplete="off" />
      <ul className="sd-guests">{guests.map((g) => {
        const max = 1 + g.plus;
        const inside = Math.min(g.arrived, max);
        return <li key={g.id} className={inside >= max ? 'in' : inside ? 'part' : ''}>
          <button className="sd-guest" onClick={() => setArrived(g, inside >= max ? 0 : max)} aria-pressed={inside >= max}>
            <span className="sd-tick">{inside >= max ? <Icon name="ok" /> : null}</span>
            <span className="sd-name"><strong>{g.name}</strong><small>{[g.plus ? `+${g.plus}` : '', g.relation].filter(Boolean).join(' · ')}</small></span>
            <span className="sd-in">{`${inside}/${max}`}</span>
          </button>
          {g.plus ? <span className="sd-step"><button aria-label={`Eén minder van ${g.name}`} onClick={() => setArrived(g, Math.max(0, inside - 1))}>−</button><button aria-label={`Eén meer van ${g.name}`} onClick={() => setArrived(g, Math.min(max, inside + 1))}>+</button></span> : null}
        </li>;
      })}</ul>
      {!guests.length ? <p className="helper">{find ? 'Niemand gevonden met die naam.' : 'De gastenlijst is leeg.'}</p> : null}
    </section> : <section className="sd-call">
      {e.contacts.length ? <><h2>Venue</h2><ul>{e.contacts.map((c) => <li key={c.id}><span><strong>{c.name || c.email}</strong><small>{c.role}</small></span>
        {c.phone ? <a className="button primary" href={`tel:${c.phone.replace(/\s/g, '')}`}><Icon name="phone" /> Bellen</a> : <small>geen nummer</small>}</li>)}</ul></> : null}
      {showday.length ? <><h2>Artiesten op de dag</h2><ul>{showday.map((b: any) => <li key={b.id}><span><strong>{b.showday_contact || b.artist.name}</strong><small>{b.artist.name}</small></span>
        <a className="button primary" href={`tel:${String(b.showday_phone).replace(/\s/g, '')}`}><Icon name="phone" /> Bellen</a></li>)}</ul></> : null}
      {!e.contacts.length && !showday.length ? <p className="helper">Nog geen telefoonnummers. Vul ze in bij Venue en bij de leden van een act (contact op de dag).</p> : null}
    </section>}
  </div>;
}

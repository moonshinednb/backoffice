import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { api } from '../lib/api';
import { dayNumber, monthShort, today } from '../lib/format';
import { ErrorBox, Icon, Loading, PageTitle, Tabs, formValues, useToast } from '../lib/ui';
import { FormDialog, StatusBadge, useCanEdit } from './common';

export type EventRow = { id: string; name: string; date: string; venue: string; status: string; progress: { artists: number; complete: number; checklist?: number; checklist_done?: number; steps?: number; steps_done?: number; steps_late?: number } };

export function Events({ past = false }: { past?: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const edit = useCanEdit();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['events'], queryFn: () => api<{ events: EventRow[] }>('/events') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const now = today();
  const upcoming = q.data.events.filter((e) => !e.date || e.date >= now).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const done = q.data.events.filter((e) => e.date && e.date < now).sort((a, b) => b.date.localeCompare(a.date));
  const list = past ? done : upcoming;
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuw event</button> : null;
  return <>
    <PageTitle title="Events" actions={button} />
    <EventTabs upcoming={upcoming.length} past={done.length} />
    {list.length ? <div className="panel"><ul className="rows ev-list">{list.map((e) => {
      const p = e.progress || { artists: 0, complete: 0 };
      const steps = p.steps || 0;
      return <li key={e.id}><Link to={`/events/${e.id}`} className="ev-row">
        {e.date ? <span className="att-date"><strong>{dayNumber(e.date)}</strong><span>{monthShort(e.date)}</span></span> : <span className="att-date muted"><strong>?</strong><span>datum</span></span>}
        <span className="att-name"><strong>{e.name}</strong><small>{[e.venue || 'Venue nog onbekend', p.artists ? `${p.artists} ${p.artists === 1 ? 'act' : 'acts'}` : ''].filter(Boolean).join(' · ')}</small></span>
        {e.status === 'live' || e.status === 'cancelled' ? <StatusBadge status={e.status} /> : <span />}
        <span className="ev-progress">{steps ? <><span className="bar" aria-hidden="true"><i style={{ width: `${Math.round(((p.steps_done || 0) / steps) * 100)}%` }} /></span>
          <small className={p.steps_late && !past ? 'late' : ''}>{p.steps_late && !past ? `${p.steps_late} te laat` : `${p.steps_done || 0}/${steps}`}</small></> : null}</span>
      </Link></li>;
    })}</ul></div>
      : <div className="panel"><p className="empty-line">{past ? 'Nog geen afgelopen events.' : 'Geen komende events.'}</p></div>}
    <FormDialog id="event-new-form" title="Nieuw event" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const created = await api<{ id: string }>('/events', { method: 'POST', body: formValues(form) });
      setOpen(false);
      toast('Event aangemaakt.');
      navigate(`/events/${created.id}`);
    }}>
      <div className="field"><label htmlFor="ne-name">Naam *</label><input id="ne-name" name="name" required placeholder="Moonshine 10YRS" /></div>
      <div className="form-grid"><div className="field"><label htmlFor="ne-date">Datum</label><input id="ne-date" name="date" type="date" /></div>
        <div className="field"><label htmlFor="ne-doors">Deuren</label><input id="ne-doors" name="doors" type="time" /></div></div>
      <div className="field"><label htmlFor="ne-venue">Venue</label><input id="ne-venue" name="venue" placeholder="Luxor Live, Arnhem" /></div>
    </FormDialog>
  </>;
}

export function EventTabs({ upcoming, past }: { upcoming?: number; past?: number }) {
  return <Tabs items={[{ to: '/events', label: <>Komend {upcoming !== undefined ? <span className="count">{upcoming}</span> : null}</> },
    { to: '/events/past', label: <>Afgelopen {past !== undefined ? <span className="count">{past}</span> : null}</> },
    { to: '/events/artists', label: 'Artiesten' }]} />;
}

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { api } from '../lib/api';
import { dayNumber, monthShort, shortDate, today } from '../lib/format';
import { Empty, ErrorBox, Icon, Loading, PageTitle, Tabs, formValues, useToast } from '../lib/ui';
import { FormDialog, StatusBadge, useCanEdit } from './common';

export type EventRow = { id: string; name: string; date: string; venue: string; status: string; progress: { artists: number; complete: number; checklist?: number; checklist_done?: number } };

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
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuw evenement</button> : null;
  return <>
    <PageTitle eyebrow="Productie" title="Evenementen" sub="Advancing per avond: artiesten, reis, riders en wat de venue heeft ontvangen." actions={button} />
    <EventTabs upcoming={upcoming.length} past={done.length} />
    <section className="card">
      {list.length ? (
        <div className="table-wrap"><table className="events-table">
          <thead><tr><th>Datum</th><th>Evenement</th><th>Status</th><th>Advancing</th><th>Venue</th><th aria-label="Openen" /></tr></thead>
          <tbody>{list.map((e) => {
            const p = e.progress || { artists: 0, complete: 0 };
            const go = () => navigate(`/evenementen/${e.id}`);
            return (
              <tr key={e.id} className="clickable" tabIndex={0} onClick={go} onKeyDown={(k) => k.key === 'Enter' && go()}>
                <td className="date-cell">{e.date ? <div className="date-block"><strong>{dayNumber(e.date)}</strong><span>{monthShort(e.date)}</span></div> : <div className="date-block muted"><strong>?</strong><span>datum</span></div>}</td>
                <td><div className="event-name"><strong>{e.name}</strong><small>{e.venue || 'Locatie nog onbekend'}{e.date ? ' · ' + shortDate(e.date) : ''}</small></div></td>
                <td><StatusBadge status={e.status} /></td>
                <td>{p.artists ? <div className="progress-line"><progress max={p.artists} value={p.complete} /><span>{p.complete}/{p.artists} artiesten compleet</span></div> : <span className="helper">Nog geen artiesten</span>}</td>
                <td className="nowrap">{p.checklist ? `${p.checklist_done}/${p.checklist} venue` : '—'}</td>
                <td><Icon name="chevron" /></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : past ? <Empty title="Nog geen afgelopen evenementen" sub="Evenementen verschijnen hier zodra hun datum voorbij is." icon="calendar" />
        : <Empty title="Geen komende evenementen" sub="Maak een evenement aan en zet de line-up erin. De advancing-checklist komt er automatisch bij." action={button} icon="calendar" />}
    </section>
    <FormDialog id="event-new-form" title="Nieuw evenement" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const created = await api<{ id: string }>('/events', { method: 'POST', body: formValues(form) });
      setOpen(false);
      toast('Evenement aangemaakt. De venue-checklist staat klaar.');
      navigate(`/evenementen/${created.id}`);
    }}>
      <div className="field"><label htmlFor="ne-name">Naam *</label><input id="ne-name" name="name" required placeholder="Moonshine 10YRS" /></div>
      <div className="form-grid"><div className="field"><label htmlFor="ne-date">Datum</label><input id="ne-date" name="date" type="date" /></div>
        <div className="field"><label htmlFor="ne-doors">Deuren</label><input id="ne-doors" name="doors" type="time" /></div></div>
      <div className="field"><label htmlFor="ne-venue">Venue</label><input id="ne-venue" name="venue" placeholder="Luxor Live, Arnhem" /></div>
    </FormDialog>
  </>;
}

export function EventTabs({ upcoming, past }: { upcoming?: number; past?: number }) {
  return <Tabs items={[{ to: '/evenementen', label: <>Komend {upcoming !== undefined ? <span className="count">{upcoming}</span> : null}</> },
    { to: '/evenementen/afgelopen', label: <>Afgelopen {past !== undefined ? <span className="count">{past}</span> : null}</> },
    { to: '/evenementen/artiesten', label: 'Artiesten' }]} />;
}

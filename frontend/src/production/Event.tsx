import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, download } from '../lib/api';
import { longDate, stamp, today } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, PageTitle, Stat, Tabs, formValues, useAction, useToast } from '../lib/ui';
import { Act, ActDialog, SendDialog } from './dialogs';
import { Asset, AssetGroups, Field, FormDialog, SaveBar, Select, STATUS, StatusBadge, useCanEdit, useDirty } from './common';

type Booking = { id: string; artist_id: string; status: string; complete: boolean; missing: string[]; acts: string[]; artist: { name: string } };
type Check = { id: string; key: string; label: string; status: string; notes: string; sent_at: number; sent_to: string };
export type Overview = {
  event: { id: string; name: string; date: string; venue: string; doors: string; capacity: number; status: string; venue_contact: string; venue_email: string; venue_phone: string };
  summary: { artists: number; complete: number; checklist: number; checklist_done: number };
  acts: Act[]; bookings: Booking[]; checklist: Check[]; assets: Asset[];
  sends: { id: string; status: string; created: number; recipients: string; attachments: unknown[]; error: string }[];
};

export const useOverview = (id: string) => useQuery({ queryKey: ['event', id], queryFn: () => api<Overview>(`/events/${id}/overview`) });

export function EventPage({ tab = 'advancing' }: { tab?: string }) {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const edit = useCanEdit();
  const run = useAction();
  const [send, setSend] = useState(false);
  const q = useOverview(id);
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/events">Evenementen</BackLink><ErrorBox error={q.error} /></>;
  const o = q.data;
  const e = o.event;
  const s = o.summary;
  const first = o.acts.find((a) => a.start);
  const base = `/events/${e.id}`;
  const set = (next: Overview) => { qc.setQueryData(['event', id], next); qc.invalidateQueries({ queryKey: ['events'] }); };
  const reload = () => { qc.invalidateQueries({ queryKey: ['event', id] }); qc.invalidateQueries({ queryKey: ['events'] }); };
  return <>
    <BackLink to={e.date && e.date < today() ? '/events/afgelopen' : '/events'}>Alle evenementen</BackLink>
    <PageTitle eyebrow="Evenement" title={e.name} sub={<>{longDate(e.date)}{e.venue ? ' · ' + e.venue : ''} <StatusBadge status={e.status} /></>}
      actions={<><button className="ghost" onClick={() => run(() => download(`/events/${e.id}/advancing.pdf`))}><Icon name="pdf" /> Advancingblad</button>
        {edit ? <button className="primary" onClick={() => setSend(true)}><Icon name="send" /> Advancing versturen</button> : null}</>} />
    <div className="stats">
      <Stat label="Artiesten compleet" value={`${s.complete}/${s.artists}`} sub={s.artists ? (s.complete === s.artists ? 'Alles is binnen' : `${s.artists - s.complete} nog niet compleet`) : 'Nog niemand geboekt'} icon="user" />
      <Stat label="Venue-checklist" value={`${s.checklist_done}/${s.checklist}`} sub={e.venue ? 'Voor ' + e.venue : 'Venue nog onbekend'} icon="check" />
      <Stat label="Eerste act" value={first ? first.start : '—'} sub={e.doors ? 'Deuren ' + e.doors : 'Deuren nog onbekend'} icon="clock" />
      <Stat label="Acts" value={String(o.acts.length)} sub={o.acts.length ? 'In de timetable' : 'Nog geen timetable'} icon="calendar" />
    </div>
    <Tabs items={[{ to: base, label: 'Advancing' }, { to: base + '/timetable', label: <>Timetable <span className="count">{o.acts.length}</span></> },
      { to: base + '/venue', label: 'Venue' }, { to: base + '/notes', label: 'Notities' }, { to: base + '/details', label: 'Gegevens' }]} />
    {tab === 'timetable' ? <Timetable o={o} set={set} reload={reload} /> : tab === 'venue' ? <Venue o={o} set={set} reload={reload} />
      : tab === 'notes' ? <Notes id={e.id} /> : tab === 'info' ? <Info o={o} reload={reload} /> : <Advancing o={o} />}
    <SendDialog open={send} eventId={e.id} checklist={o.checklist} onClose={() => setSend(false)} done={set} />
  </>;
}

function StatusIcon({ complete, cancelled }: { complete: boolean; cancelled: boolean }) {
  if (cancelled) return <span className="adv-status off" title="Geannuleerd"><Icon name="close" /></span>;
  return complete ? <span className="adv-status ok" title="Compleet"><Icon name="ok" /></span> : <span className="adv-status warn" title="Nog niet compleet"><Icon name="warn" /></span>;
}

function Advancing({ o }: { o: Overview }) {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const toast = useToast();
  const [add, setAdd] = useState(false);
  const roster = useQuery({ queryKey: ['artists'], queryFn: () => api<{ artists: { id: string; name: string }[] }>('/artists'), enabled: add });
  const open = o.bookings.filter((b) => b.status !== 'cancelled' && !b.complete);
  const counts: Record<string, number> = {};
  open.forEach((b) => b.missing.forEach((m) => { counts[m] = (counts[m] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const todo = o.checklist.filter((i) => i.status === 'todo' || i.status === 'done');
  const booked = new Set(o.bookings.map((b) => b.artist_id));
  const button = edit ? <button className="small" onClick={() => setAdd(true)}><Icon name="plus" /> Artiest toevoegen</button> : null;
  return <div className="adv-layout">
    <section className="card"><div className="card-head"><div><h2>Advancing overview</h2><p>Een vinkje betekent dat alles binnen is. Klik op een artiest voor gegevens, reis en content.</p></div>{button}</div>
      {o.bookings.length ? <div className="adv-list">{o.bookings.map((b) => {
        const acts = o.acts.filter((a) => b.acts.includes(a.id));
        const times = acts.filter((a) => a.start).map((a) => `${a.start}–${a.end || '?'}`).join(', ');
        const cancelled = b.status === 'cancelled';
        return <Link key={b.id} className="adv-row" to={`/events/${o.event.id}/artist/${b.id}`}>
          <StatusIcon complete={b.complete} cancelled={cancelled} />
          <span className="adv-name"><strong>{b.artist.name}</strong><small>{acts.map((a) => a.name).join(' · ') || 'Nog geen act'}</small></span>
          <span className="adv-when">{times || '—'}</span>
          <span className={`adv-state ${cancelled ? 'off' : b.complete ? 'ok' : 'warn'}`}>{cancelled ? 'Geannuleerd' : b.complete ? 'Compleet' : `${b.missing.length} ${b.missing.length === 1 ? 'punt' : 'punten'} open`}</span>
          <Icon name="chevron" />
        </Link>;
      })}</div> : <Empty title="Nog geen artiesten" sub="Voeg de line-up toe. Een bekende artiest neemt zijn riders, content en gegevens mee." action={button} icon="user" />}
    </section>
    <aside className="adv-side">
      <section className="card card-pad"><h2>Nog te regelen</h2>{top.length ? <ul className="todo-list">{top.map(([m, n]) => <li key={m}><span>{m}</span><b>{n}×</b></li>)}</ul>
        : <p className="helper">{o.bookings.length ? 'Alle artiesten zijn compleet.' : 'Nog niets te regelen.'}</p>}</section>
      <section className="card card-pad"><h2>{o.event.venue || 'Venue'}</h2><p className="helper">{todo.length ? `${todo.length} ${todo.length === 1 ? 'onderdeel is' : 'onderdelen zijn'} nog niet naar de venue gestuurd.` : 'Alles is verstuurd of niet van toepassing.'}</p>
        <Link className="text-link" to={`/events/${o.event.id}/venue`}>Naar de checklist <Icon name="chevron" /></Link></section>
    </aside>
    <FormDialog id="booking-form" title="Artiest toevoegen" open={add} onClose={() => setAdd(false)} label="Toevoegen" submit={async (form) => {
      const r = await api<{ booking_id: string }>(`/events/${o.event.id}/bookings`, { method: 'POST', body: formValues(form) });
      setAdd(false);
      toast('Artiest toegevoegd. Vul nu de gegevens aan.');
      navigate(`/events/${o.event.id}/artist/${r.booking_id}`);
    }}>
      <div className="field"><label htmlFor="booking-artist">Artiest</label><input id="booking-artist" name="name" list="artist-options" placeholder="Zoek in de artiesten of typ een nieuwe naam" autoComplete="off" required /></div>
      <datalist id="artist-options">{(roster.data?.artists || []).filter((a) => !booked.has(a.id)).map((a) => <option key={a.id} value={a.name} />)}</datalist>
      <p className="helper">Een bekende artiest neemt zijn gegevens, riders en content mee. Een nieuwe naam maakt een nieuw profiel aan.</p>
    </FormDialog>
  </div>;
}

function Timetable({ o, set, reload }: { o: Overview; set: (o: Overview) => void; reload: () => void }) {
  const edit = useCanEdit();
  const run = useAction();
  const [dialog, setDialog] = useState<{ act: Act | null } | null>(null);
  const lineup = o.bookings.filter((b) => b.status !== 'cancelled').map((b) => ({ artist_id: b.artist_id, name: b.artist.name }));
  const button = edit ? <button className="small" onClick={() => setDialog({ act: null })}><Icon name="plus" /> Act toevoegen</button> : null;
  return <section className="card">
    <div className="card-head"><div><h2>Timetable</h2><p>Een act kan meerdere artiesten hebben, zoals een B2B. Tijden na middernacht sorteren gewoon na de avond.</p></div>{button}</div>
    {o.acts.length ? <div className="table-wrap"><table className="tt-table"><thead><tr><th>Tijd</th><th>Act</th><th>Artiesten</th><th>Stage</th><th /></tr></thead><tbody>
      {o.acts.map((a) => <tr key={a.id}>
        <td className="tt-time">{a.start || '—'}{a.end ? ' – ' + a.end : ''}</td>
        <td><strong>{a.name}</strong>{a.note ? <small className="block">{a.note}</small> : null}</td>
        <td>{a.artists.length ? a.artists.map((n) => <span key={n} className="chip">{n}</span>) : <span className="helper">Geen artiesten gekoppeld</span>}</td>
        <td>{a.stage}</td>
        <td className="row-tools">{edit ? <>
          <button className="icon-btn ghost" onClick={() => setDialog({ act: a })} aria-label={`${a.name} bewerken`}><Icon name="edit" /></button>
          <button className="icon-btn ghost" aria-label={`${a.name} verwijderen`} onClick={() => confirm(`Act ${a.name} verwijderen?`) && run(async () => set(await api(`/acts/${a.id}`, { method: 'DELETE' })))}><Icon name="trash" /></button>
        </> : null}</td>
      </tr>)}
    </tbody></table></div> : <Empty title="Nog geen acts" sub={o.bookings.length ? 'Plan de acts met set times en koppel de artiesten.' : 'Voeg eerst artiesten toe bij Advancing.'} action={button} icon="clock" />}
    <ActDialog open={!!dialog} eventId={o.event.id} act={dialog?.act || null} lineup={lineup} onClose={() => setDialog(null)} done={reload} />
  </section>;
}

const CHECK_STATES: [string, string][] = [['todo', 'Te doen'], ['done', 'Klaar'], ['sent', 'Verstuurd'], ['na', 'N.v.t.']];

function Venue({ o, set, reload }: { o: Overview; set: (o: Overview) => void; reload: () => void }) {
  const edit = useCanEdit();
  const run = useAction();
  const [add, setAdd] = useState(false);
  const e = o.event;
  return <div className="adv-layout">
    <section className="card"><div className="card-head"><div><h2>Checklist voor {e.venue || 'de venue'}</h2><p>Vink af wat klaar is. <b>Advancing versturen</b> stuurt alles wat nog open staat in één mail via Outlook.</p></div>
      {edit ? <button className="small" onClick={() => setAdd(true)}><Icon name="plus" /> Onderdeel</button> : null}</div>
      <div className="check-list">{o.checklist.map((i) => <div key={i.id} className={`check-row is-${i.status}`}>
        <span className="check-mark">{i.status === 'sent' || i.status === 'done' ? <Icon name="check" /> : i.status === 'na' ? <Icon name="close" /> : null}</span>
        <div className="check-main"><strong>{i.label}</strong><small>{i.status === 'sent' ? `Verstuurd ${stamp(i.sent_at)}${i.sent_to ? ' naar ' + i.sent_to : ''}` : i.notes}</small></div>
        <div className="segmented" role="group" aria-label={`Status: ${i.label}`}>{CHECK_STATES.map(([v, l]) => (
          <button key={v} type="button" className={i.status === v ? 'active' : ''} aria-pressed={i.status === v} disabled={!edit}
            onClick={() => run(async () => set(await api(`/checklist/${i.id}`, { method: 'PATCH', body: { status: v } })))}>{l}</button>))}</div>
        {edit && !i.key ? <button className="icon-btn ghost tiny" aria-label={`${i.label} verwijderen`} onClick={() => confirm('Dit onderdeel van de checklist verwijderen?') && run(async () => set(await api(`/checklist/${i.id}`, { method: 'DELETE' })))}><Icon name="trash" /></button> : <span className="tiny-spacer" />}
      </div>)}</div>
    </section>
    <aside className="adv-side">
      <section className="card card-pad"><h2>Contact venue</h2>{e.venue_email || e.venue_contact || e.venue_phone
        ? <p className="contact-lines">{[e.venue_contact, e.venue_email, e.venue_phone].filter(Boolean).map((v) => <span key={v}>{v}<br /></span>)}</p>
        : <p className="helper">Nog geen contactpersoon. Vul die in bij Gegevens; het e-mailadres wordt de standaardontvanger.</p>}
        <Link className="text-link" to={`/events/${e.id}/details`}>Gegevens bewerken <Icon name="chevron" /></Link></section>
      <section className="card card-pad"><h2>Bestanden voor de venue</h2><AssetGroups ownerType="event" ownerId={e.id} assets={o.assets} kinds={['guestlist', 'production', 'stage_plot', 'other']} onChange={reload} /></section>
      <section className="card card-pad"><h2>Verzonden</h2>{o.sends.length ? <ul className="send-list">{o.sends.map((s) => <li key={s.id}>
        <span>{s.status === 'accepted' ? <Badge color="lime">Aangenomen door Outlook</Badge> : s.status === 'uncertain' ? <Badge color="amber">Onzeker</Badge> : <Badge color="red">Mislukt</Badge>} {stamp(s.created)}</span>
        <small>{s.recipients} · {s.attachments.length} bijlagen{s.error ? ' · ' + s.error : ''}</small></li>)}</ul> : <p className="helper">Nog niets verstuurd.</p>}</section>
    </aside>
    <FormDialog id="check-form" title="Onderdeel toevoegen" open={add} onClose={() => setAdd(false)} label="Toevoegen" submit={async (form) => {
      set(await api(`/events/${e.id}/checklist`, { method: 'POST', body: formValues(form) }));
      setAdd(false);
    }}>
      <div className="field"><label htmlFor="check-label">Wat moet er naar de venue?</label><input id="check-label" name="label" required placeholder="Bijv. lichtplot of merchandise-afspraken" /></div>
    </FormDialog>
  </div>;
}

function Notes({ id }: { id: string }) {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const q = useQuery({ queryKey: ['notes', id], queryFn: () => api<{ notes: { id: string; body: string; created: number }[] }>(`/events/${id}/notes`) });
  return <section className="card card-pad"><h2>Notities</h2><p className="helper">Alles wat je tijdens de voorbereiding of de opbouw niet mag vergeten.</p>
    {edit ? <form className="inline-form" onSubmit={(ev) => {
      ev.preventDefault();
      const form = ev.currentTarget;
      run(async () => { qc.setQueryData(['notes', id], await api(`/events/${id}/notes`, { method: 'POST', body: formValues(form) })); form.reset(); });
    }}><label className="visually-hidden" htmlFor="event-note">Nieuwe notitie</label><input id="event-note" name="body" placeholder="Bijv. tweede monitor defect" required /><button className="primary" type="submit">Toevoegen</button></form> : null}
    {q.isPending ? <Loading /> : q.data?.notes.length ? <ul className="note-list">{q.data.notes.map((n) => <li key={n.id}><span>{n.body}</span><time>{stamp(n.created)}</time></li>)}</ul> : <p className="helper">Nog geen notities.</p>}
  </section>;
}

function Info({ o, reload }: { o: Overview; reload: () => void }) {
  const edit = useCanEdit();
  const toast = useToast();
  const run = useAction();
  const navigate = useNavigate();
  const { setDirty, track } = useDirty();
  const e = o.event;
  return <>
    <form id="event-info-form" className="card card-pad" {...track} onSubmit={(ev) => {
      ev.preventDefault();
      const form = ev.currentTarget;
      run(async () => { await api(`/events/${e.id}`, { method: 'PATCH', body: formValues(form) }); setDirty(false); toast('Gegevens opgeslagen.'); reload(); });
    }}>
      <h2>Evenement</h2>
      <div className="kv-grid">
        <Field name="name" label="Naam *" value={e.name} required />
        <Field name="date" label="Datum" value={e.date} type="date" />
        <Field name="venue" label="Locatie / venue" value={e.venue} placeholder="Luxor Live, Arnhem" />
        <Field name="doors" label="Deuren" value={e.doors} type="time" />
        <Field name="capacity" label="Capaciteit" value={e.capacity || ''} type="number" min={0} />
        <Select name="status" label="Status" value={e.status} options={Object.entries(STATUS).map(([k, [l]]) => [k, l])} />
      </div>
      <h2 className="sub">Contact bij de venue</h2>
      <div className="kv-grid">
        <Field name="venue_contact" label="Contactpersoon" value={e.venue_contact} />
        <Field name="venue_email" label="E-mail (meerdere met komma)" value={e.venue_email} placeholder="productie@venue.nl" />
        <Field name="venue_phone" label="Telefoon" value={e.venue_phone} type="tel" />
      </div>
      {edit ? <div className="form-actions"><button className="primary" type="submit">Opslaan</button></div> : null}
    </form>
    {edit ? <section className="card card-pad danger-zone"><h2>Evenement verwijderen</h2><p className="helper">Verwijdert dit evenement met timetable, boekingen, checklist en verzendlog. Artiesten, hun riders en content blijven bewaard, net als de mappen in OneDrive.</p>
      <button className="danger" onClick={() => confirm(`${e.name} verwijderen? Dit kan niet ongedaan worden gemaakt.`) && run(async () => { await api(`/events/${e.id}`, { method: 'DELETE' }); setDirty(false); toast('Evenement verwijderd.'); navigate('/events'); })}><Icon name="trash" /> Evenement verwijderen</button></section> : null}
    <SaveBar form="event-info-form" />
  </>;
}

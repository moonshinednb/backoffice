import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import { api, download } from '../lib/api';
import { longDate, stamp, today } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, MoreMenu, Tabs, formValues, useAction, useToast } from '../lib/ui';
import { Act, ActDialog, SendDialog } from './dialogs';
import { ContentPlan } from './EventContent';
import { EventFiles } from './EventFiles';
import { EventChecklist } from './EventChecklist';
import { CrewList, GuestList } from './EventPeople';
import { LineUp, LineupAct } from './LineUp';
import { Contact, VenueContacts } from './VenueContacts';
import { Asset, AssetGroups, Field, FormDialog, SaveBar, Select, STATUS, StatusBadge, useCanEdit, useDirty } from './common';

type Booking = { id: string; artist_id: string; status: string; complete: boolean; missing: string[]; acts: string[]; artist: { name: string } };
type Check = { id: string; key: string; label: string; status: string; notes: string; sent_at: number; sent_to: string };
export type Overview = {
  event: { id: string; drive_url: string; name: string; date: string; venue: string; doors: string; capacity: number; status: string; venue_contact: string; venue_email: string; venue_phone: string; contacts: Contact[] };
  summary: { artists: number; complete: number; checklist: number; checklist_done: number };
  acts: Act[]; bookings: Booking[]; lineup: LineupAct[]; checklist: Check[]; assets: Asset[];
  sends: { id: string; status: string; created: number; recipients: string; attachments: unknown[]; error: string }[];
};

export const useOverview = (id: string) => useQuery({ queryKey: ['event', id], queryFn: () => api<Overview>(`/events/${id}/overview`) });

const TABS: [string, string][] = [['', 'Overzicht'], ['/line-up', 'Line-up'], ['/venue', 'Venue'], ['/people', 'Crew & gasten'], ['/content', 'Promo'], ['/files', 'Bestanden']];
const TAB_OF: Record<string, string> = { checklist: '', notes: '', advancing: '/line-up', timetable: '/line-up', venue: '/venue', crew: '/people', guests: '/people', content: '/content', files: '/files' };

export function EventPage({ tab = 'checklist' }: { tab?: string }) {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const edit = useCanEdit();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const [send, setSend] = useState(false);
  const q = useOverview(id);
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/events">Events</BackLink><ErrorBox error={q.error} /></>;
  const o = q.data;
  const e = o.event;
  const s = o.summary;
  const base = `/events/${e.id}`;
  const set = (next: Overview) => { qc.setQueryData(['event', id], next); qc.invalidateQueries({ queryKey: ['events'] }); };
  const reload = () => { qc.invalidateQueries({ queryKey: ['event', id] }); qc.invalidateQueries({ queryKey: ['events'] }); };
  const facts = [longDate(e.date), e.venue, e.doors ? `deuren ${e.doors}` : '', s.artists ? `${s.artists} acts, ${s.complete} compleet` : 'nog geen line-up'].filter(Boolean);
  const active = TAB_OF[tab] ?? '';
  return <>
    <BackLink to={e.date && e.date < today() ? '/events/past' : '/events'}>Events</BackLink>
    <header className="event-head">
      <div><h1>{e.name}</h1><p>{facts.map((f, i) => <span key={i}>{f}</span>)}<StatusBadge status={e.status} /></p></div>
      <div className="row-actions">
        {e.drive_url ? <a className="button ghost icon-only" href={e.drive_url} target="_blank" rel="noopener noreferrer" title="Eventmap op OneDrive" aria-label="Eventmap op OneDrive"><Icon name="folder" /></a> : null}
        <button className="ghost" onClick={() => run(() => download(`/events/${e.id}/advancing.pdf`))}><Icon name="pdf" /> Advancingblad</button>
        {edit ? <button className="primary" onClick={() => setSend(true)}><Icon name="send" /> Advancing versturen</button> : null}
        <MoreMenu items={[
          { label: 'Showdag-modus', icon: 'clock', onSelect: () => navigate(`${base}/showday`) },
          { label: 'Gegevens bewerken', icon: 'edit', onSelect: () => navigate(`${base}/details`) },
          edit && !e.drive_url ? { label: 'Mappen aanmaken op OneDrive', icon: 'folder', onSelect: () => run(async () => { await api(`/drive/event/${e.id}`, { method: 'POST' }); reload(); }, 'Mappen aangemaakt op OneDrive.') } : null,
          edit ? { label: 'Evenement verwijderen', icon: 'trash', danger: true, confirm: { title: `${e.name} verwijderen?`, action: 'Ja, verwijderen',
            body: 'Het evenement verdwijnt met line-up, timetable, checklist, crew- en gastenlijst en verzendlog. Artiestprofielen en de mappen op OneDrive blijven bestaan.' },
            onSelect: () => run(async () => { await api(`/events/${e.id}`, { method: 'DELETE' }); toast('Evenement verwijderd.'); navigate('/events'); }) } : null,
        ]} />
      </div>
    </header>
    <Tabs items={TABS.map(([path, label]) => ({ to: base + path, label: path === '/line-up' && o.lineup.length ? <>{label} <span className="count">{o.lineup.length}</span></> : label, end: path === '' }))} />
    {tab === 'info' ? <Info o={o} reload={reload} />
      : active === '/line-up' ? <><SubTabs items={[[`${base}/line-up`, 'Advancing'], [`${base}/timetable`, 'Timetable']]} />{tab === 'timetable' ? <Timetable o={o} set={set} reload={reload} /> : <LineUp o={o} />}</>
      : active === '/venue' ? <Venue o={o} set={set} reload={reload} />
      : active === '/people' ? <><SubTabs items={[[`${base}/people`, 'Crewlist'], [`${base}/guests`, 'Guestlist']]} />{tab === 'guests' ? <GuestList eventId={e.id} /> : <CrewList eventId={e.id} />}</>
      : active === '/content' ? <ContentPlan eventId={e.id} />
      : active === '/files' ? <EventFiles eventId={e.id} driveUrl={e.drive_url} reload={reload} />
      : <div className="overview-grid"><EventChecklist eventId={e.id} hasDrive={!!e.drive_url} /><Notes id={e.id} /></div>}
    <SendDialog open={send} eventId={e.id} checklist={o.checklist} onClose={() => setSend(false)} done={set} />
  </>;
}

/** Second-level switch inside a tab (e.g. Advancing | Timetable). */
function SubTabs({ items }: { items: [string, string][] }) {
  return <nav className="sub-tabs" aria-label="Weergave">{items.map(([to, label]) => <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}</nav>;
}

function Timetable({ o, set, reload }: { o: Overview; set: (o: Overview) => void; reload: () => void }) {
  const edit = useCanEdit();
  const run = useAction();
  const [dialog, setDialog] = useState<{ act: Act | null } | null>(null);
  const lineup = o.lineup.filter((a) => a.status !== 'cancelled').map((a) => ({ id: a.id, name: a.name, artist_ids: a.members.filter((m) => m.status !== 'cancelled').map((m) => m.artist_id) }));
  const button = edit ? <button className="small" onClick={() => setDialog({ act: null })}><Icon name="plus" /> Slot toevoegen</button> : null;
  return <section className="card">
    <div className="card-head"><div><h2>Timetable</h2><p>Een slot is één act, of meerdere voor een B2B. Tijden na middernacht sorteren na de avond.</p></div>{button}</div>
    {o.acts.length ? <div className="table-wrap"><table className="tt-table"><thead><tr><th>Tijd</th><th>Slot</th><th>Artiesten</th><th>Stage</th><th /></tr></thead><tbody>
      {o.acts.map((a) => <tr key={a.id}>
        <td className="tt-time">{a.start || '—'}{a.end ? ' – ' + a.end : ''}</td>
        <td><strong>{a.name}</strong>{a.note ? <small className="block">{a.note}</small> : null}</td>
        <td>{a.artists.length ? a.artists.map((n) => <span key={n} className="chip">{n}</span>) : <span className="helper">Geen act gekoppeld</span>}</td>
        <td>{a.stage}</td>
        <td className="row-tools">{edit ? <>
          <button className="icon-btn ghost" onClick={() => setDialog({ act: a })} aria-label={`${a.name} bewerken`}><Icon name="edit" /></button>
          <button className="icon-btn ghost" aria-label={`${a.name} uit de timetable halen`} onClick={() => confirm(`${a.name} uit de timetable halen? De act blijft in de line-up.`) && run(async () => set(await api(`/acts/${a.id}`, { method: 'DELETE' })))}><Icon name="trash" /></button>
        </> : null}</td>
      </tr>)}
    </tbody></table></div> : <Empty title="Nog geen timetable" sub={o.lineup.length ? 'Plan de acts met hun set times.' : 'Voeg eerst acts toe bij Line-up.'} action={button} icon="clock" />}
    <ActDialog open={!!dialog} eventId={o.event.id} act={dialog?.act || null} lineup={lineup} onClose={() => setDialog(null)} done={reload} />
  </section>;
}

const CHECK_STATES: [string, string][] = [['todo', 'Nog niet'], ['done', 'Klaar'], ['sent', 'Verstuurd'], ['na', 'N.v.t.']];

function Venue({ o, set, reload }: { o: Overview; set: (o: Overview) => void; reload: () => void }) {
  const edit = useCanEdit();
  const run = useAction();
  const [add, setAdd] = useState(false);
  const e = o.event;
  return <div className="adv-layout">
    <section className="card"><div className="card-head"><div><h2>{`Wat ${e.venue || 'de venue'} van ons krijgt`}</h2><p>Zet een onderdeel op Klaar als het compleet is. <b>Advancing versturen</b> stuurt alles wat klaar en nog niet verstuurd is in één mail.</p></div>
      {edit ? <button className="small" onClick={() => setAdd(true)}><Icon name="plus" /> Onderdeel</button> : null}</div>
      <div className="check-list">{o.checklist.map((i) => <div key={i.id} className={`check-row is-${i.status}`}>
        <div className="check-main"><strong>{i.label}</strong><small>{i.status === 'sent' ? `Verstuurd ${stamp(i.sent_at)}${i.sent_to ? ' naar ' + i.sent_to : ''}` : i.notes}</small></div>
        <div className="segmented" role="group" aria-label={`Status: ${i.label}`}>{CHECK_STATES.map(([v, l]) => (
          <button key={v} type="button" className={i.status === v ? 'active' : ''} aria-pressed={i.status === v} disabled={!edit}
            onClick={() => run(async () => set(await api(`/checklist/${i.id}`, { method: 'PATCH', body: { status: v } })))}>{l}</button>))}</div>
        {edit && !i.key ? <button className="icon-btn ghost tiny" aria-label={`${i.label} verwijderen`} onClick={() => confirm('Dit onderdeel van de checklist verwijderen?') && run(async () => set(await api(`/checklist/${i.id}`, { method: 'DELETE' })))}><Icon name="trash" /></button> : <span className="tiny-spacer" />}
      </div>)}</div>
    </section>
    <aside className="adv-side">

      <section className="card card-pad"><h2>Bestanden voor de venue</h2><AssetGroups ownerType="event" ownerId={e.id} assets={o.assets} kinds={['guestlist', 'production', 'stage_plot', 'other']} onChange={reload} /></section>
      <section className="card card-pad"><h2>Verzonden</h2>{o.sends.length ? <ul className="send-list">{o.sends.map((s) => <li key={s.id}>
        <span>{s.status === 'accepted' ? <Badge color="lime">Aangenomen door Outlook</Badge> : s.status === 'uncertain' ? <Badge color="amber">Onzeker</Badge> : <Badge color="red">Mislukt</Badge>} {stamp(s.created)}</span>
        <small>{s.recipients} · {s.attachments.length} bijlagen{s.error ? ' · ' + s.error : ''}</small></li>)}</ul> : <p className="helper">Nog niets verstuurd.</p>}</section>
    </aside>
    <div className="venue-contacts-wide"><VenueContacts eventId={e.id} contacts={e.contacts} /></div>
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
      {edit ? <div className="form-actions"><button className="primary" type="submit">Opslaan</button></div> : null}
    </form>
    <p className="helper">Contactpersonen van de venue staan bij Venue. Verwijderen kan via ⋯ rechtsboven.</p>
    <SaveBar form="event-info-form" />
  </>;
}

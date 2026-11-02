import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { euroInput, longDate } from '../lib/format';
import { BackLink, Badge, ErrorBox, Icon, Loading, MoreMenu, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { Act } from './dialogs';
import { Area, Asset, AssetGroups, BOOKED_BY, ContactBlock, Field, SaveBar, Select, TravelId, YES_NO, useCanEdit, useDirty } from './common';

type Leg = { from: string; to: string; departure: string; arrival: string; number: string };
type Detail = {
  id: string; status: string; fee: number; flight: string; grounds: string; hotel: string; notes: string; complete: boolean; missing: string[]; showday_contact: string; showday_phone: string; drive_url: string;
  flight_info: { tickets_booked: string; booked_by: string; price: number; notes: string; inbound: Leg; outbound: Leg };
  hotel_info: Record<string, any>; ground_info: Record<string, any>;
  artist: Record<string, any> & { id: string; name: string; masked: boolean };
  event: { id: string; name: string; date: string };
  acts: Act[]; assets: Asset[]; artist_assets: Asset[]; lineup: { artist_id: string; name: string }[];
  act: { id: string; name: string; travel: string; members: string[]; missing: string[]; complete: boolean } | null;
};

const SUB: Record<string, string> = { flight: 'flight', hotel: 'hotel', grounds: 'transport' };

export function BookingPage({ sub = '' }: { sub?: '' | 'flight' | 'hotel' | 'ground' }) {
  const { id = '', booking = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['booking', booking], queryFn: () => api<Detail>(`/bookings/${booking}`) });
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to={`/events/${id}`}>Evenement</BackLink><ErrorBox error={q.error} /></>;
  const set = (d: Detail) => { qc.setQueryData(['booking', booking], d); qc.invalidateQueries({ queryKey: ['event', d.event.id] }); qc.invalidateQueries({ queryKey: ['events'] }); };
  const reload = () => { qc.invalidateQueries({ queryKey: ['booking', booking] }); qc.invalidateQueries({ queryKey: ['event', id] }); };
  return sub ? <Travel key={sub} b={q.data} kind={sub} set={set} /> : <Main key={q.data.id} b={q.data} set={set} reload={reload} />;
}

function Missing({ b }: { b: Detail }) {
  if (b.status === 'cancelled') return <div className="notice"><Icon name="info" /> Deze boeking is geannuleerd en telt niet mee voor de advancing.</div>;
  const actOpen = b.act ? b.act.missing : [];
  if (!b.missing.length && !actOpen.length) return <div className="notice notice-ok"><Icon name="ok" /> {b.act && b.act.members.length > 1 ? `Compleet voor ${b.artist.name}.` : 'Advancing compleet. Alles wat de venue nodig heeft is binnen.'}</div>;
  return <div className="notice notice-warn missing"><Icon name="warn" /><div>
    {b.missing.length ? <><strong>{`Nog nodig voor ${b.artist.name}`}</strong><div className="chips">{b.missing.map((m) => <span key={m} className="chip warn">{m}</span>)}</div></> : null}
    {actOpen.length && b.act ? <><strong>{`Voor de act ${b.act.name}`}</strong><div className="chips">{actOpen.map((m) => <span key={m} className="chip warn">{m}</span>)}</div>
      <Link className="text-link" to={`/events/${b.event.id}/act/${b.act.id}`}>Naar de act <Icon name="chevron" /></Link></> : null}
  </div></div>;
}

function Main({ b, set, reload }: { b: Detail; set: (d: Detail) => void; reload: () => void }) {
  const edit = useCanEdit();
  const toast = useToast();
  const run = useAction();
  const navigate = useNavigate();
  const { setDirty, track, isDirty } = useDirty();
  const [yes, setYes] = useState({ flight: b.flight, grounds: b.grounds, hotel: b.hotel });
  const a = b.artist;
  const e = b.event;
  const mine = b.acts.filter((x) => x.artist_ids.includes(a.id));
  const needsId = (b.flight === 'yes' && ['moonshine', 'venue'].includes(b.flight_info.booked_by)) || (b.hotel === 'yes' && ['moonshine', 'venue'].includes(b.hotel_info.booked_by));

  async function save(quiet = false) {
    const form = document.getElementById('booking-main') as HTMLFormElement | null;
    if (!form) return;
    const artist: Record<string, string> = {};
    const booking: Record<string, any> = {};
    Object.entries(formValues(form)).forEach(([k, v]) => { if (k.startsWith('a_')) artist[k.slice(2)] = v; else if (k.startsWith('b_')) booking[k.slice(2)] = v; });
    if (a.masked) delete artist.passport;
    booking.artist = artist;
    const next = await api<Detail>(`/bookings/${b.id}`, { method: 'PATCH', body: booking });
    setDirty(false);
    set(next);
    if (!quiet) toast(next.complete ? 'Opgeslagen. Advancing compleet.' : 'Opgeslagen.');
  }
  const autosave = async () => { if (isDirty()) await save(true); };

  const subField = (key: 'flight' | 'grounds' | 'hotel', label: string, icon: string) => (
    <div className="kv-field"><label htmlFor={`f-b_${key}`}>{label}</label><div className="yn-row">
      <select id={`f-b_${key}`} name={`b_${key}`} defaultValue={b[key] || ''} disabled={!edit} onChange={(ev) => setYes({ ...yes, [key]: ev.target.value })}>{YES_NO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      {yes[key] === 'yes' ? <button type="button" className="small ghost" onClick={() => run(async () => { await autosave(); navigate(`/events/${e.id}/artist/${b.id}/${SUB[key]}`); })}><Icon name={icon} /> Gegevens</button> : null}
    </div></div>
  );

  return <>
    <BackLink to={b.act ? `/events/${e.id}/act/${b.act.id}` : `/events/${e.id}/line-up`}>{b.act && b.act.members.length > 1 ? `${b.act.name} · ${e.name}` : `Line-up · ${e.name}`}</BackLink>
    <PageTitle title={a.name}
      sub={<>{b.status === 'cancelled' ? <Badge>Geannuleerd</Badge> : b.complete ? <Badge color="lime">Compleet</Badge> : <Badge color="amber">{`${b.missing.length} punten open`}</Badge>} <Link className="text-link" to={`/artists/${a.id}`}>Profiel en riders <Icon name="chevron" /></Link></>}
      actions={<>{b.drive_url ? <a className="button ghost" href={b.drive_url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> EPK-map</a> : null}
        {edit ? <><button className="primary" type="submit" form="booking-main">Opslaan</button>
          <MoreMenu items={[{ label: b.act && b.act.members.length > 1 ? `${a.name} uit ${b.act.name} halen` : 'Van evenement halen', icon: 'trash', danger: true,
            confirm: { title: `${a.name} van ${e.name} halen?`, action: 'Ja, weghalen', body: 'De boeking en de bestanden die alleen bij deze boeking horen verdwijnen. Het artiestprofiel blijft bestaan. Was dit het laatste lid, dan verdwijnt de act ook.' },
            onSelect: () => run(async () => { await api(`/bookings/${b.id}`, { method: 'DELETE' }); setDirty(false); toast('Van het evenement gehaald.'); navigate(`/events/${e.id}/line-up`); }) }]} /></> : null}</>} />
    <Missing b={b} />
    <div className="booking-grid">
      <form id="booking-main" className="booking-form" {...track} onSubmit={(ev) => { ev.preventDefault(); run(() => save()); }}>
        <section className="card card-pad">
          <h2>Artiest</h2>
          <ContactBlock a={a} prefix="a_" />
          <TravelId a={a} prefix="a_" needed={needsId} flight={b.flight === 'yes' && ['moonshine', 'venue'].includes(b.flight_info.booked_by)} />
        </section>
        <section className="card card-pad">
          <h2>Boeking</h2>
          {b.act ? <p className="helper">{`Fee, status, rider en EPK staan bij de act `}<Link className="text-link" to={`/events/${e.id}/act/${b.act.id}`}>{b.act.name}</Link>.</p>
            : <Select name="b_status" label="Status" value={b.status} options={[['confirmed', 'Bevestigd'], ['option', 'Optie'], ['cancelled', 'Geannuleerd']]} />}
          {subField('flight', 'Vlucht', 'plane')}
          {subField('grounds', 'Grondvervoer', 'car')}
          {subField('hotel', 'Hotel', 'bed')}
          <Field name="a_rider_url" label="Riderlink" value={a.rider_url} type="url" placeholder="https://" />
          <Field name="a_epk_url" label="EPK-link" value={a.epk_url} type="url" placeholder="https://" />
          <h2 className="sub">Timetable</h2>
          {mine.length ? <ul className="act-list">{mine.map((x) => <li key={x.id}><span><strong>{x.name}</strong><small>{x.start ? `${x.start} – ${x.end || '?'}` : 'Nog geen tijd'}{x.stage ? ' · ' + x.stage : ''}</small></span></li>)}</ul>
            : <p className="helper">Nog niet ingepland. Dat doe je bij Line-up → Timetable.</p>}
          <h2 className="sub">Showdag</h2>
          <Field name="b_showday_contact" label="Contact op de dag (bijv. tourmanager)" value={b.showday_contact} />
          <Field name="b_showday_phone" label="Telefoon op de dag" value={b.showday_phone} type="tel" />
          <Area name="b_notes" label="Notities voor deze boeking" value={b.notes} />
        </section>
      </form>
      <section className="card card-pad content-col">
        <h2>Bestanden van deze artiest</h2>
        <AssetGroups ownerType="artist" ownerId={a.id} assets={b.artist_assets} kinds={['tech_rider', 'hospitality_rider', 'press_photo', 'bio', 'logo']} onChange={reload} before={autosave} />
        <p className="field-hint">Deze gaan mee naar elk volgend evenement van {a.name}. Een rider of EPK voor de hele act zet je bij de act. De technical rider bewerk je in het <Link className="text-link" to={`/artists/${a.id}/tech`}>profiel</Link>.</p>
      </section>
    </div>
    <SaveBar form="booking-main" />
  </>;
}

function Travel({ b, kind, set }: { b: Detail; kind: 'flight' | 'hotel' | 'ground'; set: (d: Detail) => void }) {
  const edit = useCanEdit();
  const toast = useToast();
  const run = useAction();
  const navigate = useNavigate();
  const { setDirty, track } = useDirty();
  const a = b.artist;
  const e = b.event;
  const back = `/events/${e.id}/artist/${b.id}`;
  async function save(form: HTMLFormElement) {
    const v = formValues(form);
    let body: Record<string, unknown>;
    if (kind === 'flight') {
      const leg = (p: string) => ({ from: v[p + '_from'], to: v[p + '_to'], departure: v[p + '_departure'], arrival: v[p + '_arrival'], number: v[p + '_number'] });
      body = { flight: 'yes', flight_info: { tickets_booked: v.tickets_booked, booked_by: v.booked_by, price: v.price, notes: v.notes, inbound: leg('in'), outbound: leg('out') } };
    } else body = kind === 'hotel' ? { hotel: 'yes', hotel_info: v } : { grounds: 'yes', ground_info: v };
    set(await api<Detail>(`/bookings/${b.id}`, { method: 'PATCH', body }));
    setDirty(false);
    toast('Opgeslagen.');
    navigate(back);
  }
  const title = kind === 'flight' ? 'Vluchtgegevens' : kind === 'hotel' ? 'Hotel' : 'Grondvervoer';
  const f = b.flight_info, h = b.hotel_info, g = b.ground_info;
  const leg = (p: string, l: Leg, t: string) => <section className="card card-pad"><h2>{t}</h2>
    <Field name={p + '_from'} label="Vertrekluchthaven" value={l.from} placeholder="Copenhagen (CPH)" />
    <Field name={p + '_to'} label="Aankomstluchthaven" value={l.to} placeholder="Amsterdam Schiphol (AMS)" />
    <Field name={p + '_departure'} label="Vertrek" value={l.departure} type="datetime-local" />
    <Field name={p + '_arrival'} label="Aankomst" value={l.arrival} type="datetime-local" />
    <Field name={p + '_number'} label="Vluchtnummer" value={l.number} placeholder="AB1234" /></section>;
  return <>
    <BackLink to={back}>{a.name}</BackLink>
    <PageTitle eyebrow={`${a.name} · ${e.name}`} title={title} sub={longDate(e.date)} actions={edit ? <button className="primary" type="submit" form="travel-form">Opslaan</button> : null} />
    <form id="travel-form" className={`travel-grid ${kind === 'flight' ? '' : 'two'}`} {...track} onSubmit={(ev) => { ev.preventDefault(); const form = ev.currentTarget; run(() => save(form)); }}>
      {kind === 'flight' ? <>
        <section className="card card-pad"><h2>Tickets</h2>
          <Select name="tickets_booked" label="Tickets geboekt?" value={f.tickets_booked} options={YES_NO} />
          <Select name="booked_by" label="Geboekt door" value={f.booked_by} options={BOOKED_BY} />
          <Field name="price" label="Prijs (€)" value={euroInput(f.price)} inputMode="decimal" placeholder="0,00" />
          <Area name="notes" label="Notities" value={f.notes} />
        </section>
        {leg('in', f.inbound, 'Heen (inbound)')}{leg('out', f.outbound, 'Terug (outbound)')}
      </> : kind === 'hotel' ? <>
        <section className="card card-pad"><h2>Boeking</h2>
          <Select name="booked_by" label="Geboekt door" value={h.booked_by} options={BOOKED_BY} />
          <Field name="name" label="Hotel" value={h.name} />
          <Field name="address" label="Adres" value={h.address} />
          <Field name="confirmation" label="Bevestigingsnummer" value={h.confirmation} />
          <Field name="price" label="Prijs (€)" value={euroInput(h.price)} inputMode="decimal" placeholder="0,00" />
        </section>
        <section className="card card-pad"><h2>Verblijf</h2>
          <Field name="check_in" label="Check-in" value={h.check_in} type="date" />
          <Field name="check_out" label="Check-out" value={h.check_out} type="date" />
          <Field name="rooms" label="Kamers" value={h.rooms} placeholder="1 single, 1 double" />
          <Area name="notes" label="Notities" value={h.notes} />
        </section>
      </> : <>
        <section className="card card-pad"><h2>Ophalen</h2>
          <Select name="booked_by" label="Geregeld door" value={g.booked_by} options={BOOKED_BY} />
          <Field name="pickup_time" label="Ophaaltijd" value={g.pickup_time} type="datetime-local" />
          <Field name="pickup_location" label="Ophaallocatie" value={g.pickup_location} placeholder="Schiphol, meeting point" />
          <Field name="dropoff_location" label="Afzetten bij" value={g.dropoff_location} placeholder="Hotel of venue" />
        </section>
        <section className="card card-pad"><h2>Terug en chauffeur</h2>
          <Field name="return_time" label="Terugrit" value={g.return_time} type="datetime-local" />
          <Field name="return_location" label="Terug naar" value={g.return_location} />
          <Field name="driver" label="Chauffeur" value={g.driver} />
          <Field name="driver_phone" label="Telefoon chauffeur" value={g.driver_phone} type="tel" />
          <Area name="notes" label="Notities" value={g.notes} />
        </section>
      </>}
    </form>
    <SaveBar form="travel-form" />
  </>;
}

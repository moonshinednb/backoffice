import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { eur } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, MoreMenu, PageTitle, useAction, useToast } from '../lib/ui';
import { Asset, AssetGroups, FormDialog, useCanEdit } from './common';
import type { Overview } from './Event';

export type LineupMember = { booking_id: string; artist_id: string; name: string; status: string; missing: string[] };
export type LineupAct = { id: string; name: string; fee: number; status: string; travel: string; notes: string; drive_url: string; members: LineupMember[];
  times: string[]; stages: string[]; missing: string[]; complete: boolean; assets: Asset[] };
export const TRAVEL: [string, string][] = [['', 'Nog kiezen'], ['self', 'Reist zelf'], ['us', 'Wij regelen'], ['venue', 'Venue regelt']];

function State({ a }: { a: LineupAct }) {
  if (a.status === 'cancelled') return <span className="adv-status off" title="Geannuleerd"><Icon name="close" /></span>;
  return a.complete ? <span className="adv-status ok" title="Compleet"><Icon name="ok" /></span> : <span className="adv-status warn" title="Nog niet compleet"><Icon name="warn" /></span>;
}

/** Names typed one by one (Enter or comma), with suggestions from the artist database. */
function MemberInput({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const [text, setText] = useState('');
  const add = () => { const t = text.trim().replace(/,$/, ''); if (t && !value.includes(t)) onChange([...value, t]); setText(''); };
  return <div className="member-input">
    {value.map((n) => <span key={n} className="member-chip">{n}<button type="button" aria-label={`${n} weghalen`} onClick={() => onChange(value.filter((x) => x !== n))}><Icon name="close" /></button></span>)}
    <input value={text} list="artist-options" placeholder={value.length ? 'Nog iemand…' : 'Naam van een artiest, Enter voor de volgende'} aria-label="Lid toevoegen"
      onChange={(e) => { if (e.target.value.endsWith(',')) { setText(e.target.value); setTimeout(add); } else setText(e.target.value); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)); }} onBlur={add} />
    <datalist id="artist-options">{options.map((n) => <option key={n} value={n} />)}</datalist>
  </div>;
}

/** The line-up as acts: who plays, what is still missing per act. */
export function LineUp({ o }: { o: Overview }) {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [add, setAdd] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const artists = useQuery({ queryKey: ['artists'], queryFn: () => api<{ artists: { id: string; name: string }[] }>('/artists'), enabled: add });
  const acts = o.lineup;
  const open = acts.filter((a) => a.status !== 'cancelled' && !a.complete);
  const counts: Record<string, number> = {};
  open.forEach((a) => a.missing.forEach((m) => { const k = m.replace(/^[^:]+: (?=(Vlucht|Hotel|Grondvervoer|Heenvlucht|Terugvlucht|Volledige naam|Geboortedatum))/, ''); counts[k] = (counts[k] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const booked = new Set(acts.flatMap((a) => a.members.map((m) => m.name.toLowerCase())));
  const button = edit ? <button className="small" onClick={() => { setMembers([]); setAdd(true); }}><Icon name="plus" /> Act toevoegen</button> : null;
  return <div className="adv-layout">
    <section className="card"><div className="card-head"><div><h2>Line-up</h2><p>Per act: wat er nog nodig is. Klik voor fee, rider, EPK en de reis van de leden.</p></div>{button}</div>
      {acts.length ? <div className="adv-list">{acts.map((a) => {
        const travel = TRAVEL.find(([k]) => k === a.travel)?.[1] || '';
        const others = a.members.filter((m) => m.name !== a.name);
        return <Link key={a.id} className={`adv-row act-row ${a.status === 'cancelled' ? 'is-off' : ''}`} to={`/events/${o.event.id}/act/${a.id}`}>
          <State a={a} />
          <span className="adv-name"><strong>{a.name}</strong><small>{others.length ? a.members.map((m) => m.name).join(' · ') : a.members.length > 1 ? `${a.members.length} leden` : 'Solo'}{a.status === 'option' ? ' · optie' : ''}</small></span>
          <span className="adv-when">{a.times.join(', ') || '—'}{a.stages.length ? <small>{a.stages.join(', ')}</small> : null}</span>
          <span className={`travel-tag ${a.travel ? '' : 'unset'}`}>{a.travel === '' ? 'Reis nog kiezen' : travel}</span>
          <span className={`adv-state ${a.status === 'cancelled' ? 'off' : a.complete ? 'ok' : 'warn'}`}>{a.status === 'cancelled' ? 'Geannuleerd' : a.complete ? 'Compleet' : `${a.missing.length} open`}</span>
          <Icon name="chevron" />
        </Link>;
      })}</div> : <Empty title="Nog geen line-up" sub="Voeg acts toe: een solo-artiest, een duo of een groep. Bekende artiesten nemen hun gegevens en riders mee." action={button} icon="user" />}
    </section>
    <aside className="adv-side">
      <section className="card card-pad"><h2>Nog te regelen</h2>{top.length ? <ul className="todo-list">{top.map(([m, n]) => <li key={m}><span>{m}</span><b>{n}×</b></li>)}</ul>
        : <p className="helper">{acts.length ? 'Alle acts zijn compleet.' : 'Nog niets te regelen.'}</p>}</section>
    </aside>
    <FormDialog id="lineup-form" title="Act toevoegen" open={add} onClose={() => setAdd(false)} label="Toevoegen" submit={async (form) => {
      const data = new FormData(form);
      const r = await api<{ act_id: string }>(`/events/${o.event.id}/lineup`, { method: 'POST', body: { name: data.get('name') || '', members, travel: data.get('travel') || '' } });
      setAdd(false); qc.invalidateQueries({ queryKey: ['event', o.event.id] }); qc.invalidateQueries({ queryKey: ['events'] });
      toast('Act toegevoegd.'); navigate(`/events/${o.event.id}/act/${r.act_id}`);
    }}>
      <div className="field"><label htmlFor="la-name">Naam van de act</label><input id="la-name" name="name" placeholder="Bijv. Transit & Fifth (leeg = de naam van de artiest)" /></div>
      <div className="field"><label>Leden</label><MemberInput value={members} onChange={setMembers} options={(artists.data?.artists || []).map((x) => x.name).filter((n) => !booked.has(n.toLowerCase()))} />
        <p className="helper">Eén naam voor een solo-artiest, meerdere voor een duo of groep. Bekende artiesten nemen hun gegevens en riders mee.</p></div>
      <div className="field"><label htmlFor="la-travel">Reis</label><select id="la-travel" name="travel" defaultValue="">{TRAVEL.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
    </FormDialog>
  </div>;
}

/** One act: fee, status, travel choice, rider and EPK for the whole act; members for their own travel. */
export function ActPage() {
  const { id = '', act = '' } = useParams();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const edit = useCanEdit();
  const navigate = useNavigate();
  const [member, setMember] = useState('');
  const q = useQuery({ queryKey: ['event', id], queryFn: () => api<Overview>(`/events/${id}/overview`) });
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to={`/events/${id}/line-up`}>Line-up</BackLink><ErrorBox error={q.error} /></>;
  const a = q.data.lineup.find((x) => x.id === act);
  if (!a) return <><BackLink to={`/events/${id}/line-up`}>Line-up</BackLink><Empty title="Act niet gevonden" sub="Misschien is hij van het evenement gehaald." icon="user" /></>;
  const set = (o: Overview) => { qc.setQueryData(['event', id], o); qc.invalidateQueries({ queryKey: ['events'] }); };
  const patch = (body: object) => run(async () => set(await api<Overview>(`/lineup/${a.id}`, { method: 'PATCH', body })));
  const reload = () => qc.invalidateQueries({ queryKey: ['event', id] });
  return <>
    <BackLink to={`/events/${id}/line-up`}>{`Line-up · ${q.data.event.name}`}</BackLink>
    <PageTitle title={a.name} sub={<>{a.status === 'cancelled' ? <Badge>Geannuleerd</Badge> : a.complete ? <Badge color="lime">Compleet</Badge> : <Badge color="amber">{`${a.missing.length} open`}</Badge>}
      {a.times.length ? <span className="title-meta">{`${a.times.join(', ')}${a.stages.length ? ' · ' + a.stages.join(', ') : ''}`}</span> : null}</>}
      actions={<>{a.drive_url ? <a className="button ghost" href={a.drive_url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> EPK-map</a> : null}
        {edit ? <MoreMenu items={[{ label: 'Act van evenement halen', icon: 'trash', danger: true,
          confirm: { title: `${a.name} van het evenement halen?`, body: `De boekingen van ${a.members.map((m) => m.name).join(', ')} en de bestanden van deze act verdwijnen van dit evenement. De artiestprofielen blijven bestaan.`, action: 'Ja, van evenement halen' },
          onSelect: () => run(async () => { set(await api<Overview>(`/lineup/${a.id}`, { method: 'DELETE' })); toast('Act van het evenement gehaald.'); navigate(`/events/${id}/line-up`); }) }]} /> : null}</>} />
    {a.missing.length && a.status !== 'cancelled' ? <div className="notice notice-warn missing"><Icon name="warn" /><div><strong>Nog nodig voor deze act</strong><div className="chips">{a.missing.map((m) => <span key={m} className="chip warn">{m}</span>)}</div></div></div> : null}
    <div className="act-grid">
      <section className="card card-pad">
        <h2>Boeking</h2>
        <div className="kv-field"><label htmlFor="act-status">Status</label><select id="act-status" value={a.status} disabled={!edit} onChange={(e) => patch({ status: e.target.value })}>
          <option value="confirmed">Bevestigd</option><option value="option">Optie</option><option value="cancelled">Geannuleerd</option></select></div>
        <div className="kv-field"><label htmlFor="act-fee">Fee (€)</label><input id="act-fee" key={a.fee} inputMode="decimal" disabled={!edit} defaultValue={a.fee ? (a.fee / 100).toFixed(2).replace('.', ',') : ''} placeholder="0,00"
          onBlur={(e) => { const v = Math.round(parseFloat(e.target.value.replace(/\./g, '').replace(',', '.') || '0') * 100); if (!Number.isNaN(v) && v !== a.fee) patch({ fee: v }); }} /></div>
        <div className="kv-field stacked"><label>Reis</label><div className="segmented" role="group" aria-label="Reis">{TRAVEL.map(([k, l]) =>
          <button key={k} type="button" className={a.travel === k ? 'active' : ''} aria-pressed={a.travel === k} disabled={!edit} onClick={() => patch({ travel: k })}>{l}</button>)}</div></div>
        <p className="helper">{a.travel === 'us' || a.travel === 'venue' ? 'Vul per lid de vlucht, het vervoer en het hotel in.' : a.travel === 'self' ? 'Ze regelen hun eigen reis; daar vraagt de advancing niet naar.' : 'Kies of ze zelf reizen of dat wij (of de venue) het regelen.'}</p>
        <div className="kv-field"><label htmlFor="act-notes">Notities</label><textarea id="act-notes" key={a.notes} rows={3} disabled={!edit} defaultValue={a.notes}
          onBlur={(e) => { if (e.target.value !== a.notes) patch({ notes: e.target.value }); }} placeholder="Afspraken, contract, bijzonderheden" /></div>
        {a.fee ? <p className="helper">{`Fee: ${eur(a.fee)}`}</p> : null}
      </section>
      <section className="card card-pad">
        <h2>Leden</h2>
        <ul className="member-list">{a.members.map((m) => <li key={m.booking_id}>
          <Link to={`/events/${id}/artist/${m.booking_id}`}><strong>{m.name}</strong><small>{m.missing.length ? m.missing.join(' · ') : a.travel === 'us' || a.travel === 'venue' ? 'Reis en hotel compleet' : 'Contact, reisgegevens'}</small></Link>
          <Icon name="chevron" /></li>)}</ul>
        {edit ? <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (!member.trim()) return; run(async () => { set(await api<Overview>(`/lineup/${a.id}/members`, { method: 'POST', body: { name: member } })); setMember(''); }); }}>
          <input value={member} onChange={(e) => setMember(e.target.value)} placeholder="Lid toevoegen" aria-label="Lid toevoegen" /><button className="small" type="submit"><Icon name="plus" /> Toevoegen</button></form> : null}
      </section>
      <section className="card card-pad act-files">
        <h2>Rider en EPK</h2>
        <AssetGroups ownerType="act" ownerId={a.id} assets={a.assets} kinds={['tech_rider', 'hospitality_rider', 'press_photo', 'bio', 'logo', 'press_video', 'visual']} onChange={reload} />
        <p className="field-hint">Voor de hele act. Riders komen op OneDrive in 03 Riders, persmateriaal in 02 EPKs/{a.name}.</p>
      </section>
    </div>
  </>;
}

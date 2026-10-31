import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api, download } from '../lib/api';
import { shortDate } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, PageTitle, Tabs, formValues, useAction, useToast } from '../lib/ui';
import { Area, Asset, AssetGroups, ContactBlock, Field, FormDialog, SaveBar, TravelId, useCanEdit, useDirty } from './common';
import { EventTabs } from './Events';
import { SOCIAL_LABEL } from './Roster';
import { Orb } from '../lib/ui';

type Row = { id: string; name: string; full_name: string; agency: string; agent: string; has_tech_rider: boolean; has_rider_url: boolean; rider_files: number; has_epk: boolean; booking_count: number };

export function Artists() {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['artists'], queryFn: () => api<{ artists: Row[] }>('/artists') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const term = search.trim().toLowerCase();
  const rows = q.data.artists.filter((a) => !term || [a.name, a.full_name, a.agency, a.agent].join(' ').toLowerCase().includes(term));
  const button = edit ? <button className="primary" onClick={() => setOpen(true)}><Icon name="plus" /> Nieuwe artiest</button> : null;
  return <>
    <PageTitle eyebrow="Evenementen" title="Artiesten" sub="Eén profiel per artiest: contact, riders, EPK en promo. Herbruikbaar voor elk evenement en het label." actions={button} />
    <EventTabs />
    <section className="card">{q.data.artists.length ? <>
      <div className="card-head"><div className="search-field"><label className="visually-hidden" htmlFor="artist-search">Zoek artiest</label><input id="artist-search" type="search" placeholder="Zoek op naam, agent of agency" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
      <div className="table-wrap"><table className="artists-table"><thead><tr><th>Artiest</th><th>Agent</th><th>Rider</th><th>EPK</th><th>Optredens</th><th aria-label="Openen" /></tr></thead><tbody>
        {rows.map((a) => {
          const go = () => navigate(`/artists/${a.id}`);
          return <tr key={a.id} className="clickable" tabIndex={0} onClick={go} onKeyDown={(k) => k.key === 'Enter' && go()}>
            <td><div className="event-name"><strong>{a.name}</strong><small>{a.full_name || 'Volledige naam ontbreekt'}</small></div></td>
            <td>{[a.agent, a.agency].filter(Boolean).join(' · ') || '—'}</td>
            <td>{a.has_tech_rider || a.has_rider_url || a.rider_files ? <span className="yes"><Icon name="ok" /> Rider</span> : <span className="no">Geen rider</span>}</td>
            <td>{a.has_epk ? <span className="yes"><Icon name="ok" /> EPK</span> : <span className="no">—</span>}</td>
            <td className="nowrap">{a.booking_count} {a.booking_count === 1 ? 'evenement' : 'evenementen'}</td>
            <td><Icon name="chevron" /></td>
          </tr>;
        })}
      </tbody></table></div>
    </> : <Empty title="Nog geen artiesten" sub="Artiesten ontstaan vanzelf als je ze op een evenement zet, of maak er hier een aan." action={button} icon="user" />}</section>
    <FormDialog id="artist-new-form" title="Nieuwe artiest" open={open} onClose={() => setOpen(false)} label="Aanmaken" submit={async (form) => {
      const artist = await api<{ id: string }>('/artists', { method: 'POST', body: formValues(form) });
      setOpen(false);
      navigate(`/artists/${artist.id}`);
    }}><div className="field"><label htmlFor="na-name">Artiestennaam *</label><input id="na-name" name="name" required /></div></FormDialog>
  </>;
}

type Artist = Record<string, any> & { id: string; name: string; masked: boolean; assets: Asset[]; bookings: { id: string; event_id: string; event_name: string; event_date: string; venue: string; status: string }[] };

const TECH_TEMPLATE = `# DJ-setup
- 3x Pioneer CDJ-3000, gelinkt via ethernet
- 1x Pioneer DJM-V10 of DJM-A9
- 2x booth monitors op oorhoogte, met eigen volumeregeling

# Booth
- Stevige, trillingsvrije tafel op heuphoogte
- Twee stopcontacten (230 V) bij de booth
- Geen drankjes op de tafel met apparatuur

# Opbouw
- Linecheck minimaal 30 minuten voor de set`;
const HOSPITALITY_TEMPLATE = `# Catering
- Warme maaltijd voor 2 personen
- Water, frisdrank en vers fruit backstage

# Backstage
- Afsluitbare kleedruimte met spiegel
- 4 handdoeken

# Gastenlijst
- 4 plekken`;

export function ArtistPage({ tab = 'info' }: { tab?: 'info' | 'tech' | 'hospitality' | 'files' | 'shows' }) {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const edit = useCanEdit();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const { setDirty, track, isDirty } = useDirty();
  const q = useQuery({ queryKey: ['artist', id], queryFn: () => api<Artist>(`/artists/${id}`) });
  const [photoBusy, setPhotoBusy] = useState(false);
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const b = new FormData(); b.append('file', file);
    setPhotoBusy(true);
    try { qc.setQueryData(['artist', id], await api(`/artists/${id}/photo`, { method: 'POST', body: b })); qc.invalidateQueries({ queryKey: ['roster'] }); toast('Profielfoto opgeslagen op OneDrive.'); }
    catch (err) { toast((err as Error).message, true); } finally { setPhotoBusy(false); }
  }
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/events/artiesten">Alle artiesten</BackLink><ErrorBox error={q.error} /></>;
  const a = q.data;
  const base = `/artists/${a.id}`;
  const reload = () => qc.invalidateQueries({ queryKey: ['artist', id] });
  const form = tab === 'info' ? 'artist-form' : tab === 'tech' || tab === 'hospitality' ? 'rider-form' : '';
  async function save(f: HTMLFormElement, quiet = false) {
    const values = formValues(f);
    if (a.masked) delete values.passport;
    const payload: Record<string, unknown> = { ...values };
    if (f.id === 'artist-form') {
      payload.on_label = 'on_label' in values;
      payload.in_roster = 'in_roster' in values;
      payload.socials = Object.fromEntries(Object.keys(SOCIAL_LABEL).map((k) => [k, values['social_' + k] || '']).filter(([, v]) => v));
      Object.keys(SOCIAL_LABEL).forEach((k) => delete payload['social_' + k]);
    }
    qc.setQueryData(['artist', id], await api<Artist>(`/artists/${a.id}`, { method: 'PATCH', body: payload }));
    qc.invalidateQueries({ queryKey: ['artists'] }); qc.invalidateQueries({ queryKey: ['roster'] });
    setDirty(false);
    if (!quiet) toast('Opgeslagen.');
  }
  const autosave = async () => { const f = form && document.getElementById(form) as HTMLFormElement | null; if (f && isDirty()) await save(f, true); };
  const submit = (ev: React.FormEvent<HTMLFormElement>) => { ev.preventDefault(); const f = ev.currentTarget; run(() => save(f)); };
  return <>
    <BackLink to="/events/artiesten">Alle artiesten</BackLink>
    <PageTitle eyebrow="Artiest" title={a.name} sub={[a.full_name, a.agency].filter(Boolean).join(' · ') || 'Profiel'}
      actions={<>{tab === 'tech' || tab === 'hospitality' ? <button className="ghost" onClick={() => run(async () => { await autosave(); await download(`/artists/${a.id}/rider.pdf?kind=${tab}`); })}><Icon name="pdf" /> PDF</button> : null}
        {edit && form ? <button className="primary" type="submit" form={form}>Opslaan</button> : null}</>} />
    <Tabs items={[{ to: base, label: 'Gegevens' }, { to: base + '/tech', label: 'Technical rider' }, { to: base + '/hospitality', label: 'Hospitality rider' },
      { to: base + '/files', label: <>Bestanden <span className="count">{a.assets.length}</span></> }, { to: base + '/shows', label: <>Optredens <span className="count">{a.bookings.length}</span></> }]} />
    {tab === 'tech' || tab === 'hospitality' ? <Rider key={tab} a={a} tab={tab} track={track} submit={submit} reload={reload} before={autosave} setDirty={setDirty} />
      : tab === 'files' ? <section className="card card-pad"><h2>Bestanden van {a.name}</h2><p className="helper">Riders, EPK, logo’s, persfoto’s en video’s. Lokaal bewaard en, als de koppeling aan staat, in OneDrive onder Artiesten/{a.name}.</p>
        <div className="asset-columns"><AssetGroups ownerType="artist" ownerId={a.id} assets={a.assets} kinds={['tech_rider', 'hospitality_rider', 'rider', 'epk', 'logo', 'press_photo', 'press_video', 'bio', 'visual', 'contract', 'other']} onChange={reload} /></div></section>
        : tab === 'shows' ? <section className="card">{a.bookings.length ? <div className="table-wrap"><table className="shows-table"><thead><tr><th>Datum</th><th>Evenement</th><th>Locatie</th><th>Status</th><th /></tr></thead><tbody>
          {a.bookings.map((b) => <tr key={b.id} className="clickable" tabIndex={0} onClick={() => navigate(`/events/${b.event_id}/artist/${b.id}`)} onKeyDown={(k) => k.key === 'Enter' && navigate(`/events/${b.event_id}/artist/${b.id}`)}>
            <td>{shortDate(b.event_date)}</td><td><strong>{b.event_name}</strong></td><td>{b.venue}</td>
            <td>{b.status === 'cancelled' ? <Badge>Geannuleerd</Badge> : b.status === 'option' ? <Badge color="amber">Optie</Badge> : <Badge color="lime">Bevestigd</Badge>}</td><td><Icon name="chevron" /></td></tr>)}
        </tbody></table></div> : <Empty title="Nog geen optredens" sub="Zet de artiest op een evenement via Advancing." icon="calendar" />}</section>
          : <>
            <form id="artist-form" className="booking-form" {...track} onSubmit={submit}>
              <section className="card card-pad"><h2>Gegevens</h2>
                <Field name="name" label="Artiestennaam *" value={a.name} required />
                <Field name="nationality" label="Nationaliteit" value={a.nationality} />
                <TravelId a={a} needed={false} />
                <label className="label-toggle"><input type="checkbox" name="in_roster" defaultChecked={a.in_roster} disabled={!edit} /> Eigen Moonshine-artiest (staat bij Artists)</label>
                <label className="label-toggle"><input type="checkbox" name="on_label" defaultChecked={a.on_label} disabled={!edit} /> Brengt uit op het Moonshine-label</label>
              </section>
              <section className="card card-pad">
                <ContactBlock a={a} />
                <h2 className="sub">Links</h2>
                <Field name="rider_url" label="Riderlink" value={a.rider_url} type="url" placeholder="https://" />
                <Field name="epk_url" label="EPK-link" value={a.epk_url} type="url" placeholder="https://" />
              </section>
              <section className="card card-pad wide-card"><h2>Moonshine-profiel</h2>
                <div className="profile-row">
                  <div className="roster-photo big">{a.photo ? <img src={a.photo} alt="" /> : <span>{a.name.slice(0, 2).toUpperCase()}</span>}</div>
                  {edit ? <label className="button ghost">{photoBusy ? <Orb state="weaving" /> : <Icon name="upload" />} Profielfoto<input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={uploadPhoto} /></label> : null}
                </div>
                <div className="form-grid">
                  <Field name="genres" label="Genres" value={a.genres} placeholder="Neurofunk, jump up" />
                  <Field name="city" label="Plaats" value={a.city} />
                  <Field name="epk_folder" label="EPK-map op OneDrive (link)" value={a.epk_folder} type="url" placeholder="https://…sharepoint.com/…" />
                  {Object.keys(SOCIAL_LABEL).map((k) => <Field key={k} name={'social_' + k} label={SOCIAL_LABEL[k]} value={(a.socials || {})[k]} type="url" placeholder="https://" />)}
                </div>
              </section>
              <section className="card card-pad wide-card"><h2>Promo</h2>
                <Area name="bio" label="Bio / promotekst" value={a.bio} rows={6} />
                <Area name="notes" label="Interne notities" value={a.notes} />
              </section>
            </form>
            {edit ? <section className="card card-pad danger-zone"><h2>Artiest verwijderen</h2><p className="helper">Kan alleen als de artiest niet meer op een evenement staat. Bestanden in OneDrive blijven bewaard.</p>
              <button className="danger" onClick={() => confirm(`${a.name} verwijderen? Alle lokale bestanden van deze artiest worden verwijderd.`) && run(async () => { await api(`/artists/${a.id}`, { method: 'DELETE' }); setDirty(false); qc.invalidateQueries({ queryKey: ['artists'] }); toast('Artiest verwijderd.'); navigate('/events/artiesten'); })}><Icon name="trash" /> Artiest verwijderen</button></section> : null}
          </>}
    {form ? <SaveBar form={form} /> : null}
  </>;
}

function Rider({ a, tab, track, submit, reload, before, setDirty }: { a: Artist; tab: 'tech' | 'hospitality'; track: object; submit: (e: React.FormEvent<HTMLFormElement>) => void; reload: () => void; before: () => Promise<void>; setDirty: (v: boolean) => void }) {
  const edit = useCanEdit();
  const area = useRef<HTMLTextAreaElement>(null);
  const key = tab === 'tech' ? 'tech_rider' : 'hospitality_rider';
  const [filled, setFilled] = useState(!!(a[key] || '').trim());
  function template() {
    const el = area.current;
    if (!el) return;
    const t = tab === 'tech' ? TECH_TEMPLATE : HOSPITALITY_TEMPLATE;
    el.value = el.value.trim() ? el.value.trimEnd() + '\n\n' + t : t;
    setFilled(true);
    setDirty(true);
    el.focus();
  }
  return <div className="rider-layout">
    <form id="rider-form" className="card card-pad" {...track} onSubmit={submit}>
      <div className="rider-head"><h2>{tab === 'tech' ? 'Technical rider' : 'Hospitality rider'}</h2>{edit ? <button type="button" className="small ghost" onClick={template}><Icon name="spark" /> {filled ? 'Sjabloon onderaan toevoegen' : 'Begin met sjabloon'}</button> : null}</div>
      <label className="visually-hidden" htmlFor={`f-${key}`}>Ridertekst</label>
      <textarea ref={area} id={`f-${key}`} name={key} className="rider-editor" rows={22} spellCheck defaultValue={a[key] || ''} disabled={!edit} placeholder={'# DJ-setup\n- 3x CDJ-3000\n- DJM-V10'} onInput={(e) => setFilled(!!e.currentTarget.value.trim())} />
      <p className="field-hint">Begin een regel met <code>#</code> voor een kop en met <code>-</code> voor een opsomming. De PDF en de mail naar de venue worden hieruit gemaakt.</p>
    </form>
    <aside className="card card-pad"><h2>Riderbestanden</h2><p className="helper">Heeft de artiest een eigen PDF? Upload die hier; hij gaat mee naar de venue naast de rider hierboven.</p>
      <AssetGroups ownerType="artist" ownerId={a.id} assets={a.assets} kinds={tab === 'tech' ? ['tech_rider', 'rider'] : ['hospitality_rider']} onChange={reload} before={before} /></aside>
  </div>;
}

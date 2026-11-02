import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { stamp } from '../lib/format';
import { Empty, ErrorBox, Icon, Loading, Modal, Orb, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from './common';

type Review = { reviewer: string; name: string; production: number | null; composition: number | null; decision: string; release_types: string;
  production_feedback: string; composition_feedback: string; dealbreaker: string; updated: number };
type Track = { id: string; number: number | null; artist: string; title: string; link: string; file_url: string; file_name: string; has_file: boolean;
  scouted_by: string; status: string; release_id: string | null; release: string; options: string[]; contact: string; average: number | null;
  reviews: Record<string, Review>; updated: number; notes?: string; log?: { id: number; kind: string; body: string; author: string; created: number }[] };
export const TRACK_STATUS: Record<string, [string, string]> = {
  new: ['Nieuw', ''], awaiting: ['Wacht op demo/versie', ''], in_review: ['In beoordeling', 'blue'], needs_work: ['Aanpassingen nodig', 'amber'],
  approved: ['Goedgekeurd', 'lime'], signed: ['Getekend', 'purple'], released: ['Uitgebracht', 'purple'], rejected: ['Afgekeurd', 'red'],
};
const DECISION: Record<string, string> = { '': 'Nog geen oordeel', fit: 'Fit for release', needs_work: 'Aanpassingen nodig', not_fit: 'Niet geschikt' };
const mark = (r?: Review) => (r && (r.production != null || r.composition != null) ? [r.production, r.composition].filter((x) => x != null) as number[] : null);
const avg = (xs: number[] | null) => (xs && xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const grade = (v: number | null) => (v == null ? '' : v >= 7.5 ? 'g-high' : v >= 6 ? 'g-mid' : 'g-low');

function useFeedback() {
  return useQuery({ queryKey: ['feedback'], queryFn: () => api<{ tracks: Track[]; reviewers: [string, string][] }>('/feedback/tracks') });
}

export function FeedbackList() {
  const edit = useCanEdit();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const q = useFeedback();
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const [open, setOpen] = useState(false);
  const [prospects, setProspects] = useState(false);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'number', dir: -1 });
  const isProspect = (t: Track) => !t.number && /^tbd$/i.test(t.title.trim());
  const rows = useMemo(() => (q.data?.tracks || []).filter((t) => {
    if (isProspect(t) !== prospects) return false;
    if (status === 'open' && ['rejected', 'released'].includes(t.status)) return false;
    if (status !== 'open' && status !== 'all' && t.status !== status) return false;
    if (mine && user && mark(t.reviews[user.username])) return false;
    const s = search.toLowerCase();
    return !s || [t.artist, t.title, t.scouted_by, ...(t.options || []), t.release].join(' ').toLowerCase().includes(s);
  }), [q.data, status, search, mine, user, prospects]); // eslint-disable-line
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const ORDER = Object.keys(TRACK_STATUS);
  const value = (t: Track): string | number => {
    if (sort.key === 'number') return t.number ?? -1;
    if (sort.key === 'artist') return `${t.artist} ${t.title}`.toLowerCase();
    if (sort.key === 'average') return t.average ?? -1;
    if (sort.key === 'status') return ORDER.indexOf(t.status);
    return avg(mark(t.reviews[sort.key])) ?? -1;
  };
  const sorted = [...rows].sort((a, b) => { const x = value(a), y = value(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  const head = (key: string, label: string, cls = '') => <th className={cls} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
    <button className="th-sort" onClick={() => setSort({ key, dir: sort.key === key ? (sort.dir === 1 ? -1 : 1) : (key === 'artist' || key === 'status' ? 1 : -1) })}>
      {label}{sort.key === key ? <span aria-hidden="true">{sort.dir === 1 ? ' ↑' : ' ↓'}</span> : null}</button></th>;
  const counts: Record<string, number> = {};
  q.data.tracks.filter((t) => isProspect(t) === prospects).forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
  // The list shows the three of us; older reviewers only count in the average.
  const core = q.data.reviewers.filter(([u]) => ['peppy', 'bram', 'shoroy'].includes(u));
  return <>
    <div className="toolbar">
      <div className="search"><Icon name="search" /><input placeholder="Zoek artiest, titel, scout of release" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Zoek track" /></div>
      <label className="inline-check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Nog niet door mij beoordeeld</label>
      <label className="inline-check"><input type="checkbox" checked={prospects} onChange={(e) => { setProspects(e.target.checked); setStatus('all'); }} /> {`Benaderd (nog geen track) · ${(q.data?.tracks || []).filter(isProspect).length}`}</label>
      {edit ? <button className="primary" style={{ marginLeft: 'auto' }} onClick={() => setOpen(true)}><Icon name="plus" /> Track toevoegen</button> : null}
    </div>
    <div className="status-chips">
      {[['open', 'Lopend'], ['all', 'Alles'], ...Object.entries(TRACK_STATUS).map(([k, [l]]) => [k, l])].map(([k, l]) =>
        <button key={k} className={`chip-btn ${status === k ? 'active' : ''} st-${k}`} onClick={() => setStatus(k)}>{l}{counts[k] ? <span>{counts[k]}</span> : null}</button>)}
    </div>
    <section className="card tf-list">{rows.length ? <div className="table-wrap"><table className="tf-table"><thead><tr>
      {head('number', '#', 'tf-num')}{head('artist', 'Track')}{core.map(([u, n]) => <Fragment key={u}>{head(u, n, 'tf-score')}</Fragment>)}
      {head('average', 'Gem.', 'tf-score')}{head('status', 'Status')}<th className="tf-rel">Release</th></tr></thead><tbody>
      {sorted.map((t) => { const [l, c] = TRACK_STATUS[t.status] || [t.status, '']; const go = () => navigate(`/label/feedback/${t.id}`);
        const others = Object.keys(t.reviews).filter((u) => !core.some(([k]) => k === u) && mark(t.reviews[u])).length;
        return <tr key={t.id} className={`clickable st-row-${c || 'none'}`} tabIndex={0} onClick={go} onKeyDown={(k) => k.key === 'Enter' && go()}>
          <td className="tf-num">{t.number ?? ''}</td>
          <td className="tf-track"><span className="tf-artist">{t.artist}</span><span className="tf-title">{t.title}</span>{t.link || t.has_file ? <Icon name="play" /> : null}</td>
          {core.map(([u]) => { const m = avg(mark(t.reviews[u])); return <td key={u} className="tf-score"><span className={`tf-chip ${grade(m) || 'none'}`}>{m == null ? '' : m.toFixed(1)}</span></td>; })}
          <td className="tf-score"><span className={`tf-avg ${grade(t.average)}`} title={others ? `Inclusief ${others} oudere beoordeling(en)` : undefined}>{t.average == null ? '–' : t.average.toFixed(1)}</span></td>
          <td className="tf-status"><i className={`dot dot-${c || 'none'}`} />{l}</td>
          <td className="tf-rel">{t.release || (t.options || []).join(', ')}</td></tr>; })}
    </tbody></table></div> : <Empty title="Geen tracks in deze selectie" sub="Voeg een demo toe of kies een ander filter." icon="music" />}</section>
    <FormDialog id="track-new" title="Track toevoegen" open={open} onClose={() => setOpen(false)} label="Toevoegen" submit={async (form) => {
      const t = await api<Track>('/feedback/tracks', { method: 'POST', body: formValues(form) });
      setOpen(false); toast('Track toegevoegd.'); navigate(`/label/feedback/${t.id}`);
    }}>
      <div className="form-grid">
        <div className="field"><label htmlFor="tn-artist">Artiest</label><input id="tn-artist" name="artist" required /></div>
        <div className="field"><label htmlFor="tn-title">Titel</label><input id="tn-title" name="title" required /></div>
        <div className="field"><label htmlFor="tn-link">Link (SoundCloud, Dropbox …)</label><input id="tn-link" name="link" type="url" placeholder="https://" /></div>
        <div className="field"><label htmlFor="tn-scout">Aangeleverd / gescout door</label><input id="tn-scout" name="scouted_by" placeholder={user?.name} /></div>
      </div>
      <p className="helper">Een audiobestand upload je daarna op de trackpagina; dat komt op OneDrive in 3. Scouting/Demo’s.</p>
    </FormDialog>
  </>;
}

function Player({ t }: { t: Track }) {
  if (t.has_file) return <audio className="track-audio" controls preload="none" src={`/api/feedback/tracks/${t.id}/stream`} />;
  if (/soundcloud\.com/.test(t.link)) return <iframe className="track-embed" title="SoundCloud" allow="autoplay" src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(t.link)}&color=%23ec4860&visual=false`} />;
  if (/dropbox\.com/.test(t.link)) return <audio className="track-audio" controls preload="none" src={t.link.replace(/([?&])dl=0/, '$1raw=1').replace(/\?(?!.*raw=1)/, '?raw=1&')} />;
  if (/open\.spotify\.com\/track\//.test(t.link)) return <iframe className="track-embed short" title="Spotify" src={t.link.replace('open.spotify.com/track/', 'open.spotify.com/embed/track/')} />;
  if (t.link) return <a className="button" href={t.link} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Track openen</a>;
  return <p className="helper">Nog geen link of bestand. Upload een bestand of vul een link in.</p>;
}

function Ring({ value, size = 64, label }: { value: number | null; size?: number; label?: string }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, pct = value == null ? 0 : Math.max(0, Math.min(1, value / 10));
  return <div className={`ring ${grade(value)}`} style={{ width: size, height: size }} aria-label={label ? `${label}: ${value ?? 'geen cijfer'}` : undefined}>
    <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" /><circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} /></svg>
    <span>{value ?? '–'}</span>{label ? <small>{label}</small> : null}
  </div>;
}

function Slider({ name, label, value }: { name: string; label: string; value: number | null }) {
  const [v, setV] = useState<string>(value == null ? '' : Number(value).toFixed(1));
  const n = v === '' ? null : Number(v);
  const nudge = (d: number) => setV(Math.min(10, Math.max(1, Math.round(((n ?? 5.5) + d) * 10) / 10)).toFixed(1));
  return <div className="score-slider">
    <div className="score-top"><label htmlFor={`sl-${name}`}>{label}</label>
      <span className="score-nudge"><button type="button" aria-label={`${label} 0,1 lager`} onClick={() => nudge(-0.1)}>−</button>
        <span className={`score-value ${grade(n)}`}>{n == null ? '–' : n.toFixed(1)}</span>
        <button type="button" aria-label={`${label} 0,1 hoger`} onClick={() => nudge(0.1)}>+</button></span></div>
    <input id={`sl-${name}`} type="range" min="1" max="10" step="0.1" value={v === '' ? 5.5 : v} onChange={(e) => setV(Number(e.target.value).toFixed(1))} className={v === '' ? 'unset' : ''} />
    <input type="hidden" name={name} value={v} />
    <div className="score-scale"><span>1</span><span>5</span><span>10</span>{v !== '' ? <button type="button" className="text-link" onClick={() => setV('')}>wissen</button> : null}</div>
  </div>;
}

const TYPES = ['VA', 'EP', 'Single', 'Remix', 'Album'];

/** One track, fullscreen over the app: listen, grade, read the team's feedback. */
export function FeedbackTrack() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [remove, setRemove] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const [types, setTypes] = useState<string[] | null>(null);
  const list = qc.getQueryData<{ tracks: Track[] }>(['feedback'])?.tracks || [];
  const q = useQuery({ queryKey: ['track', id], queryFn: () => api<Track>(`/feedback/tracks/${id}`) });
  const releases = useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: { id: string; title: string; catalog: string }[] }>('/releases') });
  const close = () => navigate('/label/feedback');
  const idx = list.findIndex((t) => t.id === id);
  const prev = idx > 0 ? list[idx - 1] : null, next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  useEffect(() => {
    setDecision(null); setTypes(null);
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && next) navigate(`/label/feedback/${next.id}`);
      if (e.key === 'ArrowLeft' && prev) navigate(`/label/feedback/${prev.id}`);
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('overlay-open');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('overlay-open'); };
  }, [id, next?.id, prev?.id]); // eslint-disable-line
  const t = q.data;
  const set = (n: Track) => { qc.setQueryData(['track', id], n); qc.invalidateQueries({ queryKey: ['feedback'] }); };
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const b = new FormData(); b.append('file', file);
    setUploading(true);
    try { set(await api(`/feedback/tracks/${id}/file`, { method: 'POST', body: b })); toast('Opgeslagen op OneDrive.'); } catch (err) { toast((err as Error).message, true); } finally { setUploading(false); }
  }
  const my = t && user ? t.reviews[user.username] : undefined;
  const dec = decision ?? my?.decision ?? '';
  const chosenTypes = types ?? (my?.release_types ? my.release_types.split(/[,/]\s*/).filter(Boolean) : []);
  const reviews = t ? Object.values(t.reviews).sort((a, b) => (a.reviewer === user?.username ? -1 : b.reviewer === user?.username ? 1 : a.name.localeCompare(b.name))) : [];
  return <div className="track-overlay" role="dialog" aria-modal="true" aria-label={t ? `${t.artist} – ${t.title}` : 'Track'}>
    <div className="overlay-bar">
      <button className="icon-btn ghost" onClick={close} aria-label="Terug naar de lijst"><Icon name="back" /></button>
      <span className="overlay-crumb">{`Track feedback${idx >= 0 ? ` · ${idx + 1} van ${list.length}` : ''}`}</span>
      <div className="overlay-nav">
        <button className="icon-btn ghost" disabled={!prev} onClick={() => prev && navigate(`/label/feedback/${prev.id}`)} aria-label="Vorige track"><Icon name="back" /></button>
        <button className="icon-btn ghost" disabled={!next} onClick={() => next && navigate(`/label/feedback/${next.id}`)} aria-label="Volgende track"><Icon name="chevron" /></button>
        <button className="icon-btn ghost" onClick={close} aria-label="Sluiten"><Icon name="close" /></button>
      </div>
    </div>
    {!t ? <div className="overlay-body">{q.error ? <ErrorBox error={q.error} /> : <Loading />}</div> : <div className="overlay-body">
      <header className={`track-hero st-${t.status}`}>
        <div className="hero-art">{t.artist.slice(0, 2).toUpperCase()}</div>
        <div className="hero-main">
          <p className="eyebrow">{t.number ? `#${t.number}` : 'Demo'}{t.scouted_by ? ` · aangeleverd door ${t.scouted_by}` : ''}{t.contact ? ` · ${t.contact}` : ''}</p>
          <h1>{t.title}</h1><h2>{t.artist}</h2>
          <div className="hero-meta">
            <select className={`status-select st-${t.status}`} value={t.status} disabled={!edit} aria-label="Status"
              onChange={(e) => run(async () => set(await api(`/feedback/tracks/${id}`, { method: 'PATCH', body: { status: e.target.value } })))}>
              {Object.entries(TRACK_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
            {(t.options || []).map((o) => <span key={o} className="tag">{o}</span>)}{t.release ? <span className="tag tag-strong">Getekend: {t.release}</span> : null}
          </div>
        </div>
        <Ring value={t.average} size={92} label="gemiddeld" />
      </header>
      <section className="player-card">
        <Player t={t} />
        <div className="player-actions">{t.link ? <a className="button ghost small" href={t.link} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Bron</a> : null}
          {t.file_url ? <a className="button ghost small" href={t.file_url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> OneDrive</a> : null}
          {edit ? <label className="button ghost small">{uploading ? <Orb state="weaving" /> : <Icon name="upload" />} Nieuwe versie uploaden<input type="file" accept="audio/*,.wav,.mp3,.flac,.aiff" className="visually-hidden" onChange={upload} /></label> : null}
          {t.file_name ? <small>{t.file_name}</small> : null}</div>
      </section>
      <div className="overlay-grid">
        <form className="glass-card" key={`me-${id}-${my?.updated || 0}`} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const v = formValues(f);
          run(async () => { set(await api(`/feedback/tracks/${id}/review`, { method: 'PUT', body: { ...v, decision: dec, release_types: chosenTypes.join(', ') } })); setDecision(null); setTypes(null); }, 'Je beoordeling is opgeslagen.'); }}>
          <h3>Jouw beoordeling</h3>
          <fieldset disabled={!edit} className="plain-fieldset">
            <div className="slider-row"><Slider name="production" label="Productie" value={my?.production ?? null} /><Slider name="composition" label="Compositie" value={my?.composition ?? null} /></div>
            <div className="decision-row" role="radiogroup" aria-label="Oordeel">{([['fit', 'Fit for release'], ['needs_work', 'Aanpassingen nodig'], ['not_fit', 'Niet geschikt']] as const).map(([k, l]) =>
              <button key={k} type="button" role="radio" aria-checked={dec === k} className={`decision d-${k} ${dec === k ? 'on' : ''}`} onClick={() => setDecision(dec === k ? '' : k)}>{l}</button>)}</div>
            <div className="type-row"><span>Geschikt voor</span>{TYPES.map((x) => <button key={x} type="button" className={`tag-btn ${chosenTypes.includes(x) ? 'on' : ''}`} onClick={() => setTypes(chosenTypes.includes(x) ? chosenTypes.filter((y) => y !== x) : [...chosenTypes, x])}>{x}</button>)}</div>
            <div className="field"><label htmlFor="rv-pf">Productie</label><textarea id="rv-pf" name="production_feedback" rows={3} defaultValue={my?.production_feedback} placeholder="Mix, master, sounddesign…" /></div>
            <div className="field"><label htmlFor="rv-cf">Compositie</label><textarea id="rv-cf" name="composition_feedback" rows={3} defaultValue={my?.composition_feedback} placeholder="Opbouw, drop, variatie…" /></div>
            <div className="field"><label htmlFor="rv-db">Dealbreaker</label><input id="rv-db" name="dealbreaker" defaultValue={my?.dealbreaker} placeholder="Wat moet er echt anders?" /></div>
            <button className="primary wide" type="submit">Beoordeling opslaan</button>
          </fieldset>
        </form>
        <section className="team-col">
          <h3>Team</h3>
          <div className="team-grid">{reviews.length ? reviews.map((r) => <article key={r.reviewer} className={`team-card ${r.reviewer === user?.username ? 'me' : ''}`}>
            <header><strong>{r.name}{r.reviewer === user?.username ? ' (jij)' : ''}</strong>{r.decision ? <span className={`decision-pill d-${r.decision}`}>{DECISION[r.decision]}</span> : null}</header>
            <div className="team-rings"><Ring value={r.production} size={54} label="productie" /><Ring value={r.composition} size={54} label="compositie" /></div>
            {r.production_feedback ? <p><b>Productie</b> {r.production_feedback}</p> : null}
            {r.composition_feedback ? <p><b>Compositie</b> {r.composition_feedback}</p> : null}
            {r.dealbreaker ? <p className="dealbreaker"><b>Dealbreaker</b> {r.dealbreaker}</p> : null}
            {r.release_types ? <small>Geschikt voor: {r.release_types}</small> : null}
          </article>) : <p className="helper">Nog niemand heeft deze track beoordeeld.</p>}</div>
        </section>
      </div>
      <div className="overlay-grid">
        <form className="glass-card" key={`t-${t.updated}`} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const v = formValues(f);
          run(async () => set(await api(`/feedback/tracks/${id}`, { method: 'PATCH', body: { ...v, options: (v.options || '').split(',').map((x) => x.trim()).filter(Boolean) } })), 'Opgeslagen.'); }}>
          <h3>Details</h3>
          <fieldset disabled={!edit} className="plain-fieldset">
            <div className="form-grid">
              <div className="field"><label htmlFor="tk-artist">Artiest</label><input id="tk-artist" name="artist" defaultValue={t.artist} /></div>
              <div className="field"><label htmlFor="tk-title">Titel</label><input id="tk-title" name="title" defaultValue={t.title} /></div>
              <div className="field"><label htmlFor="tk-opt">Mogelijk op (komma’s)</label><input id="tk-opt" name="options" defaultValue={(t.options || []).join(', ')} placeholder="VA4, BTTW" /></div>
              <div className="field"><label htmlFor="tk-rel">Getekend op release</label><select id="tk-rel" name="release_id" defaultValue={t.release_id || ''}><option value="">Nog niet</option>{(releases.data?.releases || []).map((r) => <option key={r.id} value={r.id}>{[r.catalog, r.title].filter(Boolean).join(' – ')}</option>)}</select></div>
              <div className="field"><label htmlFor="tk-scout">Aangeleverd door</label><input id="tk-scout" name="scouted_by" defaultValue={t.scouted_by} /></div>
              <div className="field"><label htmlFor="tk-contact">Contact</label><input id="tk-contact" name="contact" defaultValue={t.contact} placeholder="Mail, DM, agent" /></div>
            </div>
            <div className="field"><label htmlFor="tk-link">Link</label><input id="tk-link" name="link" type="url" defaultValue={t.link} /></div>
            <div className="field"><label htmlFor="tk-notes">Notities</label><textarea id="tk-notes" name="notes" rows={4} defaultValue={t.notes} /></div>
            <button className="primary" type="submit">Opslaan</button>
          </fieldset>
        </form>
        <section className="glass-card"><h3>Logboek</h3>
          {edit ? <form className="inline-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/feedback/tracks/${id}/log`, { method: 'POST', body: formValues(f) })); f.reset(); }); }}>
            <input name="body" placeholder="Opmerking of ‘nieuwe versie ontvangen’" required aria-label="Opmerking" /><button className="primary small" type="submit">Toevoegen</button></form> : null}
          <ul className="voyage-log">{(t.log || []).map((l) => <li key={l.id} className={`log-${l.kind}`}><span className="log-kind">{({ comment: 'Notitie', version: 'Versie', status: 'Status' } as Record<string, string>)[l.kind] || l.kind}</span>
            <div><p>{l.body}</p><small>{l.author} · {stamp(l.created)}</small></div></li>)}</ul>
        </section>
      </div>
      {edit ? <div className="danger-row"><button className="danger big" onClick={() => setRemove(true)}><Icon name="close" /> Track verwijderen</button></div> : null}
      <Modal title="Track verwijderen?" open={remove} onClose={() => setRemove(false)} footer={<>
        <button onClick={() => setRemove(false)}>Annuleren</button>
        <button className="danger" onClick={() => run(async () => { await api(`/feedback/tracks/${id}`, { method: 'DELETE' }); setRemove(false); qc.invalidateQueries({ queryKey: ['feedback'] }); close(); }, 'Track verwijderd.')}>Ja, definitief verwijderen</button></>}>
        <p>{`Weet je het zeker? „${t.artist} – ${t.title}” verdwijnt met alle beoordelingen, feedback en het logboek. Dit kan niet ongedaan worden gemaakt.`}</p>
        <p className="helper">Een audiobestand op OneDrive blijft staan.</p>
      </Modal>
      <p className="helper overlay-hint">Tip: ← en → voor de vorige/volgende track, Esc om terug te gaan.</p>
    </div>}
  </div>;
}

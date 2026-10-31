import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { stamp } from '../lib/format';
import { BackLink, Badge, Empty, ErrorBox, Icon, Loading, Orb, formValues, useAction, useToast } from '../lib/ui';
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
  const rows = useMemo(() => (q.data?.tracks || []).filter((t) => {
    if (status === 'open' && ['rejected', 'released'].includes(t.status)) return false;
    if (status !== 'open' && status !== 'all' && t.status !== status) return false;
    if (mine && user && mark(t.reviews[user.username])) return false;
    const s = search.toLowerCase();
    return !s || [t.artist, t.title, t.scouted_by, ...(t.options || []), t.release].join(' ').toLowerCase().includes(s);
  }), [q.data, status, search, mine, user]);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const counts: Record<string, number> = {};
  q.data.tracks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
  const reviewers = q.data.reviewers;
  return <>
    <div className="toolbar">
      <div className="search"><Icon name="search" /><input placeholder="Zoek artiest, titel, scout of release" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Zoek track" /></div>
      <label className="inline-check"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Nog niet door mij beoordeeld</label>
      {edit ? <button className="primary" style={{ marginLeft: 'auto' }} onClick={() => setOpen(true)}><Icon name="plus" /> Track toevoegen</button> : null}
    </div>
    <div className="status-chips">
      {[['open', 'Lopend'], ['all', 'Alles'], ...Object.entries(TRACK_STATUS).map(([k, [l]]) => [k, l])].map(([k, l]) =>
        <button key={k} className={`chip-btn ${status === k ? 'active' : ''} st-${k}`} onClick={() => setStatus(k)}>{l}{counts[k] ? <span>{counts[k]}</span> : null}</button>)}
    </div>
    <section className="card">{rows.length ? <div className="table-wrap"><table className="feedback-table"><thead><tr><th>#</th><th>Track</th><th>Scout</th>
      {reviewers.map(([u, n]) => <th key={u} className="amount" title={`Productie / compositie van ${n}`}>{n}</th>)}<th className="amount">Gem.</th><th>Release</th><th>Status</th></tr></thead><tbody>
      {rows.map((t) => { const [l, c] = TRACK_STATUS[t.status] || [t.status, '']; const go = () => navigate(`/label/feedback/${t.id}`);
        return <tr key={t.id} className={`clickable row-${t.status}`} tabIndex={0} onClick={go} onKeyDown={(k) => k.key === 'Enter' && go()}>
          <td className="nowrap muted">{t.number ?? ''}</td>
          <td><strong>{t.artist}</strong><small className="block">{t.title}{t.link || t.has_file ? ' · ▶' : ''}</small></td>
          <td>{t.scouted_by || '—'}</td>
          {reviewers.map(([u]) => { const m = avg(mark(t.reviews[u])); return <td key={u} className={`amount grade ${grade(m)}`}>{m ?? '·'}</td>; })}
          <td className={`amount grade strong ${grade(t.average)}`}>{t.average ?? '—'}</td>
          <td>{t.release || (t.options || []).join(', ') || '—'}</td>
          <td><Badge color={c}>{l}</Badge></td></tr>; })}
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

export function FeedbackTrack() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const q = useQuery({ queryKey: ['track', id], queryFn: () => api<Track>(`/feedback/tracks/${id}`) });
  const releases = useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: { id: string; title: string; catalog: string }[] }>('/releases') });
  if (q.isPending) return <Loading />;
  if (q.error) return <><BackLink to="/label/feedback">Track feedback</BackLink><ErrorBox error={q.error} /></>;
  const t = q.data;
  const set = (n: Track) => { qc.setQueryData(['track', id], n); qc.invalidateQueries({ queryKey: ['feedback'] }); };
  const my = user ? t.reviews[user.username] : undefined;
  const others = Object.values(t.reviews).filter((r) => r.reviewer !== user?.username);
  const [label, color] = TRACK_STATUS[t.status] || [t.status, ''];
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const b = new FormData(); b.append('file', file);
    setUploading(true);
    try { set(await api(`/feedback/tracks/${id}/file`, { method: 'POST', body: b })); toast('Opgeslagen op OneDrive.'); } catch (err) { toast((err as Error).message, true); } finally { setUploading(false); }
  }
  return <>
    <BackLink to="/label/feedback">Track feedback</BackLink>
    <div className="track-head">
      <div><p className="eyebrow">{t.number ? `#${t.number} · ` : ''}Track feedback</p><h1>{t.artist} – {t.title}</h1>
        <p className="helper"><Badge color={color}>{label}</Badge> {t.scouted_by ? `· aangeleverd door ${t.scouted_by}` : ''}{t.average != null ? ` · gemiddeld ${t.average}` : ''}</p></div>
      <div className="row-actions">{t.file_url ? <a className="button ghost" href={t.file_url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> OneDrive</a> : null}
        {edit ? <label className="button ghost">{uploading ? <Orb state="weaving" /> : <Icon name="upload" />} Audio uploaden<input type="file" accept="audio/*,.wav,.mp3,.flac,.aiff" className="visually-hidden" onChange={upload} /></label> : null}</div>
    </div>
    <section className="card card-pad"><Player t={t} />{t.file_name ? <p className="helper">{t.file_name}</p> : null}</section>
    <div className="promo-grid section-gap">
      <div>
        <form className="card card-pad" key={`me-${my?.updated || 0}`} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => set(await api(`/feedback/tracks/${id}/review`, { method: 'PUT', body: formValues(f) })), 'Je beoordeling is opgeslagen.'); }}>
          <h2>Jouw beoordeling</h2>
          <fieldset disabled={!edit} className="plain-fieldset">
            <div className="form-grid">
              <div className="field"><label htmlFor="rv-prod">Productie (1–10)</label><input id="rv-prod" name="production" type="number" min="0" max="10" step="0.1" defaultValue={my?.production ?? ''} /></div>
              <div className="field"><label htmlFor="rv-comp">Compositie (1–10)</label><input id="rv-comp" name="composition" type="number" min="0" max="10" step="0.1" defaultValue={my?.composition ?? ''} /></div>
              <div className="field"><label htmlFor="rv-dec">Oordeel</label><select id="rv-dec" name="decision" defaultValue={my?.decision || ''}>{Object.entries(DECISION).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div className="field"><label htmlFor="rv-types">Geschikt voor</label><input id="rv-types" name="release_types" defaultValue={my?.release_types} placeholder="VA, EP, single" /></div>
            </div>
            <div className="field"><label htmlFor="rv-pf">Feedback productie</label><textarea id="rv-pf" name="production_feedback" rows={3} defaultValue={my?.production_feedback} /></div>
            <div className="field"><label htmlFor="rv-cf">Feedback compositie</label><textarea id="rv-cf" name="composition_feedback" rows={3} defaultValue={my?.composition_feedback} /></div>
            <div className="field"><label htmlFor="rv-db">Dealbreaker</label><input id="rv-db" name="dealbreaker" defaultValue={my?.dealbreaker} placeholder="Wat moet er echt anders?" /></div>
            <button className="primary" type="submit">Opslaan</button>
          </fieldset>
        </form>
        <section className="card card-pad section-gap"><h2>Feedback van de anderen</h2>
          {others.length ? others.map((r) => <div key={r.reviewer} className="review-card">
            <div className="review-head"><strong>{r.name}</strong><span className={`grade ${grade(avg(mark(r)))}`}>P {r.production ?? '·'} · C {r.composition ?? '·'}</span>{r.decision ? <Badge>{DECISION[r.decision]}</Badge> : null}</div>
            {r.production_feedback ? <p><b>Productie:</b> {r.production_feedback}</p> : null}
            {r.composition_feedback ? <p><b>Compositie:</b> {r.composition_feedback}</p> : null}
            {r.dealbreaker ? <p><b>Dealbreaker:</b> {r.dealbreaker}</p> : null}
            {r.release_types ? <small>Geschikt voor: {r.release_types}</small> : null}
          </div>) : <p className="helper">Nog niemand anders heeft deze track beoordeeld.</p>}
        </section>
      </div>
      <div>
        <form className="card card-pad" key={`t-${t.updated}`} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const v = formValues(f);
          run(async () => set(await api(`/feedback/tracks/${id}`, { method: 'PATCH', body: { ...v, options: (v.options || '').split(',').map((x) => x.trim()).filter(Boolean) } })), 'Opgeslagen.'); }}>
          <h2>Track</h2>
          <fieldset disabled={!edit} className="plain-fieldset">
            <div className="field"><label htmlFor="tk-status">Status</label><select id="tk-status" name="status" defaultValue={t.status}>{Object.entries(TRACK_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="field"><label htmlFor="tk-opt">Mogelijk op (komma’s)</label><input id="tk-opt" name="options" defaultValue={(t.options || []).join(', ')} placeholder="VA4, BTTW" /></div>
            <div className="field"><label htmlFor="tk-rel">Getekend op release</label><select id="tk-rel" name="release_id" defaultValue={t.release_id || ''}><option value="">Nog niet</option>{(releases.data?.releases || []).map((r) => <option key={r.id} value={r.id}>{[r.catalog, r.title].filter(Boolean).join(' – ')}</option>)}</select></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="tk-artist">Artiest</label><input id="tk-artist" name="artist" defaultValue={t.artist} /></div>
              <div className="field"><label htmlFor="tk-title">Titel</label><input id="tk-title" name="title" defaultValue={t.title} /></div>
            </div>
            <div className="field"><label htmlFor="tk-link">Link</label><input id="tk-link" name="link" type="url" defaultValue={t.link} /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="tk-scout">Aangeleverd door</label><input id="tk-scout" name="scouted_by" defaultValue={t.scouted_by} /></div>
              <div className="field"><label htmlFor="tk-contact">Contact</label><input id="tk-contact" name="contact" defaultValue={t.contact} placeholder="Mail, DM, agent" /></div>
            </div>
            <div className="field"><label htmlFor="tk-notes">Notities</label><textarea id="tk-notes" name="notes" rows={4} defaultValue={t.notes} /></div>
            <button className="primary" type="submit">Opslaan</button>
          </fieldset>
        </form>
        <section className="card card-pad section-gap"><h2>Logboek</h2>
          {edit ? <form className="inline-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/feedback/tracks/${id}/log`, { method: 'POST', body: formValues(f) })); f.reset(); }); }}>
            <input name="body" placeholder="Opmerking of 'nieuwe versie ontvangen'" required aria-label="Opmerking" /><button className="primary small" type="submit">Toevoegen</button></form> : null}
          <ul className="voyage-log">{(t.log || []).map((l) => <li key={l.id} className={`log-${l.kind}`}><span className="log-kind">{({ comment: 'Notitie', version: 'Versie', status: 'Status' } as Record<string, string>)[l.kind] || l.kind}</span>
            <div><p>{l.body}</p><small>{l.author} · {stamp(l.created)}</small></div></li>)}</ul>
        </section>
        {edit ? <p className="helper"><button className="text-link" onClick={() => confirm('Track verwijderen? Feedback gaat ook weg.') && run(async () => { await api(`/feedback/tracks/${id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['feedback'] }); navigate('/label/feedback'); })}>Track verwijderen</button></p> : null}
        <p className="helper"><Link className="text-link" to="/label/feedback">Terug naar alle tracks</Link></p>
      </div>
    </div>
  </>;
}

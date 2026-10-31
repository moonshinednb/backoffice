import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { fullDate, shortDate } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, PageTitle, Tabs, formValues, useAction, useToast } from '../lib/ui';
import { DriveButton, FormDialog, useCanEdit } from './common';
import { TaskDialog } from '../pages/Work';
import { Task, useTasks, useUsers } from '../pages/shared';
import { PromoCampaign, PromoCampaigns, PromoContacts } from './Promo';
import { ContentPlan } from './EventContent';
import { FeedbackList, FeedbackTrack } from './Feedback';

const RELEASE: Record<string, [string, string]> = { planned: ['Gepland', 'amber'], scheduled: ['Ingepland', 'purple'], released: ['Uitgebracht', 'lime'] };
type Step = { id: string; label: string; due: string; done: boolean };
type Release = { id: string; catalog: string; drive_url: string; title: string; artist: string; release_date: string; status: string; labelgrid_release_id: string; notes: string;
  steps: Step[]; steps_done: number; tasks_open: number; tasks: number };
type Statement = { id: string; period: string; invoice_number: string; status: string; total_due_usd: number };
type Tab = 'releases' | 'planning' | 'tasks' | 'artists' | 'statements' | 'promo' | 'promo-campaign' | 'promo-contacts' | 'feedback' | 'feedback-track';

const useReleases = () => useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: Release[]; statements: Statement[] }>('/releases') });

export function Label({ tab }: { tab: Tab }) {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ r: Release | null } | null>(null);
  const q = useReleases();
  const r = dialog?.r;
  const button = edit ? <button className="primary" onClick={() => setDialog({ r: null })}><Icon name="plus" /> Nieuwe release</button> : null;
  return <>
    <PageTitle eyebrow="Productie" title="Label" sub="Releases van het Moonshine-label: planning, taken, artiesten en royalty’s." actions={button} />
    <Tabs items={[{ to: '/label', label: 'Releases' }, { to: '/label/planning', label: 'Planning' }, { to: '/label/tasks', label: 'Taken' },
      { to: '/label/feedback', label: 'Track feedback', end: false }, { to: '/label/promo', label: 'Promo', end: false }, { to: '/label/artists', label: 'Artiesten' }, { to: '/label/statements', label: 'Afrekeningen' }]} />
    {tab === 'feedback' ? <FeedbackList /> : tab === 'feedback-track' ? <><FeedbackList /><FeedbackTrack /></> : tab === 'promo' ? <PromoCampaigns /> : tab === 'promo-campaign' ? <PromoCampaign /> : tab === 'promo-contacts' ? <PromoContacts />
      : q.isPending ? <Loading /> : q.error ? <ErrorBox error={q.error} />
      : tab === 'planning' ? <Planning releases={q.data.releases} />
        : tab === 'tasks' ? <ReleaseTasks releases={q.data.releases} />
          : tab === 'artists' ? <LabelArtists />
            : tab === 'statements' ? <Statements rows={q.data.statements} />
              : <Releases releases={q.data.releases} onEdit={(x) => setDialog({ r: x })} button={button} />}
    <FormDialog id="release-form" title={r ? 'Release bewerken' : 'Nieuwe release'} open={!!dialog} onClose={() => setDialog(null)} label={r ? 'Opslaan' : 'Toevoegen'} submit={async (form) => {
      await api(r ? `/releases/${r.id}` : '/releases', { method: r ? 'PATCH' : 'POST', body: formValues(form) });
      setDialog(null); toast(r ? 'Release bijgewerkt.' : 'Release toegevoegd. De planning staat klaar en de mappen worden op OneDrive aangemaakt.'); qc.invalidateQueries({ queryKey: ['releases'] });
    }}>
      <div key={r?.id || 'new'}>
        <div className="field"><label htmlFor="rl-title">Titel *</label><input id="rl-title" name="title" required defaultValue={r?.title} /></div>
        <div className="field"><label htmlFor="rl-cat">Catalogusnummer</label><input id="rl-cat" name="catalog" defaultValue={r?.catalog} placeholder="Leeg laten: volgende nummer (bijv. MS013)" /></div>
        <div className="form-grid"><div className="field"><label htmlFor="rl-artist">Artiest</label><input id="rl-artist" name="artist" defaultValue={r?.artist} /></div>
          <div className="field"><label htmlFor="rl-date">Releasedatum</label><input id="rl-date" name="release_date" type="date" defaultValue={r?.release_date} /></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="rl-status">Status</label><select id="rl-status" name="status" defaultValue={r?.status || 'planned'}>{Object.entries(RELEASE).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label htmlFor="rl-grid">LabelGrid-ID (optioneel)</label><input id="rl-grid" name="labelgrid_release_id" defaultValue={r?.labelgrid_release_id} /></div></div>
        <div className="field"><label htmlFor="rl-notes">Notities</label><textarea id="rl-notes" name="notes" rows={3} defaultValue={r?.notes} /></div>
        {r ? null : <p className="helper">Met een releasedatum krijgt de planning meteen data: van master en artwork (6 weken vooraf) tot de promo-push na release.</p>}
      </div>
    </FormDialog>
  </>;
}

function Releases({ releases, onEdit, button }: { releases: Release[]; onEdit: (r: Release) => void; button: React.ReactNode }) {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  if (!releases.length) return <section className="card"><Empty title="Nog geen releases" sub="Plan een release met titel, artiest en datum. De planning komt er automatisch bij." action={button} icon="music" /></section>;
  return <section className="card"><div className="table-wrap"><table className="release-table"><thead><tr><th>Cat.</th><th>Datum</th><th>Titel</th><th>Artiest</th><th>Status</th><th>Planning</th><th>Taken</th><th /></tr></thead><tbody>
    {releases.map((x) => { const [l, c] = RELEASE[x.status] || [x.status, '']; return <tr key={x.id}>
      <td className="nowrap">{x.catalog || '—'}</td><td>{shortDate(x.release_date)}</td><td><strong>{x.title}</strong>{x.notes ? <small className="block">{x.notes}</small> : null}</td><td>{x.artist || '—'}</td><td><Badge color={c}>{l}</Badge></td>
      <td>{x.steps.length ? <div className="progress-line"><progress max={x.steps.length} value={x.steps_done} /><span>{x.steps_done}/{x.steps.length}</span></div> : '—'}</td>
      <td className="nowrap">{x.tasks_open ? `${x.tasks_open} open` : x.tasks ? 'Klaar' : '—'}</td>
      <td className="row-tools"><DriveButton kind="release" id={x.id} url={x.drive_url} onDone={() => qc.invalidateQueries({ queryKey: ['releases'] })} />{edit ? <><button className="icon-btn ghost" onClick={() => onEdit(x)} aria-label={`${x.title} bewerken`}><Icon name="edit" /></button>
        <button className="icon-btn ghost" aria-label={`${x.title} verwijderen`} onClick={() => confirm(`Release ${x.title} verwijderen? De planning gaat mee.`) && run(async () => { await api(`/releases/${x.id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['releases'] }); })}><Icon name="trash" /></button></> : null}</td></tr>; })}
  </tbody></table></div></section>;
}

/** Per release a checklist of steps with dates, soonest release first. */
function Planning({ releases }: { releases: Release[] }) {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const [adding, setAdding] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const set = (next: Release) => qc.setQueryData(['releases'], (old: any) => old && { ...old, releases: old.releases.map((r: Release) => r.id === next.id ? next : r) });
  const list = [...releases].filter((r) => r.status !== 'released' || r.steps.some((s) => !s.done)).sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
  if (!list.length) return <section className="card"><Empty title="Niets te plannen" sub="Alle releases zijn uit en afgerond. Maak een nieuwe release aan om te plannen." icon="calendar" /></section>;
  return <div className="planning-grid">{list.map((r) => <section key={r.id} className="card card-pad planning-card">
    <div className="planning-head"><div><h2>{r.title}</h2><p className="helper">{r.artist || 'Artiest nog onbekend'} · {r.release_date ? fullDate(r.release_date) : 'Datum nog onbekend'}</p></div>
      <span className="adv-state">{r.steps_done}/{r.steps.length}</span></div>
    <ul className="step-list">{r.steps.map((s) => {
      const late = !s.done && s.due && s.due < today;
      return <li key={s.id} className={s.done ? 'done' : late ? 'late' : ''}>
        <input type="checkbox" checked={s.done} disabled={!edit} aria-label={s.label} onChange={(e) => run(async () => set(await api(`/release-steps/${s.id}`, { method: 'PATCH', body: { done: e.target.checked } })))} />
        <span className="step-label">{s.label}</span>
        <input type="date" className="step-date" value={s.due} disabled={!edit} aria-label={`Datum ${s.label}`} onChange={(e) => run(async () => set(await api(`/release-steps/${s.id}`, { method: 'PATCH', body: { due: e.target.value } })))} />
        {edit ? <button className="icon-btn ghost tiny" aria-label={`${s.label} verwijderen`} onClick={() => confirm(`Stap ${s.label} verwijderen?`) && run(async () => set(await api(`/release-steps/${s.id}`, { method: 'DELETE' })))}><Icon name="close" /></button> : null}
      </li>;
    })}</ul>
    <details className="optional-block"><summary>Promo en content van deze release</summary><ContentPlan releaseId={r.id} /></details>
    {edit ? (adding === r.id
      ? <form className="inline-form" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { set(await api(`/releases/${r.id}/steps`, { method: 'POST', body: formValues(f) })); setAdding(null); }); }}>
        <input name="label" placeholder="Nieuwe stap, bijv. radio-pitch" required autoFocus /><input name="due" type="date" /><button className="primary small" type="submit">Toevoegen</button></form>
      : <button className="small ghost" onClick={() => setAdding(r.id)}><Icon name="plus" /> Stap toevoegen</button>) : null}
  </section>)}</div>;
}

/** Tasks linked to a release; they also show in the general task list. */
function ReleaseTasks({ releases }: { releases: Release[] }) {
  const tasks = useTasks();
  const users = useUsers();
  const qc = useQueryClient();
  const run = useAction();
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const [preset, setPreset] = useState('');
  const byRelease = new Map(releases.map((r) => [r.id, r]));
  const rows = (tasks.data?.tasks || []).filter((t: Task & { release?: string }) => t.release && byRelease.has(t.release)) as (Task & { release: string })[];
  return <>
    <div className="toolbar"><button className="primary" onClick={() => { setPreset(releases[0]?.id || ''); setTask(null); }} disabled={!releases.length}><Icon name="plus" /> Taak voor een release</button></div>
    {releases.length ? releases.map((r) => {
      const mine = rows.filter((t) => t.release === r.id);
      return <section key={r.id} className="card section-gap"><div className="card-head"><div><h2>{r.title}</h2><p>{r.artist || '—'} · {shortDate(r.release_date)}</p></div>
        <button className="text-link" onClick={() => { setPreset(r.id); setTask(null); }}>Taak toevoegen</button></div>
        {mine.length ? mine.map((t) => <div key={t.id} className={`task-row ${t.done ? 'done' : ''}`}>
          <input type="checkbox" checked={t.done} aria-label={`${t.title} afronden`} onChange={(e) => run(async () => { await api(`/tasks/${t.id}`, { method: 'PATCH', body: { done: e.target.checked } }); qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['releases'] }); })} />
          <div><strong>{t.title}</strong><small>{t.due ? shortDate(t.due) : 'Geen deadline'}{t.assignee ? ' · ' + (users.data?.users.find((u) => u.id === t.assignee)?.name || '') : ''}</small></div>
          <button className="icon-btn ghost task-edit" onClick={() => { setPreset(r.id); setTask(t); }} aria-label={`${t.title} bewerken`}><Icon name="edit" /></button>
        </div>) : <p className="helper card-pad-x">Nog geen taken voor deze release.</p>}
      </section>;
    }) : <section className="card"><Empty title="Nog geen releases" sub="Maak eerst een release aan." icon="music" /></section>}
    <TaskDialog task={task} release={preset} releases={releases.map((r) => ({ id: r.id, title: r.title }))} onClose={() => { setTask(undefined); qc.invalidateQueries({ queryKey: ['releases'] }); }} />
  </>;
}

function LabelArtists() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['label-artists'], queryFn: () => api<{ artists: { id: string; name: string; on_label: boolean; releases: number; agency: string }[] }>('/label/artists') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  return <section className="card">{q.data.artists.length ? <div className="table-wrap"><table><thead><tr><th>Artiest</th><th>Agency</th><th>Releases</th><th /></tr></thead><tbody>
    {q.data.artists.map((a) => <tr key={a.id} className="clickable" tabIndex={0} onClick={() => navigate(`/artists/${a.id}`)} onKeyDown={(k) => k.key === 'Enter' && navigate(`/artists/${a.id}`)}>
      <td><strong>{a.name}</strong>{a.on_label ? null : <small className="block">Staat op een release, nog niet gemarkeerd als label-artiest</small>}</td><td>{a.agency || '—'}</td><td>{a.releases}</td><td><Icon name="chevron" /></td></tr>)}
  </tbody></table></div> : <Empty title="Nog geen label-artiesten" sub={<>Zet bij een artiest het vinkje ‘Artiest van het Moonshine-label’, of koppel de artiestennaam aan een release. <Link className="text-link" to="/events/artiesten">Naar artiesten</Link></>} icon="user" />}</section>;
}

function Statements({ rows }: { rows: Statement[] }) {
  return <section className="card"><div className="card-head"><div><h2>LabelGrid-afrekeningen</h2><p>Alleen-lezen overzicht. Ophalen gaat via de LabelGrid-koppeling.</p></div></div>
    {rows.length ? <div className="table-wrap"><table><thead><tr><th>Periode</th><th>Factuur</th><th>Status</th><th className="amount">Te ontvangen (USD)</th></tr></thead><tbody>
      {rows.map((s) => <tr key={s.id}><td>{s.period}</td><td>{s.invoice_number}</td><td>{s.status}</td><td className="amount">{Number(s.total_due_usd || 0).toFixed(2)}</td></tr>)}
    </tbody></table></div> : <p className="helper card-pad-x">Nog geen afrekeningen opgehaald.</p>}</section>;
}

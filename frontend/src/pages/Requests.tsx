import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { stamp } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, PageTitle, useAction } from '../lib/ui';
import { KINDS, PRIORITIES } from '../shell/FeatureRequest';

export type FeatureRequest = { id: string; author: string; author_name: string; area: string; sub: string; feature: string; kind: string; title: string;
  current: string; wanted: string; why: string; priority: string; page: string; has_screenshot: boolean; status: string; admin_note: string; created: number; updated: number };
const STATUS: [string, string, string][] = [['new', 'Nieuw', 'red'], ['planned', 'Ingepland', 'blue'], ['in_progress', 'Mee bezig', 'amber'], ['done', 'Klaar', 'lime'], ['declined', 'Niet nu', '']];
const KIND_COLOR: Record<string, string> = { new: 'purple', change: 'blue', different: 'amber', bug: 'red', idea: '' };
const PRIO_COLOR: Record<string, string> = { low: '', normal: '', high: 'amber', blocking: 'red' };

export const useFeatureRequests = () => useQuery({ queryKey: ['feature-requests'], queryFn: () => api<{ requests: FeatureRequest[]; new: number }>('/feature-requests'), refetchInterval: 60000 });

/** Admin inbox: every feature request from the team, newest first. */
export function RequestsPage() {
  const qc = useQueryClient();
  const run = useAction();
  const q = useFeatureRequests();
  const [filter, setFilter] = useState('open');
  const [open, setOpen] = useState<string | null>(null);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const all = q.data.requests;
  const rows = all.filter((r) => filter === 'all' || (filter === 'open' ? !['done', 'declined'].includes(r.status) : r.status === filter));
  const patch = (r: FeatureRequest, body: object) => run(async () => { await api(`/feature-requests/${r.id}`, { method: 'PATCH', body }); qc.invalidateQueries({ queryKey: ['feature-requests'] }); });
  return <>
    <PageTitle title="Feature requests" />
    <div className="status-chips">{[['open', 'Open'], ['all', 'Alles'], ...STATUS.map(([k, l]) => [k, l])].map(([k, l]) =>
      <button key={k} className={`chip-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}<span>{all.filter((r) => k === 'all' || (k === 'open' ? !['done', 'declined'].includes(r.status) : r.status === k)).length}</span></button>)}</div>
    {rows.length ? <div className="fr-list">{rows.map((r) => {
      const st = STATUS.find(([k]) => k === r.status) || STATUS[0];
      const expanded = open === r.id;
      return <section key={r.id} className={`card fr-card ${r.status === 'new' ? 'unread' : ''}`}>
        <button className="fr-head" onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded}>
          <span className="fr-where">{r.area}{r.sub ? <> <Icon name="chevron" /> {r.sub}</> : null}</span>
          <strong>{r.title}</strong>
          <span className="fr-meta"><Badge color={KIND_COLOR[r.kind]}>{KINDS.find(([k]) => k === r.kind)?.[1] || r.kind}</Badge>
            {r.priority !== 'normal' ? <Badge color={PRIO_COLOR[r.priority]}>{PRIORITIES.find(([k]) => k === r.priority)?.[1]}</Badge> : null}
            <Badge color={st[2]}>{st[1]}</Badge><small>{`${r.author_name} · ${stamp(r.created)}`}</small></span>
        </button>
        {expanded ? <div className="fr-body">
          {r.feature ? <p><span className="fr-label">Knop / functie</span>{r.feature}</p> : null}
          <div className="fr-cols">
            {r.current ? <div><span className="fr-label">Nu</span><p className="pre">{r.current}</p></div> : null}
            {r.wanted ? <div><span className="fr-label">Gewenst</span><p className="pre">{r.wanted}</p></div> : null}
          </div>
          {r.why ? <p><span className="fr-label">Waarom</span>{r.why}</p> : null}
          {r.has_screenshot ? <a href={`/api/feature-requests/${r.id}/screenshot`} target="_blank" rel="noopener noreferrer"><img className="fr-shot" src={`/api/feature-requests/${r.id}/screenshot`} alt="Screenshot" /></a> : null}
          <p className="helper">{`Pagina: ${r.page || 'onbekend'}`}</p>
          <div className="fr-admin">
            <select value={r.status} onChange={(e) => patch(r, { status: e.target.value })} aria-label="Status">{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <input defaultValue={r.admin_note} placeholder="Notitie voor jezelf of de aanvrager" aria-label="Notitie"
              onBlur={(e) => { if (e.currentTarget.value !== r.admin_note) patch(r, { admin_note: e.currentTarget.value }); }} />
          </div>
        </div> : null}
      </section>;
    })}</div> : <section className="card"><Empty title="Geen verzoeken" sub="Het team stuurt ze via ‘Feature request’ linksonder in het menu." icon="chat" /></section>}
  </>;
}

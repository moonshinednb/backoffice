import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { shortDate } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from './common';

const RELEASE: Record<string, [string, string]> = { planned: ['Gepland', 'amber'], scheduled: ['Ingepland', 'purple'], released: ['Uitgebracht', 'lime'] };
type Release = { id: string; title: string; artist: string; release_date: string; status: string; labelgrid_release_id: string; notes: string };
type Statement = { id: string; period: string; invoice_number: string; status: string; total_due_usd: number };

export function Label() {
  const edit = useCanEdit();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ r: Release | null } | null>(null);
  const q = useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: Release[]; statements: Statement[] }>('/releases') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const reload = () => qc.invalidateQueries({ queryKey: ['releases'] });
  const r = dialog?.r;
  const button = edit ? <button className="primary" onClick={() => setDialog({ r: null })}><Icon name="plus" /> Nieuwe release</button> : null;
  return <>
    <PageTitle eyebrow="Productie" title="Label" sub="Releases van het Moonshine-label. Royalty-afrekeningen komen uit LabelGrid zodra die koppeling aan staat." actions={button} />
    <section className="card"><div className="card-head"><div><h2>Releases</h2></div></div>
      {q.data.releases.length ? <div className="table-wrap"><table className="release-table"><thead><tr><th>Datum</th><th>Titel</th><th>Artiest</th><th>Status</th><th /></tr></thead><tbody>
        {q.data.releases.map((x) => { const [l, c] = RELEASE[x.status] || [x.status, '']; return <tr key={x.id}>
          <td>{shortDate(x.release_date)}</td><td><strong>{x.title}</strong>{x.notes ? <small className="block">{x.notes}</small> : null}</td><td>{x.artist || '—'}</td><td><Badge color={c}>{l}</Badge></td>
          <td className="row-tools">{edit ? <><button className="icon-btn ghost" onClick={() => setDialog({ r: x })} aria-label={`${x.title} bewerken`}><Icon name="edit" /></button>
            <button className="icon-btn ghost" aria-label={`${x.title} verwijderen`} onClick={() => confirm(`Release ${x.title} verwijderen?`) && run(async () => { await api(`/releases/${x.id}`, { method: 'DELETE' }); reload(); })}><Icon name="trash" /></button></> : null}</td></tr>; })}
      </tbody></table></div> : <Empty title="Nog geen releases" sub="Plan een release met titel, artiest en datum." action={button} icon="music" />}</section>
    <section className="card section-gap"><div className="card-head"><div><h2>LabelGrid-afrekeningen</h2><p>Alleen-lezen overzicht. Ophalen gaat via Koppelingen.</p></div></div>
      {q.data.statements.length ? <div className="table-wrap"><table><thead><tr><th>Periode</th><th>Factuur</th><th>Status</th><th className="amount">Te ontvangen (USD)</th></tr></thead><tbody>
        {q.data.statements.map((s) => <tr key={s.id}><td>{s.period}</td><td>{s.invoice_number}</td><td>{s.status}</td><td className="amount">{Number(s.total_due_usd || 0).toFixed(2)}</td></tr>)}
      </tbody></table></div> : <p className="helper card-pad-x">Nog geen afrekeningen opgehaald.</p>}</section>
    <FormDialog id="release-form" title={r ? 'Release bewerken' : 'Nieuwe release'} open={!!dialog} onClose={() => setDialog(null)} label={r ? 'Opslaan' : 'Toevoegen'} submit={async (form) => {
      await api(r ? `/releases/${r.id}` : '/releases', { method: r ? 'PATCH' : 'POST', body: formValues(form) });
      setDialog(null); toast(r ? 'Release bijgewerkt.' : 'Release toegevoegd.'); reload();
    }}>
      <div key={r?.id || 'new'}>
        <div className="field"><label htmlFor="rl-title">Titel *</label><input id="rl-title" name="title" required defaultValue={r?.title} /></div>
        <div className="form-grid"><div className="field"><label htmlFor="rl-artist">Artiest</label><input id="rl-artist" name="artist" defaultValue={r?.artist} /></div>
          <div className="field"><label htmlFor="rl-date">Releasedatum</label><input id="rl-date" name="release_date" type="date" defaultValue={r?.release_date} /></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="rl-status">Status</label><select id="rl-status" name="status" defaultValue={r?.status || 'planned'}>{Object.entries(RELEASE).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label htmlFor="rl-grid">LabelGrid-ID (optioneel)</label><input id="rl-grid" name="labelgrid_release_id" defaultValue={r?.labelgrid_release_id} /></div></div>
        <div className="field"><label htmlFor="rl-notes">Notities</label><textarea id="rl-notes" name="notes" rows={3} defaultValue={r?.notes} /></div>
      </div>
    </FormDialog>
  </>;
}

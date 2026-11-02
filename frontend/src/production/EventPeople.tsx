import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, download } from '../lib/api';
import { Empty, ErrorBox, Icon, Loading, formValues, useAction, useToast } from '../lib/ui';
import { useCanEdit } from './common';

type Crew = { id: string; name: string; role: string; act: string; cars: number };
type Guest = { id: string; name: string; plus: number; relation: string; added_by: string };
type People = { crew: Crew[]; guests: Guest[]; file_url: string; file_name: string; totals: { crew: number; cars: number; guests: number; people: number } };

const usePeople = (eventId: string) => useQuery({ queryKey: ['event-people', eventId], queryFn: () => api<People>(`/events/${eventId}/people`) });

/** An input that saves when you leave it, only if the value changed. */
function Cell({ value, save, type = 'text', edit, ...rest }: { value: string | number; save: (v: string) => void; type?: string; edit: boolean } & Record<string, unknown>) {
  return <input className="cell" type={type} defaultValue={value} disabled={!edit} {...rest}
    onBlur={(e) => { if (e.currentTarget.value !== String(value)) save(e.currentTarget.value); }}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function Bar({ eventId, p, kind, reload }: { eventId: string; p: People; kind: 'crew' | 'guests'; reload: (d?: People) => void }) {
  const run = useAction();
  const toast = useToast();
  const edit = useCanEdit();
  const empty = !p.crew.length && !p.guests.length;
  const t = p.totals;
  return <div className="people-bar">
    <div className="people-totals">{kind === 'crew'
      ? <><strong>{`${t.crew} crew`}</strong><span>{`${t.cars} auto’s (parkeren)`}</span><span>backstage-bandje</span></>
      : <><strong>{`${t.guests} gasten`}</strong><span>{`${t.people} personen incl. +1s`}</span><span>frontstage</span></>}</div>
    <div className="people-actions">
      {edit && kind === 'crew' ? <button className="ghost small" onClick={() => run(async () => { const r = await api<People & { copied: number; origin: string }>(`/events/${eventId}/crew/copy`, { method: 'POST' }); reload(r); toast(r.copied ? `${r.copied} crewleden overgenomen van ${r.origin}.` : 'Iedereen staat er al op.'); })}><Icon name="users" /> Core crew overnemen</button> : null}
      {edit && kind === 'crew' ? <button className="ghost small" onClick={() => run(async () => { const r = await api<People & { added: number }>(`/events/${eventId}/crew/lineup`, { method: 'POST' }); reload(r); toast(r.added ? `${r.added} artiesten op de crewlist gezet.` : 'De hele line-up staat er al op.'); })}><Icon name="music" /> Line-up erop zetten</button> : null}
      {edit && empty ? <button className="ghost small" onClick={() => run(async () => { const r = await api<People & { imported: { crew: number; guests: number; file: string } }>(`/events/${eventId}/people/import`, { method: 'POST' }); reload(r); toast(`${r.imported.crew} crew en ${r.imported.guests} gasten uit ${r.imported.file}.`); })}><Icon name="download" /> Uit OneDrive-Excel halen</button> : null}
      <button className="ghost small" onClick={() => run(() => download(`/events/${eventId}/people.xlsx`))}><Icon name="file" /> Excel</button>
      {p.file_url ? <a className="button ghost small" href={p.file_url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> OneDrive</a> : null}
    </div>
  </div>;
}

/** Crew list (backstage entrance): name, role, act, cars. */
export function CrewList({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const run = useAction();
  const edit = useCanEdit();
  const q = usePeople(eventId);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const p = q.data;
  const reload = (d?: People) => d ? qc.setQueryData(['event-people', eventId], d) : qc.invalidateQueries({ queryKey: ['event-people', eventId] });
  const patch = (c: Crew, body: object) => run(async () => { await api(`/crew/${c.id}`, { method: 'PATCH', body }); reload(); });
  return <section className="card people">
    <Bar eventId={eventId} p={p} kind="crew" reload={reload} />
    <div className="table-wrap"><table className="people-table">
      <thead><tr><th className="num">#</th><th>Naam</th><th>Rol</th><th>Act</th><th className="num">Auto’s</th><th aria-label="Verwijderen" /></tr></thead>
      <tbody>{p.crew.map((c, i) => <tr key={c.id}>
        <td className="num">{i + 1}</td>
        <td><Cell edit={edit} value={c.name} save={(v) => patch(c, { name: v })} aria-label="Naam" /></td>
        <td><Cell edit={edit} value={c.role} save={(v) => patch(c, { role: v })} aria-label="Rol" placeholder="CORE CREW" /></td>
        <td><Cell edit={edit} value={c.act} save={(v) => patch(c, { act: v })} aria-label="Act" /></td>
        <td className="num"><Cell edit={edit} value={c.cars || ''} type="number" min={0} max={20} save={(v) => patch(c, { cars: Number(v || 0) })} aria-label="Auto’s" /></td>
        <td>{edit ? <button className="icon-btn ghost tiny" aria-label={`${c.name} verwijderen`} onClick={() => run(async () => { await api(`/crew/${c.id}`, { method: 'DELETE' }); reload(); })}><Icon name="close" /></button> : null}</td>
      </tr>)}</tbody>
    </table></div>
    {!p.crew.length ? <Empty title="Nog geen crew" sub="Neem de core crew over van het vorige event, of voeg mensen toe." icon="users" /> : null}
    {edit ? <form className="people-add crew" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; run(async () => { await api(`/events/${eventId}/crew`, { method: 'POST', body: formValues(f) }); f.reset(); (f.elements.namedItem('name') as HTMLInputElement).focus(); reload(); }); }}>
      <input name="name" required placeholder="Naam" aria-label="Naam" /><input name="role" placeholder="Rol" aria-label="Rol" /><input name="act" placeholder="Act" aria-label="Act" />
      <input name="cars" type="number" min={0} max={20} placeholder="Auto’s" aria-label="Auto’s" /><button className="primary small" type="submit"><Icon name="plus" /> Toevoegen</button>
    </form> : null}
  </section>;
}

/** Guest list (frontstage entrance, never backstage): name, +1s, relation. */
export function GuestList({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const run = useAction();
  const edit = useCanEdit();
  const [find, setFind] = useState('');
  const q = usePeople(eventId);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const p = q.data;
  const reload = (d?: People) => d ? qc.setQueryData(['event-people', eventId], d) : qc.invalidateQueries({ queryKey: ['event-people', eventId] });
  const patch = (g: Guest, body: object) => run(async () => { await api(`/guests/${g.id}`, { method: 'PATCH', body }); reload(); });
  const needle = find.trim().toLowerCase();
  const rows = needle ? p.guests.filter((g) => `${g.name} ${g.relation}`.toLowerCase().includes(needle)) : p.guests;
  return <section className="card people">
    <Bar eventId={eventId} p={p} kind="guests" reload={reload} />
    {p.guests.length > 8 ? <div className="people-find"><Icon name="search" /><input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Zoek een naam of relatie" aria-label="Zoeken" /></div> : null}
    <div className="table-wrap"><table className="people-table">
      <thead><tr><th className="num">#</th><th>Naam</th><th className="num">+1s</th><th>Relatie</th><th>Gezet door</th><th aria-label="Verwijderen" /></tr></thead>
      <tbody>{rows.map((g) => <tr key={g.id}>
        <td className="num">{p.guests.indexOf(g) + 1}</td>
        <td><Cell edit={edit} value={g.name} save={(v) => patch(g, { name: v })} aria-label="Naam" /></td>
        <td className="num"><select className="cell" value={g.plus} disabled={!edit} aria-label="+1s" onChange={(e) => patch(g, { plus: Number(e.target.value) })}>
          {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n ? `+${n}` : '—'}</option>)}</select></td>
        <td><Cell edit={edit} value={g.relation} save={(v) => patch(g, { relation: v })} aria-label="Relatie" placeholder="+1 MS CREW, DJ…" /></td>
        <td className="muted-cell">{g.added_by}</td>
        <td>{edit ? <button className="icon-btn ghost tiny" aria-label={`${g.name} verwijderen`} onClick={() => run(async () => { await api(`/guests/${g.id}`, { method: 'DELETE' }); reload(); })}><Icon name="close" /></button> : null}</td>
      </tr>)}</tbody>
    </table></div>
    {!p.guests.length ? <Empty title="Nog geen gasten" sub="Iedereen uit het team kan gasten toevoegen; je ziet wie wie heeft gezet." icon="users" /> : null}
    {edit ? <form className="people-add guests" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const v = formValues(f); run(async () => { await api(`/events/${eventId}/guests`, { method: 'POST', body: { ...v, plus: Number(v.plus || 0) } }); f.reset(); (f.elements.namedItem('name') as HTMLInputElement).focus(); reload(); }); }}>
      <input name="name" required placeholder="Naam" aria-label="Naam" />
      <select name="plus" aria-label="+1s" defaultValue="0">{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n ? `+${n}` : 'Geen +1'}</option>)}</select>
      <input name="relation" placeholder="Relatie" aria-label="Relatie" /><button className="primary small" type="submit"><Icon name="plus" /> Toevoegen</button>
    </form> : null}
  </section>;
}

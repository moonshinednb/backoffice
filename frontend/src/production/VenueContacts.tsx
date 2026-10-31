import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { Icon, useAction } from '../lib/ui';
import { useCanEdit } from './common';

export type Contact = { id: string; role: string; name: string; email: string; phone: string; note: string; advancing: boolean };
const ROLES = ['Productie', 'Contactpersoon', 'Programmeur / booker', 'Techniek', 'Bar', 'Security', 'Hospitality', 'Eigenaar', 'Finance', 'Anders'];

function Row({ c, onChange }: { c: Contact; onChange: () => void }) {
  const run = useAction();
  const edit = useCanEdit();
  const [note, setNote] = useState(!!c.note);
  const patch = (body: object) => run(async () => { await api(`/venue-contacts/${c.id}`, { method: 'PATCH', body }); onChange(); });
  const cell = (key: keyof Contact, label: string, type = 'text') => <input className="cell" type={type} defaultValue={String(c[key] ?? '')} placeholder={label} aria-label={label} disabled={!edit}
    onBlur={(e) => { if (e.currentTarget.value !== String(c[key] ?? '')) patch({ [key]: e.currentTarget.value }); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
  return <li className="vc-row">
    <div className="vc-main">
      <input className="cell vc-role" list="vc-roles" defaultValue={c.role} placeholder="Rol" aria-label="Rol" disabled={!edit}
        onBlur={(e) => { if (e.currentTarget.value !== c.role) patch({ role: e.currentTarget.value }); }} />
      {cell('name', 'Naam')}{cell('email', 'E-mail', 'email')}{cell('phone', 'Telefoon', 'tel')}
      <label className="vc-adv" title="Krijgt de advancingmail"><input type="checkbox" checked={c.advancing} disabled={!edit} onChange={(e) => patch({ advancing: e.target.checked })} /> Advancing</label>
      <button className={`icon-btn ghost tiny vc-note-btn ${c.note ? 'has' : ''}`} aria-expanded={note} aria-label="Opmerking" title={c.note || 'Opmerking toevoegen'} onClick={() => setNote(!note)}><Icon name="chat" /></button>
      {edit ? <button className="icon-btn ghost tiny" aria-label={`${c.name || c.email} verwijderen`} onClick={() => { if (confirm(`${c.name || c.email || 'Dit contact'} verwijderen?`)) run(async () => { await api(`/venue-contacts/${c.id}`, { method: 'DELETE' }); onChange(); }); }}><Icon name="close" /></button> : null}
    </div>
    {note ? <textarea className="vc-note" defaultValue={c.note} placeholder="Opmerking, bijv. ‘alleen bereikbaar tot 17:00’ of ‘regelt de bar-afrekening’" disabled={!edit} autoFocus={!c.note}
      onFocus={(e) => { e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
      onBlur={(e) => { if (e.currentTarget.value !== c.note) patch({ note: e.currentTarget.value }); }} /> : null}
  </li>;
}

/** The people at the venue: role, name, e-mail, phone, a note; ticked ones get the advancing mail. */
export function VenueContacts({ eventId, contacts }: { eventId: string; contacts: Contact[] }) {
  const qc = useQueryClient();
  const run = useAction();
  const edit = useCanEdit();
  const reload = () => { qc.invalidateQueries({ queryKey: ['event', eventId] }); qc.invalidateQueries({ queryKey: ['events'] }); };
  return <section className="card card-pad section-gap venue-contacts">
    <div className="vc-head"><h2>Contactpersonen bij de venue</h2><small>Wie “Advancing” aan heeft, krijgt de advancingmail.</small></div>
    <datalist id="vc-roles">{ROLES.map((r) => <option key={r} value={r} />)}</datalist>
    {contacts.length ? <ul className="vc-list">{contacts.map((c) => <Row key={c.id} c={c} onChange={reload} />)}</ul> : <p className="helper">Nog niemand. Voeg de productieleider van de venue toe; die krijgt de advancing.</p>}
    {edit ? <button className="ghost small" onClick={() => run(async () => { await api(`/events/${eventId}/contacts`, { method: 'POST', body: { role: contacts.length ? '' : 'Productie', name: 'Nieuw contact' } }); reload(); })}><Icon name="plus" /> Persoon toevoegen</button> : null}
  </section>;
}

/** Compact list for the advancing page. */
export function VenueContactLines({ contacts }: { contacts: Contact[] }) {
  return <ul className="vc-lines">{contacts.map((c) => <li key={c.id}>
    <strong>{c.name || c.email}</strong>{c.role ? <small>{c.role}</small> : null}
    <span>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}{c.phone ? <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> : null}</span>
    {c.note ? <em>{c.note}</em> : null}{c.advancing && c.email ? <i className="vc-tag">advancing</i> : null}
  </li>)}</ul>;
}

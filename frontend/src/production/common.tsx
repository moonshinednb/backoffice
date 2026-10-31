/* Shared pieces for the production pages: labels, form fields, files and
   the unsaved-changes guard. */
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';
import { api } from '../lib/api';
import { can, useAuth } from '../lib/auth';
import { size } from '../lib/format';
import { Badge, Icon, Modal, Orb, formValues, useToast } from '../lib/ui';

export const KIND: Record<string, string> = {
  tech_rider: 'Technical rider', hospitality_rider: 'Hospitality rider', rider: 'Rider', epk: 'EPK', logo: 'Logo’s',
  press_photo: 'Persfoto’s', press_video: 'Persvideo’s', bio: 'Bio / promotekst', visual: 'Visuals', invoice: 'Facturen',
  contract: 'Contracten', stage_plot: 'Stage plot', guestlist: 'Gastenlijst', production: 'Productieplanning', other: 'Overig',
};
export const STATUS: Record<string, [string, string]> = { planning: ['In planning', 'amber'], confirmed: ['Bevestigd', 'lime'], live: ['Live', 'purple'], done: ['Afgelopen', 'blue'], cancelled: ['Geannuleerd', ''] };
export const BOOKED_BY: [string, string][] = [['', 'Nog onbekend'], ['artist', 'Artiest'], ['agency', 'Agency'], ['venue', 'Venue'], ['moonshine', 'Moonshine']];
export const YES_NO: [string, string][] = [['', 'Nog onbekend'], ['yes', 'Ja'], ['no', 'Nee']];

export function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return <span className="status-orb"><Orb state="listening" tone="accent" label="Live" /><Badge color="purple">Live</Badge></span>;
  const [label, color] = STATUS[status] || [status || 'Onbekend', ''];
  return <Badge color={color}>{label}</Badge>;
}

export function useCanEdit() {
  return can.write(useAuth().user);
}

type FieldProps = { name: string; label: ReactNode; value?: string | number | null; type?: string; wide?: boolean } & Record<string, any>;

export function Field({ name, label, value, type = 'text', ...rest }: FieldProps) {
  const edit = useCanEdit();
  return <div className="kv-field"><label htmlFor={`f-${name}`}>{label}</label><input id={`f-${name}`} name={name} type={type} defaultValue={value ?? ''} disabled={!edit} {...rest} /></div>;
}

export function Select({ name, label, value, options, ...rest }: { name: string; label: ReactNode; value?: string; options: [string, string][] } & Record<string, any>) {
  const edit = useCanEdit();
  return <div className="kv-field"><label htmlFor={`f-${name}`}>{label}</label><select id={`f-${name}`} name={name} defaultValue={value || ''} disabled={!edit} {...rest}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
}

export function Area({ name, label, value, rows = 3, ...rest }: { name: string; label: ReactNode; value?: string; rows?: number } & Record<string, any>) {
  const edit = useCanEdit();
  return <div className="kv-field wide"><label htmlFor={`f-${name}`}>{label}</label><textarea id={`f-${name}`} name={name} rows={rows} defaultValue={value || ''} disabled={!edit} {...rest} /></div>;
}

/** Track unsaved edits in a form and ask before leaving the page. */
export function useDirty() {
  const [dirty, setState] = useState(false);
  const ref = useRef(false);
  const setDirty = (value: boolean) => { ref.current = value; setState(value); };
  const blocker = useBlocker(({ currentLocation, nextLocation }) => ref.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch verlaten?')) { ref.current = false; blocker.proceed(); }
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return { dirty, setDirty, track: { onInput: () => setDirty(true), onChange: () => setDirty(true) }, isDirty: () => ref.current };
}

/** Sticky save button for phones, where the title actions scroll away. */
export function SaveBar({ form }: { form: string }) {
  return useCanEdit() ? <div className="save-bar"><button className="primary" type="submit" form={form}>Opslaan</button></div> : null;
}

export type Asset = { id: string; kind: string; name: string; size: number; has_file: boolean; url: string; sync_status: string; onedrive_url: string; error: string };

function AssetRow({ a, onChange }: { a: Asset; onChange: () => void }) {
  const edit = useCanEdit();
  const toast = useToast();
  async function sync() {
    try { await api(`/assets/${a.id}/sync`, { method: 'POST' }); toast('Opgeslagen in OneDrive.'); } catch (e) { toast((e as Error).message, true); }
    onChange();
  }
  async function remove() {
    if (!confirm('Dit bestand verwijderen? Een kopie in OneDrive blijft bewaard.')) return;
    try { await api(`/assets/${a.id}`, { method: 'DELETE' }); toast('Verwijderd.'); onChange(); } catch (e) { toast((e as Error).message, true); }
  }
  const sync_ = !a.has_file ? <span className="sync link" title="Externe link"><Icon name="link" /></span>
    : a.sync_status === 'synced' ? <a className="sync ok" href={a.onedrive_url} target="_blank" rel="noopener noreferrer" title="Opgeslagen in OneDrive"><Icon name="cloud" /></a>
      : a.sync_status === 'error' ? <button type="button" className="sync err" onClick={sync} title={`OneDrive: ${a.error || 'mislukt'}. Klik om opnieuw te proberen.`}><Icon name="warn" /></button>
        : <span className="sync pending" title="Lokaal opgeslagen. Wordt naar OneDrive gekopieerd zodra die koppeling aan staat."><Icon name="cloud" /></span>;
  return (
    <li>
      <a className="asset-name" href={a.has_file ? `/api/assets/${a.id}/file` : a.url} {...(a.has_file ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}><Icon name={a.has_file ? 'file' : 'link'} /><span>{a.name}</span></a>
      <small>{a.has_file ? size(a.size) : ''}</small>{sync_}
      {edit ? <button type="button" className="icon-btn ghost tiny" onClick={remove} aria-label={`${a.name} verwijderen`}><Icon name="close" /></button> : null}
    </li>
  );
}

/** Files grouped by kind, with upload and link buttons. `before` runs first
    (autosave of the surrounding form). */
export function AssetGroups({ ownerType, ownerId, assets, kinds, onChange, before }: { ownerType: string; ownerId: string; assets: Asset[]; kinds: string[]; onChange: () => void; before?: () => Promise<void> }) {
  const edit = useCanEdit();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  async function upload(kind: string, e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast('Maximaal 20 MB per bestand. Zet grotere bestanden (video) als link.', true); input.value = ''; return; }
    const body = new FormData();
    body.append('owner_type', ownerType); body.append('owner_id', ownerId); body.append('kind', kind); body.append('file', file);
    setBusy(kind);
    try {
      await before?.();
      await api('/assets', { method: 'POST', body });
      toast(`${file.name} opgeslagen.`);
      onChange();
    } catch (err) { toast((err as Error).message, true); } finally { setBusy(''); input.value = ''; }
  }
  async function saveLink(form: HTMLFormElement) {
    try {
      await before?.();
      await api('/assets/link', { method: 'POST', body: { ...formValues(form), owner_type: ownerType, owner_id: ownerId, kind: link } });
      setLink(''); setError(''); toast('Link opgeslagen.'); onChange();
    } catch (err) { setError((err as Error).message); }
  }
  return <>
    {kinds.map((kind) => {
      const rows = assets.filter((a) => a.kind === kind);
      return (
        <div className="asset-group" key={kind}>
          <div className="asset-head"><span>{KIND[kind] || kind}</span>{edit ? <span className="asset-tools">
            <label className={`small-btn ${busy === kind ? 'busy' : ''}`}>{busy === kind ? <Orb state="weaving" label="Uploaden" /> : null}<Icon name="upload" /> Upload<input type="file" className="visually-hidden" onChange={(e) => upload(kind, e)} /></label>
            <button type="button" className="small-btn" onClick={() => setLink(kind)}><Icon name="link" /> Link</button></span> : null}</div>
          {rows.length ? <ul className="asset-list">{rows.map((a) => <AssetRow key={a.id} a={a} onChange={onChange} />)}</ul> : <p className="asset-empty">Nog niets</p>}
        </div>
      );
    })}
    <Modal title={`Link toevoegen: ${KIND[link] || ''}`} open={!!link} onClose={() => setLink('')} error={error}
      footer={<><button className="ghost" onClick={() => setLink('')}>Annuleren</button><button className="primary" type="submit" form="link-form">Opslaan</button></>}>
      <form id="link-form" onSubmit={(e) => { e.preventDefault(); saveLink(e.currentTarget); }}>
        <div className="field"><label htmlFor="link-url">Link</label><input id="link-url" name="url" type="url" required placeholder="https://" /></div>
        <div className="field"><label htmlFor="link-name">Naam (optioneel)</label><input id="link-name" name="name" placeholder="Bijv. EPK 2026 of persvideo Dekmantel" /></div>
        <p className="helper">Handig voor grote video’s of mappen in WeTransfer, Dropbox of Google Drive. De link gaat mee in de mail naar de venue.</p>
      </form>
    </Modal>
  </>;
}

/** A simple one-form dialog: submit returns a promise; errors show inline. */
export function FormDialog({ id, title, open, onClose, submit, label = 'Opslaan', children }: { id: string; title: string; open: boolean; onClose: () => void; submit: (form: HTMLFormElement) => Promise<void>; label?: ReactNode; children: ReactNode }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(false);
  useEffect(() => { if (open) setError(''); }, [open]);
  return (
    <Modal title={title} open={open} onClose={onClose} error={error}
      footer={<><button className="ghost" onClick={onClose}>Annuleren</button><button className="primary" type="submit" form={id} disabled={busy}>{label}</button></>}>
      <form id={id} onSubmit={async (e) => {
        e.preventDefault();
        if (ref.current) return;
        ref.current = true; setBusy(true);
        try { await submit(e.currentTarget); } catch (err) { setError((err as Error).message); } finally { ref.current = false; setBusy(false); }
      }}>{children}</form>
    </Modal>
  );
}

/** How advancing for this artist runs: via their agency or with the artist.
    Only the chosen route's fields are required; the rest stays optional. */
export function ContactBlock({ a, prefix = '' }: { a: Record<string, any>; prefix?: string }) {
  const edit = useCanEdit();
  const [via, setVia] = useState<string>(a.contact_via || (a.agency || a.agent_email ? 'agency' : 'self'));
  const artistFields = <>
    <Field name={prefix + 'email'} label="E-mail artiest" value={a.email} type="email" />
    <Field name={prefix + 'phone'} label="Telefoon artiest" value={a.phone} type="tel" />
    <Field name={prefix + 'instagram'} label="Instagram" value={a.instagram} placeholder="@naam" />
  </>;
  return <>
    <h2 className="sub">Advancing via</h2>
    <div className="segmented contact-via" role="radiogroup" aria-label="Advancing via">
      {([['agency', 'Agency'], ['self', 'Artiest zelf']] as const).map(([v, l]) => (
        <label key={v} className={via === v ? 'active' : ''}><input type="radio" className="visually-hidden" name={prefix + 'contact_via'} value={v} checked={via === v} disabled={!edit} onChange={() => setVia(v)} />{l}</label>
      ))}
    </div>
    {via === 'agency' ? <>
      <Field name={prefix + 'agency'} label="Agency" value={a.agency} />
      <Field name={prefix + 'agent'} label="Agent" value={a.agent} />
      <Field name={prefix + 'agent_email'} label="E-mail agent *" value={a.agent_email} type="email" />
      <Field name={prefix + 'agent_phone'} label="Telefoon agent" value={a.agent_phone} type="tel" />
      <p className="field-hint">Alle advancing loopt via de agent. Alleen het e-mailadres van de agent is verplicht.</p>
      <details className="optional-block"><summary>Contact van de artiest zelf (optioneel)</summary>{artistFields}</details>
    </> : <>
      {artistFields}
      <p className="field-hint">Geen agency: advancing loopt via de artiest. E-mail of telefoon is genoeg.</p>
    </>}
  </>;
}

/** Full name and date of birth: only asked for when Moonshine or the venue
    books travel or a room in the artist's name (the date of birth for a
    flight). Passport/ID is always optional. */
export function TravelId({ a, prefix = '', needed, flight = false }: { a: Record<string, any>; prefix?: string; needed: boolean; flight?: boolean }) {
  const body = <>
    <Field name={prefix + 'full_name'} label={needed ? 'Volledige naam (zoals in paspoort) *' : 'Volledige naam (zoals in paspoort)'} value={a.full_name} autoComplete="off" />
    <Field name={prefix + 'date_of_birth'} label={flight ? 'Geboortedatum *' : 'Geboortedatum'} value={a.date_of_birth} type={a.masked ? 'text' : 'date'} autoComplete="off" readOnly={a.masked} />
    <Field name={prefix + 'passport'} label="Paspoort / ID (optioneel)" value={a.passport} autoComplete="off" readOnly={a.masked} />
    <p className="field-hint">Gaat nooit mee in de mail naar de venue.</p>
  </>;
  return needed ? <><h2 className="sub">Reisgegevens</h2><p className="field-hint">Nodig omdat Moonshine of de venue de reis of het hotel boekt.</p>{body}</>
    : <details className="optional-block"><summary>Reisgegevens (alleen nodig als Moonshine of de venue boekt)</summary>{body}</details>;
}

/** "Open in OneDrive" when the folder exists, otherwise a button that creates it. */
export function DriveButton({ kind, id, url, onDone }: { kind: 'event' | 'booking' | 'release' | 'voyage'; id: string; url?: string; onDone: () => void }) {
  const edit = useCanEdit();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (url) return <a className="button ghost" href={url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> OneDrive</a>;
  if (!edit) return null;
  return <button className="ghost" disabled={busy} onClick={async () => {
    setBusy(true);
    try { await api(`/drive/${kind}/${id}`, { method: 'POST' }); toast('Mappen aangemaakt op OneDrive.'); onDone(); }
    catch (e) { toast((e as Error).message, true); } finally { setBusy(false); }
  }}>{busy ? <Orb state="weaving" /> : <Icon name="folder" />} Mappen aanmaken</button>;
}

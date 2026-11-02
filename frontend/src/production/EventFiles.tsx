import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { Empty, ErrorBox, Icon, Loading, Orb, useToast } from '../lib/ui';
import { DriveButton, useCanEdit } from './common';

type Item = { name: string; url: string; size: number; folder: boolean; count: number; modified: string };
type Section = { name: string; url: string; exists: boolean; items: Item[]; count: number; filled: boolean };
type Files = { enabled: boolean; url: string; sections: Section[]; other: Item[] };

const HINT: Record<string, string> = {
  finance: 'Costing en begroting; loopt via Luxor, los van onze eigen boekhouding',
  epks: 'Persmateriaal van de line-up, voor de content',
  riders: 'Alle riders samen, in één keer naar de venue',
  artwork: 'Posters, banners, line-up en artist announcements',
  content: 'Reels/TikToks, countdown, giveaway en timetable',
  productie: 'Technical rider, crew- en gastenlijst, advancing, briefings en moodboard',
  'na afloop': 'Foto’s, aftermovie, footage, set-opnames en evaluatie',
};
const SHOWN = 6;

function size(n: number) {
  return n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} kB` : `${n} B`;
}

function Row({ i }: { i: Item }) {
  return <li><a href={i.url} target="_blank" rel="noopener noreferrer"><Icon name={i.folder ? 'folder' : 'file'} /><span>{i.name}</span></a>
    <small>{i.folder ? `${i.count} items` : size(i.size)}</small></li>;
}

/** The event's OneDrive folder, per section in checklist order. The files stay on OneDrive; links open them in SharePoint. */
export function EventFiles({ eventId, driveUrl, reload }: { eventId: string; driveUrl: string; reload: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const edit = useCanEdit();
  const [busy, setBusy] = useState('');
  const [over, setOver] = useState('');
  async function upload(section: string, files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(section);
    try {
      for (const file of list) {
        const b = new FormData(); b.append('section', section); b.append('file', file);
        await api(`/events/${eventId}/files`, { method: 'POST', body: b });
      }
      toast(list.length === 1 ? `${list[0].name} staat in ${section}.` : `${list.length} bestanden staan in ${section}.`);
      qc.setQueryData(['event-files', eventId], await api<Files>(`/events/${eventId}/files?fresh=1`));
      qc.invalidateQueries({ queryKey: ['event-steps', eventId] });
    } catch (e) { toast((e as Error).message, true); } finally { setBusy(''); }
  }
  const q = useQuery({ queryKey: ['event-files', eventId], queryFn: () => api<Files>(`/events/${eventId}/files`), enabled: !!driveUrl });
  if (!driveUrl) return <section className="card"><Empty title="Nog geen OneDrive-map" sub="Maak de standaardmappen aan; daarna zie je hier per onderdeel wat er op OneDrive staat." action={<DriveButton kind="event" id={eventId} onDone={reload} />} icon="folder" /></section>;
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const f = q.data;
  const filled = f.sections.filter((s) => s.filled).length;
  const refresh = async () => { qc.setQueryData(['event-files', eventId], await api<Files>(`/events/${eventId}/files?fresh=1`)); };
  return <>
    <div className="files-head">
      <div><strong>{`${filled}/${f.sections.length} onderdelen gevuld`}</strong><span className="helper">De bestanden staan op OneDrive in de eventmap; deel ze gewoon met een SharePoint-link.</span></div>
      <div className="row-actions"><button className="ghost" onClick={refresh}><Icon name="refresh" /> Vernieuwen</button>
        <a className="button ghost" href={f.url} target="_blank" rel="noopener noreferrer"><Icon name="folder" /> Eventmap openen</a></div>
    </div>
    <div className="files-grid">
      {f.sections.map((s) => {
        const key = s.name.replace(/^\d+\s*/, '').toLowerCase();
        return <section key={s.name} className={`card files-card ${s.filled ? 'filled' : ''} ${over === s.name ? 'drop' : ''}`}
          onDragOver={edit ? (ev) => { ev.preventDefault(); setOver(s.name); } : undefined} onDragLeave={() => setOver('')}
          onDrop={edit ? (ev) => { ev.preventDefault(); setOver(''); upload(s.name, ev.dataTransfer.files); } : undefined}>
          <header><span className={`files-check ${s.filled ? 'ok' : ''}`}>{s.filled ? <Icon name="ok" /> : null}</span>
            <div><h3>{s.name}</h3><small>{HINT[key] || ''}</small></div>
            {s.url ? <a className="text-link" href={s.url} target="_blank" rel="noopener noreferrer">Openen</a> : null}</header>
          {s.items.length ? <ul className="files-list">{s.items.slice(0, SHOWN).map((i) => <Row key={i.name} i={i} />)}</ul>
            : <p className="helper">{s.exists ? 'Nog leeg.' : 'Map bestaat nog niet.'}</p>}
          {s.count > SHOWN ? <a className="text-link files-more" href={s.url} target="_blank" rel="noopener noreferrer">{`+${s.count - SHOWN} meer op OneDrive`}</a> : null}
          {edit ? <label className="files-drop">{busy === s.name ? <><Orb state="weaving" /> Uploaden…</> : <><Icon name="download" /> Sleep bestanden hierheen of kies ze</>}
            <input type="file" multiple disabled={!!busy} onChange={(ev) => { if (ev.target.files) upload(s.name, ev.target.files); ev.target.value = ''; }} /></label> : null}
        </section>;
      })}
    </div>
    {f.other.length ? <section className="card card-pad section-gap"><h3 className="files-other">Overig in de eventmap</h3><ul className="files-list">{f.other.map((i) => <Row key={i.name} i={i} />)}</ul></section> : null}
  </>;
}

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { api } from '../lib/api';
import { Icon, Modal, useToast } from '../lib/ui';

/** Menu → parts, as in the sidebar and the tabs of each page. */
export const AREAS: [string, string[]][] = [
  ['Overzicht', ['Komende evenementen', 'Mijn eventpunten', 'Financieel overzicht', 'Taken op het overzicht']],
  ['Agenda', ['Maandoverzicht', 'Outlook-synchronisatie', 'Contentplanning']],
  ['Taken', ['Takenlijst', 'Toewijzen', 'Microsoft To Do']],
  ['Meetings', ['Upcoming meeting', 'TODO-bord (stickies)', 'Notulen', 'Actiepunten']],
  ['Evenementen', ['Lijst (komend/afgelopen)', 'Checklist', 'Advancing', 'Timetable', 'Venue', 'Crewlist', 'Guestlist', 'Bestanden (OneDrive)', 'Content', 'Notities', 'Gegevens', 'Artiest in de line-up']],
  ['Artists', ['Overzicht', 'Profiel', 'EPK', 'Socials', 'Profielfoto']],
  ['Voyages', ['Lijst', 'Leveringen (rider, EPK …)', 'Logboek']],
  ['Label', ['Releases', 'Planning', 'Taken', 'Track feedback', 'Promo', 'Artiesten', 'Statements']],
  ['Financiën', ['Facturen', 'Odoo', 'Bank', 'Btw', 'Documenten', 'Afletteren']],
  ['Admin', ['Koppelingen', 'Sleutels', 'Gebruikers', 'Activiteit', 'Instellingen', 'Feature requests']],
  ['Algemeen', ['Inloggen', 'Menu / navigatie', 'Meldingen', 'Chat', 'Mobiel / app', 'Vertaling', 'Snelheid', 'Iets anders']],
];
export const KINDS: [string, string, string][] = [
  ['new', 'Nieuwe functie', 'Iets wat er nog niet is'], ['change', 'Aanpassing', 'Het bestaat, maar moet anders'],
  ['different', 'Werkt anders dan verwacht', 'Het doet iets anders dan je denkt'], ['bug', 'Fout', 'Iets werkt niet of geeft een foutmelding'], ['idea', 'Idee', 'Nog vaag, maar het idee is…'],
];
export const PRIORITIES: [string, string][] = [['low', 'Kan wachten'], ['normal', 'Normaal'], ['high', 'Belangrijk'], ['blocking', 'Houdt mijn werk tegen']];

/** Guess menu and part from the page you are on. */
function guess(path: string): [string, string] {
  const p = path.replace(/\/+$/, '');
  const tab = (m: RegExp, map: Record<string, string>, area: string, fallback: string): [string, string] | null => {
    const hit = p.match(m);
    return hit ? [area, map[hit[1] || ''] || fallback] : null;
  };
  return tab(/^\/events\/[^/]+(?:\/([a-z]+))?/, { '': 'Checklist', advancing: 'Advancing', timetable: 'Timetable', venue: 'Venue', crew: 'Crewlist', guests: 'Guestlist', files: 'Bestanden (OneDrive)', content: 'Content', notes: 'Notities', details: 'Gegevens', artist: 'Artiest in de line-up', past: 'Lijst (komend/afgelopen)' }, 'Evenementen', 'Lijst (komend/afgelopen)')
    || tab(/^\/label(?:\/([a-z]+))?/, { '': 'Releases', planning: 'Planning', tasks: 'Taken', feedback: 'Track feedback', promo: 'Promo', artists: 'Artiesten', statements: 'Statements' }, 'Label', 'Releases')
    || tab(/^\/admin(?:\/([a-z]+))?/, { integrations: 'Koppelingen', keys: 'Sleutels', users: 'Gebruikers', activity: 'Activiteit', settings: 'Instellingen', requests: 'Feature requests' }, 'Admin', 'Koppelingen')
    || tab(/^\/(invoices|odoo|bank|vat|documents)/, { invoices: 'Facturen', odoo: 'Odoo', bank: 'Bank', vat: 'Btw', documents: 'Documenten' }, 'Financiën', 'Facturen')
    || ([['/calendar', 'Agenda', 'Maandoverzicht'], ['/tasks', 'Taken', 'Takenlijst'], ['/meetings', 'Meetings', 'TODO-bord (stickies)'], ['/artists', 'Artists', 'Overzicht'], ['/voyages', 'Voyages', 'Lijst']]
      .find(([prefix]) => p.startsWith(prefix))?.slice(1) as [string, string] | undefined)
    || (p === '' || p === '/' ? ['Overzicht', 'Komende evenementen'] : ['Algemeen', 'Iets anders']);
}

/** "Feature request": where in the app, what kind, how it works now and how it should work. */
export function FeatureRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const toast = useToast();
  const qc = useQueryClient();
  const [g0, g1] = guess(location.pathname);
  const [area, setArea] = useState(g0);
  const [sub, setSub] = useState(g1);
  const [kind, setKind] = useState('change');
  const [shot, setShot] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [key, setKey] = useState(0);
  const subs = AREAS.find(([a]) => a === area)?.[1] || [];
  const reset = () => { const [a, b] = guess(location.pathname); setArea(a); setSub(b); setKind('change'); setShot(null); setError(''); setKey((k) => k + 1); };
  const pick = (f?: File | null) => { if (f && /^image\/(png|jpeg|webp)$/.test(f.type)) setShot(f); else if (f) setError('Gebruik een PNG-, JPG- of WebP-afbeelding.'); };
  const placeholders: Record<string, [string, string]> = {
    new: ['(Optioneel) Hoe los je het nu op?', 'Wat moet er komen en wat moet het doen?'],
    change: ['Hoe werkt het nu?', 'Hoe wil je dat het werkt?'],
    different: ['Wat deed je, en wat gebeurde er?', 'Wat had je verwacht?'],
    bug: ['Wat deed je precies, en welke foutmelding kreeg je?', 'Wat had er moeten gebeuren?'],
    idea: ['Waar loop je tegenaan?', 'Wat is je idee?'],
  };
  return <Modal title="Feature request" open={open} onClose={() => { onClose(); reset(); }} error={error} footer={<>
    <button onClick={() => { onClose(); reset(); }}>Annuleren</button>
    <button className="primary" type="submit" form="feature-form" disabled={busy}><Icon name="send" /> Versturen</button></>}>
    <form id="feature-form" key={key} className="feature-form" onPaste={(e) => pick(Array.from(e.clipboardData.files)[0])} onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true); setError('');
      try {
        const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const r = await api<{ id: string }>('/feature-requests', { method: 'POST', body: { ...v, area, sub, kind, page: location.pathname } });
        if (shot) { const b = new FormData(); b.append('file', shot); await api(`/feature-requests/${r.id}/screenshot`, { method: 'POST', body: b }); }
        qc.invalidateQueries({ queryKey: ['feature-requests'] });
        toast('Verstuurd. Je krijgt een melding als de status verandert.');
        onClose(); reset();
      } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}>
      <div className="form-grid">
        <div className="field"><label htmlFor="fr-area">Onder welk menu?</label>
          <select id="fr-area" value={area} onChange={(e) => { setArea(e.target.value); setSub(AREAS.find(([a]) => a === e.target.value)?.[1][0] || ''); }}>{AREAS.map(([a]) => <option key={a} value={a}>{a}</option>)}</select></div>
        <div className="field"><label htmlFor="fr-sub">Welk onderdeel?</label>
          <select id="fr-sub" value={sub} onChange={(e) => setSub(e.target.value)}>{subs.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="fr-feature">Welke knop of functie? <span className="opt">(optioneel)</span></label><input id="fr-feature" name="feature" placeholder="Bijv. ‘Toevoegen’-knop, de deadline, de filter ‘Alleen ik’" /></div>
      <div className="field"><label>Wat voor verzoek?</label>
        <div className="kind-picks">{KINDS.map(([k, l, hint]) => <button type="button" key={k} className={`kind-pick ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}><strong>{l}</strong><small>{hint}</small></button>)}</div></div>
      <div className="field"><label htmlFor="fr-title">In één zin</label><input id="fr-title" name="title" required maxLength={200} placeholder="Bijv. ‘Bij de guestlist wil ik kunnen zoeken op relatie’" /></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="fr-current">Nu</label><textarea id="fr-current" name="current" rows={4} placeholder={placeholders[kind][0]} /></div>
        <div className="field"><label htmlFor="fr-wanted">Gewenst</label><textarea id="fr-wanted" name="wanted" rows={4} placeholder={placeholders[kind][1]} /></div>
      </div>
      <div className="form-grid">
        <div className="field"><label htmlFor="fr-why">Waarom? Wat levert het op? <span className="opt">(optioneel)</span></label><input id="fr-why" name="why" placeholder="Bijv. ‘scheelt elke week een uur’" /></div>
        <div className="field"><label htmlFor="fr-prio">Hoe belangrijk?</label><select id="fr-prio" name="priority" defaultValue="normal">{PRIORITIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      <div className="field"><label>Screenshot <span className="opt">(optioneel; je kunt ook plakken met Ctrl/Cmd+V)</span></label>
        <label className={`shot-drop ${shot ? 'has' : ''}`}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
          {shot ? <><img src={URL.createObjectURL(shot)} alt="Screenshot" /><span>{shot.name}</span><button type="button" className="text-link" onClick={(e) => { e.preventDefault(); setShot(null); }}>weghalen</button></>
            : <><Icon name="download" /><span>Kies een afbeelding of plak een screenshot</span></>}</label></div>
      <p className="helper">{`Wordt verstuurd vanaf ${location.pathname}. Peppy ziet het in de inbox bij Admin.`}</p>
    </form>
  </Modal>;
}

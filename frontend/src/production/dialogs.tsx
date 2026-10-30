import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { size } from '../lib/format';
import { Icon, Modal, Orb, useToast } from '../lib/ui';
import { FormDialog } from './common';

export type Act = { id: string; name: string; start: string; end: string; stage: string; note: string; artist_ids: string[]; artists: string[] };

/** Add or edit an act. `act` null = new. Calls `done` with the fresh overview. */
export function ActDialog({ open, eventId, act, preset, lineup, onClose, done }: { open: boolean; eventId: string; act: Act | null; preset?: string; lineup: { artist_id: string; name: string }[]; onClose: () => void; done: () => void }) {
  const toast = useToast();
  const ids = new Set(act ? act.artist_ids : preset ? [preset] : []);
  return (
    <FormDialog id="act-form" title={act ? 'Act bewerken' : 'Act toevoegen'} open={open} onClose={onClose} label={act ? 'Opslaan' : 'Toevoegen'} submit={async (form) => {
      const data = new FormData(form);
      const body = { name: data.get('name') || '', start: data.get('start') || '', end: data.get('end') || '', stage: data.get('stage') || '', note: data.get('note') || '', artist_ids: data.getAll('artist_ids') };
      if (act) await api(`/acts/${act.id}`, { method: 'PATCH', body });
      else await api(`/events/${eventId}/acts`, { method: 'POST', body });
      onClose();
      toast(act ? 'Act bijgewerkt.' : 'Act toegevoegd.');
      done();
    }}>
      <div key={act?.id || 'new'}>
        <div className="form-grid">
          <div className="field"><label htmlFor="act-start">Start</label><input id="act-start" name="start" type="time" defaultValue={act?.start} /></div>
          <div className="field"><label htmlFor="act-end">Eind</label><input id="act-end" name="end" type="time" defaultValue={act?.end} /></div>
        </div>
        <fieldset className="check-group"><legend>Artiesten in deze act</legend>
          {lineup.length ? lineup.map((p) => <label key={p.artist_id}><input type="checkbox" name="artist_ids" value={p.artist_id} defaultChecked={ids.has(p.artist_id)} /> {p.name}</label>) : <p className="helper">Nog geen artiesten op dit evenement.</p>}
        </fieldset>
        <div className="field"><label htmlFor="act-name">Naam van de act</label><input id="act-name" name="name" defaultValue={act?.name} placeholder="Leeg laten: namen van de artiesten, bijv. Dwonji B2B HDN" /></div>
        <div className="form-grid">
          <div className="field"><label htmlFor="act-stage">Stage</label><input id="act-stage" name="stage" defaultValue={act?.stage} placeholder="Main" /></div>
          <div className="field"><label htmlFor="act-note">Opmerking</label><input id="act-note" name="note" defaultValue={act?.note} /></div>
        </div>
      </div>
    </FormDialog>
  );
}

type Preview = { sender: string; to: string[]; cc: string[]; subject: string; message: string; items: { id: string }[]; attachments: { name: string; size: number; source: string }[]; links: { name: string }[]; warnings: string[]; total_size: number };
type Check = { id: string; label: string; status: string };

function Pack({ pv }: { pv: Preview }) {
  return (
    <div className="pack">
      <div className="pack-head"><strong>{pv.attachments.length} {pv.attachments.length === 1 ? 'bijlage' : 'bijlagen'}{pv.links.length ? ` en ${pv.links.length} ${pv.links.length === 1 ? 'link' : 'links'}` : ''}</strong><span>{size(pv.total_size)}</span></div>
      {pv.attachments.length || pv.links.length ? <ul className="pack-list">
        {pv.attachments.map((a, i) => <li key={'a' + i}><Icon name={a.source === 'generated' ? 'pdf' : 'file'} /><span>{a.name}</span><small>{size(a.size)}</small></li>)}
        {pv.links.map((l, i) => <li key={'l' + i}><Icon name="link" /><span>{l.name}</span><small>link</small></li>)}
      </ul> : <p className="helper">Kies hierboven wat er mee moet.</p>}
      {pv.warnings.length ? <ul className="pack-warn">{pv.warnings.map((w) => <li key={w}><Icon name="warn" /><span>{w}</span></li>)}</ul> : null}
    </div>
  );
}

/** Compose and send the advancing pack to the venue through Outlook. */
export function SendDialog({ open, eventId, checklist, onClose, done }: { open: boolean; eventId: string; checklist: Check[]; onClose: () => void; done: (overview: any) => void }) {
  const toast = useToast();
  const [pv, setPv] = useState<Preview | null>(null);
  const [first, setFirst] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef(0);
  useEffect(() => {
    if (!open) { setPv(null); setFirst(null); setError(''); return; }
    api<Preview>(`/events/${eventId}/send-preview`, { method: 'POST', body: {} }).then((p) => { setPv(p); setFirst(p); }).catch((e) => setError(e.message));
  }, [open, eventId]);
  const payload = () => {
    const data = new FormData(form.current!);
    return { to: data.get('to') || '', cc: data.get('cc') || '', subject: data.get('subject') || '', message: data.get('message') || '', items: data.getAll('items') };
  };
  function refresh() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try { setPv(await api<Preview>(`/events/${eventId}/send-preview`, { method: 'POST', body: payload() })); setError(''); } catch (e) { setError((e as Error).message); }
    }, 350);
  }
  async function submit() {
    setBusy(true);
    try {
      const { result, ...overview } = await api(`/events/${eventId}/send`, { method: 'POST', body: payload() });
      done(overview);
      onClose();
      if (result.status === 'uncertain') toast(result.error || 'Verzending onzeker. Controleer Verzonden items in Outlook.', true);
      else toast('Aangenomen door Outlook. De checklist is bijgewerkt.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const chosen = new Set(first?.items.map((i) => i.id));
  return (
    <Modal title="Advancing versturen" open={open} onClose={onClose} error={error}
      footer={<><button className="ghost" onClick={onClose}>Annuleren</button><button className="primary" type="submit" form="send-form" disabled={!first?.sender || busy}>{busy ? <><Orb state="composing" /> Versturen…</> : <><Icon name="send" /> Versturen via Outlook</>}</button></>}>
      {!first ? (error ? null : <div className="empty orb-loading"><Orb state="composing" size={32} />Pakket samenstellen…</div>) : (
        <form id="send-form" ref={form} className="send-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {first.sender ? <p className="helper">Wordt verstuurd vanaf <strong>{first.sender}</strong> via Outlook. Een kopie van de documenten komt in de evenementmap in OneDrive als die koppeling aan staat.</p>
            : <div className="notice notice-warn"><Icon name="warn" /><span>Nog geen verzendadres ingesteld. Stel het in bij Koppelingen → Advancing. Het pakket kun je hieronder al controleren.</span></div>}
          <div className="form-grid">
            <div className="field"><label htmlFor="send-to">Aan</label><input id="send-to" name="to" defaultValue={first.to.join(', ')} placeholder="productie@venue.nl" required onChange={refresh} /></div>
            <div className="field"><label htmlFor="send-cc">Cc</label><input id="send-cc" name="cc" defaultValue={first.cc.join(', ')} placeholder="optioneel" onChange={refresh} /></div>
          </div>
          <div className="field"><label htmlFor="send-subject">Onderwerp</label><input id="send-subject" name="subject" defaultValue={first.subject} required /></div>
          <div className="field"><label htmlFor="send-message">Bericht</label><textarea id="send-message" name="message" rows={5} defaultValue={first.message} /></div>
          <fieldset className="check-group"><legend>Meesturen</legend>
            {checklist.map((i) => <label key={i.id}><input type="checkbox" name="items" value={i.id} defaultChecked={chosen.has(i.id)} onChange={refresh} /> {i.label}{i.status === 'sent' ? <> <span className="badge">al verstuurd</span></> : i.status === 'na' ? <> <span className="badge">n.v.t.</span></> : null}</label>)}
          </fieldset>
          {pv ? <Pack pv={pv} /> : null}
        </form>
      )}
    </Modal>
  );
}

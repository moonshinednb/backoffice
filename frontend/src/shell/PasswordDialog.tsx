import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { User, useAuth } from '../lib/auth';
import { Modal, useToast } from '../lib/ui';

/** Change password. Forced (no cancel) when the account must choose its own. */
export function PasswordDialog({ open, onClose, forced = false }: { open: boolean; onClose: () => void; forced?: boolean }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get('password') !== data.get('repeat')) return setError('De nieuwe wachtwoorden zijn niet gelijk.');
    setBusy(true);
    try {
      const r = await api<{ user: User }>('/auth/password', { method: 'POST', body: { current: data.get('current'), password: data.get('password') } });
      setUser(r.user);
      setError('');
      toast('Wachtwoord gewijzigd.');
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={forced ? 'Kies je eigen wachtwoord' : 'Wachtwoord wijzigen'} open={open} onClose={forced ? () => {} : onClose} error={error}
      footer={<>{forced ? null : <button className="ghost" onClick={onClose}>Annuleren</button>}<button className="primary" type="submit" form="password-form" disabled={busy}>Opslaan</button></>}>
      {forced ? <p className="helper">Je logt voor het eerst in met een tijdelijk wachtwoord. Kies een eigen wachtwoord van minimaal 8 tekens.</p> : null}
      <form id="password-form" onSubmit={submit}>
        <div className="field"><label htmlFor="pw-current">{forced ? 'Tijdelijk wachtwoord' : 'Huidig wachtwoord'}</label><input id="pw-current" name="current" type="password" autoComplete="current-password" required /></div>
        <div className="field"><label htmlFor="pw-new">Nieuw wachtwoord</label><input id="pw-new" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
        <div className="field"><label htmlFor="pw-repeat">Herhaal nieuw wachtwoord</label><input id="pw-repeat" name="repeat" type="password" autoComplete="new-password" minLength={8} required /></div>
      </form>
    </Modal>
  );
}

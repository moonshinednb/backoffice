import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../lib/ui';

/** Landing page of the reset link from the email. */
export function ResetPassword() {
  const token = new URLSearchParams(location.search).get('token') || '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get('password') !== data.get('repeat')) return setError('De nieuwe wachtwoorden zijn niet gelijk.');
    setBusy(true);
    try { await api('/auth/reset', { method: 'POST', body: { token, password: data.get('password') } }); setDone(true); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <main className="reset-page"><section className="access-panel"><div className="access-form">
      <img className="access-logo" src="/assets/moonshine-logo.svg" alt="Moonshine" />
      <h2>Nieuw <span>wachtwoord.</span></h2>
      {done ? <><div className="notice">Je wachtwoord is gewijzigd. Je kunt nu inloggen.</div><a className="button primary" href="/">Naar inloggen <Icon name="arrow" /></a></>
        : !token ? <div className="error-box">Deze link is onvolledig. Vraag een nieuwe aan via Wachtwoord vergeten.</div>
          : <form onSubmit={submit}>
            {error ? <div className="error-box visible" role="alert">{error}</div> : null}
            <div className="field"><label htmlFor="r-new">Nieuw wachtwoord</label><input id="r-new" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
            <div className="field"><label htmlFor="r-repeat">Herhaal nieuw wachtwoord</label><input id="r-repeat" name="repeat" type="password" autoComplete="new-password" minLength={8} required /></div>
            <button className="primary" type="submit" disabled={busy}>Opslaan <Icon name="arrow" /></button>
          </form>}
    </div></section></main>
  );
}

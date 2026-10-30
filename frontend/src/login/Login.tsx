import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { Icon, Modal } from '../lib/ui';

/** Login with the chrome Moonshine logo scene. The 3D scene loads lazily,
    so the form is usable before three.js has arrived. */
export function Login() {
  const { login } = useAuth();
  const canvas = useRef<HTMLCanvasElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./scene.js').then(({ mountScene }) => { if (!cancelled && canvas.current) dispose = mountScene(canvas.current); }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try { await login(String(data.get('username')), String(data.get('password'))); }
    catch (err) { setError((err as Error).message); password.current?.focus(); }
    finally { setBusy(false); }
  }
  return (
    <main className="studio-login">
      <section className="brand-stage" aria-label="Moonshine">
        <div className="sculpture-view"><img className="scene-fallback" src="/assets/moonshine-logo.svg" alt="Moonshine" /><canvas ref={canvas} className="logo-scene" role="img" aria-label="Moonshine-logo in chroom op een ruwe grijze ondergrond" /></div>
        <div className="stage-bottom"><h1>Moonshine <span>Backoffice.</span></h1><p>Manage your team, content, documents and more.<br />All in one place.</p><div className="stage-progress" aria-hidden="true"><i /></div></div>
      </section>
      <div className="private-badge"><Icon name="lock" /> Private workspace</div>
      <section className="access-panel"><div className="access-form">
        <img className="access-logo" src="/assets/moonshine-logo.svg" alt="Moonshine" />
        <p className="access-kicker">TEAM ACCESS</p><h2>Welkom <span>terug.</span></h2>
        <form id="login-form" onSubmit={submit}>
          {error ? <div className="error-box visible" role="alert">{error}</div> : null}
          <div className="field"><label htmlFor="username">Gebruikersnaam</label><div className="input-icon"><Icon name="user" /><input id="username" name="username" autoComplete="username" autoCapitalize="none" required /></div></div>
          <div className="field"><label htmlFor="password">Wachtwoord</label><div className="input-icon"><Icon name="lock" />
            <input ref={password} id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Vul je wachtwoord in" required aria-invalid={!!error} />
            <button type="button" className="password-visibility" onClick={() => setShow(!show)} aria-label={show ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'} aria-pressed={show}><Icon name="eye" /></button></div></div>
          <button className="primary" type="submit" disabled={busy}>Inloggen <Icon name="arrow" /></button>
        </form>
        <button className="text-link login-help" onClick={() => setHelp(true)}>Wachtwoord vergeten? <Icon name="chevron" /></button>
      </div></section>
      <Modal title="Toegang herstellen" open={help} onClose={() => setHelp(false)} footer={<button onClick={() => setHelp(false)}>Sluiten</button>}>
        <p className="helper">Vraag Peppy (beheerder) om je wachtwoord opnieuw in te stellen via Gebruikers. Je krijgt dan een tijdelijk wachtwoord en kiest bij het inloggen zelf een nieuw. Er worden geen wachtwoorden per e-mail verstuurd.</p>
      </Modal>
    </main>
  );
}

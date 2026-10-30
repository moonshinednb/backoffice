/* Installable app: service worker (HTTPS or localhost only) and the
   browser's install prompt. */
let deferred: any = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
window.addEventListener('appinstalled', () => { deferred = null; });
if ('serviceWorker' in navigator && window.isSecureContext && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const platform = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return /Android/.test(ua) ? 'android' : 'desktop';
};

export function installSteps() {
  if (standalone()) return <p className="helper">Je gebruikt Moonshine al als app.</p>;
  const p = platform();
  return <>
    <p className="helper">Moonshine opent dan als losse app met een eigen icoon, zonder adresbalk. Je blijft gewoon inloggen zoals nu.</p>
    {deferred ? <button className="primary" onClick={() => deferred.prompt()}>Nu installeren</button> : (
      <ol className="install-steps">
        {p === 'ios' ? <><li>Open deze pagina in <strong>Safari</strong>.</li><li>Tik op de deelknop: het vierkant met de pijl omhoog.</li><li>Kies <strong>Zet op beginscherm</strong> en tik op <strong>Voeg toe</strong>.</li></>
          : p === 'android' ? <><li>Open deze pagina in <strong>Chrome</strong>.</li><li>Tik op het menu met de drie puntjes.</li><li>Kies <strong>App installeren</strong> of <strong>Toevoegen aan startscherm</strong>.</li></>
            : <><li>Open deze pagina in Chrome of Edge.</li><li>Klik op het installatie-icoon rechts in de adresbalk.</li><li>Kies <strong>Installeren</strong>.</li></>}
      </ol>
    )}
    {window.isSecureContext ? null : <div className="notice">Deze verbinding gebruikt nog http. Op een iPhone werkt Zet op beginscherm al wel. Voor volledige installatie op Android en offline gebruik is het https-adres via Tailscale nodig.</div>}
  </>;
}

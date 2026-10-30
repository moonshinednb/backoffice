/* Installable app: registers the service worker (only possible on HTTPS or
   localhost) and keeps the browser's install prompt for the profile menu. */
(() => {
  'use strict';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferred = event; });
  window.addEventListener('appinstalled', () => { deferred = null; });
  window.__pwa = {
    standalone: () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    canPrompt: () => !!deferred,
    async prompt() {
      if (!deferred) return null;
      deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      return choice.outcome;
    },
    platform() {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
      if (/Android/.test(ua)) return 'android';
      return 'desktop';
    },
  };
})();

/* Moonshine service worker. Makes the backoffice installable and keeps the
   app shell available when the connection drops.

   Data is never cached: everything under /api is network-only, so invoices,
   bank lines and artist details stay on the server and not on a phone.
   Pages, styles and scripts are network-first, so a deploy is visible on the
   next load; the cache is only a fallback when offline. Vendored libraries
   and fonts never change in place and are served cache-first. */
const VERSION = 'moonshine-shell-v2';
const SHELL = [
  '/', '/style.css', '/luxury.css', '/studio.css', '/events.css', '/app.js', '/events.js', '/pwa.js',
  '/logo-scene.js', '/logo-geometry.js', '/orbs.js', '/vendor/motion.js', '/vendor/thinking-orbs-0.3.2/engine.es.js',
  '/vendor/thinking-orbs-0.3.2/index-B8WsUNf5.js', '/fonts/manrope-latin.woff2',
  '/assets/moonshine-logo.svg', '/assets/icons/icon-192.png', '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

function remember(request, response) {
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(VERSION).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/vendor/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => remember(request, response))));
    return;
  }
  const key = request.mode === 'navigate' ? '/' : request;
  event.respondWith(fetch(request)
    .then((response) => remember(key, response))
    .catch(() => caches.match(key).then((hit) => hit || (request.mode === 'navigate' ? caches.match('/') : Response.error()))));
});

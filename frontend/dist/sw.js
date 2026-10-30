/* Moonshine service worker. The API is never cached; built assets have
   hashed names and are cached on first use; pages are network-first so a
   new release shows up immediately, with the last copy as offline fallback. */
const CACHE = 'moonshine-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/django-admin/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put('/', copy));
      return response;
    }).catch(() => caches.match('/')));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok && (url.pathname.startsWith('/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/assets/'))) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});

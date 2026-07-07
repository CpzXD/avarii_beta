const CACHE_NAME = 'avarii-iluminat-v1';
const APP_SHELL = [
  '/',
  '/harta.html',
  '/login.html',
  '/register.html',
  '/sesizare-detalii.html',
  '/sesizare.html',
  '/sesizarile-mele.html',
  '/manifest-cetatean.json',
  '/icons/cetatean-192.png',
  '/icons/cetatean-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/avarii') || url.pathname.startsWith('/auth') || url.pathname.startsWith('/uploads')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    return response;
  })));
});

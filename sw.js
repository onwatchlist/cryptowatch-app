// Caches the app shell so CryptoWatch opens instantly and works offline.
// App files are always fetched fresh from the network first (bypassing the browser's HTTP cache)
// so updates show up on the next launch; the cache is only used when offline. API calls are never cached.
const CACHE = 'cryptowatch-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-1024.png', './qrcode.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // APIs go straight to the network
  e.respondWith(
    fetch(e.request.url, { cache: 'no-store' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

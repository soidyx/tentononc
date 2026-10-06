// Keeps the page usable without internet (for example in a shop). A changed index.html is picked up
// in the background and shown the next time the page is opened.
const CACHE = 'papermono-list-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

// Answer from the saved copy at once and refresh it in the background. "Share" opens the page as
// index.html?text=<the list>; the part after "?" is cut off here, so the list itself is never sent
// to the web server - it stays in the phone.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const plain = url.origin + url.pathname;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(plain);
    const fresh = fetch(plain).then(res => {
      if (res && res.ok) cache.put(plain, res.clone());
      return res;
    }).catch(() => saved);
    return saved || fresh;
  }));
});

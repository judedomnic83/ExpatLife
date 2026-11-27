// ExpatLife v1.2 — cache only the public app shell, never personal records.
const CACHE = 'expatlife-shell-v1.2';
const ROOT = new URL('./', self.location.href);
const SHELL = ['index.html','manifest.webmanifest','icon-192.png','icon-512.png'].map(p => new URL(p, ROOT).href);
const HOME = SHELL[0];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('expatlife-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== ROOT.origin) return;
  if (req.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === new URL(HOME).pathname)) {
    event.respondWith(fetch(req).then(async response => {
      if (response.ok) { try { const cache = await caches.open(CACHE); await cache.put(HOME, response.clone()); } catch (_) {} return response; }
      return (await (await caches.open(CACHE)).match(HOME)) || response;
    }).catch(async () => (await (await caches.open(CACHE)).match(HOME)) || new Response('ExpatLife is offline. Open it once while connected.', {status:503,headers:{'Content-Type':'text/plain'}})));
  } else if (SHELL.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(req)) || fetch(req)));
  }
});

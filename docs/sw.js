// Yellowmetal service worker. The cache name changes on every build, so updates reach installed apps.
const CACHE = "ym-mvfapeln";
const CORE = ["/", "/hire/", "/buy/", "/shortlist/", "/assets/style.css?v=mvfapeln", "/assets/app.js?v=mvfapeln", "/assets/data.js?v=mvfapeln", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/favicon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const put = res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/img/") || url.pathname.startsWith("/icons/")) {
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));          // photos: cache first
    } else {
      e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then(r => r || caches.match("/"))));  // pages: network first, offline copy
    }
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
  }
});

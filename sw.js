// Gjør appen tilgjengelig uten nett. Øk VERSJON når filene endres, så henter telefonene ny utgave.
const VERSJON = 'v3';
const CACHE = 'livescouting-' + VERSJON;
const FILER = ['./', './manifest.webmanifest', './logo.png', './ikon-180.png', './ikon-192.png', './ikon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('livescouting-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Svar fra telefonen først, og hent ny utgave i bakgrunnen når det er nett.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const lagret = await c.match(req, { ignoreSearch: true });
      const nett = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      if (lagret) { e.waitUntil(nett); return lagret; }
      return (await nett) || (req.mode === 'navigate' ? c.match('./') : Response.error());
    })
  );
});

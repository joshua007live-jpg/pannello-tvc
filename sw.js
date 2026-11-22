// Service worker del Pannello TVC: fa funzionare l'app anche senza internet.
// Quando cambi index.html, aumenta VERSIONE così i telefoni scaricano la nuova copia.
const VERSIONE = 'tvc-v5';
const FILE_APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone/icon-192.png',
  './icone/icon-512.png',
  './icone/icon-maskable-512.png',
  './icone/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE_APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(nomi.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // three.js dal CDN: la prima volta lo scarico, poi lo uso dalla memoria (serve per il Razzo 3D offline)
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.match(e.request).then(inCache => inCache || fetch(e.request).then(risp => {
        const copia = risp.clone();
        caches.open(VERSIONE).then(c => c.put(e.request, copia));
        return risp;
      }))
    );
    return;
  }

  // file dell'app: rispondo subito dalla memoria e intanto controllo se c'è una versione nuova
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(inCache => {
        const rete = fetch(e.request).then(risp => {
          if (risp.ok) { const copia = risp.clone(); caches.open(VERSIONE).then(c => c.put(e.request, copia)); }
          return risp;
        }).catch(() => inCache);
        return inCache || rete;
      })
    );
  }
});

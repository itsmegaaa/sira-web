const CACHE = 'sira-v2';
const ASSETS = [
  '/login.html',
  '/home.html',
  '/laporan.html',
  '/detail.html',
  '/form.html',
  '/log.html',
  '/master-bank.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/firebase-config.js',
  '/js/auth-guard.js',
  '/js/login.js',
  '/js/home.js',
  '/js/laporan.js',
  '/js/detail.js',
  '/js/form.js',
  '/js/log.js',
  '/js/master-bank.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

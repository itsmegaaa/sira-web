const CACHE = 'sira-v1';
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

const CACHE_NAME = 'farmhill-retur-v1';

// File yang di-cache saat install
const PRECACHE = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache file utama
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE).catch(err => {
        console.log('Cache addAll partial error (ok):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback ke cache
self.addEventListener('fetch', event => {
  // Jangan intercept request ke GAS atau Google APIs
  const url = event.request.url;
  if (url.includes('script.google.com') ||
      url.includes('googleapis.com') ||
      url.includes('drive.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kalau berhasil, simpan ke cache
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Kalau offline, ambil dari cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback ke index.html untuk navigasi
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

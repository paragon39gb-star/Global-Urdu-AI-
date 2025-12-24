
const CACHE_NAME = 'chat-grc-v5.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://img.icons8.com/fluency/96/sparkling-light.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // CRITICAL: Always skip cache for API requests to Google Generative AI
  if (url.includes('generativelanguage.googleapis.com')) {
    return; 
  }

  // Network-first strategy for everything else to ensure stability
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

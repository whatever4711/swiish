/* global self, caches, fetch */

const CACHE_NAME = 'swiish-app-shell-v3';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  // Bypass caching for dynamic/API endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/manifest/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    return;
  }

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  // Serve index.html for navigations - NETWORK FIRST to avoid stale HTML
  if (isNavigation) {
    event.respondWith(
      // Always try network first - fetch index.html (server serves it for all routes)
      fetch('/index.html', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then((resp) => {
          // Don't cache index.html - always fetch fresh to avoid stale content
          // Return the network response directly
          return resp;
        })
        .catch(() => {
          // Only fall back to cache if network completely fails (offline)
          return caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            // Last resort: offline fallback
            return new Response('<!DOCTYPE html><html><body>Offline - Please check your connection</body></html>', {
              headers: { 'Content-Type': 'text/html' },
            });
          });
        })
    );
    return;
  }

  // Cache-first for static assets, but never fall back to index.html (avoid wrong MIME)
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request, { cache: 'no-store' })
          .then((resp) => {
            if (resp.ok) {
              const clone = resp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return resp;
          })
          // If network fails and nothing cached, propagate the failure (no HTML fallback)
          .catch((err) => {
            return cached || Promise.reject(err);
          });
      })
    );
    return;
  }
});



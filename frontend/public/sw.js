// NASAB Service Worker — strategy per resource class
// Strategy fix (was stale-while-revalidate on app shell, which is dangerous
// for Vite SPAs because index.html cached at v_N could reference chunk
// filenames that no longer exist after deploy v_N+1 → boot fails silently
// and the user sees a stuck spinner). Now:
//   - index.html → network-first (always boot off the deployed bundle)
//   - /assets/*  → cache-first (filenames are content-hashed = immutable)
//   - /api/*     → network-first with offline fallback
//   - other      → stale-while-revalidate
const CACHE = 'nasab-v33';
const PRECACHE = [
  '/manifest.json',
  '/icons/icon.svg',
  // NOTE: '/' (index.html) is intentionally NOT precached. Caching the
  // shell here was the root cause of "stuck Memuat" — old shell referenced
  // chunk filenames that were already purged from /assets.
];
const CDN_CACHE = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches and claim clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', e => {
  const req = e.request;
  // Cache API only supports GET. Bail early on POST/PUT/DELETE etc. so we
  // never attempt cache.put() on them (throws TypeError).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) API → network-first with offline fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('nasab-api')) {
    e.respondWith(
      fetch(req).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 2) index.html / SPA shell → NETWORK FIRST (fixes stuck-Memuat bug).
  //    Boundary: same-origin paths without a file extension (route-style URLs)
  //    or anything ending in .html. These all resolve to index.html via the
  //    Pages _redirects rule (`/* /index.html 200`).
  const isShell = (url.origin === self.location.origin) && (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    !url.pathname.includes('.')
  );
  if (isShell) {
    e.respondWith(
      fetch(req).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => caches.match(req).then(c => c || caches.match('/')))
    );
    return;
  }

  // 3) Hashed assets → CACHE FIRST. Vite filenames carry a content hash
  //    so the URL itself is the cache key; never goes stale.
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      /\.(woff2?|ttf|eot)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return r;
        });
      })
    );
    return;
  }

  // 4) CDN (fonts, leaflet) → cache-first
  if (CDN_CACHE.some(cdn => url.href.startsWith(cdn))) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return r;
        });
      })
    );
    return;
  }

  // 5) Default → stale-while-revalidate
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Allow page to trigger skipWaiting (auto-reload pattern in index.html)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

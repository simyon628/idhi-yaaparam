const CACHE_VERSION = 'yaaparam-v4';

// ─── Install: activate immediately ───────────────────────────────────────────
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Take over immediately, don't wait for old SW to die
    e.waitUntil(
        caches.open(CACHE_VERSION).then(cache =>
            cache.addAll(['/', '/manifest.json']).catch(() => {})
        )
    );
});

// ─── Activate: claim all tabs + delete old caches ────────────────────────────
self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control of all tabs immediately
            caches.keys().then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_VERSION)
                        .map(key => caches.delete(key)) // Delete ALL old caches
                )
            )
        ])
    );
});

// ─── Fetch: Network First ─────────────────────────────────────────────────────
// Always try network first. Only fall back to cache if offline.
// Never serve stale JS/HTML from cache — users always get latest code.
self.addEventListener('fetch', (e) => {
    // Skip non-GET requests (auth, Firestore writes, etc.)
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);

    // Skip Firebase, API routes, browser extensions, and _next chunks
    if (
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/_next') ||
        url.hostname.includes('firestore') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        !url.protocol.startsWith('http')
    ) {
        return; // Let browser handle it natively
    }

    e.respondWith(
        fetch(e.request)
            .then(networkResponse => {
                // Only cache valid same-origin responses
                if (
                    networkResponse.ok &&
                    networkResponse.type === 'basic'
                ) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
                }
                return networkResponse;
            })
            .catch(async () => {
                // Offline fallback: serve from cache if available
                const cached = await caches.match(e.request);
                if (cached) return cached;
                // For navigation requests offline, serve the root page
                if (e.request.mode === 'navigate') {
                    const cachedRoot = await caches.match('/');
                    if (cachedRoot) return cachedRoot;
                }
                return new Response('Offline — no cached version available', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});

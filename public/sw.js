const CACHE_NAME = 'yaaparam-cache-v3';

// Only cache essential static assets to avoid breaking the Next.js app
const CONTENT_TO_CACHE = [
    '/',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Fail-safe caching
        await Promise.allSettled(
            CONTENT_TO_CACHE.map(url =>
                fetch(url).then(res => {
                    if (res.ok) cache.put(url, res);
                }).catch(() => {})
            )
        );
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
    // 1. DO NOT intercept non-GET requests (Fixes Auth, DB writes, Notifications crashing)
    if (e.request.method !== 'GET') return;
    
    // 2. DO NOT intercept API routes, Firebase auth, or extensions
    const url = new URL(e.request.url);
    if (
        url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') || 
        !url.protocol.startsWith('http')
    ) {
        return;
    }

    e.respondWith((async () => {
        try {
            const cachedResponse = await caches.match(e.request);
            if (cachedResponse) return cachedResponse;
            
            const networkResponse = await fetch(e.request);
            // Only cache valid OK responses
            if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
                const cache = await caches.open(CACHE_NAME);
                cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            // Ignore fetch errors gracefully so app doesn't crash offline
            console.warn('SW fetch failed:', error);
            return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        }
    })());
});

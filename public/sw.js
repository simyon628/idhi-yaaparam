const CACHE_NAME = 'yaaparam-cache-v2';
// Only cache paths that are guaranteed to exist and return 200
const CONTENT_TO_CACHE = [
    '/',
    '/manifest.json',
];

self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Use individual puts so one failure doesn't abort the whole install
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

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        if (r) return r;
        const response = await fetch(e.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(e.request, response.clone());
        return response;
    })());
});

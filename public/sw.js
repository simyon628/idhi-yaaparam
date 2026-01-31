const CACHE_NAME = 'yaaparam-cache-v1';
const CONTENT_TO_CACHE = [
    '/',
    '/home',
    '/rentals/requests',
    '/chat',
    '/globals.css',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CONTENT_TO_CACHE);
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

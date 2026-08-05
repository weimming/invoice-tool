/*
 * Cache Eviction Service Worker
 * Immediately clears all stale caches to ensure fresh single-file script.js loading.
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    console.log('[Service Worker] Clearing stale cache:', cache);
                    return caches.delete(cache);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Always bypass cache and fetch directly from network
    event.respondWith(fetch(event.request));
});

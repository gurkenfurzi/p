// SlideBloom Stable cache-cleanup service worker.
// This version intentionally does not cache app files, preventing stale GitHub Pages builds.
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.toLowerCase().includes('slidebloom')).map(k => caches.delete(k)));
    await self.clients.claim();
    try { await self.registration.unregister(); } catch {}
  })());
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

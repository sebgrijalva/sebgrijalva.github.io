const CACHE = "family-adventure-v16";
const ASSETS = [
  "./?v=16",
  "./index.html",
  "./styles.css?v=16",
  "./app.js?v=16",
  "./engine.js?v=15",
  "./adventure.js?v=15",
  "./adventure-v14.js?v=15",
  "./matter-adventure.js?v=15",
  "./platformer-v16.js?v=16",
  "./vendor/matter.min.js?v=16",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});

const C='zero-is-you-v7-reasoning';
const F=['./?v=7.0','./index.html','./style.css?v=7.0','./loader-v6.js?v=7.0','./game-v6.pack?v=7.0','./challenge-levels.js?v=7.0','./engine.js?v=7.0','./levels.js?v=7.0','./facts.js?v=7.0','./nil-levels.js?v=7.0','./manifest.webmanifest?v=7.0','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./?v=7.0'))))});

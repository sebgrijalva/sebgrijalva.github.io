const C='zero-is-you-v8-2-32px';
const F=['./?v=8.2','./index.html','./style.css?v=8.2','./game-v8.js?v=8.2','./engine.js?v=8.2','./levels.js?v=8.2','./challenge-levels.js?v=8.2','./facts.js?v=8.2','./nil-levels.js?v=8.2','./manifest.webmanifest?v=8.2','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./?v=8.2'))))});

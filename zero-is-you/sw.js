const C='zero-is-you-v8-32px';
const F=['./?v=8.0','./index.html','./style.css?v=8.0','./game-v8.js?v=8.0','./engine.js','./levels.js','./challenge-levels.js','./facts.js','./nil-levels.js','./manifest.webmanifest?v=8.0','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./?v=8.0'))))});

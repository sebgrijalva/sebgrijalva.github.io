const C='zero-is-you-v9-1';
const F=['./?v=9.1','./index.html','./style.css?v=9.1','./game-v9.js?v=9.1','./engine.js','./facts.js','./levels.js','./challenge-levels.js','./levels-v9.js','./levels-v9-runtime.js','./problem-bank-v9.js','./nil-levels.js','./music-v9.js','./manifest.webmanifest?v=9.1','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./?v=9.1'))))});

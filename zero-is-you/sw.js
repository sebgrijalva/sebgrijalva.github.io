const C='zero-is-you-v5-nil-legibility';
const F=['./?v=5','./index.html','./style.css?v=5','./loader-v5.js?v=5','./game-v5.pack?v=5','./engine.js','./levels.js','./facts.js','./nil-levels.js','./manifest.webmanifest?v=5','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./?v=5'))));
});

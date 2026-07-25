const CACHE="family-toy-lab-v3";
const ASSETS=[
  "./","./index.html","./styles.css","./app.js","./engine.js","./marble-lab.js",
  "./marble-code-1.js","./marble-code-2.js","./marble-code-3.js","./marble-code-4.js","./marble-code-5.js","./marble-code-6.js",
  "./manifest.webmanifest","./icons/icon.svg"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r})))})

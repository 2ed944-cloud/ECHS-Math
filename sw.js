const CACHE = "echs-math-lessons-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./data/courses.js",
  "./js/portal.js",
  "./assets/echs_logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./lessons/ap-calculus/1-1-introducing-calculus.html",
  "./lessons/ap-calculus/1-2-understanding-limits-graphically.html",
  "./lessons/ap-calculus/1-3-properties-of-limits.html",
  "./lessons/ap-calculus/1-4-limits-of-composite-functions.html",
  "./lessons/ap-precalculus/1-1-change-in-tandem.html",
  "./lessons/ap-precalculus/1-2-rates-of-change.html"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return res;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html"))));
});

const cacheName = "yudu-cache-v1";
const assets = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});

const cacheName = "yudu-cache-v1";
const assets = [
  "/",
  "/index.html",
  "/manifest.json",
  "/style.css",

  "/film.html",
  "/sehir.html",
  "/ulke.html",

  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/logo.png",

  "/datasets/film.json",
  "/datasets/sehir.json",
  "/datasets/ulke.json",

  "/sound/ding.mp3",
  "/sound/error.mp3"
];

// Install: tüm önemli dosyaları cache'le ve yeni SW'yi hemen aktif et
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
  self.skipWaiting();
});

// Activate: eski cache’leri temizle ve SW kontrolü hemen ele al
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ...existing code...
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      if (cacheRes) {
        // Cache varsa hemen göster, arka planda güncelle
        fetch(e.request)
          .then(networkRes => {
            if (networkRes && networkRes.status === 200) {
              caches.open(cacheName).then(cache => {
                cache.put(e.request, networkRes.clone());
              });
            }
          });
        return cacheRes;
      }
      // Cache yoksa ağdan getir ve cache’e ekle
      return fetch(e.request)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            const responseClone = networkRes.clone();
            caches.open(cacheName).then(cache => {
              cache.put(e.request, responseClone);
            });
          }
          return networkRes;
        })
        .catch(() => cacheRes);
    })
  );
});
// ...existing code...

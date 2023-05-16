// service-worker.js

const CACHE_NAME = "my-cache";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/styles.css",
        "/script.js",
        // Adicione aqui os arquivos estáticos que deseja armazenar em cache
      ])
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

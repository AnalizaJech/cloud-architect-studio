/* Offline application shell. Increment the version when releasing new assets. */
const CACHE = "cloud-architect-studio-v8";
const SHELL = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/app.js",
  "./js/modules/catalog.js",
  "./js/modules/document.js",
  "./js/services/history.js",
  "./js/services/storage.js",
  "./js/services/export.js",
  "./js/components/palette.js",
  "./js/components/scene.js",
  "./js/hooks/shortcuts.js",
  "./js/utils/escape.js",
  "./icons/logo.svg",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/social-card.svg",
  "./manifest.json",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            if (
              response.ok &&
              new URL(event.request.url).origin === self.location.origin
            ) {
              const copy = response.clone();
              caches
                .open(CACHE)
                .then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached || Response.error()),
    ),
  );
});

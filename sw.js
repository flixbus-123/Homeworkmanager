```js
const CACHE_NAME = "school-organizer-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Neue Version installieren
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Alte Caches löschen und neue Version aktivieren
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Anfragen behandeln
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  // HTML: IMMER zuerst Internet versuchen
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || caches.match("./index.html"));
        })
    );

    return;
  }

  // Andere Dateien: Cache zuerst
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        });
      })
  );
});

// Sofortiges Aktivieren erlauben
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
```

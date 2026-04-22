const CACHE_NAME = "story-sprout-v26"; // bumped version to roll out fetch-strategy update

const ASSETS_TO_CACHE = [
  "./story-form.html",
  "./story-viewer.html",
  "./story-garden.html", // newest version (replaces saved-stories.html)
  "./styles.css",
  "./js/app.js",
  "./js/story-api.js",
  "./js/story-viewer.js",
  "./js/pwa.js",
  "./img/logo.png",
  "./img/icon-192.png",
  "./img/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Always try network first for page navigations so HTML updates are not stale.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match("./story-form.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // ✅ Return cached first (fast load)
      if (cachedResponse) return cachedResponse;

      // Otherwise fetch from network
      return fetch(event.request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request));
    })
  );
});
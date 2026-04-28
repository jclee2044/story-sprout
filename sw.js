const CACHE_NAME = "story-sprout-v28"; // bumped version to roll out network-first JS/CSS

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
  const request = event.request;
  const isSameOrigin = request.url.startsWith(self.location.origin);
  const isNetworkFirst =
    request.mode === "navigate" ||
    request.destination === "script" ||
    request.destination === "style";

  // Use network-first for HTML, JS, and CSS to avoid stale app updates.
  if (isNetworkFirst) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            isSameOrigin
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          if (request.mode === "navigate") return caches.match("./story-form.html");
          return new Response("", { status: 504, statusText: "Gateway Timeout" });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // ✅ Return cached first (fast load)
      if (cachedResponse) return cachedResponse;

      // Otherwise fetch from network
      return fetch(request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            isSameOrigin
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(request));
    })
  );
});
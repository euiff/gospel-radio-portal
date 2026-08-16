const VERSION = new URL(self.location.href).searchParams.get("v") || "1";
const CACHE = `radio-shell-v${VERSION}`;
const ASSETS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch stream/API hosts
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api")) return;
  // Branding assets and manifest are always fetched fresh so updates apply instantly.
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/favicon")) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // network-first, cache fallback (offline)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
  );
});

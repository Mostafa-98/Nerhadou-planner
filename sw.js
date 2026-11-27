/* Nerhadou Visit Planner service worker: offline-first for same-origin GET. */
const CACHE = "nerhadou-planner-v1";
const PRECACHE = ["./", "index.html", "manifest.webmanifest"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);
            await cache.addAll(PRECACHE);
            try {
                const res = await fetch("index.html");
                const html = await res.text();
                const urls = [
                    ...html.matchAll(/(?:src|href)="(?:\.\/|\/[^"/]+\/)?(assets\/[^"]+)"/g),
                ].map((m) => "./" + m[1]);
                await cache.addAll(urls);
            } catch (e) {
                /* assets are cached lazily on first online visit */
            }
            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Navigation requests: network first, fall back to cached shell.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put("./", copy));
                    return response;
                })
                .catch(() => caches.match("./").then((r) => r || caches.match("index.html")))
        );
        return;
    }

    // Static assets: cache first, then network (and cache the result).
    event.respondWith(
        caches.match(request).then(
            (cached) =>
                cached ||
                fetch(request).then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches
                            .open(CACHE)
                            .then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
        )
    );
});

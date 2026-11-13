/*
 * Lingora's service worker: offline use (the app installs as a PWA) and push notifications
 * (the push part is the same logic as the other two apps).
 *
 * Offline: /precache.json (written by scripts/build-precache.ts) lists the app shell, cached on
 * install, and the stroke-order files, cached in the background after. Pages fall back to the
 * cached app when the network is down; built files, strokes and lookups come from the cache
 * first; the API is never cached (lessons and reviews queue in the app's outbox and sync later).
 */
const APP_NAME = "Lingora";
const ICON = "/icon-192.png";
const SHELL = "lingora-shell-";
const STROKES = "lingora-strokes-v1";
const RUNTIME = "lingora-runtime-v1";

async function precacheList() {
  const res = await fetch("/precache.json", { cache: "no-store" });
  if (!res.ok) throw new Error("no precache list");
  return res.json();
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const list = await precacheList();
      const cache = await caches.open(SHELL + list.version);
      await cache.addAll(list.shell.map((u) => new Request(u, { cache: "reload" })));
    } catch {
      // Dev server or offline install: no precache, the app still works online.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    let version = null;
    try { version = (await precacheList()).version; } catch { /* offline */ }
    if (version && (await caches.has(SHELL + version))) {
      for (const key of await caches.keys()) if (key.startsWith(SHELL) && key !== SHELL + version) await caches.delete(key);
    }
    await self.clients.claim();
    void cacheStrokes();
  })());
});

/** Stroke data for every character, a few at a time, skipping ones already stored. */
async function cacheStrokes() {
  try {
    const list = await precacheList();
    const cache = await caches.open(STROKES);
    const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const todo = list.strokes.filter((u) => !have.has(u));
    for (let i = 0; i < todo.length; i += 12) await Promise.all(todo.slice(i, i + 12).map((u) => cache.add(u).catch(() => {})));
  } catch { /* try again next time */ }
}

async function shellMatch(request) {
  const keys = (await caches.keys()).filter((k) => k.startsWith(SHELL));
  for (const key of keys.reverse()) {
    const hit = await (await caches.open(key)).match(request, { ignoreSearch: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: the network (fresh), or the cached app when offline (it routes on its own).
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        return (await shellMatch("/index.html")) || (await shellMatch("/")) || Response.error();
      }
    })());
    return;
  }

  // Built files, strokes, lookups, icons: the cache first, else the network (and keep a copy).
  event.respondWith((async () => {
    const strokes = url.pathname.startsWith("/strokes/");
    const cached = (await shellMatch(req)) || (await caches.match(req, { cacheName: strokes ? STROKES : RUNTIME }));
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok && (strokes || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/lookup/"))) {
      const copy = res.clone();
      void caches.open(strokes ? STROKES : RUNTIME).then((c) => c.put(req, copy));
    }
    return res;
  })());
});

/* ---------- Push notifications ---------- */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: APP_NAME, body: event.data ? event.data.text() : "" };
  }
  event.waitUntil((async () => {
    // Already looking at the app? Then the page shows it live; don't also pop up a notification.
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const looking = wins.some((w) => w.focused && w.visibilityState === "visible");
    if (looking && !data.sticky) return;
    await self.registration.showNotification(data.title || APP_NAME, {
      body: data.body || "",
      tag: data.tag || undefined,
      renotify: !!data.tag,
      icon: ICON,
      badge: ICON,
      requireInteraction: !!data.sticky,
      data: { url: data.url || "/" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) {
        await w.focus();
        if ("navigate" in w) await w.navigate(url).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

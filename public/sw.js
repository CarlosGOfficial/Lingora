/* Push notifications for APP_NAME (Web Push). Shared logic with the other two apps. */
const APP_NAME = "Lingora";
const ICON = "/icon-192.png";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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

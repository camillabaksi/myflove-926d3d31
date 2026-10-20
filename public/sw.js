/* MyFlove push service worker (no offline caching). */

const VAPID_PUBLIC_KEY =
  "BPxfhVUsDs6sqHE_Ls7Ws3M1b5BJuBobkcUJnSIxEhW85C0RfU3uO-4KrNOFcAlx0APR49fx83eUVDofnQ7dAnI";

/* Ingen offline-cache: alla gamla Cache Storage-poster töms så att en äldre
   bundle aldrig kan serveras (t.ex. Flow utan karusell-CSS). */
async function purgeAllCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch (_) {}
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await purgeAllCaches();
      await self.clients.claim();
    })(),
  );
});

/* Minimal fetch-hanterare: ingen cache, men krävs av webbläsarens
   installationskriterier så att MyFlove går att lägga till på hemskärmen. */
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => Response.error()));
  }
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "myflove-skip-waiting") self.skipWaiting();
  if (type === "myflove-purge-caches") event.waitUntil(purgeAllCaches());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Paceable",
    body: "Ny påminnelse",
    url: "/idag",
    tag: undefined,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }

  const itemKey = data.itemKey;
  const quickActions =
    itemKey && /^med:/.test(itemKey)
      ? [
          { action: "done", title: "✓ Tagit" },
          { action: "snooze", title: "⏰ 10 min" },
          { action: "skip", title: "Hoppa över" },
        ]
      : itemKey && /^(task|deadline|reminder|quickflow):/.test(itemKey)
        ? [
            { action: "done", title: "✓ Klart" },
            { action: "snooze", title: "⏰ 10 min" },
          ]
        : [];

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url || "/idag", itemKey: itemKey || null },
    actions: quickActions,
    silent: data.silent === true,
    ...(data.silent === true
      ? {}
      : { vibrate: Array.isArray(data.vibrate) ? data.vibrate : [200, 100, 200] }),
    requireInteraction: !!data.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* Förnya lokalt; serverregistreringen sker i appens autentiserade flöde.
   Om appen är stängd kan notiser pausa tills användaren öppnar den igen. */
function urlB64ToBuffer(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}

function keyToB64(sub, name) {
  const key = sub.getKey(name);
  if (!key) return "";
  const bytes = new Uint8Array(key);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const sub =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToBuffer(VAPID_PUBLIC_KEY),
          }));
        if (!sub) return;
        // No account credentials in the worker and no endpoint-only writes.
        // Existing foreground sync registers through authenticated subscribeToPush.
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) client.postMessage({ type: "myflove-push-renewal-needed" });
      } catch (_) {}
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const info = event.notification.data || {};
  const itemKey = info.itemKey;
  const action = event.action; // "done" | "snooze" | ""
  let destination = new URL("/idag", self.location.origin);
  try {
    const candidate = new URL(info.url || "/idag", self.location.origin);
    if (candidate.origin === self.location.origin && candidate.protocol === "https:") destination = candidate;
  } catch (_) {}
  if (action && itemKey) {
    destination.searchParams.set("notis", itemKey);
    destination.searchParams.set("atgard", action);
  }
  const targetUrl = `${destination.pathname}${destination.search}${destination.hash}`;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            if (action && itemKey) {
              // Appen är redan igång: utför snabbvalet utan att flytta användaren.
              client.postMessage({ type: "myflove-notification-action", itemKey, action });
              if (action === "done" || action === "snooze" || action === "skip") return;
            }
            await client.focus();
            if ("navigate" in client) await client.navigate(targetUrl);
            return;
          }
        } catch (_) {}
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

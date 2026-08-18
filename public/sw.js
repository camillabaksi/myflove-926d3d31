/* MyFlove push service worker (no offline caching). */

const VAPID_PUBLIC_KEY =
  "BPxfhVUsDs6sqHE_Ls7Ws3M1b5BJuBobkcUJnSIxEhW85C0RfU3uO-4KrNOFcAlx0APR49fx83eUVDofnQ7dAnI";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "MyFlove", body: "Ny påminnelse", url: "/hem", tag: undefined, icon: "/icon-192.png", badge: "/icon-192.png" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url || "/hem" },
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : [200, 100, 200],
    requireInteraction: !!data.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* Webbläsaren kan byta ut prenumerationen. Då skapar vi en ny direkt och
   berättar för servern, annars slutar notiserna komma när appen är stängd. */
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
      const oldEndpoint = event.oldSubscription?.endpoint;
      try {
        const sub =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToBuffer(VAPID_PUBLIC_KEY),
          }));
        if (!sub || !oldEndpoint) return;
        await fetch("/api/public/hooks/push-resubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint,
            endpoint: sub.endpoint,
            p256dh: keyToB64(sub, "p256dh"),
            auth: keyToB64(sub, "auth"),
          }),
        });
      } catch (_) {}
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/hem";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
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

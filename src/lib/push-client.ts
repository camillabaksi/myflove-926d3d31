import { isNativeShell } from "./native-caps";
// Client-side push helpers: registration guard, subscribe/unsubscribe, key sync.
// Never registers in Lovable preview, dev, or iframes.

export const VAPID_PUBLIC_KEY =
  "BPxfhVUsDs6sqHE_Ls7Ws3M1b5BJuBobkcUJnSIxEhW85C0RfU3uO-4KrNOFcAlx0APR49fx83eUVDofnQ7dAnI";

const SW_PATH = "/sw.js";
export const PUSH_SUBSCRIPTION_EVENT = "myflove-push-subscription-changed";

/** Först efter serverregistrering kan befintliga påminnelser köas för bakgrunden. */
export function notifyPushSubscriptionChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PUSH_SUBSCRIPTION_EVENT));
}

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  try {
    // Guarded per PWA skill: never in preview/dev/iframe or ?sw=off
    if (window.top !== window.self) return true;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
    if (host.endsWith(".lovableproject.com") || host === "lovableproject.com") return true;
    if (host.endsWith(".lovableproject-dev.com") || host === "lovableproject-dev.com") return true;
    if (host.endsWith(".beta.lovable.dev") || host === "beta.lovable.dev") return true;
    if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  } catch {
    return true;
  }
  return false;
}

export function pushSupported(): boolean {
  return (
    !isNativeShell() &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function unregisterOurWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) {
    try {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_PATH)) await r.unregister();
    } catch {
      // ignoreras med flit – felet påverkar inte användaren
    }
  }
}

/**
 * Registrerar /sw.js utan att kräva push-stöd. Behövs för att webbläsaren ska
 * se MyFlove som installerbar (PWA-kriterier: manifest + service worker).
 */
export async function registerAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isNativeShell() || typeof window === "undefined" || !("serviceWorker" in navigator))
    return null;
  if (isRefusedContext()) {
    await unregisterOurWorkers();
    return null;
  }
  try {
    return (
      (await navigator.serviceWorker.getRegistration(SW_PATH)) ??
      (await navigator.serviceWorker.register(SW_PATH, { scope: "/" }))
    );
  } catch {
    return null;
  }
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  if (isRefusedContext()) {
    await unregisterOurWorkers();
    return null;
  }
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration(SW_PATH)) ??
      (await navigator.serviceWorker.register(SW_PATH, { scope: "/" }));
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[push] register failed", err);
    return null;
  }
}

function urlB64ToBuffer(base64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

function toB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export type SerializedSub = { endpoint: string; p256dh: string; auth: string };

export function serializeSubscription(sub: PushSubscription): SerializedSub {
  return {
    endpoint: sub.endpoint,
    p256dh: toB64(sub.getKey("p256dh")),
    auth: toB64(sub.getKey("auth")),
  };
}

export async function subscribeUserToPush(): Promise<SerializedSub | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  if (Notification.permission === "denied") return null;
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return null;
  }
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToBuffer(VAPID_PUBLIC_KEY),
    });
  }
  return serializeSubscription(sub);
}

export async function getCurrentSubscription(): Promise<SerializedSub | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  return sub ? serializeSubscription(sub) : null;
}

/**
 * Hämtar (eller återskapar) prenumerationen så att endpoint och nycklar
 * alltid matchar det som ligger på servern. Frågar aldrig om nytt lov.
 */
export async function refreshPushSubscription(): Promise<SerializedSub | null> {
  if (!pushSupported()) return null;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return null;
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToBuffer(VAPID_PUBLIC_KEY),
      });
    } catch (err) {
      console.error("[push] resubscribe failed", err);
      return null;
    }
  }
  return serializeSubscription(sub);
}

export async function unsubscribeCurrent(): Promise<string | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // ignoreras med flit – felet påverkar inte användaren
  }
  return endpoint;
}

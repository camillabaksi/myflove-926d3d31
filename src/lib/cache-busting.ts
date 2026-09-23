/**
 * Cache-busting för publicerad app.
 *
 * Syfte: en äldre service worker eller ett gammalt Cache Storage-innehåll ska
 * aldrig kunna servera en föråldrad JS/CSS-bundle (vilket t.ex. gjorde att
 * Flow-karusellens CSS saknades och slides staplades vertikalt).
 *
 * Strategin:
 * 1. Varje build har ett unikt BUILD_ID (injiceras av Vite).
 * 2. Vid start jämförs BUILD_ID med det senast sedda i localStorage.
 * 3. Vid ny build: töm allt i Cache Storage och be service workern uppdatera sig.
 * 4. Service workers som inte är vår /sw.js avregistreras alltid.
 * 5. Om en ny service worker tar över kontrollen laddas sidan om exakt en gång.
 */

declare const __MYFLOVE_BUILD_ID__: string | undefined;

export const BUILD_ID: string =
  typeof __MYFLOVE_BUILD_ID__ === "string" ? __MYFLOVE_BUILD_ID__ : "dev";

const STORAGE_KEY = "myflove:build-id";
const RELOAD_KEY = "myflove:build-reloaded";
const SW_PATH = "/sw.js";

export async function purgeCaches(): Promise<number> {
  if (typeof caches === "undefined") return 0;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    return keys.length;
  } catch {
    return 0;
  }
}

async function refreshServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const url =
        reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
      if (url && !url.endsWith(SW_PATH)) {
        // Främmande/legacy worker: får aldrig ligga kvar och cacha bundles.
        await reg.unregister();
        continue;
      }
      await reg.update().catch(() => undefined);
      reg.waiting?.postMessage({ type: "myflove-skip-waiting" });
      reg.active?.postMessage({ type: "myflove-purge-caches" });
    }
  } catch {
    // ignoreras med flit – påverkar inte användaren
  }
}

let started = false;

/** Körs en gång i webbläsaren när appen startar. */
export function initCacheBusting(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  let previous: string | null = null;
  try {
    previous = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, BUILD_ID);
  } catch {
    // privat läge – fortsätt ändå
  }

  const isNewBuild = previous !== null && previous !== BUILD_ID;

  void (async () => {
    if (isNewBuild) await purgeCaches();
    await refreshServiceWorkers();
  })();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      try {
        if (window.sessionStorage.getItem(RELOAD_KEY) === BUILD_ID) return;
        window.sessionStorage.setItem(RELOAD_KEY, BUILD_ID);
      } catch {
        return;
      }
      // En uppdatering får inte kasta bort en ändring som fortfarande väntar i
      // synkens korta debounce-fönster. Importera sent för att undvika att
      // molnklienten dras in i den vanliga cachekontrollen vid modulstart.
      void import("@/lib/cloud-storage")
        .then(({ flushCloudSync }) => flushCloudSync())
        .catch(() => undefined)
        .finally(() => window.location.reload());
    });
  }
}

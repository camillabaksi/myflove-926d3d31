/**
 * Vad mobilappen (Android/iOS-skalet) klarar av.
 *
 * iPhone-appen kraschar direkt om webbsidan ber om mikrofon eller kamera och
 * appens behörighetstexter saknas. De första TestFlight-versionerna (1.0)
 * saknar dem; från version 1.1 finns de. Därför frågar vi efter appens
 * version innan mikrofon/kamera används i iPhone-appen.
 */

const FIRST_IOS_VERSION_WITH_DEVICE_ACCESS = [1, 1] as const;

type CapWindow = { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } };

function cap(): CapWindow["Capacitor"] {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as CapWindow).Capacitor;
}

/** Körs sidan i Android/iOS-appen (inte i en vanlig webbläsare)? Synkront. */
export function isNativeShell(): boolean {
  return cap()?.isNativePlatform?.() === true;
}

export function nativePlatform(): "ios" | "android" | "web" {
  const p = cap()?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
}

function versionAtLeast(version: string, min: readonly number[]): boolean {
  const parts = version.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < min.length; i++) {
    const a = parts[i] ?? 0;
    const b = min[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
}

let accessPromise: Promise<boolean> | null = null;

/** Får mikrofon och kamera användas utan att appen kraschar? */
export function deviceAccessReady(): Promise<boolean> {
  if (nativePlatform() !== "ios") return Promise.resolve(true);
  if (!accessPromise) {
    accessPromise = import("@capacitor/app")
      .then(({ App }) => App.getInfo())
      .then((info) => versionAtLeast(info.version, FIRST_IOS_VERSION_WITH_DEVICE_ACCESS))
      .catch(() => false);
  }
  return accessPromise;
}

export const UPDATE_APP_FOR_DEVICE_ACCESS =
  "Mikrofon och kamera fungerar i nästa version av iPhone-appen. Tills dess: använd myflove.se i Safari.";

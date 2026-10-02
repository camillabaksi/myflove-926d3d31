/**
 * Säkerhetskopia av appdata i telefonens egen lagring (endast i Android/iOS-appen).
 * WebView-lagringen kan rensas vid uppdatering; då återställs allt härifrån.
 * I webbläsaren gör modulen ingenting.
 */
const BACKUP_KEY = "myflove-native-backup";
const RESTORED_FLAG = "myflove-native-restored";

function isAppKey(key: string): boolean {
  return key.startsWith("myflow") || key.startsWith("myflove");
}

function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !isAppKey(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
}

export async function initNativeBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");

  // Återställ om webblagringen är tom men telefonen har en kopia.
  const { value } = await Preferences.get({ key: BACKUP_KEY });
  if (value) {
    try {
      const saved = JSON.parse(value) as Record<string, string>;
      let restored = 0;
      for (const [key, v] of Object.entries(saved)) {
        if (window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, v);
          restored++;
        }
      }
      if (restored > 0 && !window.sessionStorage.getItem(RESTORED_FLAG)) {
        window.sessionStorage.setItem(RESTORED_FLAG, "1");
        window.location.reload();
        return;
      }
    } catch {
      // Trasig kopia – skrivs över nedan.
    }
  }

  let last = "";
  const save = async () => {
    const data = JSON.stringify(snapshot());
    if (data === last || data === "{}") return;
    last = data;
    await Preferences.set({ key: BACKUP_KEY, value: data });
  };
  await save();
  window.setInterval(() => void save(), 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void save();
  });
  window.addEventListener("pagehide", () => void save());
}

/** Raderar telefonens kopia, t.ex. när kontot tas bort. */
export async function clearNativeBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.remove({ key: BACKUP_KEY });
}

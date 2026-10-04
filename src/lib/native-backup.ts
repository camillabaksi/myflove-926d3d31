/**
 * Säkerhetskopia av appdata i telefonens egen lagring (endast i Android/iOS-appen).
 * WebView-lagringen kan rensas vid uppdatering; då återställs allt härifrån.
 * I webbläsaren gör modulen ingenting.
 *
 * Kopian är knuten till ETT konto (dataägaren). Den sparas bara medan någon
 * äger datan och återställs bara till samma inloggade konto – annars skulle
 * en utloggning ångras vid nästa start, eller ett konto få ett annats data.
 */
import { DATA_OWNER_KEY, getDataOwner } from "@/lib/account-scope";

const BACKUP_KEY = "myflove-native-backup";
const RESTORED_FLAG = "myflove-native-restored";

interface BackupV2 {
  v: 2;
  owner: string;
  data: Record<string, string>;
}

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

/** Läser kopian; äldre format (utan ägare) får ägaren från sin egen ägarnyckel. */
function parseBackup(raw: string): BackupV2 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (obj["v"] === 2 && typeof obj["owner"] === "string" && obj["data"] && typeof obj["data"] === "object") {
      return { v: 2, owner: obj["owner"], data: obj["data"] as Record<string, string> };
    }
    const legacyOwner = obj[DATA_OWNER_KEY];
    if (typeof legacyOwner === "string" && legacyOwner) {
      return { v: 2, owner: legacyOwner, data: obj as Record<string, string> };
    }
    return null;
  } catch {
    return null;
  }
}

async function currentUserId(): Promise<string | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

export async function initNativeBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");

  // Återställ bara om samma konto är inloggat och webblagringen saknar datan.
  const { value } = await Preferences.get({ key: BACKUP_KEY });
  const backup = value ? parseBackup(value) : null;
  if (value && !backup) await Preferences.remove({ key: BACKUP_KEY });
  if (backup) {
    const uid = await currentUserId();
    const owner = getDataOwner();
    const sameAccount = uid === backup.owner && (owner === null || owner === backup.owner);
    if (sameAccount) {
      let restored = 0;
      for (const [key, v] of Object.entries(backup.data)) {
        if (typeof v === "string" && window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, v);
          restored++;
        }
      }
      if (restored > 0 && !window.sessionStorage.getItem(RESTORED_FLAG)) {
        window.sessionStorage.setItem(RESTORED_FLAG, "1");
        window.location.reload();
        return;
      }
    }
  }

  let last = "";
  const save = async () => {
    const owner = getDataOwner();
    // Ingen ägare = utloggad: spara ingenting (och skriv inte över en kopia).
    if (!owner) return;
    const data = snapshot();
    if (Object.keys(data).length === 0) return;
    const payload: BackupV2 = { v: 2, owner, data };
    const json = JSON.stringify(payload);
    if (json === last) return;
    last = json;
    await Preferences.set({ key: BACKUP_KEY, value: json });
  };
  await save();
  window.setInterval(() => void save(), 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void save();
  });
  window.addEventListener("pagehide", () => void save());
}

/** Raderar telefonens kopia, t.ex. vid utloggning eller när kontot tas bort. */
export async function clearNativeBackup(): Promise<void> {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.remove({ key: BACKUP_KEY });
}

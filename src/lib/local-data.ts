/**
 * Lokal användardata på enheten.
 *
 * MyFlove sparar en hel del i localStorage (energi, mående, medicin,
 * rutiner, ekonomi, anteckningar) för att appen ska fungera offline och
 * kännas snabb. Allt sådant är personligt och får inte ligga kvar när
 * någon loggar ut på en delad enhet.
 *
 * Här samlas rensningen på ett ställe. Serverdata rörs aldrig – bara den
 * lokala kopian på just den här enheten.
 *
 * Det känsligaste (energi, mående, medicin, ekonomi) ligger dessutom
 * krypterat på disken – se secure-local.ts.
 */
import { lockSecureLocal, secureGetItem, unlockSecureLocal } from "@/lib/secure-local";
import { CLOUD_KEYS_REGISTRY, flushCloudSync, hasUnsyncedCloudData } from "@/lib/cloud-storage";
import { PENDING_ENERGY_KEY } from "@/lib/energy-pending";

/** Prefix som alltid räknas som användarens egen data. */
const USER_DATA_PREFIXES = ["myflove", "myflow", "flow-", "sb-"];

/** Nycklar som bara beskriver enheten/visningen och får vara kvar. */
const DEVICE_KEYS = new Set<string>([
  "myflove-alarm-enabled",
  "myflove-theme",
  "myflove-text-size",
  // Konto- och dagsdata synkas via useCloudSyncedStorage och ska därför
  // inte ligga kvar när nästa person loggar in på samma enhet.
  // Personalisering: tema, alarmsignal och alarmformat hör till enheten.
  "myflove-alarm-sound",
  "myflove-alarm-format",
  // Registret över molnsynkade nycklar beskriver bara synkläget, inte data.
  CLOUD_KEYS_REGISTRY,
]);

export function isUserDataKey(key: string): boolean {
  if (DEVICE_KEYS.has(key)) return false;
  const lower = key.toLowerCase();
  return USER_DATA_PREFIXES.some((p) => lower.startsWith(p));
}

/** Ligger det energiloggar och väntar på att flyttas upp till kontot? */
function hasPendingEnergy(): boolean {
  try {
    // Säkerställ att en krypterad pending-kö är upplåst innan den bedöms.
    // `clearLocalUserData` väntar på detta före anropet; fallbacken skyddar
    // ändå konservativt om upplåsningen inte är klar.
    const raw = secureGetItem(PENDING_ENERGY_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    // Går det inte att läsa vet vi inte om det finns data – behåll den.
    return true;
  }
}

/**
 * Nycklar som INTE får rensas vid utloggning eftersom deras innehåll ännu
 * inte är bekräftat sparat i molnet. Bättre att data ligger kvar på enheten
 * en stund till än att den försvinner för alltid.
 */
export function unsafeToClearKeys(): string[] {
  if (typeof window === "undefined") return [];
  const keep: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !isUserDataKey(key)) continue;
      if (hasUnsyncedCloudData(key)) keep.push(key);
    }
  } catch {
    /* utan lagring finns inget att skydda */
  }
  if (hasPendingEnergy() && !keep.includes(PENDING_ENERGY_KEY)) keep.push(PENDING_ENERGY_KEY);
  return keep;
}

/**
 * Rensar lokal användardata på enheten. Anropas vid utloggning så att nästa
 * person som använder samma enhet inte ser något privat.
 *
 * Innan rensningen görs en sista skrivning till molnet. Allt som molnet inte
 * hunnit bekräfta – t.ex. vid offline eller nätverksfel – lämnas kvar och
 * synkas nästa gång användaren loggar in. Ingen data raderas för att
 * "städa"; bara det som bevisligen finns kvar på kontot tas bort lokalt.
 */
export async function clearLocalUserData(options?: { force?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;

  const force = options?.force === true;

  // Lås upp eventuell krypterad pending-kö innan vi avgör vad som får
  // rensas. Detta är no-op när WebCrypto/IndexedDB inte finns.
  if (!force) await unlockSecureLocal();

  // Sista chansen att få upp det som ligger i debounce-fönstret.
  if (!force) {
    try {
      await flushCloudSync();
    } catch {
      /* misslyckad flush = datan räknas som osynkad och sparas nedan */
    }
  }

  // Vid kontoradering finns inget moln att spara till – då rensas allt.
  const keep = new Set(force ? [] : unsafeToClearKeys());
  // Metadata för skyddade nycklar måste också vara kvar för att synken ska
  // kunna avgöra läget nästa gång.
  for (const key of [...keep]) {
    keep.add(key + "__updated_at");
    keep.add(key + "__synced_at");
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isUserDataKey(key) && !keep.has(key)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* utan lagring finns inget att rensa */
  }

  lockSecureLocal([...keep]);

  try {
    window.sessionStorage.clear();
  } catch {
    /* samma sak här */
  }
}

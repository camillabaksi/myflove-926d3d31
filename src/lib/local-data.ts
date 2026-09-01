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
import { lockSecureLocal } from "@/lib/secure-local";

/** Prefix som alltid räknas som användarens egen data. */
const USER_DATA_PREFIXES = ["myflove", "myflow", "flow-", "sb-"];

/** Nycklar som bara beskriver enheten/visningen och får vara kvar. */
const DEVICE_KEYS = new Set<string>([
  "myflove-alarm-enabled",
  "myflove-theme",
  "myflove-text-size",
  // Namn och dagens ramar (morgon/kväll-batteri) är personliga men ska
  // stanna kvar på enheten även efter utloggning – de är inte känsliga
  // hälso- eller ekonomidata och gör appen varmare vid nästa besök.
  "myflove-preferred-name",
  "myflove-day-window",
  "myflove-day-edges",
  // Personalisering: tema, alarmsignal och alarmformat hör till enheten.
  "myflove-alarm-sound",
  "myflove-alarm-format",
]);

export function isUserDataKey(key: string): boolean {
  if (DEVICE_KEYS.has(key)) return false;
  const lower = key.toLowerCase();
  return USER_DATA_PREFIXES.some((p) => lower.startsWith(p));
}

/**
 * Rensar all lokal användardata på enheten. Anropas vid utloggning så att
 * nästa person som använder samma enhet inte ser något privat.
 */
export function clearLocalUserData(): void {
  if (typeof window === "undefined") return;

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isUserDataKey(key)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* utan lagring finns inget att rensa */
  }

  lockSecureLocal();

  try {
    window.sessionStorage.clear();
  } catch {
    /* samma sak här */
  }
}

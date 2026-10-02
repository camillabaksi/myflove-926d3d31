/**
 * Lokal användardata på enheten.
 *
 * MyFlove sparar mycket i localStorage för att fungera offline. Den datan
 * tillhör alltid ett konto (se account-scope.ts). Vid utloggning:
 *
 * 1. En sista skrivning till molnet görs medan sessionen lever.
 * 2. Allt som molnet bekräftat raderas lokalt.
 * 3. Allt som INTE är bekräftat (offline, nätverksfel, väntande energiloggar)
 *    flyttas till kontots eget förråd. Det visas eller synkas aldrig för
 *    någon annan och läggs tillbaka när samma konto loggar in igen.
 *
 * Känsliga värden (energi, mående, medicin, ekonomi) ligger krypterade på
 * disken – se secure-local.ts. Förrådet innehåller samma chiffertext.
 */
import { lockSecureLocal, secureGetItem, unlockSecureLocal } from "@/lib/secure-local";
import { flushCloudSync, hasUnsyncedCloudData } from "@/lib/cloud-storage";
import { PENDING_ENERGY_KEY } from "@/lib/energy-pending";
import {
  getDataOwner,
  hasAnyStash,
  isUserDataKey,
  releaseOwner,
  removeStash,
  stashKeys,
} from "@/lib/account-scope";

export { isUserDataKey };

const META_SUFFIXES = ["__updated_at", "__synced_at", "__removed", "__base"];

/** Ligger det energiloggar och väntar på att flyttas upp till kontot? */
function hasPendingEnergy(): boolean {
  try {
    const raw = secureGetItem(PENDING_ENERGY_KEY);
    if (raw === null) {
      // Krypterat men inte upplåst går inte att bedöma – behåll.
      return window.localStorage.getItem(PENDING_ENERGY_KEY) !== null;
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return true;
  }
}

/** Nycklar vars innehåll ännu inte är bekräftat sparat i molnet. */
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
 * Rensar det aktiva lokala utrymmet vid utloggning. Osynkat flyttas till
 * kontots förråd i stället för att ligga kvar synligt för nästa person.
 *
 * `force` (kontoradering): allt för kontot raderas, även förrådet.
 */
export async function clearLocalUserData(options?: { force?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;
  const force = options?.force === true;
  const owner = getDataOwner();

  if (!force) {
    await unlockSecureLocal();
    try {
      await flushCloudSync();
    } catch {
      /* misslyckad flush = datan räknas som osynkad och sparas nedan */
    }
  }

  const keep = new Set(force ? [] : unsafeToClearKeys());
  for (const key of [...keep]) for (const s of META_SUFFIXES) keep.add(key + s);

  try {
    const all: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isUserDataKey(key)) all.push(key);
    }
    const toStash = all.filter((k) => keep.has(k) && window.localStorage.getItem(k) !== null);
    if (toStash.length > 0) {
      // Utan känd ägare (äldre installation) hamnar det i ett ägarlöst förråd
      // som aldrig visas för något konto automatiskt.
      stashKeys(owner ?? "unowned", toStash);
    }
    for (const key of all) if (!keep.has(key)) window.localStorage.removeItem(key);
    if (force && owner) removeStash(owner);
  } catch {
    /* utan lagring finns inget att rensa */
  }

  releaseOwner();
  // Nyckeln behövs så länge något förråd innehåller chiffertext.
  lockSecureLocal({ keepKey: hasAnyStash() });

  try {
    window.sessionStorage.clear();
  } catch {
    /* samma sak här */
  }
}

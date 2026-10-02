/**
 * Kontoseparering för lokal data.
 *
 * All lokal användardata (localStorage) ligger i ett "aktivt" utrymme som
 * alltid tillhör exakt ett konto: `myflove-data-owner`. Byter enheten konto
 * flyttas föregående kontos data undan till ett eget förråd
 * (`myflove-stash:<userId>:<nyckel>`) och nästa kontos förråd läggs tillbaka.
 *
 * Regler:
 * - Synk och migrering får bara köras när ägaren är den inloggade användaren
 *   (se `isActiveOwner`). Konto A:s data kan därför aldrig skrivas till B.
 * - Data utan känd ägare (från versioner före kontoseparering) gissas inte
 *   bort. Den adopteras bara av en session som redan var inloggad när appen
 *   startade – då har den datan visats och synkats i just den sessionen.
 *   Vid en ny inloggning läggs ägarlös data i förrådet "unowned" och varken
 *   visas eller synkas.
 * - Krypterade värden flyttas som chiffertext; de dekrypteras aldrig här.
 */

export const DATA_OWNER_KEY = "myflove-data-owner";
export const STASH_PREFIX = "myflove-stash:";
export const UNOWNED = "unowned";

/** Prefix som räknas som användarens egen data. */
const USER_DATA_PREFIXES = ["myflove", "myflow", "flow-", "sb-"];

/** Nycklar som beskriver enheten/visningen och inte flyttas mellan konton. */
export const DEVICE_KEYS = new Set<string>([
  "myflove-alarm-enabled",
  "myflove-theme",
  "myflove-text-size",
  "myflove-alarm-sound",
  "myflove-alarm-format",
  "myflove-cloud-keys",
  DATA_OWNER_KEY,
]);

export function isUserDataKey(key: string): boolean {
  if (DEVICE_KEYS.has(key)) return false;
  const lower = key.toLowerCase();
  if (lower.startsWith(STASH_PREFIX)) return false;
  // Supabase-sessionen hanteras av auth-klienten själv.
  if (lower.startsWith("sb-") && lower.endsWith("-auth-token")) return false;
  return USER_DATA_PREFIXES.some((p) => lower.startsWith(p));
}

function ls(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function getDataOwner(): string | null {
  try {
    return ls()?.getItem(DATA_OWNER_KEY) ?? null;
  } catch {
    return null;
  }
}

function setDataOwner(userId: string | null): void {
  const s = ls();
  if (!s) return;
  if (userId) s.setItem(DATA_OWNER_KEY, userId);
  else s.removeItem(DATA_OWNER_KEY);
}

/** Får synk/migrering köras för den här användaren just nu? */
export function isActiveOwner(userId: string | null | undefined): boolean {
  return !!userId && getDataOwner() === userId;
}

function stashKey(owner: string, key: string): string {
  return `${STASH_PREFIX}${owner}:${key}`;
}

function listKeys(): string[] {
  const s = ls();
  if (!s) return [];
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k) out.push(k);
  }
  return out;
}

export function activeUserDataKeys(): string[] {
  return listKeys().filter(isUserDataKey);
}

/** Flyttar angivna aktiva nycklar till ägarens förråd. Skriver aldrig över nyare förråd med tomt. */
export function stashKeys(owner: string, keys: string[]): void {
  const s = ls();
  if (!s) return;
  for (const key of keys) {
    const raw = s.getItem(key);
    if (raw === null) continue;
    s.setItem(stashKey(owner, key), raw);
    s.removeItem(key);
  }
}

export function stashedKeys(owner: string): string[] {
  const prefix = `${STASH_PREFIX}${owner}:`;
  return listKeys()
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}

export function hasAnyStash(): boolean {
  return listKeys().some((k) => k.startsWith(STASH_PREFIX));
}

/** Lägger tillbaka ägarens förråd i det aktiva utrymmet. */
export function restoreStash(owner: string): void {
  const s = ls();
  if (!s) return;
  for (const key of stashedKeys(owner)) {
    const sk = stashKey(owner, key);
    const raw = s.getItem(sk);
    if (raw !== null) s.setItem(key, raw);
    s.removeItem(sk);
  }
}

export function removeStash(owner: string): void {
  const s = ls();
  if (!s) return;
  for (const key of stashedKeys(owner)) s.removeItem(stashKey(owner, key));
}

/**
 * Knyter det aktiva utrymmet till `userId`.
 *
 * Returnerar `"switched"` när data flyttats (anroparen bör ladda om sidan så
 * att inga minnescacher eller prenumerationer från förra kontot lever kvar).
 */
export function bindAccount(
  userId: string,
  options: { adoptUnowned: boolean },
): "same" | "adopted" | "switched" {
  const owner = getDataOwner();
  if (owner === userId) return "same";
  const active = activeUserDataKeys();

  if (owner === null && options.adoptUnowned) {
    setDataOwner(userId);
    return "adopted";
  }

  if (active.length > 0) stashKeys(owner ?? UNOWNED, active);
  restoreStash(userId);
  setDataOwner(userId);
  return "switched";
}

/**
 * Sessionen tog slut utan att appen själv loggade ut (t.ex. utgången token
 * eller utloggning i en annan flik): parkera allt i ägarens förråd utan
 * nätverk, så att inget försvinner och nästa konto inte ser något.
 */
export function parkActiveData(): void {
  const owner = getDataOwner();
  if (!owner) return;
  const active = activeUserDataKeys();
  if (active.length > 0) stashKeys(owner, active);
  setDataOwner(null);
}

/** Används av utloggningen när synkat innehåll redan raderats lokalt. */
export function releaseOwner(): void {
  setDataOwner(null);
}

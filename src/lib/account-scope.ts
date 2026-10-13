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
  "myflove-text-size",
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

  // Ägarlös aktiv data adopteras bara om kontot inte har ett eget förråd –
  // annars skulle osynkade ändringar från en offline-utloggning ligga kvar
  // undanlagda när samma person loggar in igen.
  if (owner === null && options.adoptUnowned && stashedKeys(userId).length === 0) {
    setDataOwner(userId);
    return "adopted";
  }

  const incoming = stashedKeys(userId);
  if (active.length > 0) stashKeys(owner ?? UNOWNED, active);
  restoreStash(userId);
  setDataOwner(userId);
  // Ingenting flyttades (t.ex. första inloggningen efter en ren utloggning):
  // ingen omladdning behövs.
  return active.length > 0 || incoming.length > 0 ? "switched" : "adopted";
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

const META_SUFFIXES = ["__updated_at", "__synced_at", "__base", "__removed"] as const;

function baseKeyOf(key: string): string | null {
  for (const s of META_SUFFIXES) if (key.endsWith(s)) return null;
  return key;
}

/** Antal sparade uppgiftstyper i förrådet för äldre data utan känd ägare. */
export function unownedStashCount(): number {
  return stashedKeys(UNOWNED).filter((k) => baseKeyOf(k) !== null).length;
}

interface WithId {
  id: string | number;
}

function isIdArray(v: unknown): v is WithId[] {
  return (
    Array.isArray(v) &&
    v.every((x) => typeof x === "object" && x !== null && "id" in x)
  );
}

/**
 * Användaren har uttryckligen bekräftat att den äldre, ägarlösa datan är
 * hennes: lägg den i det aktiva (inloggade) utrymmet utan att skriva över
 * något. Listor med id slås ihop (befintliga poster vinner), saknade värden
 * läggs till, krockande enskilda värden behåller kontots version. Allt som
 * läggs till markeras som osynkat så att nästa synk slår ihop det med molnet.
 */
export function claimUnownedStash(): { restored: number } {
  const s = ls();
  const owner = getDataOwner();
  if (!s || !owner || owner === UNOWNED) return { restored: 0 };
  let restored = 0;
  const now = String(Date.now());
  for (const key of stashedKeys(UNOWNED)) {
    const sk = stashKey(UNOWNED, key);
    const raw = s.getItem(sk);
    s.removeItem(sk);
    if (raw === null || baseKeyOf(key) === null) continue;
    const current = s.getItem(key);
    let next: string | null = null;
    if (current === null) {
      next = raw;
    } else {
      try {
        const a: unknown = JSON.parse(current);
        const b: unknown = JSON.parse(raw);
        if (isIdArray(a) && isIdArray(b)) {
          const ids = new Set(a.map((x) => String(x.id)));
          const extra = b.filter((x) => !ids.has(String(x.id)));
          if (extra.length > 0) next = JSON.stringify([...a, ...extra]);
        }
      } catch {
        // Krypterat eller ej JSON: behåll kontots version.
      }
    }
    if (next === null) continue;
    s.setItem(key, next);
    s.removeItem(`${key}__synced_at`);
    s.removeItem(`${key}__base`);
    s.setItem(`${key}__updated_at`, now);
    restored++;
  }
  return { restored };
}

export function discardUnownedStash(): void {
  removeStash(UNOWNED);
}

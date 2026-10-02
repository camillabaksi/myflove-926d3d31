/**
 * Krypterad lokal lagring för känslig data.
 *
 * Energi, mående, medicin och ekonomi sparas lokalt (appen ska fungera
 * offline) men skrivs aldrig i klartext till disken. Värdena krypteras med
 * AES-GCM och nyckeln ligger som en icke-exporterbar CryptoKey i IndexedDB.
 *
 * Vad skyddet räcker till: innehållet i localStorage är obegripligt utan
 * nyckeln, t.ex. i en kopierad lagringsfil eller backup. Vad det INTE skyddar
 * mot: skadlig kod som körs i samma origin (XSS, ett komprometterat paket)
 * kan använda nyckeln för att dekryptera – icke-exporterbar betyder bara att
 * själva nyckelbytes inte kan läsas ut.
 *
 * Uppstart: localStorage är synkront men WebCrypto asynkront. Skrivningar
 * innan nyckeln är redo hålls i minnet och skrivs krypterat så fort den finns.
 * Går nyckeln inte att få fram (privat läge, blockerad IndexedDB) stannar
 * värdet i minnet, status blir "unavailable" och appen visar ett besked.
 * Klartext skrivs aldrig som reserv.
 */

/** Nycklar som alltid krypteras: energi, mående, medicin och ekonomi. */
const SENSITIVE_KEYS = new Set<string>([
  "myflove-flow-memories",
  "myflove-energy-log",
  "myflove-energy-pending",
  "myflove-energy-flow",
  "myflove-checkin-10",
  "myflove-daily-checkin",
  "myflove-wake-steps",
  "myflow-moods",
  "myflove-medications",
  "myflove-medication-log",
  "myflow-medications",
  "myflow-medication-log",
  "myflove-finances",
  "myflove-budget",
  "myflow-finances",
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

const PREFIX = "enc:v1:";
const DB_NAME = "myflove-secure";
const STORE = "keys";
const KEY_ID = "local-data";
const STASH_PREFIX = "myflove-stash:";
const LOCAL_STORAGE_EVENT = "myflow-local-storage";
const RETRY_MS = 5000;

export const SECURE_UNLOCK_EVENT = "myflove-secure-unlocked";
export const SECURE_STATUS_EVENT = "myflove-secure-status";

/** ready = krypterat sparande fungerar; pending = startar; unavailable/error = sparas bara i minnet. */
export type SecureStatus = "pending" | "ready" | "unavailable" | "error";
let status: SecureStatus = "pending";

function setStatus(next: SecureStatus) {
  if (status === next) return;
  status = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SECURE_STATUS_EVENT, { detail: { status } }));
  }
}

export function getSecureStatus(): SecureStatus {
  return status;
}

function hasCrypto(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof indexedDB !== "undefined" &&
    typeof crypto !== "undefined" &&
    !!crypto.subtle
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
}

/**
 * Hämtar enhetens nyckel, eller sparar `candidate` om ingen finns.
 * Läsning och skrivning sker i samma readwrite-transaktion, som IndexedDB
 * serialiserar mellan flikar – två flikar som startar samtidigt får alltså
 * samma nyckel och skriver inte över varandras.
 */
function getOrAddKey(db: IDBDatabase, candidate: CryptoKey): Promise<CryptoKey> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let result: CryptoKey = candidate;
    const req = store.get(KEY_ID);
    req.onsuccess = () => {
      const existing = req.result as CryptoKey | undefined;
      if (existing) result = existing;
      else store.add(candidate, KEY_ID);
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("aborted"));
  });
}

async function loadKey(): Promise<CryptoKey> {
  const db = await openDb();
  try {
    const candidate = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    return await getOrAddKey(db, candidate);
  } finally {
    db.close();
  }
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cryptoKey: CryptoKey | null = null;
/** Klartext i minnet – bara för känsliga nycklar, bara under sessionen. */
const cache = new Map<string, string | null>();
/** Känsliga skrivningar som väntar på nyckeln. */
const pendingWrites = new Set<string>();
let ready: Promise<void> | null = null;
let lastFailure = 0;

async function encrypt(plain: string): Promise<string> {
  if (!cryptoKey) throw new Error("locked");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, data);
  return `${PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(ct))}`;
}

async function decrypt(stored: string): Promise<string | null> {
  if (!cryptoKey) return null;
  const body = stored.slice(PREFIX.length);
  const [ivPart, ctPart] = body.split(".");
  if (!ivPart || !ctPart) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivPart) },
      cryptoKey,
      fromBase64(ctPart),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

async function writeEncrypted(key: string, value: string): Promise<void> {
  try {
    const encrypted = await encrypt(value);
    // En nyare skrivning har redan tagit över – låt den vinna.
    if (cache.get(key) !== value) return;
    window.localStorage.setItem(key, encrypted);
    pendingWrites.delete(key);
  } catch {
    // Full lagring eller låst nyckel: värdet finns kvar i minnet och
    // försöket görs om vid nästa skrivning/upplåsning.
    pendingWrites.add(key);
    setStatus("error");
  }
}

/** Basnyckeln för en förrådsnyckel (`myflove-stash:<id>:<key>`). */
function baseOfStash(storageKey: string): string | null {
  if (!storageKey.startsWith(STASH_PREFIX)) return null;
  const rest = storageKey.slice(STASH_PREFIX.length);
  const i = rest.indexOf(":");
  return i < 0 ? null : rest.slice(i + 1);
}

/**
 * Låser upp den krypterade lagringen: hämtar/skapar nyckeln, dekrypterar
 * känsliga värden till minnet, krypterar gammal klartext och skriver ner
 * det som väntat på nyckeln.
 */
export function unlockSecureLocal(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (!hasCrypto()) {
      setStatus("unavailable");
      return;
    }
    try {
      cryptoKey = await loadKey();
    } catch {
      lastFailure = Date.now();
      setStatus("unavailable");
      // Tillåt ett nytt försök senare.
      ready = null;
      return;
    }

    const touched: string[] = [];
    for (const key of SENSITIVE_KEYS) {
      // Värden skrivna före upplåsningen är nyare än disken.
      if (pendingWrites.has(key) && cache.has(key)) continue;
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        continue;
      }
      if (raw === null) continue;
      if (raw.startsWith(PREFIX)) {
        const plain = await decrypt(raw);
        // Går inte att dekryptera (nyckeln byttes ut): visa tomt men låt
        // chiffertexten ligga orörd tills användaren själv skriver nytt.
        if (plain !== null) cache.set(key, plain);
        touched.push(key);
      } else {
        cache.set(key, raw);
        await writeEncrypted(key, raw);
        touched.push(key);
      }
    }

    // Gammal klartext i förråd (andra konton) krypteras på plats.
    try {
      const all: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k) all.push(k);
      }
      for (const k of all) {
        const base = baseOfStash(k);
        if (!base || !isSensitiveKey(base)) continue;
        const raw = window.localStorage.getItem(k);
        if (raw !== null && !raw.startsWith(PREFIX)) {
          window.localStorage.setItem(k, await encrypt(raw));
        }
      }
    } catch {
      /* lämnas till nästa upplåsning */
    }

    for (const key of [...pendingWrites]) {
      const v = cache.get(key);
      if (typeof v === "string") await writeEncrypted(key, v);
    }

    setStatus(pendingWrites.size > 0 ? "error" : "ready");
    window.dispatchEvent(new CustomEvent(SECURE_UNLOCK_EVENT, { detail: { keys: touched } }));
  })();
  return ready;
}

/** Läser ett värde – känsliga nycklar kommer från klartextcachen. */
export function secureGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (!isSensitiveKey(key)) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  void unlockSecureLocal();
  if (cache.has(key)) return cache.get(key) ?? null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  // Krypterat men ännu inte upplåst: vänta hellre än att visa fel data.
  if (raw !== null && raw.startsWith(PREFIX)) return null;
  return raw;
}

/** Skriver ett värde – känsliga nycklar krypteras innan de når disken. */
export function secureSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (!isSensitiveKey(key)) {
    window.localStorage.setItem(key, value);
    return;
  }

  cache.set(key, value);
  if (cryptoKey) {
    void writeEncrypted(key, value);
    return;
  }
  // Ingen nyckel än: håll värdet i minnet, aldrig klartext på disk.
  pendingWrites.add(key);
  if (!ready && Date.now() - lastFailure > RETRY_MS) void unlockSecureLocal();
}

/** Finns det känsliga ändringar som bara ligger i minnet? */
export function hasUnpersistedSecureWrites(): boolean {
  return pendingWrites.size > 0;
}

/**
 * Låser lagringen (utloggning): klartexten i minnet försvinner. Nyckeln
 * raderas när inget förråd längre behöver den, så rester blir oläsbara.
 */
export function lockSecureLocal(options: { keepKey?: boolean } = {}): void {
  cache.clear();
  pendingWrites.clear();
  if (options.keepKey) return;
  cryptoKey = null;
  ready = null;
  status = "pending";
  if (typeof indexedDB === "undefined") return;
  try {
    indexedDB.deleteDatabase(DB_NAME);
  } catch {
    /* nyckeln är ändå borttagen ur minnet */
  }
}

/** Endast för tester. */
export function __resetSecureLocal(): void {
  cache.clear();
  pendingWrites.clear();
  cryptoKey = null;
  ready = null;
  lastFailure = 0;
  status = "pending";
}

if (typeof window !== "undefined") {
  // En annan flik skrev ett känsligt värde: dekryptera och uppdatera vyerna.
  window.addEventListener("storage", (event) => {
    const key = event.key;
    if (!key || !isSensitiveKey(key) || event.storageArea !== window.localStorage) return;
    const raw = event.newValue;
    void (async () => {
      if (raw === null) cache.set(key, null);
      else if (raw.startsWith(PREFIX)) {
        if (!cryptoKey) await unlockSecureLocal();
        const plain = await decrypt(raw);
        if (plain === null) return;
        cache.set(key, plain);
      } else return;
      pendingWrites.delete(key);
      window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }));
    })();
  });
  void unlockSecureLocal();
}

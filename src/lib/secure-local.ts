/**
 * Krypterad lokal lagring för känslig data.
 *
 * Energi, mående, medicin och ekonomi sparas fortfarande lokalt (appen ska
 * fungera offline), men aldrig i klartext. Värdena krypteras med AES-GCM och
 * nyckeln ligger som en icke-exporterbar CryptoKey i IndexedDB – den går
 * alltså inte att läsa ut med JavaScript eller devtools, och innehållet i
 * localStorage är obegripligt utan den.
 *
 * localStorage är synkront medan WebCrypto är asynkront. Därför håller vi en
 * klartextcache i minnet: vid start låses lagringen upp en gång, allt
 * känsligt dekrypteras till cachen och komponenterna uppdateras. Skrivningar
 * går direkt till cachen och krypteras därefter ner till disk.
 */

/** Nycklar som alltid krypteras: energi, mående, medicin och ekonomi. */
const SENSITIVE_KEYS = new Set<string>([
  // Energi & mående
  "myflove-energy-log",
  "myflove-energy-pending",
  "myflove-energy-flow",
  "myflove-checkin-10",
  "myflove-daily-checkin",
  "myflove-wake-steps",
  "myflow-moods",
  // Medicin (kanoniska nycklar + gamla som migreras bort)
  "myflove-medications",
  "myflove-medication-log",
  "myflow-medications",
  "myflow-medication-log",
  // Ekonomi
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
  });
}

function idbGet(db: IDBDatabase, id: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, id: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Hämtar enhetens nyckel, eller skapar en ny icke-exporterbar nyckel. */
async function loadKey(): Promise<CryptoKey> {
  const db = await openDb();
  const existing = await idbGet(db, KEY_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  await idbPut(db, KEY_ID, key);
  return key;
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
/** Klartext i minnet – bara för nycklarna ovan, bara under sessionen. */
const cache = new Map<string, string | null>();
let ready: Promise<void> | null = null;

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
    // Fel nyckel eller manipulerad data – behandla som tomt.
    return null;
  }
}

export const SECURE_UNLOCK_EVENT = "myflove-secure-unlocked";

/**
 * Låser upp den krypterade lagringen: hämtar/skapar nyckeln, dekrypterar
 * allt känsligt till minnet och krypterar eventuell gammal klartext.
 */
export function unlockSecureLocal(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (!hasCrypto()) return;
    try {
      cryptoKey = await loadKey();
    } catch {
      // Utan nyckel (privat läge, blockerad IndexedDB) faller vi tillbaka på
      // vanlig lagring – appen ska inte sluta fungera.
      return;
    }

    const touched: string[] = [];
    for (const key of SENSITIVE_KEYS) {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        continue;
      }
      if (raw === null) continue;

      if (raw.startsWith(PREFIX)) {
        cache.set(key, await decrypt(raw));
        touched.push(key);
      } else {
        // Gammal klartext från tidigare versioner – kryptera på plats.
        cache.set(key, raw);
        try {
          window.localStorage.setItem(key, await encrypt(raw));
        } catch {
          /* full lagring – värdet finns kvar i minnet */
        }
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SECURE_UNLOCK_EVENT, { detail: { keys: touched } }));
    }
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
  if (!ready && hasCrypto()) {
    void unlockSecureLocal();
  }
  try {
    if (cryptoKey) {
      void encrypt(value)
        .then((encrypted) => {
          if (cache.get(key) === value) window.localStorage.setItem(key, encrypted);
        })
        .catch(() => undefined);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* utan lagring behåller vi bara minnesvärdet */
  }
}

/**
 * Låser lagringen igen (utloggning): klartexten i minnet försvinner och
 * enhetens nyckel raderas, så eventuella rester på disken blir oläsbara.
 *
 * `keep` är nycklar som måste överleva utloggningen därför att de ännu inte
 * är säkert migrerade till kontot (t.ex. energiloggar gjorda utloggad). För
 * dem behålls både klartextcachen och krypteringsnyckeln – annars skulle
 * datan bli oläsbar och därmed förlorad.
 */
export function lockSecureLocal(keep: string[] = []): void {
  const kept = keep.filter((k) => cache.has(k)).map((k) => [k, cache.get(k) ?? null] as const);
  cache.clear();
  if (kept.length > 0) {
    for (const [k, v] of kept) cache.set(k, v);
    // Nyckeln måste finnas kvar för att den sparade datan ska gå att läsa.
    return;
  }
  cryptoKey = null;
  ready = null;
  if (typeof indexedDB === "undefined") return;
  try {
    indexedDB.deleteDatabase(DB_NAME);
  } catch {
    /* går inte att radera – nyckeln är ändå borttagen ur minnet */
  }
}

/** Endast för tester. */
export function __resetSecureLocal(): void {
  cache.clear();
  cryptoKey = null;
  ready = null;
}

if (typeof window !== "undefined") {
  void unlockSecureLocal();
}

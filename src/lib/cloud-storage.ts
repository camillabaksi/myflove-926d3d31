import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useLocalStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToAccountTable } from "@/lib/account-realtime";
import { isActiveOwner } from "@/lib/account-scope";
import {
  SECURE_UNLOCK_EVENT,
  isSensitiveKey,
  secureGetItem,
  secureSetItem,
  unlockSecureLocal,
} from "@/lib/secure-local";
import { mergeSyncValues, snapshotBase, type SyncBase } from "@/lib/sync-merge";
import type { User } from "@supabase/supabase-js";

export { CLOUD_USER_DATA_KEYS } from "@/lib/cloud-keys";
import { CLOUD_USER_DATA_KEYS } from "@/lib/cloud-keys";

/**
 * Molnsynk för localStorage-nycklar (tabellen user_kv).
 *
 * localStorage är sanningskällan på enheten; molnet är kontots gemensamma
 * kopia. Metadata per nyckel:
 * - `__updated_at`  senaste lokala ändring (enhetens klocka)
 * - `__synced_at`   den lokala ändring som molnet senast bekräftade
 * - `__base`        värdet (hashat per post) vid senaste bekräftelse
 * - `__removed`     id:n som tagits bort på den här enheten
 *
 * Varje synk hämtar först molnets senaste version, slår ihop enligt
 * sync-merge.ts och skriver villkorat (bara om molnet inte ändrats sedan
 * läsningen). Misslyckas skrivningen ligger ändringen kvar som osynkad och
 * försöks igen – den markeras aldrig som bekräftad.
 *
 * Synk körs bara när enhetens data ägs av den inloggade användaren
 * (account-scope.ts).
 */

const META_SUFFIX = "__updated_at";
const SYNCED_SUFFIX = "__synced_at";
const BASE_SUFFIX = "__base";
const REMOVED_SUFFIX = "__removed";
const MAX_REMOVED = 300;
const DEBOUNCE_MS = 600;
const RETRY_STEPS_MS = [5_000, 15_000, 60_000];
const LOCAL_STORAGE_EVENT = "myflow-local-storage";
export const ACCOUNT_BOUND_EVENT = "myflove-account-bound";

/** Lista över nycklar som hanteras av molnsynken (device-nyckel, rensas ej). */
export const CLOUD_KEYS_REGISTRY = "myflove-cloud-keys";

// ---------------------------------------------------------------------------
// Inloggad användare (delat svar mellan alla hooks)

let cachedUser: { user: User | null } | null = null;
let inflightUser: Promise<User | null> | null = null;

/** Den inloggade användaren – men bara om enhetens data tillhör hen. */
export async function getSyncUser(): Promise<User | null> {
  const ownerChecked = (u: User | null) => (u && isActiveOwner(u.id) ? u : null);
  if (cachedUser) return ownerChecked(cachedUser.user);
  if (!inflightUser) {
    inflightUser = supabase.auth
      .getUser()
      .then(({ data }) => {
        cachedUser = { user: data.user ?? null };
        return cachedUser.user;
      })
      .catch(() => null)
      .finally(() => {
        inflightUser = null;
      });
  }
  return ownerChecked(await inflightUser);
}

// Delat, synkront värde per nyckel så att två snabba uppdateringar från olika
// vyer aldrig räknas från varsin gammal React-snapshot.
const sharedValues = new Map<string, unknown>();
const initialValues = new Map<string, unknown>();
const revisions = new Map<string, number>();

supabase.auth.onAuthStateChange(() => {
  cachedUser = null;
  sharedValues.clear();
});

// ---------------------------------------------------------------------------
// Små lagringshjälpare

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* full lagring – metadata uppdateras nästa gång */
  }
}
function readMeta(key: string, suffix: string): number {
  const raw = lsGet(key + suffix);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function readBase(key: string): SyncBase | null {
  try {
    const raw = lsGet(key + BASE_SUFFIX);
    return raw ? (JSON.parse(raw) as SyncBase) : null;
  } catch {
    return null;
  }
}

const idOf = (v: unknown): string | null =>
  !!v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string"
    ? (v as { id: string }).id
    : null;

function readRemoved(key: string): string[] {
  try {
    const raw = lsGet(key + REMOVED_SUFFIX);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberRemoved(key: string, prev: unknown, next: unknown): void {
  if (typeof window === "undefined" || !Array.isArray(prev) || !Array.isArray(next)) return;
  const nextIds = new Set(next.map(idOf).filter((x): x is string => !!x));
  const removed = prev.map(idOf).filter((x): x is string => !!x && !nextIds.has(x));
  const before = readRemoved(key);
  const kept = before.filter((id) => !nextIds.has(id));
  if (removed.length === 0 && kept.length === before.length) return;
  lsSet(key + REMOVED_SUFFIX, JSON.stringify([...kept, ...removed].slice(-MAX_REMOVED)));
}

/** Tar bort poster som användaren raderat här från ett inkommande molnvärde. */
export function withoutRemoved<T>(key: string, value: T): T {
  if (typeof window === "undefined" || !Array.isArray(value)) return value;
  const removed = new Set(readRemoved(key));
  if (removed.size === 0) return value;
  const filtered = value.filter((v) => {
    const id = idOf(v);
    return !id || !removed.has(id);
  });
  return (filtered.length === value.length ? value : filtered) as T;
}

export function applyCloudStorageUpdate<T>(current: T, update: T | ((previous: T) => T)): T {
  return update instanceof Function ? update(current) : update;
}

/**
 * Lägger till poster som bara finns i molnet (matchas på id). Behålls för
 * bakåtkompatibilitet; själva synken använder trevägssammanslagningen.
 */
export function mergeMissingCloudEntries<T>(local: T, cloud: unknown): T {
  if (!Array.isArray(local) || !Array.isArray(cloud)) return local;
  const hasId = (v: unknown): v is { id: string } => idOf(v) !== null;
  if (local.length > 0 && !local.every(hasId)) return local;
  if (!cloud.every(hasId)) return local;
  const localIds = new Set((local as unknown[]).filter(hasId).map((v) => v.id));
  const missing = (cloud as unknown[]).filter((v) => hasId(v) && !localIds.has(v.id));
  if (missing.length === 0) return local;
  return [...missing, ...(local as unknown[])] as T;
}

function readRegistry(): string[] {
  try {
    const raw = lsGet(CLOUD_KEYS_REGISTRY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function registerCloudKey(key: string) {
  if (typeof window === "undefined") return;
  const keys = readRegistry();
  if (keys.includes(key)) return;
  lsSet(CLOUD_KEYS_REGISTRY, JSON.stringify([...keys, key]));
}

/** Finns det lokala ändringar för nyckeln som molnet ännu inte bekräftat? */
export function hasUnsyncedCloudData(key: string): boolean {
  if (typeof window === "undefined") return false;
  if (!readRegistry().includes(key) && !CLOUD_USER_DATA_KEYS.has(key)) return false;
  if (lsGet(key) === null) return false;
  const updated = readMeta(key, META_SUFFIX);
  const synced = readMeta(key, SYNCED_SUFFIX);
  if (synced === 0) return true;
  return synced < updated;
}

function currentValue<T>(key: string): T {
  if (sharedValues.has(key)) return sharedValues.get(key) as T;
  const initial = initialValues.get(key) as T;
  try {
    const raw = secureGetItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

function isEmptyValue(key: string, value: unknown): boolean {
  try {
    return JSON.stringify(value) === JSON.stringify(initialValues.get(key));
  } catch {
    return false;
  }
}

/** Skriver ett värde från molnet lokalt och låter alla vyer läsa om det. */
function writeLocal(key: string, value: unknown): void {
  sharedValues.set(key, value);
  try {
    secureSetItem(key, JSON.stringify(value));
  } catch {
    /* full lagring – värdet finns i minnet */
  }
  window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }));
}

function markConfirmed(key: string, editStamp: number, value: unknown): void {
  lsSet(key + SYNCED_SUFFIX, String(editStamp));
  if (readMeta(key, META_SUFFIX) < editStamp) lsSet(key + META_SUFFIX, String(editStamp));
  lsSet(key + BASE_SUFFIX, JSON.stringify(snapshotBase(value)));
}

// ---------------------------------------------------------------------------
// Synkstatus (diskret indikator)

export type CloudSyncStatus = "saved" | "pending" | "error";
const keyStatus = new Map<string, CloudSyncStatus>();
const statusListeners = new Set<() => void>();
let aggregate: CloudSyncStatus = "saved";

function setKeyStatus(key: string, s: CloudSyncStatus) {
  if (keyStatus.get(key) === s) return;
  keyStatus.set(key, s);
  const values = [...keyStatus.values()];
  const next: CloudSyncStatus = values.includes("error")
    ? "error"
    : values.includes("pending")
      ? "pending"
      : "saved";
  if (next !== aggregate) {
    aggregate = next;
    statusListeners.forEach((l) => l());
  }
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return aggregate;
}

export function useCloudSyncStatus(): CloudSyncStatus {
  return useSyncExternalStore(
    (cb) => {
      statusListeners.add(cb);
      return () => statusListeners.delete(cb);
    },
    () => aggregate,
    () => "saved",
  );
}

// ---------------------------------------------------------------------------
// Själva synken – en körning åt gången per nyckel

const running = new Map<string, Promise<void>>();
const rerun = new Set<string>();
const debounces = new Map<string, ReturnType<typeof setTimeout>>();
const retries = new Map<string, { timer: ReturnType<typeof setTimeout>; step: number }>();
const mountedKeys = new Map<string, number>();

type Row = { value: unknown; updated_at: string };

function scheduleRetry(key: string) {
  const prev = retries.get(key);
  if (prev) clearTimeout(prev.timer);
  const step = Math.min(prev ? prev.step + 1 : 0, RETRY_STEPS_MS.length - 1);
  const timer = setTimeout(() => {
    void requestSync(key);
  }, RETRY_STEPS_MS[step]);
  retries.set(key, { timer, step });
}

function clearRetry(key: string) {
  const prev = retries.get(key);
  if (prev) clearTimeout(prev.timer);
  retries.delete(key);
}

async function syncOnce(key: string): Promise<void> {
  if (isSensitiveKey(key)) {
    await unlockSecureLocal();
    // Krypterat men oläsbart just nu: skicka aldrig ett "tomt" värde.
    const raw = lsGet(key);
    if (raw !== null && raw.startsWith("enc:v1:") && secureGetItem(key) === null) {
      setKeyStatus(key, "pending");
      return;
    }
  }
  const user = await getSyncUser();
  if (!user) {
    if (hasUnsyncedCloudData(key)) setKeyStatus(key, "pending");
    return;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase
      .from("user_kv")
      .select("value, updated_at")
      .eq("user_id", user.id)
      .eq("key", key)
      .maybeSingle();
    if (!isActiveOwner(user.id)) return; // kontot byttes under tiden
    if (error) {
      setKeyStatus(key, hasUnsyncedCloudData(key) ? "error" : "saved");
      if (hasUnsyncedCloudData(key)) scheduleRetry(key);
      return;
    }
    const row = data as Row | null;
    const unsynced = hasUnsyncedCloudData(key);

    if (!unsynced) {
      // Inget lokalt att skicka: molnet är sanningen.
      if (row) {
        const cloudValue = withoutRemoved(key, row.value);
        if (JSON.stringify(cloudValue) !== JSON.stringify(currentValue(key))) {
          writeLocal(key, cloudValue);
        }
        const ts = new Date(row.updated_at).getTime();
        markConfirmed(key, Math.max(ts, readMeta(key, META_SUFFIX)), cloudValue);
      }
      clearRetry(key);
      setKeyStatus(key, "saved");
      return;
    }

    const revision = revisions.get(key) ?? 0;
    const editStamp = readMeta(key, META_SUFFIX) || Date.now();
    const local = currentValue(key);

    if (!row && isEmptyValue(key, local)) {
      markConfirmed(key, editStamp, local);
      setKeyStatus(key, "saved");
      return;
    }

    const merged = row
      ? mergeSyncValues({
          base: readBase(key),
          local,
          cloud: row.value,
          removed: new Set(readRemoved(key)),
          localUpdatedAt: editStamp,
          cloudUpdatedAt: new Date(row.updated_at).getTime(),
        })
      : local;

    let writeError: { code?: string } | null = null;
    let wrote = false;
    if (row) {
      const res = await supabase
        .from("user_kv")
        .update({ value: merged as never })
        .eq("user_id", user.id)
        .eq("key", key)
        .eq("updated_at", row.updated_at)
        .select("updated_at");
      writeError = res.error;
      wrote = !res.error && Array.isArray(res.data) && res.data.length > 0;
    } else {
      const res = await supabase
        .from("user_kv")
        .insert({ user_id: user.id, key, value: merged as never })
        .select("updated_at");
      writeError = res.error;
      wrote = !res.error;
      if (res.error?.code === "23505") {
        writeError = null; // en annan enhet hann först – läs om och slå ihop
      }
    }

    if (writeError) {
      setKeyStatus(key, "error");
      scheduleRetry(key);
      return;
    }
    if (!wrote) continue; // molnet ändrades mellan läsning och skrivning

    // Skrivet. Visa det sammanslagna värdet om ingen ny ändring kommit under tiden.
    if ((revisions.get(key) ?? 0) === revision) {
      if (JSON.stringify(merged) !== JSON.stringify(local)) writeLocal(key, merged);
      markConfirmed(key, editStamp, merged);
      clearRetry(key);
      setKeyStatus(key, "saved");
    } else {
      // Nya ändringar under skrivningen: basen är det som nu ligger i molnet.
      lsSet(key + BASE_SUFFIX, JSON.stringify(snapshotBase(merged)));
      lsSet(key + SYNCED_SUFFIX, String(editStamp));
      rerun.add(key);
    }
    return;
  }
  // Fyra krockar i rad: försök igen lite senare.
  setKeyStatus(key, "pending");
  scheduleRetry(key);
}

/** Synkar en nyckel nu (eller direkt efter pågående körning). */
export function requestSync(key: string): Promise<void> {
  const d = debounces.get(key);
  if (d) {
    clearTimeout(d);
    debounces.delete(key);
  }
  const current = running.get(key);
  if (current) {
    rerun.add(key);
    return current;
  }
  const p = (async () => {
    try {
      do {
        rerun.delete(key);
        await syncOnce(key);
      } while (rerun.has(key));
    } catch {
      setKeyStatus(key, "error");
      scheduleRetry(key);
    } finally {
      running.delete(key);
    }
  })();
  running.set(key, p);
  return p;
}

function scheduleSync(key: string) {
  setKeyStatus(key, "pending");
  const d = debounces.get(key);
  if (d) clearTimeout(d);
  debounces.set(
    key,
    setTimeout(() => {
      debounces.delete(key);
      void requestSync(key);
    }, DEBOUNCE_MS),
  );
}

/**
 * Skriver upp allt som väntar (debounce eller osynkat). Anropas före
 * utloggning så att inget går förlorat bara för att timern inte hann gå.
 */
export async function flushCloudSync(): Promise<void> {
  const keys = new Set<string>([...debounces.keys(), ...mountedKeys.keys()]);
  await Promise.all(
    [...keys]
      .filter((k) => debounces.has(k) || hasUnsyncedCloudData(k) || running.has(k))
      .map((k) => requestSync(k).catch(() => undefined)),
  );
}

// Globala triggers: nätet tillbaka, appen i förgrunden, konto bundet.
let globalsInstalled = false;
function installGlobals() {
  if (globalsInstalled || typeof window === "undefined") return;
  globalsInstalled = true;
  let last = 0;
  const refreshAll = () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - last < 3000) return;
    last = now;
    for (const key of mountedKeys.keys()) void requestSync(key);
  };
  const onOnline = () => {
    last = 0;
    for (const key of mountedKeys.keys()) {
      clearRetry(key);
      void requestSync(key);
    }
  };
  document.addEventListener("visibilitychange", refreshAll);
  window.addEventListener("focus", refreshAll);
  window.addEventListener("online", onOnline);
  window.addEventListener(ACCOUNT_BOUND_EVENT, onOnline);
  // Värden som lästs före upplåsning eller ändrats i en annan flik ska läsas om.
  window.addEventListener(SECURE_UNLOCK_EVENT, () => sharedValues.clear());
  window.addEventListener("storage", (e) => {
    if (e.key) sharedValues.delete(e.key);
  });
}

function handleIncoming(key: string, payload: { eventType: string; value: unknown }) {
  // Lokala osynkade ändringar: slå ihop via vanlig synk i stället för att skriva över.
  if (hasUnsyncedCloudData(key) || debounces.has(key) || running.has(key)) {
    void requestSync(key);
    return;
  }
  if (payload.eventType === "DELETE") {
    writeLocal(key, initialValues.get(key));
    lsSet(key + BASE_SUFFIX, JSON.stringify(snapshotBase(initialValues.get(key))));
    return;
  }
  if (payload.value === undefined) return;
  const incoming = withoutRemoved(key, payload.value);
  writeLocal(key, incoming);
  markConfirmed(key, Math.max(Date.now(), readMeta(key, META_SUFFIX)), incoming);
  setKeyStatus(key, "saved");
}

/** Endast för tester. */
export function __resetCloudSync(): void {
  for (const d of debounces.values()) clearTimeout(d);
  for (const r of retries.values()) clearTimeout(r.timer);
  debounces.clear();
  retries.clear();
  running.clear();
  rerun.clear();
  sharedValues.clear();
  keyStatus.clear();
  revisions.clear();
  aggregate = "saved";
  cachedUser = null;
}

/** Endast för tester: registrera en nyckel utan React. */
export function __registerKeyForTest(key: string, initial: unknown): void {
  initialValues.set(key, initial);
}

/** Lokal ändring utan React (samma väg som hookens setter). */
export function applyLocalChange<T>(key: string, update: T | ((prev: T) => T)): T {
  const current = currentValue<T>(key);
  const next = applyCloudStorageUpdate(current, update);
  revisions.set(key, (revisions.get(key) ?? 0) + 1);
  lsSet(key + META_SUFFIX, String(Math.max(Date.now(), readMeta(key, META_SUFFIX) + 1)));
  rememberRemoved(key, current, next);
  sharedValues.set(key, next);
  try {
    secureSetItem(key, JSON.stringify(next));
  } catch {
    /* full lagring – värdet finns i minnet och skickas till molnet */
  }
  return next;
}

/**
 * localStorage-baserat state som också synkas till user_kv när användaren
 * är inloggad. Fungerar offline; molnet slås ihop enligt sync-merge.ts.
 */
export function useCloudSyncedStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage<T>(key, initialValue);
  if (!initialValues.has(key)) initialValues.set(key, initialValue);

  useEffect(() => {
    installGlobals();
    registerCloudKey(key);
    mountedKeys.set(key, (mountedKeys.get(key) ?? 0) + 1);
    void requestSync(key);
    return () => {
      const n = (mountedKeys.get(key) ?? 1) - 1;
      if (n <= 0) mountedKeys.delete(key);
      else mountedKeys.set(key, n);
      // Debouncen lever vidare på modulnivå – en dialog som stängs inom
      // fönstret tappar alltså inte sin ändring.
    };
  }, [key]);

  // Liveuppdatering mellan öppna enheter.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getSyncUser().then((user) => {
      if (!user || cancelled) return;
      unsubscribe = subscribeToAccountTable("user_kv", user.id, (payload) => {
        if (payload.new.key !== key && payload.old.key !== key) return;
        if (!isActiveOwner(user.id)) return;
        handleIncoming(key, { eventType: payload.eventType, value: payload.new.value });
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [key]);

  const setAndStamp = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = applyLocalChange<T>(key, v);
      setValue(next);
      scheduleSync(key);
    },
    [key, setValue],
  );

  return [value, setAndStamp] as const;
}

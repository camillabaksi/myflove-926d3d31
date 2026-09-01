import { useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const META_SUFFIX = "__updated_at";

// Varje synkad nyckel behöver veta vem som är inloggad. Utan cache blir det
// ett nätverksanrop per nyckel (70+ per sidladdning) – vi delar ett svar
// mellan alla hooks och nollställer det när inloggningen ändras.
let cachedUser: { user: User | null } | null = null;
let inflightUser: Promise<User | null> | null = null;

export async function getSyncUser(): Promise<User | null> {
  if (cachedUser) return cachedUser.user;
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
  return inflightUser;
}

supabase.auth.onAuthStateChange(() => {
  cachedUser = null;
});

/**
 * Bekräftad molnkopia.
 *
 * `key__updated_at` säger när värdet ändrades lokalt, `key__synced_at` när
 * molnet senast bekräftade en skrivning. Är synced_at äldre än updated_at
 * finns det lokala ändringar som ännu inte nått molnet – då får utloggningen
 * inte radera den lokala kopian (se local-data.ts).
 */
const SYNCED_SUFFIX = "__synced_at";
/** Alla nycklar som migrerats från lokal lagring till molnsynk. */
export const CLOUD_USER_DATA_KEYS = new Set([
  "myflow-tasks",
  "myflow-reminders",
  "myflow-moods",
  "myflow-shopping",
  "myflow-focus",
  "myflow-focus-completed-count",
  "myflow-dump-ideas",
  "myflow-saved-stores",
  "myflow-saved-trips",
  "myflove-flow-usage",
  "myflove-quickflow",
  "myflove-quickflow-priority",
  "myflove-notes",
  "myflove-medications",
  "myflove-medication-log",
  "myflove-budget",
  "myflow-finances",
]);
/** Lista över nycklar som hanteras av molnsynken (device-nyckel, rensas ej). */
export const CLOUD_KEYS_REGISTRY = "myflove-cloud-keys";

function readRegistry(): string[] {
  try {
    const raw = window.localStorage.getItem(CLOUD_KEYS_REGISTRY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function registerCloudKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    const keys = readRegistry();
    if (keys.includes(key)) return;
    window.localStorage.setItem(CLOUD_KEYS_REGISTRY, JSON.stringify([...keys, key]));
  } catch {
    /* utan lagring finns inget register */
  }
}

function readMeta(key: string, suffix: string): number {
  try {
    const raw = window.localStorage.getItem(key + suffix);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/** Finns det lokala ändringar för nyckeln som molnet ännu inte bekräftat? */
export function hasUnsyncedCloudData(key: string): boolean {
  if (typeof window === "undefined") return false;
  // Använd både registret och den fasta listan. Registret kan sakna en nyckel
  // om utloggningen sker precis innan en sida hunnit montera sin hook.
  if (!readRegistry().includes(key) && !CLOUD_USER_DATA_KEYS.has(key)) return false;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return false;
  }
  if (raw === null) return false;
  const updated = readMeta(key, META_SUFFIX);
  const synced = readMeta(key, SYNCED_SUFFIX);
  // Aldrig synkad men har innehåll → betrakta som osynkad.
  if (synced === 0) return true;
  return synced < updated;
}

/** Alla monterade synkade nycklar – används för en sista flush före utloggning. */
const flushers = new Set<() => Promise<void>>();

/**
 * Skriver upp allt som ligger och väntar i debounce-fönstret. Anropas före
 * utloggning så att ingenting går förlorat bara för att timern inte hann gå.
 */
export async function flushCloudSync(): Promise<void> {
  await Promise.all([...flushers].map((f) => f().catch(() => undefined)));
}

/**
 * localStorage-backed state that also syncs to public.user_kv when the user
 * is signed in. Last-write-wins based on a locally tracked updated_at.
 * Offline still works — cloud is best-effort.
 */
export function useCloudSyncedStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage<T>(key, initialValue);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const initialRef = useRef(initialValue);
  const valueRef = useRef(value);
  valueRef.current = value;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getLocalUpdatedAt = () => readMeta(key, META_SUFFIX);

  const setLocalUpdatedAt = (ts: number) => {
    try {
      window.localStorage.setItem(key + META_SUFFIX, String(ts));
    } catch {
      /* ignore */
    }
  };

  const setLocalSyncedAt = (ts: number) => {
    try {
      window.localStorage.setItem(key + SYNCED_SUFFIX, String(ts));
    } catch {
      /* ignore */
    }
  };

  // Är det lokala värdet fortfarande "tomt" (samma som standardvärdet)?
  // Då får det aldrig skriva över något i molnet.
  const isLocalEmpty = () => {
    try {
      return JSON.stringify(valueRef.current) === JSON.stringify(initialRef.current);
    } catch {
      return false;
    }
  };

  /**
   * Skriver upp nuvarande värde och bekräftar synken först när molnet
   * svarat utan fel. Vid nätverksfel lämnas synced_at orört, så den lokala
   * kopian räknas fortfarande som osynkad och skyddas vid utloggning.
   */
  const pushNow = useCallback(async () => {
    const user = await getSyncUser();
    if (!user) return;
    const stamp = Date.now();
    setLocalUpdatedAt(stamp);
    const { error } = await supabase.from("user_kv").upsert({
      user_id: user.id,
      key,
      value: valueRef.current as never,
    });
    if (!error) setLocalSyncedAt(stamp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Registrera nyckeln + flush-funktionen så länge hooken är monterad.
  useEffect(() => {
    registerCloudKey(key);
    const flush = async () => {
      if (!dirtyRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      await pushNow();
    };
    flushers.add(flush);
    return () => {
      flushers.delete(flush);
    };
  }, [key, pushNow]);

  // Initial hydration from cloud
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getSyncUser();
      if (!user || cancelled) return;

      const { data, error } = await supabase
        .from("user_kv")
        .select("value, updated_at")
        .eq("user_id", user.id)
        .eq("key", key)
        .maybeSingle();

      if (cancelled) return;

      // Läsningen misslyckades – rör inte molnet, annars riskerar vi att
      // skriva över riktig data med en tom lista.
      if (error) return;

      const localTs = getLocalUpdatedAt();
      if (data) {
        const cloudTs = new Date(data.updated_at as string).getTime();
        if (!dirtyRef.current && (cloudTs >= localTs || isLocalEmpty())) {
          setValue(data.value as T);
          setLocalUpdatedAt(cloudTs);
          setLocalSyncedAt(cloudTs);
          hydratedRef.current = true;
          return;
        }
      }

      hydratedRef.current = true;

      // Inget i molnet och inget lokalt att spara – gör ingenting.
      if (isLocalEmpty()) return;

      await pushNow();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pushNow]);

  // Push local changes to cloud (debounced) – bara efter en avsiktlig ändring.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!dirtyRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void pushNow();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, key, pushNow]);

  // Nätet kom tillbaka – försök igen med det som inte hunnit bekräftas.
  useEffect(() => {
    const retry = () => {
      if (hasUnsyncedCloudData(key)) void pushNow();
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [key, pushNow]);

  const setAndStamp = useCallback(
    (v: T | ((prev: T) => T)) => {
      dirtyRef.current = true;
      setLocalUpdatedAt(Date.now());
      setValue(v);
    },

    // setLocalUpdatedAt är en lokal setter och behöver inte stå med här.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue],
  );

  return [value, setAndStamp] as const;
}

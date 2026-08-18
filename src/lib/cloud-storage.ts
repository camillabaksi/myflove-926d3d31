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
 * localStorage-backed state that also syncs to public.user_kv when the user
 * is signed in. Last-write-wins based on a locally tracked updated_at.
 * Offline still works — cloud is best-effort.
 */
export function useCloudSyncedStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage<T>(key, initialValue);
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getLocalUpdatedAt = () => {
    try {
      const raw = window.localStorage.getItem(key + META_SUFFIX);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  };

  const setLocalUpdatedAt = (ts: number) => {
    try {
      window.localStorage.setItem(key + META_SUFFIX, String(ts));
    } catch {
      /* ignore */
    }
  };

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

      const localTs = getLocalUpdatedAt();
      if (!error && data) {
        const cloudTs = new Date(data.updated_at as string).getTime();
        if (cloudTs >= localTs) {
          setValue(data.value as T);
          setLocalUpdatedAt(cloudTs);
          hydratedRef.current = true;
          return;
        }
      }

      // Local is newer (or cloud is empty) — push up.
      hydratedRef.current = true;
      const nowTs = Date.now();
      setLocalUpdatedAt(nowTs);
      await supabase.from("user_kv").upsert({
        user_id: user.id,
        key,
        value: value as never,
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Push local changes to cloud (debounced)
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const user = await getSyncUser();
      if (!user) return;
      setLocalUpdatedAt(Date.now());
      await supabase.from("user_kv").upsert({
        user_id: user.id,
        key,
        value: value as never,
      });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key]);

  const setAndStamp = useCallback(
    (v: T | ((prev: T) => T)) => {
      setLocalUpdatedAt(Date.now());
      setValue(v);
    },
    [setValue],
  );

  return [value, setAndStamp] as const;
}

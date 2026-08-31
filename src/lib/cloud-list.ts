import { useEffect, useRef } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export interface CloudListEntry {
  id: string;
  date?: number;
}

/**
 * Kontobunden lista (user_kv) med skonsam migrering av lokal data.
 *
 * Molnet är source of truth, men om användaren redan har poster lokalt
 * (från tiden då listan bara låg i localStorage) slås de ihop med molnets
 * poster en gång strax efter start. Sammanslagningen sker per id, så inget
 * skrivs över och inga dubbletter skapas. Lokal data raderas aldrig innan
 * den har hunnit läggas upp i molnet.
 */
export function useCloudSyncedList<T extends CloudListEntry>(key: string) {
  const [items, setItems] = useCloudSyncedStorage<T[]>(key, []);
  const seen = useRef(new Map<string, T>());
  const mergedRef = useRef(false);

  if (!mergedRef.current) {
    for (const item of Array.isArray(items) ? items : []) {
      if (item && typeof item.id === "string" && !seen.current.has(item.id)) {
        seen.current.set(item.id, item);
      }
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mergedRef.current = true;
      setItems((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const known = new Set(current.map((i) => i.id));
        const missing = [...seen.current.values()].filter((i) => !known.has(i.id));
        if (missing.length === 0) return current;
        return [...missing, ...current].sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [setItems]);

  return [items, setItems] as const;
}

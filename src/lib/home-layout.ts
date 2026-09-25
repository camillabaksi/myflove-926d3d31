import { useEffect, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Vilka block Hem visar och i vilken ordning.
 *
 * Hem = fyra primära widgets (Kalender, QuickFlow, Mitt batteri, Logga energi
 * & mående) som ALLTID visas högst upp – de är sidans genvägar och styrs inte
 * av anpassningen. Nedanför dem kan användaren slå av/på sekundära block:
 * hälsningen ligger alltid överst och går inte att stänga av.
 */
export type HomeBlockId = "barnens-dag" | "medicin" | "omrade";

export interface HomeBlockMeta {
  id: HomeBlockId;
  label: string;
  hint: string;
}

export const HOME_BLOCKS: HomeBlockMeta[] = [
  {
    id: "barnens-dag",
    label: "Barnens dag",
    hint: "Visa valda barns aktiviteter på Hem",
  },
  {
    id: "medicin",
    label: "Rutiner & medicin",
    hint: "Dagens rutiner och doser – bocka av med ett tryck",
  },
  { id: "omrade", label: "Områdesväljare", hint: "Vilket rum du är i" },
];

export interface HomeLayoutPrefs {
  hidden: HomeBlockId[];
  order: HomeBlockId[];
}

export const DEFAULT_PREFS: HomeLayoutPrefs = {
  hidden: ["barnens-dag"],
  order: ["barnens-dag", "medicin", "omrade"],
};

const STORAGE_KEY = "myflove-home-layout";
/**
 * Återställning: Hem fick fyra fasta widgets i stället för de gamla
 * konkurrerande blocken – gamla sparade ordrar/hidden nollställs en gång.
 */
const CLEANUP_MIGRATION_KEY = "myflove-home-layout-children-opt-in-3";

/** Filtrerar bort gamla block och återställer sekundärblockens standardordning. */
export function cleanupOrder(order: HomeBlockId[] | undefined): HomeBlockId[] {
  const known = new Set(
    (order ?? []).filter((id): id is HomeBlockId => HOME_BLOCKS.some((b) => b.id === id)),
  );
  return DEFAULT_PREFS.order.filter((id) => known.has(id));
}

export function useHomeLayout() {
  const [prefs, setPrefs] = useCloudSyncedStorage<HomeLayoutPrefs>(STORAGE_KEY, DEFAULT_PREFS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(CLEANUP_MIGRATION_KEY)) return;
    window.localStorage.setItem(CLEANUP_MIGRATION_KEY, "1");
    setPrefs((current) => ({
      order: cleanupOrder(current?.order),
      hidden: Array.from(new Set([...(current?.hidden ?? []), "barnens-dag"])),
    }));
  }, [setPrefs]);

  const order = useMemo<HomeBlockId[]>(() => {
    const valid = (prefs?.order ?? []).filter((id): id is HomeBlockId =>
      HOME_BLOCKS.some((b) => b.id === id),
    );
    const missing = HOME_BLOCKS.map((b) => b.id).filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  }, [prefs?.order]);

  const hidden = useMemo(() => prefs?.hidden ?? [], [prefs?.hidden]);
  const visible = useMemo(() => order.filter((id) => !hidden.includes(id)), [order, hidden]);

  const toggle = (id: HomeBlockId) =>
    setPrefs((p) => {
      const current = p?.hidden ?? [];
      return {
        order: p?.order ?? DEFAULT_PREFS.order,
        hidden: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      };
    });

  const move = (id: HomeBlockId, dir: -1 | 1) =>
    setPrefs((p) => {
      const arr = [...order];
      const i = arr.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return p ?? DEFAULT_PREFS;
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      return { hidden: p?.hidden ?? [], order: arr };
    });

  const reset = () => setPrefs(DEFAULT_PREFS);

  return { order, hidden, visible, toggle, move, reset };
}

import { useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Vilka block Hem visar och i vilken ordning.
 * Hälsningen ligger alltid överst och går inte att stänga av.
 */
export type HomeBlockId =
  | "batteri"
  | "nasta"
  | "forslag"
  | "lagg-till"
  | "genvagar"
  | "vagar"
  | "omrade"
  | "gjort"
  | "energifloede";

export interface HomeBlockMeta {
  id: HomeBlockId;
  label: string;
  hint: string;
}

export const HOME_BLOCKS: HomeBlockMeta[] = [
  { id: "batteri", label: "Mitt batteri", hint: "Din energi just nu" },
  { id: "nasta", label: "Nästa", hint: "Nästa sak som händer idag" },
  { id: "forslag", label: "Flow-förslag", hint: "Ett förslag – samma som Flow → NU" },
  { id: "lagg-till", label: "Lägg till", hint: "Snabbknapp för ny uppgift" },
  { id: "genvagar", label: "Dina genvägar", hint: "Fyra egna favoriter du väljer själv" },
  { id: "vagar", label: "Korta vägar", hint: "Min dag · QuickFlow · Flow" },
  { id: "omrade", label: "Områdesväljare", hint: "Vilket rum du är i" },
  { id: "gjort", label: "Lägg till det du gjorde", hint: "Snabb registrering av vardagssaker" },
  { id: "energifloede", label: "Dagens energiflöde", hint: "Planerat · Vardag · Spontant · Återhämtning" },
];

export interface HomeLayoutPrefs {
  hidden: HomeBlockId[];
  order: HomeBlockId[];
}

const DEFAULT_PREFS: HomeLayoutPrefs = {
  hidden: [],
  order: HOME_BLOCKS.map((b) => b.id),
};

const STORAGE_KEY = "myflove-home-layout";

export function useHomeLayout() {
  const [prefs, setPrefs] = useCloudSyncedStorage<HomeLayoutPrefs>(STORAGE_KEY, DEFAULT_PREFS);

  const order = useMemo<HomeBlockId[]>(() => {
    const valid = (prefs?.order ?? []).filter((id) => HOME_BLOCKS.some((b) => b.id === id));
    const missing = HOME_BLOCKS.map((b) => b.id).filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  }, [prefs?.order]);

  const hidden = useMemo<HomeBlockId[]>(() => prefs?.hidden ?? [], [prefs?.hidden]);
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

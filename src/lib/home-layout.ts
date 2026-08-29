import { useEffect, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Vilka block Hem visar och i vilken ordning.
 * Hälsningen ligger alltid överst och går inte att stänga av.
 */
export type HomeBlockId =
  | "batteri"
  | "nasta"
  | "medicin"
  | "idag"
  | "forslag"
  | "lagg-till"
  | "vagar"
  | "omrade";

export interface HomeBlockMeta {
  id: HomeBlockId;
  label: string;
  hint: string;
}

export const HOME_BLOCKS: HomeBlockMeta[] = [
  { id: "batteri", label: "Mitt energibatteri", hint: "Din energi just nu" },
  { id: "nasta", label: "Nästa", hint: "Nästa sak som händer idag" },
  {
    id: "medicin",
    label: "Rutiner & medicin",
    hint: "Dagens rutiner och doser – bocka av med ett tryck",
  },
  {
    id: "idag",
    label: "Dagens översikt",
    hint: "Kort sammanfattning – hela listan finns i Idag",
  },
  { id: "forslag", label: "Rekommendation just nu", hint: "Ett förslag – samma som i Planera" },
  { id: "lagg-till", label: "Lägg till", hint: "Snabbknapp för ny uppgift" },
  { id: "vagar", label: "Vad behöver du just nu?", hint: "Fyra vanliga situationer" },
  { id: "omrade", label: "Områdesväljare", hint: "Vilket rum du är i" },
];

export interface HomeLayoutPrefs {
  hidden: HomeBlockId[];
  order: HomeBlockId[];
}

// Clean-up 1.0: Hem visar max sex block. Resten slås på i "Anpassa hemskärmen".

export const DEFAULT_PREFS: HomeLayoutPrefs = {
  // Hem är appens samlade överblick igen: alla block syns som komprimerade
  // widgets. Ingen information göms – den ligger i expanderat läge.
  hidden: [],

  order: ["batteri", "forslag", "nasta", "idag", "lagg-till", "vagar", "medicin", "omrade"],
};

const STORAGE_KEY = "myflove-home-layout";
/** Återställning: Hem visar åter allt innehåll som block – körs en gång. */
const CLEANUP_MIGRATION_KEY = "myflove-home-layout-restore-1";

/** Sorterar användarens ordning efter Clean-up-ordningen, okända block sist. */
export function cleanupOrder(order: HomeBlockId[] | undefined): HomeBlockId[] {
  const known = (order ?? []).filter((id) => HOME_BLOCKS.some((b) => b.id === id));
  const missing = DEFAULT_PREFS.order.filter((id) => !known.includes(id));
  const all = [...known, ...missing];
  return [...all].sort((a, b) => DEFAULT_PREFS.order.indexOf(a) - DEFAULT_PREFS.order.indexOf(b));
}

export function useHomeLayout() {
  const [prefs, setPrefs] = useCloudSyncedStorage<HomeLayoutPrefs>(STORAGE_KEY, DEFAULT_PREFS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(CLEANUP_MIGRATION_KEY)) return;
    window.localStorage.setItem(CLEANUP_MIGRATION_KEY, "1");
    setPrefs(() => ({ order: DEFAULT_PREFS.order, hidden: DEFAULT_PREFS.hidden }));
  }, [setPrefs]);

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

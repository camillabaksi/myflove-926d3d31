import { useEffect, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Vilka block Hem visar och i vilken ordning.
 * Hälsningen ligger alltid överst och går inte att stänga av.
 */
export type HomeBlockId =
  | "checkin"
  | "batteri"
  | "nasta"
  | "medicin"
  | "idag"
  | "forslag"
  | "lagg-till"
  | "vagar"
  | "omrade"
  | "energifloede";

export interface HomeBlockMeta {
  id: HomeBlockId;
  label: string;
  hint: string;
}

export const HOME_BLOCKS: HomeBlockMeta[] = [
  {
    id: "checkin",
    label: "Hur är det just nu?",
    hint: "Snabb registrering av mående och energi",
  },
  { id: "batteri", label: "Mitt energibatteri", hint: "Din energi just nu" },
  { id: "nasta", label: "Nästa", hint: "Nästa sak som händer idag" },
  {
    id: "medicin",
    label: "Rutiner & medicin",
    hint: "Dagens rutiner och doser – bocka av med ett tryck",
  },
  { id: "idag", label: "Dagens saker", hint: "Bocka av dagens saker och se vad du redan gjort" },
  { id: "forslag", label: "Rekommendation just nu", hint: "Ett förslag – samma som i Planera" },
  { id: "lagg-till", label: "Lägg till", hint: "Snabbknapp för ny uppgift" },
  { id: "vagar", label: "Vad behöver du just nu?", hint: "Fyra vanliga situationer" },
  { id: "omrade", label: "Områdesväljare", hint: "Vilket rum du är i" },
  {
    id: "energifloede",
    label: "Energins historik",
    hint: "Mönster över dagen – batteriet är fortfarande din energibild",
  },
];

export interface HomeLayoutPrefs {
  hidden: HomeBlockId[];
  order: HomeBlockId[];
}

// Clean-up 1.0: Hem visar max sex block. Resten slås på i "Anpassa hemskärmen".

export const DEFAULT_PREFS: HomeLayoutPrefs = {
  // Lugn start: Hem svarar på "vad behöver jag veta eller göra just nu?".
  hidden: ["checkin", "energifloede", "medicin", "omrade", "vagar"],

  order: [
    "batteri",
    "forslag",
    "nasta",
    "idag",
    "lagg-till",
    "checkin",
    "energifloede",
    "vagar",
    "medicin",
    "omrade",
  ],
};

const STORAGE_KEY = "myflove-home-layout";
/** Clean-up 1.0: en lugnare hemskärm med max sex block – körs en gång. */
const CLEANUP_MIGRATION_KEY = "myflove-home-layout-cleanup-1";

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

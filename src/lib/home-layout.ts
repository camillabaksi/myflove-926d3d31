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
  | "genvagar"
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
  { id: "idag", label: "Dagens saker", hint: "Bocka av dagens saker och se vad du redan gjort" },
  { id: "forslag", label: "Rekommendation just nu", hint: "Ett förslag – samma som i Planera" },
  { id: "lagg-till", label: "Lägg till", hint: "Snabbknapp för ny uppgift" },
  { id: "genvagar", label: "Dina genvägar", hint: "Fyra egna favoriter du väljer själv" },
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

// Lugn start: bara det som ger nytta direkt. Resten slås på i "Anpassa hemskärmen".
// De fyra snabbalternativen ("vagar") ligger högt – de täcker redan
// "Lägg till", "Jag gjorde något" och "Lägg till det du gjorde".
const DEFAULT_PREFS: HomeLayoutPrefs = {
  hidden: ["lagg-till", "omrade", "genvagar"],

  order: [
    "checkin",
    "batteri",
    "energifloede",
    "nasta",
    "vagar",
    "idag",
    "forslag",
    "lagg-till",
    "genvagar",
    "omrade",
  ],
};

const STORAGE_KEY = "myflove-home-layout";
/** Engångsflytt: Energins historik direkt under batteriet, "Nästa" före snabbalternativen. */
const MIGRATION_KEY = "myflove-home-layout-migrated-energifloede-v2";

function normalizeOrder(order: HomeBlockId[] | undefined): HomeBlockId[] {
  const base = order ?? DEFAULT_PREFS.order;
  const withoutFlow = base.filter((id) => id !== "energifloede");
  const atBattery = withoutFlow.indexOf("batteri");
  const withFlow =
    atBattery >= 0
      ? [
          ...withoutFlow.slice(0, atBattery + 1),
          "energifloede" as HomeBlockId,
          ...withoutFlow.slice(atBattery + 1),
        ]
      : base;

  // Säkerställ önskad ordning mellan "nasta" och "vagar".
  const iNasta = withFlow.indexOf("nasta");
  const iVagar = withFlow.indexOf("vagar");
  if (iNasta >= 0 && iVagar >= 0 && iNasta > iVagar) {
    const next = [...withFlow];
    next.splice(iNasta, 1);
    next.splice(iVagar, 0, "nasta");
    return next;
  }
  return withFlow;
}

export function useHomeLayout() {
  const [prefs, setPrefs] = useCloudSyncedStorage<HomeLayoutPrefs>(STORAGE_KEY, DEFAULT_PREFS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(MIGRATION_KEY)) return;
    window.localStorage.setItem(MIGRATION_KEY, "1");
    setPrefs((p) => {
      const nextOrder = normalizeOrder(p?.order);
      return {
        order: nextOrder,
        hidden: (p?.hidden ?? []).filter((id) => id !== "energifloede"),
      };
    });
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

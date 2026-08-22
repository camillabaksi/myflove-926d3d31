import { useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Vilka block Hem visar och i vilken ordning.
 * Hälsningen ligger alltid överst och går inte att stänga av.
 */
export type HomeBlockId =
  | "checkin"
  | "batteri"
  | "gjort-knapp"
  | "nasta"
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
  {
    id: "gjort-knapp",
    label: "Jag gjorde något",
    hint: "Snabbknapp för att registrera något du redan gjort",
  },
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
  hidden: ["gjort-knapp", "lagg-till", "energifloede", "omrade", "genvagar"],

  order: [
    "checkin",
    "batteri",
    "vagar",
    "nasta",
    "idag",
    "forslag",
    "gjort-knapp",
    "lagg-till",
    "genvagar",
    "omrade",
    "energifloede",
  ],
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

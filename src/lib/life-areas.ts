// Livsområden – MyFlove Blueprint: "En hjärna. Inte sju appar."
// Användaren får separata rum för olika delar av livet, men Flow ser helheten.

import { useMemo } from "react";
import { useLocalStorage } from "./storage";

export type LifeArea = "vardag" | "studier" | "jobb" | "privat";
export type AreaFilter = LifeArea | "alla";

export interface AreaMeta {
  id: LifeArea;
  label: string;
  emoji: string;
  blurb: string;
  /** true = alltid på, kan inte stängas av */
  core?: boolean;
  /** HSL-värde för områdets ton (matchar den lila paletten) */
  hue: string;
}

export const AREA_META: Record<LifeArea, AreaMeta> = {
  vardag: {
    id: "vardag",
    label: "Vardag",
    emoji: "🏠",
    blurb: "Kalender, att göra, rutiner och påminnelser",
    core: true,
    hue: "258 62% 60%",
  },
  privat: {
    id: "privat",
    label: "Privat",
    emoji: "🏡",
    blurb: "Familj, ärenden, inköp, räkningar och bokningar",
    core: true,
    hue: "327 62% 62%",
  },
  studier: {
    id: "studier",
    label: "Studier",
    emoji: "🎓",
    blurb: "Kurser, inlämningar, deadlines och dokument",
    hue: "232 58% 64%",
  },
  jobb: {
    id: "jobb",
    label: "Jobb",
    emoji: "💼",
    blurb: "Arbetsuppgifter, möten, projekt och uppföljningar",
    hue: "212 48% 52%",
  },
};

export const ALL_AREAS: LifeArea[] = ["vardag", "privat", "studier", "jobb"];
const CORE_AREAS: LifeArea[] = ALL_AREAS.filter((a) => AREA_META[a].core);

const AREAS_KEY = "myflove-areas";
const ONBOARDED_KEY = "myflove-areas-onboarded";
const ACTIVE_KEY = "myflove-active-area";

/** Vilka livsområden användaren valt vid onboarding. Vardag + Privat är alltid på. */
export function useEnabledAreas() {
  const [stored, setStored] = useLocalStorage<LifeArea[]>(AREAS_KEY, CORE_AREAS);
  const [onboarded, setOnboarded] = useLocalStorage<boolean>(ONBOARDED_KEY, false);

  const enabled = useMemo(() => {
    const set = new Set<LifeArea>([...CORE_AREAS, ...stored.filter((a) => AREA_META[a])]);
    return ALL_AREAS.filter((a) => set.has(a));
  }, [stored]);

  const toggleArea = (area: LifeArea) => {
    if (AREA_META[area].core) return;
    setStored((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const setAreas = (areas: LifeArea[]) => {
    setStored(Array.from(new Set([...CORE_AREAS, ...areas])));
  };

  return {
    enabled,
    isEnabled: (a: LifeArea) => enabled.includes(a),
    toggleArea,
    setAreas,
    onboarded,
    completeOnboarding: () => setOnboarded(true),
    resetOnboarding: () => setOnboarded(false),
  };
}

/** Vilket rum användaren tittar i just nu. "alla" = Flow ser helheten. */
export function useActiveArea() {
  const [active, setActive] = useLocalStorage<AreaFilter>(ACTIVE_KEY, "alla");
  const { enabled } = useEnabledAreas();

  const safeActive: AreaFilter =
    active !== "alla" && !enabled.includes(active) ? "alla" : active;

  return { activeArea: safeActive, setActiveArea: setActive, enabled };
}

/** Området en ny sak ska hamna i när man skapar den i ett visst rum. */
export function defaultAreaFor(filter: AreaFilter): LifeArea {
  return filter === "alla" ? "vardag" : filter;
}

/**
 * Livsområdet "Familj" heter numera "Relationer" och bor i rummet Privat.
 * Äldre uppgifter, händelser och påminnelser mappas om automatiskt så att
 * historiken behåller sitt sammanhang.
 */
export const LEGACY_AREA_MAP: Record<string, LifeArea> = {
  familj: "privat",
  family: "privat",
  relationer: "privat",
};

export function normalizeArea(area?: string | null): LifeArea {
  if (area && AREA_META[area as LifeArea]) return area as LifeArea;
  if (area && LEGACY_AREA_MAP[area]) return LEGACY_AREA_MAP[area]!;
  return "vardag";
}

export function getArea(item: { area?: LifeArea }): LifeArea {
  return normalizeArea(item.area);
}

/** Filtrerar en lista på aktivt område. "alla" visar allt. */
export function filterByArea<T extends { area?: LifeArea }>(
  items: T[],
  filter: AreaFilter,
): T[] {
  if (filter === "alla") return items;
  return items.filter((i) => getArea(i) === filter);
}

/** Inline-stil med områdets färg – används för prickar, kanter och chips. */
export function areaColor(area: LifeArea): string {
  return `hsl(${AREA_META[area].hue})`;
}

export function areaTint(area: LifeArea, alpha = 0.12): string {
  return `hsl(${AREA_META[area].hue} / ${alpha})`;
}

/** Färgsatt chip-stil för ett område. */
export function areaChipStyle(area: LifeArea, active = true) {
  return active
    ? {
        color: areaColor(area),
        backgroundColor: areaTint(area, 0.14),
        borderColor: areaTint(area, 0.4),
      }
    : { borderColor: areaTint(area, 0.35) };
}

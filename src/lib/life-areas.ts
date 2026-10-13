// Livsområden – MyFlove Blueprint: "En hjärna. Inte sju appar."
// Användaren får separata rum för olika delar av livet, men Flow ser helheten.

import { useMemo } from "react";

import { useCloudSyncedStorage } from "./cloud-storage";

export type LifeArea =
  | "vardag"
  | "studier"
  | "jobb"
  | "privat"
  | "barn"
  | "halsa"
  | "ekonomi"
  | "socialt"
  | "egentid";
export type AreaFilter = LifeArea | "alla";

export interface AreaMeta {
  id: LifeArea;
  label: string;
  emoji: string;
  blurb: string;
  /** true = alltid på, kan inte stängas av */
  core?: boolean;
  /** HSL-värde för områdets ton (färgen betyder LIVSOMRÅDE, aldrig status) */
  hue: string;
}

/**
 * Free-nivåns grunduppsättning: färdiga livsområden med färg, så att appen
 * fungerar direkt utan konfigurering. Premium kan senare lägga egna områden,
 * egna namn, emojis och färger ovanpå detta (se `src/lib/area-premium.ts`).
 */
export const AREA_META: Record<LifeArea, AreaMeta> = {
  vardag: {
    id: "vardag",
    label: "Hem",
    emoji: "🏠",
    blurb: "Vardag, hushåll, rutiner och påminnelser",
    core: true,
    hue: "150 45% 42%", // grön
  },
  privat: {
    id: "privat",
    label: "Familj",
    emoji: "👨‍👩‍👧",
    blurb: "Familj, relationer, ärenden och bokningar",
    core: true,
    hue: "327 62% 62%", // rosa
  },
  studier: {
    id: "studier",
    label: "Studier",
    emoji: "🎓",
    blurb: "Kurser, inlämningar, deadlines och dokument",
    hue: "265 60% 60%", // lila
  },
  barn: {
    id: "barn",
    label: "Barn",
    emoji: "🧒",
    blurb: "Barnens aktiviteter, scheman och att göra",
    hue: "20 70% 58%", // varm korall
  },
  jobb: {
    id: "jobb",
    label: "Arbete",
    emoji: "💼",
    blurb: "Arbetsuppgifter, möten, projekt och uppföljningar",
    hue: "212 72% 52%", // blå
  },
  halsa: {
    id: "halsa",
    label: "Hälsa",
    emoji: "❤️",
    blurb: "Vård, medicin, träning och återhämtning",
    hue: "28 85% 55%", // orange
  },
  ekonomi: {
    id: "ekonomi",
    label: "Ekonomi",
    emoji: "💰",
    blurb: "Räkningar, budget och pengar",
    hue: "45 85% 48%", // gul
  },
  socialt: {
    id: "socialt",
    label: "Socialt",
    emoji: "🤝",
    blurb: "Vänner, kontakter och sociala planer",
    hue: "350 72% 62%", // rosa/korall
  },
  egentid: {
    id: "egentid",
    label: "Egen tid",
    emoji: "🌙",
    blurb: "Vila, intressen och tid som bara är din",
    hue: "285 45% 55%", // dovt lila
  },
};

export const ALL_AREAS: LifeArea[] = [
  "vardag",
  "privat",
  "barn",
  "studier",
  "jobb",
  "halsa",
  "ekonomi",
  "socialt",
  "egentid",
];
const CORE_AREAS: LifeArea[] = ALL_AREAS.filter((a) => AREA_META[a].core);

const AREAS_KEY = "myflove-areas";
const ONBOARDED_KEY = "myflove-areas-onboarded";
const ACTIVE_KEY = "myflove-active-area";

/** Vilka livsområden användaren valt vid onboarding. Vardag + Privat är alltid på. */
export function useEnabledAreas() {
  const [stored, setStored] = useCloudSyncedStorage<LifeArea[]>(AREAS_KEY, CORE_AREAS);
  const [onboarded, setOnboarded] = useCloudSyncedStorage<boolean>(ONBOARDED_KEY, false);

  const enabled = useMemo(() => {
    const set = new Set<LifeArea>([...CORE_AREAS, ...stored.filter((a) => AREA_META[a])]);
    return ALL_AREAS.filter((a) => set.has(a));
  }, [stored]);

  const toggleArea = (area: LifeArea) => {
    if (AREA_META[area].core) return;
    setStored((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
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
  const [active, setActive] = useCloudSyncedStorage<AreaFilter>(ACTIVE_KEY, "alla");
  const { enabled } = useEnabledAreas();

  const safeActive: AreaFilter = active !== "alla" && !enabled.includes(active) ? "alla" : active;

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
export function filterByArea<T extends { area?: LifeArea }>(items: T[], filter: AreaFilter): T[] {
  if (filter === "alla") return items;
  return items.filter((i) => getArea(i) === filter);
}

/** Inline-stil med områdets färg – används för prickar, kanter och chips. */
export function areaColor(area: LifeArea): string {
  return `hsl(var(--calendar-${area}, ${AREA_META[area].hue}))`;
}

export function areaTint(area: LifeArea, alpha = 0.12): string {
  return `hsl(var(--calendar-${area}, ${AREA_META[area].hue}) / ${alpha})`;
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

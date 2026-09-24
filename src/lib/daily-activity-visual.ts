import {
  activityPresetForTitle,
  CATEGORY_LABELS,
  type PictogramId,
  type VisualActivityCategory,
  type VisualActivityTone,
} from "@/lib/child-visual-schedule";
import { AREA_META, type LifeArea } from "@/lib/life-areas";
import type { FlowItem } from "@/lib/flow-items";

export interface DailyActivityVisual {
  pictogram: PictogramId;
  tone: VisualActivityTone;
  label: string;
  category?: VisualActivityCategory;
  colorArea?: LifeArea;
}

const AREA_FALLBACK: Record<LifeArea, PictogramId> = {
  vardag: "task",
  privat: "family",
  barn: "childcare",
  studier: "study",
  jobb: "work",
  halsa: "doctor",
  ekonomi: "money",
  socialt: "friends",
  egentid: "rest",
};

const AREA_TONE: Record<LifeArea, VisualActivityTone> = {
  vardag: "mint",
  privat: "blush",
  barn: "blush",
  studier: "sky",
  jobb: "sky",
  halsa: "sun",
  ekonomi: "sun",
  socialt: "blush",
  egentid: "lavender",
};

const CATEGORY_AREA: Record<VisualActivityCategory, LifeArea> = {
  hemma: "vardag",
  hygien: "egentid",
  mat: "vardag",
  skola: "studier",
  transport: "vardag",
  fritid: "socialt",
  "träning": "halsa",
  "återhämtning": "egentid",
  familj: "privat",
  "vård": "halsa",
};

/** Visuell tolkning av samma FlowItem – ingen ny aktivitet eller lagring skapas. */
export function dailyActivityVisual(item: FlowItem): DailyActivityVisual {
  const preset = activityPresetForTitle(item.title);

  if (item.area === "barn") {
    return {
      pictogram: preset?.pictogram ?? AREA_FALLBACK.barn,
      tone: preset?.tone ?? AREA_TONE.barn,
      label: "Familj · Barn",
      colorArea: "privat",
    };
  }

  if (item.area !== "vardag") {
    return {
      pictogram: preset?.pictogram ?? AREA_FALLBACK[item.area],
      tone: preset?.tone ?? AREA_TONE[item.area],
      label: AREA_META[item.area].label,
      colorArea: item.area,
    };
  }

  if (preset) {
    return {
      pictogram: preset.pictogram,
      tone: preset.tone,
      label: CATEGORY_LABELS[preset.category],
      category: preset.category,
      colorArea: CATEGORY_AREA[preset.category],
    };
  }

  if (item.source === "rutin") {
    return { pictogram: "task", tone: "lavender", label: "Rutiner", category: "hygien", colorArea: "egentid" };
  }

  if (item.source === "kalender") {
    return { pictogram: "calendar", tone: "lavender", label: "Kalender", colorArea: "vardag" };
  }

  return {
    pictogram: AREA_FALLBACK.vardag,
    tone: AREA_TONE.vardag,
    label: AREA_META.vardag.label,
    colorArea: "vardag",
  };
}
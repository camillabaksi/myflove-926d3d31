import { addDaysISO, parseISODate, toISODate } from "@/lib/day";
import type { CapacityLevel } from "@/lib/adaptive-activity";

export type VisualActivityCategory = "hemma" | "skola" | "transport" | "fritid" | "återhämtning";
export type VisualActivityTone = "lavender" | "blush" | "mint" | "sky" | "sun";

export interface VisualActivityMeta {
  emoji: string;
  category: VisualActivityCategory;
  tone: VisualActivityTone;
}

export interface ActivityBankItem extends VisualActivityMeta {
  title: string;
}

export const ACTIVITY_BANK: Record<VisualActivityCategory, ActivityBankItem[]> = {
  hemma: [
    { title: "Frukost", emoji: "🍎", category: "hemma", tone: "sun" },
    { title: "Äta", emoji: "🍽️", category: "hemma", tone: "sun" },
    { title: "Klä på sig", emoji: "👕", category: "hemma", tone: "blush" },
    { title: "Borsta tänderna", emoji: "🪥", category: "hemma", tone: "sky" },
    { title: "Duscha", emoji: "🛁", category: "hemma", tone: "sky" },
    { title: "Sova", emoji: "😴", category: "hemma", tone: "lavender" },
    { title: "Packa väskan", emoji: "🎒", category: "hemma", tone: "mint" },
    { title: "Lugn stund", emoji: "🎧", category: "hemma", tone: "lavender" },
  ],
  skola: [
    { title: "Skola", emoji: "🏫", category: "skola", tone: "sky" },
    { title: "Rast", emoji: "☀️", category: "skola", tone: "sun" },
    { title: "Lunch", emoji: "🍽️", category: "skola", tone: "sun" },
    { title: "Läxa", emoji: "📚", category: "skola", tone: "lavender" },
    { title: "Fritids", emoji: "🧩", category: "skola", tone: "mint" },
  ],
  transport: [
    { title: "Gå", emoji: "🚶", category: "transport", tone: "mint" },
    { title: "Bil", emoji: "🚗", category: "transport", tone: "sky" },
    { title: "Buss", emoji: "🚌", category: "transport", tone: "sun" },
    { title: "Tåg", emoji: "🚆", category: "transport", tone: "lavender" },
  ],
  fritid: [
    { title: "Lek", emoji: "🧸", category: "fritid", tone: "blush" },
    { title: "Kompis", emoji: "👫", category: "fritid", tone: "blush" },
    { title: "Träning", emoji: "⚽", category: "fritid", tone: "mint" },
    { title: "Spela", emoji: "🎮", category: "fritid", tone: "lavender" },
    { title: "TV", emoji: "📺", category: "fritid", tone: "sky" },
    { title: "Pyssla", emoji: "🎨", category: "fritid", tone: "sun" },
  ],
  återhämtning: [
    { title: "Paus", emoji: "🌿", category: "återhämtning", tone: "mint" },
    { title: "Lugn stund", emoji: "🎧", category: "återhämtning", tone: "lavender" },
    { title: "Hörlurar", emoji: "🎧", category: "återhämtning", tone: "sky" },
    { title: "Vila", emoji: "🛋️", category: "återhämtning", tone: "blush" },
  ],
};

export const CATEGORY_LABELS: Record<VisualActivityCategory, string> = {
  hemma: "Hemma",
  skola: "Skola",
  transport: "Transport",
  fritid: "Fritid",
  återhämtning: "Återhämtning",
};

export const VISUAL_TONES: VisualActivityTone[] = ["lavender", "blush", "mint", "sky", "sun"];

const META_PREFIX = "[myflove-visual:";

export function encodeVisualNotes(meta: VisualActivityMeta, note = ""): string {
  return `${META_PREFIX}${JSON.stringify(meta)}]\n${note.trim()}`.trim();
}

export function decodeVisualNotes(notes?: string | null): { meta: VisualActivityMeta; note: string } {
  const fallback: VisualActivityMeta = { emoji: "⭐", category: "hemma", tone: "lavender" };
  if (!notes?.startsWith(META_PREFIX)) return { meta: fallback, note: notes ?? "" };
  const end = notes.indexOf("]\n");
  if (end < 0) return { meta: fallback, note: notes };
  try {
    const value: unknown = JSON.parse(notes.slice(META_PREFIX.length, end));
    if (!value || typeof value !== "object") return { meta: fallback, note: notes.slice(end + 2) };
    const candidate = value as Partial<VisualActivityMeta>;
    const category = candidate.category;
    const tone = candidate.tone;
    if (!category || !(category in ACTIVITY_BANK) || !tone || !VISUAL_TONES.includes(tone)) {
      return { meta: fallback, note: notes.slice(end + 2) };
    }
    return {
      meta: { emoji: typeof candidate.emoji === "string" ? candidate.emoji : "⭐", category, tone },
      note: notes.slice(end + 2),
    };
  } catch {
    return { meta: fallback, note: notes.slice(end + 2) };
  }
}

export function startOfWeekISO(dateISO: string): string {
  const date = parseISODate(dateISO);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toISODate(date);
}

export function weekDates(dateISO: string): string[] {
  const monday = startOfWeekISO(dateISO);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(monday, index));
}

export function activityDedupKey(input: { childId: string; title: string; date?: string | null; time?: string | null }) {
  return [input.childId, input.date ?? "", input.time?.slice(0, 5) ?? "", input.title.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim()].join("|");
}

export function dayPart(time?: string | null): "Morgon" | "Dag" | "Efter skolan" | "Kväll" {
  if (!time) return "Dag";
  const hour = Number(time.slice(0, 2));
  if (hour < 10) return "Morgon";
  if (hour < 15) return "Dag";
  if (hour < 18) return "Efter skolan";
  return "Kväll";
}

export interface ScheduleGuidance {
  capacity: CapacityLevel;
  message: string | null;
  recovery: string | null;
}

export function getScheduleGuidance(count: number, capacity: CapacityLevel): ScheduleGuidance {
  const busyLimit = capacity === "låg" ? 4 : capacity === "medel" ? 6 : 8;
  const busy = count >= busyLimit;
  return {
    capacity,
    message: busy
      ? "Det här ser ut som en ganska full dag. Vill du göra planen lite enklare?"
      : null,
    recovery:
      count >= 3
        ? "En lugn stund mellan aktiviteterna kan ge mer luft. Du väljer själv om den ska läggas in."
        : null,
  };
}

export function transitionPrompt(title: string, minutes = 10): string {
  return `Om ${minutes} minuter är det dags för ${title.toLocaleLowerCase("sv")}.`;
}
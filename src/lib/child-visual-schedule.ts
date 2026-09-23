import { addDaysISO, parseISODate, toISODate } from "@/lib/day";
import type { CapacityLevel } from "@/lib/adaptive-activity";

export type VisualActivityCategory = "hemma" | "skola" | "mat" | "hygien" | "transport" | "fritid" | "träning" | "återhämtning" | "familj";
export type VisualActivityTone = "lavender" | "blush" | "mint" | "sky" | "sun";
export type PictogramId = "breakfast" | "meal" | "dress" | "teeth" | "shower" | "sleep" | "bag" | "home" | "school" | "break" | "study" | "childcare" | "walk" | "car" | "bus" | "train" | "bike" | "play" | "friends" | "exercise" | "swim" | "game" | "tv" | "craft" | "music" | "pause" | "quiet" | "headphones" | "rest" | "family" | "visit";

export interface VisualActivityMeta {
  /** Legacy value retained only so old saved activities decode safely. */
  emoji?: string;
  pictogram: PictogramId;
  category: VisualActivityCategory;
  tone: VisualActivityTone;
}

export interface ActivityBankItem extends VisualActivityMeta { title: string; keywords?: string[] }

export const ACTIVITY_BANK: Record<VisualActivityCategory, ActivityBankItem[]> = {
  hemma: [
    { title: "Klä på sig", pictogram: "dress", category: "hemma", tone: "blush" },
    { title: "Packa väskan", pictogram: "bag", category: "hemma", tone: "mint" },
    { title: "Hemma", pictogram: "home", category: "hemma", tone: "lavender" },
  ],
  skola: [
    { title: "Skola", pictogram: "school", category: "skola", tone: "sky" },
    { title: "Rast", pictogram: "break", category: "skola", tone: "sun" },
    { title: "Läxa", pictogram: "study", category: "skola", tone: "lavender", keywords: ["bok", "studera"] },
    { title: "Fritids", pictogram: "childcare", category: "skola", tone: "mint" },
  ],
  mat: [
    { title: "Frukost", pictogram: "breakfast", category: "mat", tone: "sun" },
    { title: "Mellanmål", pictogram: "breakfast", category: "mat", tone: "mint" },
    { title: "Lunch", pictogram: "meal", category: "mat", tone: "sun" },
    { title: "Middag", pictogram: "meal", category: "mat", tone: "blush" },
    { title: "Äta", pictogram: "meal", category: "mat", tone: "sun" },
  ],
  hygien: [
    { title: "Borsta tänderna", pictogram: "teeth", category: "hygien", tone: "sky", keywords: ["tandborstning"] },
    { title: "Duscha", pictogram: "shower", category: "hygien", tone: "sky" },
    { title: "Sova", pictogram: "sleep", category: "hygien", tone: "lavender", keywords: ["läggdags", "sömn"] },
  ],
  transport: [
    { title: "Gå", pictogram: "walk", category: "transport", tone: "mint" },
    { title: "Cykla", pictogram: "bike", category: "transport", tone: "mint" },
    { title: "Bil", pictogram: "car", category: "transport", tone: "sky" },
    { title: "Buss", pictogram: "bus", category: "transport", tone: "sun" },
    { title: "Tåg", pictogram: "train", category: "transport", tone: "lavender" },
  ],
  fritid: [
    { title: "Lek", pictogram: "play", category: "fritid", tone: "blush" },
    { title: "Kompis", pictogram: "friends", category: "fritid", tone: "blush" },
    { title: "Spela", pictogram: "game", category: "fritid", tone: "lavender" },
    { title: "TV", pictogram: "tv", category: "fritid", tone: "sky" },
    { title: "Pyssla", pictogram: "craft", category: "fritid", tone: "sun" },
    { title: "Musik", pictogram: "music", category: "fritid", tone: "lavender" },
  ],
  träning: [
    { title: "Träning", pictogram: "exercise", category: "träning", tone: "mint" },
    { title: "Simning", pictogram: "swim", category: "träning", tone: "sky" },
    { title: "Promenad", pictogram: "walk", category: "träning", tone: "mint" },
  ],
  återhämtning: [
    { title: "Paus", pictogram: "pause", category: "återhämtning", tone: "mint" },
    { title: "Lugn stund", pictogram: "quiet", category: "återhämtning", tone: "lavender" },
    { title: "Hörlurar", pictogram: "headphones", category: "återhämtning", tone: "sky" },
    { title: "Vila", pictogram: "rest", category: "återhämtning", tone: "blush" },
  ],
  familj: [
    { title: "Familjetid", pictogram: "family", category: "familj", tone: "blush" },
    { title: "Besök", pictogram: "visit", category: "familj", tone: "sun" },
  ],
};

export const CATEGORY_LABELS: Record<VisualActivityCategory, string> = { hemma: "Hemma", skola: "Skola", mat: "Mat", hygien: "Hygien", transport: "Transport", fritid: "Fritid", träning: "Träning", återhämtning: "Återhämtning", familj: "Familj" };
export const VISUAL_TONES: VisualActivityTone[] = ["lavender", "blush", "mint", "sky", "sun"];
export const ALL_PICTOGRAMS = Object.values(ACTIVITY_BANK).flat();
const VALID_PICTOGRAMS = new Set<PictogramId>(ALL_PICTOGRAMS.map((item) => item.pictogram));
const LEGACY_EMOJI: Record<string, PictogramId> = { "⭐": "home", "🎒": "bag", "🏫": "school", "🍎": "breakfast", "🍽️": "meal", "🪥": "teeth", "👕": "dress", "🛁": "shower", "😴": "sleep", "🎧": "headphones", "⚽": "exercise", "🏊": "swim", "🎨": "craft", "🚌": "bus", "🚗": "car", "🚆": "train", "🚶": "walk", "👫": "friends", "🌿": "pause", "🛋️": "rest", "📚": "study", "🎮": "game", "📺": "tv", "🧩": "play", "☀️": "break" };
const META_PREFIX = "[myflove-visual:";
const FALLBACK_META: VisualActivityMeta = { pictogram: "home", category: "hemma", tone: "lavender" };

export function encodeVisualNotes(meta: VisualActivityMeta, note = ""): string {
  const safeMeta = { pictogram: meta.pictogram, category: meta.category, tone: meta.tone };
  return `${META_PREFIX}${JSON.stringify(safeMeta)}]\n${note.trim()}`.trim();
}

export function decodeVisualNotes(notes?: string | null): { meta: VisualActivityMeta; note: string } {
  if (!notes?.startsWith(META_PREFIX)) return { meta: FALLBACK_META, note: notes ?? "" };
  const end = notes.indexOf("]\n");
  if (end < 0) return { meta: FALLBACK_META, note: notes };
  try {
    const value: unknown = JSON.parse(notes.slice(META_PREFIX.length, end));
    if (!value || typeof value !== "object") return { meta: FALLBACK_META, note: notes.slice(end + 2) };
    const candidate = value as Partial<VisualActivityMeta>;
    const category = candidate.category;
    const tone = candidate.tone;
    if (!category || !(category in ACTIVITY_BANK) || !tone || !VISUAL_TONES.includes(tone)) return { meta: FALLBACK_META, note: notes.slice(end + 2) };
    const legacy = typeof candidate.emoji === "string" ? LEGACY_EMOJI[candidate.emoji] : undefined;
    const pictogram = candidate.pictogram && VALID_PICTOGRAMS.has(candidate.pictogram) ? candidate.pictogram : legacy ?? "home";
    return { meta: { pictogram, category, tone }, note: notes.slice(end + 2) };
  } catch { return { meta: FALLBACK_META, note: notes.slice(end + 2) }; }
}

export function searchActivityBank(query: string, category?: VisualActivityCategory): ActivityBankItem[] {
  const normalized = query.toLocaleLowerCase("sv").trim();
  const source = category ? ACTIVITY_BANK[category] : ALL_PICTOGRAMS;
  if (!normalized) return source;
  return source.filter((item) => [item.title, ...(item.keywords ?? [])].some((text) => text.toLocaleLowerCase("sv").includes(normalized)));
}

export function startOfWeekISO(dateISO: string): string { const date = parseISODate(dateISO); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return toISODate(date); }
export function weekDates(dateISO: string): string[] { const monday = startOfWeekISO(dateISO); return Array.from({ length: 7 }, (_, index) => addDaysISO(monday, index)); }
export function activityDedupKey(input: { childId: string; title: string; date?: string | null; time?: string | null }) { return [input.childId, input.date ?? "", input.time?.slice(0, 5) ?? "", input.title.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim()].join("|"); }
export function shiftDateBetween(sourceDate: string, sourceAnchor: string, targetAnchor: string): string { const source = parseISODate(sourceDate); const anchor = parseISODate(sourceAnchor); const target = parseISODate(targetAnchor); const offset = Math.round((source.getTime() - anchor.getTime()) / 86400000); target.setDate(target.getDate() + offset); return toISODate(target); }
export function copiedVisualNotes(notes: string | null | undefined, includePrivateNote: boolean): string {
  const decoded = decodeVisualNotes(notes);
  return encodeVisualNotes(decoded.meta, includePrivateNote ? decoded.note : "");
}
export function dayPart(time?: string | null): "Morgon" | "Dag" | "Efter skolan" | "Kväll" { if (!time) return "Dag"; const hour = Number(time.slice(0, 2)); if (hour < 10) return "Morgon"; if (hour < 15) return "Dag"; if (hour < 18) return "Efter skolan"; return "Kväll"; }
export interface ScheduleGuidance { capacity: CapacityLevel; message: string | null; recovery: string | null }
export function getScheduleGuidance(count: number, capacity: CapacityLevel): ScheduleGuidance { const busyLimit = capacity === "låg" ? 4 : capacity === "medel" ? 6 : 8; const busy = count >= busyLimit; return { capacity, message: busy ? "Det här ser ut som en ganska full dag. Vill du göra planen lite enklare?" : null, recovery: count >= 3 ? "En lugn stund mellan aktiviteterna kan ge mer luft. Du väljer själv om den ska läggas in." : null }; }
export function transitionPrompt(title: string, minutes = 10): string { return `Om ${minutes} minuter är det dags för ${title.toLocaleLowerCase("sv")}.`; }

import { addDaysISO, parseISODate, toISODate } from "@/lib/day";
import type { CapacityLevel } from "@/lib/adaptive-activity";

export type VisualActivityCategory = "hemma" | "skola" | "mat" | "hygien" | "transport" | "fritid" | "träning" | "återhämtning" | "familj" | "vård";
export type VisualActivityTone = "lavender" | "blush" | "mint" | "sky" | "sun";
export type FamilyActivityLabel = "child" | "shared" | "caregiver";
export type PictogramId = "breakfast" | "meal" | "dress" | "teeth" | "shower" | "sleep" | "bag" | "home" | "clean" | "laundry" | "shopping" | "school" | "break" | "study" | "childcare" | "walk" | "car" | "bus" | "train" | "bike" | "play" | "friends" | "exercise" | "swim" | "game" | "tv" | "craft" | "music" | "pause" | "quiet" | "headphones" | "rest" | "family" | "visit" | "doctor" | "dentist" | "hospital" | "pharmacy" | "clinic" | "vaccination" | "nurse" | "examination" | "emergency" | "conversation" | "optician" | "hearing" | "physio" | "followup" | "work" | "money" | "calendar" | "task";

export interface VisualActivityMeta {
  /** Legacy value retained only so old saved activities decode safely. */
  emoji?: string;
  pictogram: PictogramId;
  category: VisualActivityCategory;
  tone: VisualActivityTone;
  /** Optional end time kept in the existing visual metadata envelope. */
  endTime?: string;
  /** Optional label inside the existing Family area; never a top-level area. */
  familyLabel?: FamilyActivityLabel;
  /**
   * Förälderns egen information om aktiviteten – aldrig ett energivärde och
   * aldrig något om barnets kapacitet. Allt är frivilligt.
   */
  parentPresence?: boolean;
  /** Förberedelse före, minuter. */
  prepMinutes?: number;
  /** Resa/förflyttning, minuter. */
  travelMinutes?: number;
  /** Användaren vill gärna ha en lugn stund efteråt. */
  recoveryAfter?: boolean;
  /** Förälderns egen ordning inom dagen. */
  order?: number;
}

/** Valbara minutvärden – inga påhittade siffror, användaren väljer själv. */
export const PREP_MINUTE_CHOICES = [5, 10, 15] as const;
export const TRAVEL_MINUTE_CHOICES = [5, 10, 15, 20] as const;

function safeMinutes(value: unknown, allowed: readonly number[]): number | undefined {
  return typeof value === "number" && allowed.includes(value) ? value : undefined;
}

export interface ActivityBankItem extends VisualActivityMeta { title: string; keywords?: string[] }

export const ACTIVITY_BANK: Record<VisualActivityCategory, ActivityBankItem[]> = {
  hemma: [
    { title: "Klä på sig", pictogram: "dress", category: "hemma", tone: "blush" },
    { title: "Packa", pictogram: "bag", category: "hemma", tone: "mint", keywords: ["packa väskan", "ryggsäck", "väska"] },
    { title: "Hemma", pictogram: "home", category: "hemma", tone: "lavender" },
    { title: "Städa", pictogram: "clean", category: "hemma", tone: "mint", keywords: ["städa rummet", "dammsuga", "plocka undan"] },
    { title: "Tvätta", pictogram: "laundry", category: "hemma", tone: "sky", keywords: ["tvätt", "tvättmaskin", "kläder"] },
    { title: "Handla", pictogram: "shopping", category: "hemma", tone: "sun", keywords: ["affär", "mataffär", "butik", "inköp"] },
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
    { title: "Fritid", pictogram: "game", category: "fritid", tone: "lavender", keywords: ["spela", "tv-spel", "gaming"] },
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
    { title: "Barnomsorg", pictogram: "childcare", category: "familj", tone: "mint", familyLabel: "child", keywords: ["barn", "omsorg", "passa barn"] },
    { title: "Hämta/lämna barn", pictogram: "bag", category: "familj", tone: "sky", familyLabel: "child", keywords: ["hämta barn", "lämna barn", "hämtning", "lämning"] },
    { title: "Lek", pictogram: "play", category: "familj", tone: "blush", familyLabel: "child", keywords: ["leka med barn"] },
    { title: "Barnets bad/dusch", pictogram: "shower", category: "familj", tone: "sky", familyLabel: "child", keywords: ["bada barn", "duscha barn"] },
    { title: "Borsta tänder", pictogram: "teeth", category: "familj", tone: "sky", familyLabel: "child", keywords: ["barnets tänder", "tandborstning"] },
    { title: "Barnets måltid", pictogram: "meal", category: "familj", tone: "sun", familyLabel: "child", keywords: ["barnmat", "äta med barn"] },
    { title: "Läggning", pictogram: "sleep", category: "familj", tone: "lavender", familyLabel: "child", keywords: ["lägga barn", "nattning", "sova"] },
    { title: "Lek/fri tid", pictogram: "game", category: "familj", tone: "blush", familyLabel: "child", keywords: ["fri lek", "fritid"] },
    { title: "Läsa med barn", pictogram: "study", category: "familj", tone: "lavender", familyLabel: "child", keywords: ["saga", "läsa bok", "högläsning"] },
    { title: "Förskola/skola", pictogram: "school", category: "familj", tone: "sky", familyLabel: "child", keywords: ["förskola", "skola", "fritids"] },
    { title: "Barnläkare/vårdbesök", pictogram: "doctor", category: "familj", tone: "blush", familyLabel: "child", keywords: ["barnläkare", "barnets vårdbesök", "läkarbesök"] },
    { title: "Barnets medicin", pictogram: "pharmacy", category: "familj", tone: "mint", familyLabel: "child", keywords: ["medicin barn", "läkemedel barn"] },
    { title: "Familjetid", pictogram: "family", category: "familj", tone: "blush", familyLabel: "shared" },
    { title: "Besök", pictogram: "visit", category: "familj", tone: "sun", familyLabel: "shared" },
    { title: "Förälder/omsorg", pictogram: "family", category: "familj", tone: "mint", familyLabel: "caregiver", keywords: ["förälder", "omsorg", "vuxen"] },
  ],
  vård: [
    { title: "Doktor", pictogram: "doctor", category: "vård", tone: "sky", keywords: ["läkare", "läkarbesök", "doktorsbesök"] },
    { title: "Tandläkare", pictogram: "dentist", category: "vård", tone: "sky", keywords: ["tandvård", "tänder", "tandhygienist"] },
    { title: "Sjukhus", pictogram: "hospital", category: "vård", tone: "lavender", keywords: ["sjukhusbesök", "mottagning"] },
    { title: "Apotek", pictogram: "pharmacy", category: "vård", tone: "mint", keywords: ["hämta medicin", "hämta läkemedel", "recept"] },
    { title: "Vårdcentral", pictogram: "clinic", category: "vård", tone: "sky", keywords: ["hälsocentral", "mottagning", "vårdbesök"] },
    { title: "Vaccination", pictogram: "vaccination", category: "vård", tone: "sun", keywords: ["vaccin", "spruta"] },
    { title: "Sjuksköterska", pictogram: "nurse", category: "vård", tone: "mint", keywords: ["sköterska", "sjuksköterskebesök"] },
    { title: "Undersökning", pictogram: "examination", category: "vård", tone: "sun", keywords: ["provtagning", "prov", "blodprov", "test"] },
    { title: "Akut vård", pictogram: "emergency", category: "vård", tone: "blush", keywords: ["akuten", "ambulans", "akutmottagning"] },
    { title: "Samtal", pictogram: "conversation", category: "vård", tone: "lavender", keywords: ["psykolog", "BUP", "kurator", "samtalsbesök"] },
    { title: "Optiker", pictogram: "optician", category: "vård", tone: "sky", keywords: ["syn", "synundersökning", "glasögon"] },
    { title: "Hörselmottagning", pictogram: "hearing", category: "vård", tone: "mint", keywords: ["hörsel", "audiolog", "öra", "hörseltest"] },
    { title: "Fysioterapi", pictogram: "physio", category: "vård", tone: "sun", keywords: ["rehab", "rehabilitering", "fysioterapeut", "sjukgymnastik"] },
    { title: "Återbesök", pictogram: "followup", category: "vård", tone: "lavender", keywords: ["vårdbesök", "uppföljning", "kontroll"] },
  ],
};

export const CATEGORY_LABELS: Record<VisualActivityCategory, string> = { hemma: "Hemma", skola: "Skola", mat: "Mat", hygien: "Rutiner", transport: "Transport", fritid: "Fritid", träning: "Aktivitet", återhämtning: "Återhämtning", familj: "Familj", vård: "Vård" };
export const FAMILY_LABELS: Record<FamilyActivityLabel, string> = { child: "Barn", shared: "Familj gemensamt", caregiver: "Förälder/omsorg" };
export const CATEGORY_STYLES: Record<VisualActivityCategory, { card: string; subtle: string; marker: string }> = {
  hemma: { card: "border-sun bg-sun/55", subtle: "border-sun/80 bg-sun/20", marker: "bg-sun" },
  skola: { card: "border-sky bg-sky/65", subtle: "border-sky/80 bg-sky/20", marker: "bg-sky" },
  mat: { card: "border-mint bg-mint/65", subtle: "border-mint/80 bg-mint/20", marker: "bg-mint" },
  hygien: { card: "border-lavender bg-lavender/70", subtle: "border-lavender bg-lavender/20", marker: "bg-lavender" },
  transport: { card: "border-border bg-secondary/80", subtle: "border-border bg-secondary/35", marker: "bg-muted-foreground/45" },
  fritid: { card: "border-blush bg-blush/65", subtle: "border-blush/80 bg-blush/20", marker: "bg-blush" },
  träning: { card: "border-sun bg-sun/75", subtle: "border-sun bg-sun/25", marker: "bg-sun" },
  återhämtning: { card: "border-mint bg-mint/75", subtle: "border-mint bg-mint/25", marker: "bg-mint" },
  familj: { card: "border-sky bg-mint/55", subtle: "border-sky/70 bg-mint/20", marker: "bg-sky" },
  vård: { card: "border-blush bg-blush/75", subtle: "border-blush bg-blush/25", marker: "bg-blush" },
};
export const VISUAL_TONES: VisualActivityTone[] = ["lavender", "blush", "mint", "sky", "sun"];
export const ALL_PICTOGRAMS = Object.values(ACTIVITY_BANK).flat();
const GENERIC_PICTOGRAMS: PictogramId[] = ["work", "money", "calendar", "task"];
const VALID_PICTOGRAMS = new Set<PictogramId>([
  ...ALL_PICTOGRAMS.map((item) => item.pictogram),
  ...GENERIC_PICTOGRAMS,
]);
const LEGACY_EMOJI: Record<string, PictogramId> = { "⭐": "home", "🎒": "bag", "🏫": "school", "🍎": "breakfast", "🍽️": "meal", "🪥": "teeth", "👕": "dress", "🧥": "dress", "🛁": "shower", "🚿": "shower", "😴": "sleep", "🎧": "headphones", "⚽": "exercise", "🏊": "swim", "🎨": "craft", "🚌": "bus", "🚗": "car", "🚆": "train", "🚶": "walk", "👫": "friends", "👭": "friends", "🌿": "pause", "🛋️": "rest", "📚": "study", "🎮": "game", "📺": "tv", "🧩": "play", "☀️": "break", "🛒": "shopping", "🧹": "clean", "🧺": "laundry", "👩‍⚕️": "doctor", "🧑‍⚕️": "nurse", "🦷": "dentist", "🏥": "hospital", "💊": "pharmacy", "🩺": "clinic", "💉": "vaccination", "🩹": "examination", "🚑": "emergency", "🧠": "conversation", "👓": "optician", "👂": "hearing", "🧑‍🦽": "physio", "📋": "followup" };
const META_PREFIX = "[myflove-visual:";
const FALLBACK_META: VisualActivityMeta = { pictogram: "home", category: "hemma", tone: "lavender" };

export function encodeVisualNotes(meta: VisualActivityMeta, note = ""): string {
  const safeMeta = {
    pictogram: meta.pictogram,
    category: meta.category,
    tone: meta.tone,
    ...(meta.endTime ? { endTime: meta.endTime } : {}),
    ...(meta.category === "familj" && meta.familyLabel ? { familyLabel: meta.familyLabel } : {}),
    ...(typeof meta.parentPresence === "boolean" ? { parentPresence: meta.parentPresence } : {}),
    ...(safeMinutes(meta.prepMinutes, PREP_MINUTE_CHOICES) ? { prepMinutes: meta.prepMinutes } : {}),
    ...(safeMinutes(meta.travelMinutes, TRAVEL_MINUTE_CHOICES) ? { travelMinutes: meta.travelMinutes } : {}),
    ...(meta.recoveryAfter ? { recoveryAfter: true } : {}),
    ...(typeof meta.order === "number" && Number.isFinite(meta.order) ? { order: Math.round(meta.order) } : {}),
  };
  return `${META_PREFIX}${JSON.stringify(safeMeta)}]\n${note.trim()}`;
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
    const endTime = typeof candidate.endTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(candidate.endTime) ? candidate.endTime : undefined;
    const familyLabel = category === "familj" && (candidate.familyLabel === "child" || candidate.familyLabel === "shared" || candidate.familyLabel === "caregiver") ? candidate.familyLabel : undefined;
    const prepMinutes = safeMinutes(candidate.prepMinutes, PREP_MINUTE_CHOICES);
    const travelMinutes = safeMinutes(candidate.travelMinutes, TRAVEL_MINUTE_CHOICES);
    return {
      meta: {
        pictogram,
        category,
        tone,
        ...(endTime ? { endTime } : {}),
        ...(familyLabel ? { familyLabel } : {}),
        ...(typeof candidate.parentPresence === "boolean" ? { parentPresence: candidate.parentPresence } : {}),
        ...(prepMinutes ? { prepMinutes } : {}),
        ...(travelMinutes ? { travelMinutes } : {}),
        ...(candidate.recoveryAfter === true ? { recoveryAfter: true } : {}),
        ...(typeof candidate.order === "number" && Number.isFinite(candidate.order) ? { order: candidate.order } : {}),
      },
      note: notes.slice(end + 2),
    };
  } catch { return { meta: FALLBACK_META, note: notes.slice(end + 2) }; }
}

export type ChildRepeatMode = "none" | "daily" | "weekdays" | "weekly";

export function activityOccursOn(item: { date: string | null; repeat: ChildRepeatMode }, date: string): boolean {
  if (!item.date || date < item.date) return false;
  if (item.repeat === "none") return item.date === date;
  const target = parseISODate(date);
  if (item.repeat === "daily") return true;
  if (item.repeat === "weekdays") return target.getDay() >= 1 && target.getDay() <= 5;
  const source = parseISODate(item.date);
  return target.getDay() === source.getDay();
}

export function minutesFromTime(time?: string | null): number | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(value: number): string {
  const safe = Math.max(0, Math.min(23 * 60 + 59, value));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function shiftEndTime(startTime: string | null, endTime: string | undefined, nextStartTime: string | null): string | undefined {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const nextStart = minutesFromTime(nextStartTime);
  if (start === null || end === null || nextStart === null) return endTime;
  return timeFromMinutes(nextStart + Math.max(0, end - start));
}

export function buildMultiMovePatches<T extends { id: string; date: string | null; time: string | null }>(
  items: T[],
  targetDate: string,
  targetTime?: string,
): Array<{ id: string; date: string; time: string | null }> {
  const sorted = [...items].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  const firstMinutes = minutesFromTime(sorted[0]?.time);
  const targetMinutes = minutesFromTime(targetTime);
  return sorted.map((item) => {
    const itemMinutes = minutesFromTime(item.time);
    const shifted = targetMinutes !== null && firstMinutes !== null && itemMinutes !== null
      ? timeFromMinutes(targetMinutes + itemMinutes - firstMinutes)
      : item.time?.slice(0, 5) ?? null;
    return { id: item.id, date: targetDate, time: shifted };
  });
}

export function searchActivityBank(query: string, category?: VisualActivityCategory): ActivityBankItem[] {
  const normalized = query.toLocaleLowerCase("sv").trim();
  const source = category ? ACTIVITY_BANK[category] : ALL_PICTOGRAMS;
  if (!normalized) return source;
  return source.filter((item) => [item.title, ...(item.keywords ?? [])].some((text) => text.toLocaleLowerCase("sv").includes(normalized)));
}

export function activityPresetForTitle(title: string): ActivityBankItem | undefined {
  const normalized = title.toLocaleLowerCase("sv").trim();
  const exact = ALL_PICTOGRAMS.find((item) => item.title.toLocaleLowerCase("sv") === normalized);
  if (exact) return exact;
  return ALL_PICTOGRAMS
    .flatMap((item) => [item.title, ...(item.keywords ?? [])].map((text) => ({ item, text: text.toLocaleLowerCase("sv") })))
    .filter(({ text }) => normalized.includes(text))
    .sort((a, b) => b.text.length - a.text.length)[0]?.item;
}

export function pictogramForActivity(title: string, fallback: PictogramId): PictogramId {
  const normalized = title.toLocaleLowerCase("sv").trim();
  const preset = activityPresetForTitle(title);
  if (preset) return preset.pictogram;
  if (/\b(jobb|jobba|arbete|arbetsdag|kund|möte|deadline)\b/.test(normalized)) return "work";
  if (/\b(räkning|faktura|betala|budget|lön|ekonomi)\b/.test(normalized)) return "money";
  return fallback;
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
/** Minuter från lokal "nu" (minuter sedan midnatt) till HH:MM. Negativ när tiden passerat. */
export function minutesUntilTime(time: string, nowMinutes: number): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0) - nowMinutes;
}

/** Lokal tid som minuter sedan midnatt – samma lokala klocka som lib/day. */
export function localNowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function transitionPrompt(title: string, minutes: number): string | null {
  const what = title.toLocaleLowerCase("sv");
  if (minutes < 0) return null;
  if (minutes === 0) return `Det är dags för ${what} nu.`;
  return `Om ${minutes} ${minutes === 1 ? "minut" : "minuter"} är det dags för ${what}.`;
}

/**
 * Nu/Nästa utifrån faktisk lokal tid. Nu = senast startade öppna aktivitet
 * (vars sluttid inte passerat); annars första öppna. Nästa = första öppna
 * aktivitet som startar efter nu.
 */
export function pickNowNext<T extends { time: string | null; notes?: string | null }>(open: T[], nowMinutes: number): { current: T | null; next: T | null } {
  const started = open.filter((item) => {
    if (!item.time) return false;
    if (minutesUntilTime(item.time, nowMinutes) > 0) return false;
    const end = decodeVisualNotes(item.notes ?? null).meta.endTime;
    return !end || minutesUntilTime(end, nowMinutes) > 0;
  });
  const current = started[started.length - 1] ?? open.find((item) => !item.time) ?? open.find((item) => item.time && minutesUntilTime(item.time, nowMinutes) > 0) ?? open[0] ?? null;
  const next = open.find((item) => item !== current && item.time && minutesUntilTime(item.time, nowMinutes) > 0) ?? null;
  return { current, next };
}

/** Sorterar en dags aktiviteter: egen ordning om satt, annars tid. */
export function compareDayItems(
  a: { time?: string | null; notes?: string | null; created_at?: string },
  b: { time?: string | null; notes?: string | null; created_at?: string },
): number {
  const oa = decodeVisualNotes(a.notes).meta.order;
  const ob = decodeVisualNotes(b.notes).meta.order;
  if (typeof oa === "number" && typeof ob === "number" && oa !== ob) return oa - ob;
  return (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || (a.created_at ?? "").localeCompare(b.created_at ?? "");
}

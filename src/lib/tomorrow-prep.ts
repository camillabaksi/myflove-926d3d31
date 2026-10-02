// "Imorgon med Flow" – förbereder bara det vi redan vet.
// Ren logik utan gissningar: förslag kommer ENDAST från text användaren själv
// skrivit (kalender, anteckningar, QuickFlow). Ingen energiprognos finns här.

export interface TomorrowEvent {
  id: string;
  title: string;
  time?: string;
  endTime?: string;
  note?: string;
  allDay?: boolean;
}

export interface PrepSuggestion {
  id: string;
  text: string;
  /** Varifrån förslaget kommer – visas som liten förklaring. */
  source: string;
}

export interface TravelHint {
  eventId: string;
  title: string;
  leaveAt: string;
  minutes: number;
}

const BRING_RE = /\b(?:ta med|tag med|glöm inte|kom ihåg)\s+([^.,;!?\n]{2,60})/gi;

function cap(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/** Sorterar på klockslag; heldag först. */
export function sortEvents(events: TomorrowEvent[]): TomorrowEvent[] {
  return [...events].sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"));
}

/** Förslag från kalenderns egna ord – aldrig påhittade krav. */
export function suggestFromEvents(events: TomorrowEvent[]): PrepSuggestion[] {
  const out: PrepSuggestion[] = [];
  const seen = new Set<string>();
  const push = (text: string, source: string) => {
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: `prep-${out.length}-${key.slice(0, 20)}`, text: cap(text), source });
  };
  for (const e of events) {
    const hay = `${e.title}. ${e.note ?? ""}`;
    for (const m of hay.matchAll(BRING_RE)) push(`Ta med ${m[1].trim()}`, e.title);
    if (/\b(träning|gym|gympa|simning|löpning|yoga)\b/i.test(e.title)) {
      push("Lägg fram träningskläder", e.title);
    }
  }
  return out;
}

/** Har händelsen en sparad möteslänk (Zoom/Teams/Meet)? */
export function hasMeetingLink(e: TomorrowEvent): boolean {
  return /https?:\/\/\S*(zoom\.us|teams\.microsoft|meet\.google)\S*/i.test(e.note ?? "");
}

export function isOnlineMeeting(e: TomorrowEvent): boolean {
  return /\b(zoom|teams|meet)\b/i.test(`${e.title} ${e.note ?? ""}`);
}

/** Plats, om användaren skrivit "Plats: …" eller "📍 …" i anteckningen. */
export function eventPlace(e: TomorrowEvent): string | undefined {
  const m = (e.note ?? "").match(/(?:plats:|📍)\s*([^\n]{2,60})/i);
  return m?.[1].trim();
}

/** Restid från anteckningen ("Restid: 35 min") → när det är dags att åka. */
export function travelHint(e: TomorrowEvent): TravelHint | null {
  if (!e.time) return null;
  const m = (e.note ?? "").match(/restid:?\s*(\d{1,3})\s*min/i);
  if (!m) return null;
  const minutes = Number(m[1]);
  const [h, mi] = e.time.split(":").map(Number);
  // Fem minuters marginal, avrundat nedåt till närmaste fem.
  let total = h * 60 + mi - minutes - 5;
  total = Math.max(0, Math.floor(total / 5) * 5);
  const leaveAt = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return { eventId: e.id, title: e.title, leaveAt, minutes };
}

/** QuickFlow-text som uttryckligen nämner imorgon. */
export function mentionsTomorrow(text: string): boolean {
  return /\bimorgon\b|\bi morgon\b/i.test(text);
}

/** Städar QuickFlow-texten till en kort "kom ihåg"-rad. */
export function quickflowReminderText(text: string): string {
  const cleaned = text
    .replace(/\b(måste|ska|behöver)\s+(komma ihåg|minnas)\s*/i, "")
    .replace(/\b(kom ihåg|glöm inte)\s*/i, "")
    .replace(/\bi ?morgon\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s.,!]+$/, "")
    .trim();
  return cap(cleaned || text);
}

export const EVENING_PREP_CHIPS = [
  "Packa dator",
  "Lägg fram kläder",
  "Ladda mobilen",
  "Ta fram dokument",
  "Förbered lunch",
];

/** Morgonens check-in: fyra svar → befintliga kapacitetslägen. */
export type MorningAnswer = "energi" | "lagom" | "lite" | "forsiktigt";
export const MORNING_TO_CAPACITY: Record<MorningAnswer, "fullt" | "mellan" | "lagt"> = {
  energi: "fullt",
  lagom: "mellan",
  lite: "lagt",
  forsiktigt: "lagt",
};

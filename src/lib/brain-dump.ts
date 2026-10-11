// TODO: Replace this simulated heuristic sorter with a real LLM call for smarter,
// more nuanced categorization if needed. For now it uses keyword matching so users
// get a useful "dump and sort" experience without backend infrastructure.

import { detectRepeat, type RepeatMode } from "./recurrence";
import { toISODate, todayISO } from "@/lib/day";

export type DumpCategory = "task" | "shopping" | "reminder" | "idea" | "mood";

export interface ParsedThought {
  text: string;
  category: DumpCategory;
  date?: string; // ISO date string, only set for "reminder"
  time?: string; // HH:MM, only set for "reminder"
  moodScore?: number; // 1-5, only set for "mood"
  repeat?: RepeatMode; // upprepning, bara relevant för "reminder"
}

const SHOPPING_KEYWORDS = [
  "köpa",
  "handla",
  "inköp",
  "affären",
  "mataffären",
  "ica",
  "coop",
  "willys",
  "mjölk",
  "bröd",
  "ägg",
  "grönsaker",
  "kaffe",
  "tvättmedel",
  "hushållspapper",
];

const IDEA_KEYWORDS = [
  "tänker på",
  "tänkte på",
  "fundera",
  "funderar",
  "kanske",
  "skulle vara kul",
  "idé",
  "idea",
  "undra",
  "önskar",
  "vore najs",
  "vore skönt",
];

const TASK_KEYWORDS = [
  "ringa",
  "boka",
  "betala",
  "fixa",
  "mejla",
  "maila",
  "skicka",
  "lämna",
  "hämta",
  "städa",
  "diska",
  "tvätta",
  "laga",
  "göra",
  "behöver",
  "måste",
  "ska",
  "påminn",
];

const MOOD_KEYWORDS = [
  "känner mig",
  "känns",
  "mår",
  "mående",
  "orkar inte",
  "orolig",
  "stressad",
  "trött",
  "ledsen",
  "nedstämd",
  "glad",
  "peppad",
  "taggad",
  "nöjd",
  "överväldigad",
  "ångest",
  "irriterad",
  "less",
];

const NEGATIVE_MOOD_WORDS = [
  "trött",
  "ledsen",
  "nedstämd",
  "orolig",
  "stressad",
  "orkar inte",
  "överväldigad",
  "ångest",
  "irriterad",
  "less",
  "dålig",
  "hopplös",
];

const POSITIVE_MOOD_WORDS = [
  "glad",
  "peppad",
  "taggad",
  "nöjd",
  "pigg",
  "stark",
  "bra",
  "toppen",
  "lugn",
];

const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

const toIsoDate = (d: Date): string => toISODate(d);

function resolveDate(lower: string): string | undefined {
  const today = new Date();

  if (lower.includes("idag")) return toIsoDate(today);
  if (lower.includes("imorgon") || lower.includes("i morgon")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  }
  if (lower.includes("övermorgon")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return toIsoDate(d);
  }
  if (lower.includes("nästa vecka")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return toIsoDate(d);
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    const weekday = WEEKDAYS[i] as string;
    if (lower.includes(weekday)) {
      const d = new Date(today);
      const currentDay = d.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return toIsoDate(d);
    }
  }

  return undefined;
}

function resolveTime(lower: string): string | undefined {
  const colonMatch = lower.match(/(\d{1,2})[:.](\d{2})/);
  if (colonMatch) {
    const hh = String(Math.min(23, Number(colonMatch[1]))).padStart(2, "0");
    const mm = String(Math.min(59, Number(colonMatch[2]))).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const klMatch = lower.match(/\bkl\.?\s?(\d{1,2})\b/) ?? lower.match(/\bklockan\s?(\d{1,2})\b/);
  if (klMatch) {
    const hh = String(Math.min(23, Number(klMatch[1]))).padStart(2, "0");
    return `${hh}:00`;
  }
  return undefined;
}

const HAS_DATE_SIGNAL = new RegExp(
  `\\b(idag|imorgon|i morgon|övermorgon|nästa vecka|${WEEKDAYS.join("|")})\\b`,
  "i",
);
const HAS_TIME_SIGNAL = /(\d{1,2}[:.]\d{2})|\bkl\.?\s?\d{1,2}\b|\bklockan\s?\d{1,2}\b/i;

function estimateMoodScore(lower: string): number {
  const negativeHits = NEGATIVE_MOOD_WORDS.filter((w) => lower.includes(w)).length;
  const positiveHits = POSITIVE_MOOD_WORDS.filter((w) => lower.includes(w)).length;
  if (negativeHits > positiveHits) return negativeHits >= 2 ? 1 : 2;
  if (positiveHits > negativeHits) return positiveHits >= 2 ? 5 : 4;
  return 3;
}

function categorize(text: string): {
  category: DumpCategory;
  date?: string;
  time?: string;
  moodScore?: number;
} {
  const lower = text.toLowerCase();

  if (SHOPPING_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "shopping" };
  }

  if (MOOD_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "mood", moodScore: estimateMoodScore(lower) };
  }

  if (HAS_DATE_SIGNAL.test(lower) || HAS_TIME_SIGNAL.test(lower)) {
    return { category: "reminder", date: resolveDate(lower), time: resolveTime(lower) };
  }

  if (IDEA_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "idea" };
  }

  if (TASK_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { category: "task" };
  }

  return { category: "idea" };
}

// Connector words people use when they string several distinct things together
// in one breath while talking or typing quickly, without proper punctuation.
const LIST_CONNECTORS =
  /\s+(?:och sedan|och sen|och sedan även|sedan|sen|också|dessutom|därefter|efter det)\s+/gi;

const TRIGGER_WORDS = [...TASK_KEYWORDS, ...SHOPPING_KEYWORDS, ...MOOD_KEYWORDS, "och"];

function splitOnConnectors(text: string): string[] {
  const parts = text
    .split(LIST_CONNECTORS)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1 && parts.every((p) => p.length > 2)) return parts;
  return [text];
}

function splitOnCommaList(text: string): string[] {
  if (!text.includes(",")) return [text];
  const segments = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length < 2) return [text];

  // Only split on commas when at least one later segment starts with a
  // recognizable action/feeling word — a strong signal these are separate
  // items in a spoken/typed list, not just a descriptive comma inside one thought.
  const looksLikeList = segments
    .slice(1)
    .some((seg) => TRIGGER_WORDS.some((w) => seg.toLowerCase().startsWith(w)));

  if (looksLikeList && segments.every((s) => s.length > 2)) return segments;
  return [text];
}

export function splitIntoThoughts(raw: string): string[] {
  const byLine = raw
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=\S)/))
    .flatMap(splitOnConnectors)
    .flatMap(splitOnCommaList)
    .map((t) =>
      t
        .replace(/^[-*•]\s*/, "")
        .replace(/[.,;]+$/, "")
        .trim(),
    )
    .filter((t) => t.length > 1);

  return byLine;
}

export function parseDump(raw: string): ParsedThought[] {
  return splitIntoThoughts(raw).map((text) => {
    const { category, date, time, moodScore } = categorize(text);
    const repeat = detectRepeat(text);
    if (repeat !== "none") {
      // "Ta medicin varje dag kl 7" hör hemma i kalendern, som återkommande.
      const start = date ?? todayISO();
      return { text, category: "reminder" as DumpCategory, date: start, time, repeat };
    }
    return { text, category, date, time, moodScore, repeat };
  });
}

export const CATEGORY_LABELS: Record<DumpCategory, string> = {
  task: "Att göra",
  shopping: "Inköp",
  reminder: "Kalender",
  idea: "Fånga",
  mood: "Mående",
};

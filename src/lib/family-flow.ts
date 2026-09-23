/**
 * Family Flow – samma kärnlogik som resten av MyFlove, fast för familjen.
 *
 * "Vad behöver fungera?" → "Vem gäller det?" → "Vad brukar hjälpa?"
 * → "Vilken kapacitet finns?" → "Vad är nästa rimliga steg?"
 *
 * Ren logik: ingen lagring, ingen ny aktivitetsmodell. Förslagen bygger på
 * befintlig adaptActivity (FlowScore/Mitt batteri) och på förälderns egna
 * observationer om barnet. Inga diagnoser, ingen medicinsk bedömning – bara
 * en mindre och mer rimlig version av det föräldern själv sagt.
 */
import { adaptActivity, type AdaptiveSuggestion } from "@/lib/adaptive-activity";

export type FamilySubject = "jag" | "barn" | "familjen";

/** Förslag föräldern kan välja bland – förälderns observationer, inte behovsbedömning. */
export const CHILD_HELP_OPTIONS = [
  "Förvarna vid förändringar",
  "Dela upp saker i små steg",
  "Extra tid vid övergångar",
  "Tydliga instruktioner",
  "Möjlighet att pausa",
  "Lugnt bemötande",
] as const;

/** Vad varje observation betyder som konkret första steg. */
const HELP_STEP: Record<string, string> = {
  "Förvarna vid förändringar": "Säg vad som händer härnäst innan ni byter aktivitet.",
  "Dela upp saker i små steg": "Ta en sak i taget – börja med den första.",
  "Extra tid vid övergångar": "Lägg in några extra minuter innan bytet.",
  "Tydliga instruktioner": "Ge en kort och tydlig instruktion i taget.",
  "Möjlighet att pausa": "Erbjud en kort paus innan nästa del.",
  "Lugnt bemötande": "Sänk tempot och prata lugnt en stund först.",
};

export interface FamilySituationInput {
  /** Fritext: "Jag måste få Bianca klar till skolan." */
  text: string;
  subject: FamilySubject;
  /** Barnets namn när situationen gäller ett barn. */
  childName?: string | null;
  /** Förälderns egna observationer om barnet. */
  helps?: string[];
  /** FlowScore 0–100 om det finns. Saknas den används neutral fallback. */
  score?: number | null;
  capacityMinutes?: number | null;
  adjust?: "mindre" | "större" | null;
}

export interface FamilySuggestion {
  headline: string;
  /** "Din kapacitet idag: låg" */
  capacityLine: string;
  /** Antal minuter kvar om föräldern skrivit "om 20 minuter". */
  minutesUntil: number | null;
  /** Fast klockslag i texten, t.ex. "14:00". */
  fixedTime: string | null;
  /** Rad om tid: "Ni behöver gå om 25 minuter." */
  timingLine: string | null;
  /** "Bianca brukar behöva extra tid vid övergångar." */
  helpLine: string | null;
  /** Två–tre små steg. */
  steps: string[];
  /** Föreslå återhämtning i stället för att pressa igenom. */
  suggestRecovery: boolean;
  /** Mjukt förslag när kapaciteten är låg – aldrig en bedömning. */
  capacityNote: string | null;
  canShrink: boolean;
  canGrow: boolean;
  /** Sant när ingen energilogg finns. */
  usedFallback: boolean;
  /** Titel som sparas på den vanliga uppgiften om föräldern accepterar. */
  taskTitle: string;
  base: AdaptiveSuggestion;
}

/** "om 20 minuter", "om en halvtimme" → minuter kvar. */
export function detectMinutesUntil(text: string): number | null {
  const t = text.toLowerCase();
  if (/om\s+en\s+halvtimme/.test(t)) return 30;
  const m = t.match(/om\s+(\d{1,3})\s*(minuter|minuter|min\b|minut)/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0 && n <= 600) return n;
  }
  const h = t.match(/om\s+(\d{1,2})\s*(timmar|timme|tim\b|h\b)/);
  if (h) {
    const n = Number(h[1]);
    if (Number.isFinite(n) && n > 0 && n <= 12) return n * 60;
  }
  return null;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function subjectLabel(subject: FamilySubject, childName?: string | null): string {
  if (subject === "barn") return childName?.trim() || "Barnet";
  if (subject === "familjen") return "Familjen";
  return "Du";
}

export function familyTaskTitle(text: string, subject: FamilySubject, childName?: string | null) {
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 70);
  const who = subject === "jag" ? "" : ` (${subjectLabel(subject, childName)})`;
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${titled}${who}`;
}

/** Bygger ett litet, ändringsbart förslag av familjesituationen. */
export function planFamilySituation(input: FamilySituationInput): FamilySuggestion {
  const base = adaptActivity({
    text: input.text,
    score: input.score,
    capacityMinutes: input.capacityMinutes,
    adjust: input.adjust,
  });

  const minutesUntil = detectMinutesUntil(input.text);
  const helps = (input.helps ?? []).filter(Boolean);
  const name = subjectLabel(input.subject, input.childName);
  const low = base.capacity === "låg";

  const timingLine =
    minutesUntil != null
      ? `Ni behöver vara klara om ${minutesUntil} minuter.`
      : base.fixedTime
        ? `Tiden ${base.fixedTime} står kvar. Lämna lite luft före.`
        : null;

  const helpLine =
    input.subject === "barn" && helps.length > 0
      ? `${name} brukar behöva ${lowerFirst(helps[0]!)}.`
      : null;

  const steps: string[] = [];
  for (const h of helps.slice(0, 2)) {
    const step = HELP_STEP[h];
    if (step) steps.push(step);
  }
  if (steps.length === 0) steps.push(base.firstStep);
  steps.push("När det är klart tar vi nästa steg.");

  const capacityNote = low
    ? "Det ser ut att bli mycket. Du behöver inte lösa allt på en gång – jag kan hjälpa dig förenkla."
    : null;

  return {
    headline: low ? "Vi gör det här mindre." : "Vi tar det i små steg.",
    capacityLine: base.capacityLine,
    minutesUntil,
    fixedTime: base.fixedTime,
    timingLine,
    helpLine,
    steps,
    suggestRecovery: base.suggestRecovery,
    capacityNote,
    canShrink: base.canShrink,
    canGrow: base.canGrow,
    usedFallback: base.usedFallback,
    taskTitle: familyTaskTitle(input.text, input.subject, input.childName),
    base,
  };
}

/**
 * Anpassa aktiviteten efter dagens kapacitet.
 *
 * En central UX-princip, inte en ny funktion: användaren säger vad hen vill
 * eller behöver göra ("Jag vill träna", "Jag behöver plugga") och Flow
 * föreslår en rimlig version utifrån den kapacitet som redan finns i appen
 * (FlowScore™ / Mitt batteri).
 *
 * Filen innehåller BARA ren logik – ingen egen lagring, ingen egen
 * aktivitetsmodell. Den som använder resultatet skriver till befintliga
 * uppgifter/steg.
 *
 * Inga medicinska påståenden: förslagen är UX-beteende (kortare eller längre
 * version av det användaren själv valt), inte rekommendationer om hälsa.
 */

/** Hur mycket användaren rimligen har att ge just nu. */
export type CapacityLevel = "låg" | "medel" | "hög";

export type ActivityIntent = "träning" | "studier" | "städning" | "promenad" | "generisk";

export interface AdaptiveInput {
  /** Fritext från användaren, t.ex. "Jag vill träna idag". */
  text: string;
  /**
   * FlowScore 0–100 om det finns. Saknas den (ingen energilogg) används
   * medelläget – användaren ska aldrig behöva fylla i något för att få svar.
   */
  score?: number | null;
  /** Realistisk fokustid just nu, om FlowScore räknat fram den. */
  capacityMinutes?: number | null;
  /** Justering från användaren: mindre eller större version. */
  adjust?: "mindre" | "större" | null;
}

export interface AdaptiveSuggestion {
  intent: ActivityIntent;
  /** "Du vill träna." */
  headline: string;
  capacity: CapacityLevel;
  /** "Din kapacitet idag: låg" */
  capacityLine: string;
  /** Hur lång den föreslagna versionen är. */
  minutes: number;
  /** "10 min lugn träning" */
  suggestion: string;
  /** Ett konkret första steg. */
  firstStep: string;
  /** Klockslag som användaren själv angett – ändras aldrig av Flow. */
  fixedTime: string | null;
  /** Rad om tiden är fast: vad som är rimligt före och efter. */
  fixedTimeNote: string | null;
  /** Sant när en paus/återhämtning är rimligare än att pressa igenom. */
  suggestRecovery: boolean;
  /** Finns det en mindre/större version att byta till? */
  canShrink: boolean;
  canGrow: boolean;
  /** Sant när kapaciteten bygger på fallback i stället för dagens logg. */
  usedFallback: boolean;
}

const INTENT_PATTERNS: { intent: ActivityIntent; re: RegExp }[] = [
  { intent: "träning", re: /(träna|träning|gym|styrka|löp|springa|yoga|pass\b|konditio)/ },
  { intent: "studier", re: /(plugga|plugg\b|studera|studier|tenta|läsa kurs|instudering|läxa)/ },
  { intent: "städning", re: /(städa|städning|diska|tvätta|plocka undan|dammsug|rensa|sortera)/ },
  { intent: "promenad", re: /(promenad|gå ut|gå en runda|ta en sväng|frisk luft)/ },
];

/** Vad handlar det om? Okända aktiviteter fungerar som "generisk". */
export function detectIntent(text: string): ActivityIntent {
  const t = text.toLowerCase();
  return INTENT_PATTERNS.find((p) => p.re.test(t))?.intent ?? "generisk";
}

/** Klockslag i texten, t.ex. "läkaren 14:00" eller "kl 9". */
export function detectFixedTime(text: string): string | null {
  const m =
    text.match(/\b([01]?\d|2[0-3])[.:]([0-5]\d)\b/) ?? text.match(/\bkl\.?\s*([01]?\d|2[0-3])\b/i);
  if (!m) return null;
  const hour = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (Number.isNaN(hour) || hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** FlowScore → kapacitetsnivå. Utan score används medel (aldrig ett hinder). */
export function capacityFromScore(score?: number | null): CapacityLevel {
  if (score == null) return "medel";
  if (score >= 66) return "hög";
  if (score >= 40) return "medel";
  return "låg";
}

const MINUTES: Record<ActivityIntent, Record<CapacityLevel, number>> = {
  träning: { låg: 10, medel: 20, hög: 35 },
  studier: { låg: 10, medel: 25, hög: 40 },
  städning: { låg: 5, medel: 15, hög: 30 },
  promenad: { låg: 10, medel: 20, hög: 35 },
  generisk: { låg: 5, medel: 15, hög: 30 },
};

const HEADLINE: Record<ActivityIntent, string> = {
  träning: "Du vill träna.",
  studier: "Du vill plugga.",
  städning: "Du vill städa.",
  promenad: "Du vill ta en promenad.",
  generisk: "Du vill göra något.",
};

const SHAPE: Record<ActivityIntent, Record<CapacityLevel, string>> = {
  träning: { låg: "lugn träning", medel: "träning i lagom tempo", hög: "träning med lite mer tempo" },
  studier: { låg: "lugnt pluggpass", medel: "fokuserat pluggpass", hög: "längre pluggpass" },
  städning: { låg: "städning av en liten yta", medel: "städning av ett område", hög: "städning av ett större område" },
  promenad: { låg: "lugn promenad", medel: "promenad", hög: "längre promenad" },
  generisk: { låg: "liten början", medel: "avgränsad del", hög: "ordentligt pass" },
};

const FIRST_STEP: Record<ActivityIntent, Record<CapacityLevel, string>> = {
  träning: {
    låg: "Byt om och rör på kroppen i 10 minuter – du bestämmer tempot.",
    medel: "Sätt en timer på 20 minuter och börja med något du gillar.",
    hög: "Välj ditt pass och kör igång – sätt en timer så du vet när du är klar.",
  },
  studier: {
    låg: "Öppna materialet och läs i 10 minuter. Inget mer än så.",
    medel: "Välj ett avsnitt och plugga 25 minuter med timer.",
    hög: "Dela upp i två block och börja med det som känns tyngst.",
  },
  städning: {
    låg: "Välj en enda yta – ett bord eller en hylla – och sätt en timer på 5 minuter.",
    medel: "Välj ett rum och gör bara det, 15 minuter.",
    hög: "Ta ett rum i taget och börja med det som stör dig mest.",
  },
  promenad: {
    låg: "Ta på skorna och gå runt kvarteret i 10 minuter.",
    medel: "Gå 20 minuter i lugnt tempo, ingen fast rutt behövs.",
    hög: "Gå en längre runda, 35 minuter, och ta en paus om du vill.",
  },
  generisk: {
    låg: "Gör den allra minsta biten i 5 minuter, sen får du välja igen.",
    medel: "Avgränsa till 15 minuter och börja med första delen.",
    hög: "Sätt igång och håll på i 30 minuter, sen stämmer du av.",
  },
};

const ORDER: CapacityLevel[] = ["låg", "medel", "hög"];

/**
 * Bygger ett konkret förslag av det användaren själv sagt. Kapacitet
 * används för att forma förslaget – aldrig för att neka aktiviteten.
 */
export function adaptActivity(input: AdaptiveInput): AdaptiveSuggestion {
  const intent = detectIntent(input.text);
  const base = capacityFromScore(input.score);
  const usedFallback = input.score == null;

  const index = ORDER.indexOf(base);
  const adjusted =
    input.adjust === "mindre"
      ? ORDER[Math.max(0, index - 1)]
      : input.adjust === "större"
        ? ORDER[Math.min(ORDER.length - 1, index + 1)]
        : base;

  let minutes = MINUTES[intent][adjusted];
  // Finns det redan en uträknad fokustid får förslaget aldrig bli längre.
  if (input.capacityMinutes && input.capacityMinutes > 0) {
    minutes = Math.max(5, Math.min(minutes, Math.round(input.capacityMinutes)));
  }

  const fixedTime = detectFixedTime(input.text);

  return {
    intent,
    headline: HEADLINE[intent],
    capacity: base,
    capacityLine: `Din kapacitet idag: ${base}`,
    minutes,
    suggestion: `${minutes} min ${SHAPE[intent][adjusted]}`,
    firstStep: FIRST_STEP[intent][adjusted],
    fixedTime,
    fixedTimeNote: fixedTime
      ? `Tiden ${fixedTime} står kvar. Lämna lite luft före och planera något lugnt efteråt.`
      : null,
    suggestRecovery: base === "låg",
    canShrink: ORDER.indexOf(adjusted) > 0,
    canGrow: ORDER.indexOf(adjusted) < ORDER.length - 1,
    usedFallback,
  };
}

/** Titel som sparas på den befintliga uppgiften när förslaget accepteras. */
export function suggestionTitle(s: AdaptiveSuggestion): string {
  return s.suggestion.charAt(0).toUpperCase() + s.suggestion.slice(1);
}

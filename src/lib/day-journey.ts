/**
 * Dagens resa – MyFloves tre steg.
 *
 *   01  Hur mår du?          → energi + mående + påverkan
 *   02  Vad händer?          → kalender, aktiviteter, påminnelser, Quickflow
 *   03  Behöver du planera om? → Flow och FlowPlan
 *
 * Ren logik utan React. Skapar ingen egen data – tar emot det som redan
 * finns i appen och räknar ut vad varje steg ska visa för status.
 * Tonen är alltid icke-dömande: aldrig "du har massor kvar", alltid
 * "vad är rimligt just nu".
 */

export type JourneyStepId = "mar" | "hander" | "planera";

export interface JourneyInput {
  /** Ork 1–10, null när inget loggats idag. */
  ork10: number | null;
  /** Har mående loggats idag? */
  hasMood: boolean;
  /** Har påverkan registrerats idag? */
  hasImpact: boolean;
  /** Antal saker som ligger på dagen. */
  planned: number;
  /** Antal av dem som är gjorda. */
  done: number;
  /** Tankar som ligger kvar i Quickflow. */
  openThoughts: number;
  /** Batteriet just nu, 0–100. */
  batteryNow: number;
}

export interface JourneyStepStatus {
  id: JourneyStepId;
  /** Korta statusrader, t.ex. "✓ Energi registrerad". */
  lines: string[];
  /** Är steget klart för idag? Bara en lugn markering, aldrig ett krav. */
  complete: boolean;
}

/** Ork 1–10 där dagen bör bäras lättare. */
export const LOW_ORK_MAX = 4;

/** Kvar att göra som fortfarande känns rimligt vid låg ork. */
const HEAVY_DAY_MIN = 4;

export function journeyStatus(input: JourneyInput): Record<JourneyStepId, JourneyStepStatus> {
  const { ork10, hasMood, hasImpact, planned, done, openThoughts, batteryNow } = input;
  const remaining = Math.max(0, planned - done);
  const lowOrk = ork10 != null && ork10 <= LOW_ORK_MAX;

  const marLines: string[] = [];
  if (ork10 != null) marLines.push("✓ Energi registrerad");
  if (hasMood) marLines.push("✓ Mående registrerat");
  if (hasImpact) marLines.push("✓ Påverkan registrerad");
  if (marLines.length === 0) marLines.push("Inget loggat idag ännu");

  const handerLines: string[] = [];
  if (planned === 0) handerLines.push("Inget inlagt för idag ännu");
  else {
    handerLines.push(planned === 1 ? "1 sak planerad" : `${planned} saker planerade`);
    if (done > 0) handerLines.push(`${done} klara`);
  }
  if (openThoughts > 0) {
    handerLines.push(
      openThoughts === 1 ? "1 tanke väntar på plats" : `${openThoughts} tankar väntar på plats`,
    );
  }

  const heavy = (lowOrk || batteryNow < 40) && remaining >= HEAVY_DAY_MIN;
  const planeraLines = heavy
    ? ["Din energi verkar lägre än dagen är planerad för. Vill du att vi hjälper dig anpassa den?"]
    : lowOrk
      ? ["Dagen ser rimlig ut för orken du har idag."]
      : ["Inget behöver ändras just nu."];

  return {
    mar: { id: "mar", lines: marLines, complete: ork10 != null },
    hander: { id: "hander", lines: handerLines, complete: planned > 0 },
    planera: { id: "planera", lines: planeraLines, complete: !heavy },
  };
}

/** Behöver dagen anpassas? Används för att lyfta steg 3 lite extra. */
export function needsReplan(input: JourneyInput): boolean {
  return !journeyStatus(input).planera.complete;
}

/* ── Kvällscheck ──────────────────────────────────────────────── */

export type EveningAnswer = "lattare" | "som-vantat" | "tyngre";

export const EVENING_ANSWERS: { id: EveningAnswer; label: string; emoji: string }[] = [
  { id: "lattare", label: "Lättare än väntat", emoji: "🌤️" },
  { id: "som-vantat", label: "Ungefär som väntat", emoji: "🌿" },
  { id: "tyngre", label: "Tyngre än väntat", emoji: "🌙" },
];

/** Ett kort, varmt svar – aldrig en värdering av dagen. */
export function eveningReply(answer: EveningAnswer): string {
  if (answer === "lattare") return "Vad fint. Det tar vi med oss till imorgon.";
  if (answer === "tyngre") return "Tack för att du berättar. Vi tar med det i morgondagens plan.";
  return "Tack. Nu vet MyFlove lite mer om hur dina dagar blir.";
}

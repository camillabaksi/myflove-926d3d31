/**
 * Personlig veckoplan: justerar steg- och rörelsemål utifrån vad du faktiskt
 * gjorde förra veckan och hur det kändes. Ingen dömande logik – målen får
 * gå ner lika gärna som upp.
 */

export type WeekFeedback = "for-tufft" | "lagom" | "for-latt";

export interface WeeklyPlan {
  /** ISO-datum för måndagen som planen gäller */
  weekStart: string;
  stepTarget: number;
  movementTarget: number;
  sessionTarget: number;
  note: string;
  basis: {
    avgSteps: number;
    avgMovement: number;
    doneSessions: number;
    feedback: WeekFeedback | null;
  };
}

export const FEEDBACK_LABEL: Record<WeekFeedback, string> = {
  "for-tufft": "För tufft",
  lagom: "Lagom",
  "for-latt": "För lätt",
};

const FACTOR: Record<WeekFeedback, number> = {
  "for-tufft": 0.85,
  lagom: 1.05,
  "for-latt": 1.15,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** ISO-datum för veckans måndag (måndag = veckostart). */
export function weekStartKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = måndag
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export interface PlanInput {
  /** Steg per dag senaste 7 dagarna */
  steps: number[];
  /** Vardagsmotion i minuter per dag senaste 7 dagarna */
  movementMinutes: number[];
  /** Antal genomförda pass senaste 7 dagarna */
  doneSessions: number;
  /** Hur många pass programmet innehåller (om det finns) */
  plannedSessions: number;
  currentStepGoal: number;
  currentMovementGoal: number;
  feedback: WeekFeedback | null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildWeeklyPlan(input: PlanInput, date = new Date()): WeeklyPlan {
  const avgSteps = Math.round(average(input.steps));
  const avgMovement = Math.round(average(input.movementMinutes));
  const factor = input.feedback ? FACTOR[input.feedback] : 1;

  // Utgå från det du faktiskt gjorde, inte från ett mål du missade.
  const stepBase =
    avgSteps > 0 ? (avgSteps * 2 + input.currentStepGoal) / 3 : input.currentStepGoal;
  const movementBase =
    avgMovement > 0 ? (avgMovement * 2 + input.currentMovementGoal) / 3 : input.currentMovementGoal;

  const stepTarget = clamp(Math.round((stepBase * factor) / 250) * 250, 2000, 20000);
  const movementTarget = clamp(Math.round((movementBase * factor) / 5) * 5, 5, 90);

  const plannedBase = input.plannedSessions > 0 ? input.plannedSessions : 3;
  let sessionTarget = plannedBase;
  if (input.feedback === "for-tufft")
    sessionTarget = Math.max(1, Math.min(plannedBase, input.doneSessions || 1));
  else if (input.feedback === "for-latt") sessionTarget = plannedBase + 1;
  else if (input.doneSessions > 0 && input.doneSessions < plannedBase)
    sessionTarget = input.doneSessions + 1;
  sessionTarget = clamp(sessionTarget, 1, 7);

  return {
    weekStart: weekStartKey(date),
    stepTarget,
    movementTarget,
    sessionTarget,
    note: buildNote(input.feedback, stepTarget, input.currentStepGoal),
    basis: {
      avgSteps,
      avgMovement,
      doneSessions: input.doneSessions,
      feedback: input.feedback ?? null,
    },
  };
}

function buildNote(
  feedback: WeekFeedback | null,
  stepTarget: number,
  previousGoal: number,
): string {
  if (feedback === "for-tufft")
    return "Vi sänker ribban den här veckan. Att fortsätta alls är vinsten.";
  if (feedback === "for-latt") return "Du verkar ha utrymme för lite mer – vi höjer försiktigt.";
  if (stepTarget > previousGoal) return "Ett litet kliv upp från förra veckan. Inget dramatiskt.";
  if (stepTarget < previousGoal)
    return "Målen är anpassade efter din verkliga vecka, inte en perfekt vecka.";
  return "Samma nivå som förra veckan – stabilt är också framsteg.";
}

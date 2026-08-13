// FlowScore™ – "Vad är rimligt för mig just nu?"
// En lugn kapacitetsmätare som väger energi, mående, tid kvar, öppna trådar
// och hur mycket som redan är gjort idag. Aldrig dömande – bara realistisk.

export interface FlowScoreInput {
  /** Senaste energinivån 1–5 (Energikartan). */
  energy?: number | null;
  /** Senaste måendet 1–5. */
  mood?: number | null;
  /** Minuter kvar av arbetsdagen. */
  minutesLeft: number;
  /** Öppna Quickflow-tankar (mental belastning). */
  openThoughts: number;
  /** Antal uppgifter med passerad deadline. */
  overdue: number;
  /** Klarmarkerade uppgifter idag. */
  doneToday: number;
}

export type FlowLoad = "låg" | "medel" | "hög";

export interface FlowScore {
  /** 0–100. Högre = mer kapacitet just nu. */
  score: number;
  /** Realistisk fokustid i minuter just nu. */
  capacityMinutes: number;
  /** Hur tunga uppgifter som är rimliga (1–10). */
  maxFriction: number;
  /** Hur många saker det är rimligt att sikta på nu. */
  suggestedTasks: number;
  /** Upplevd belastning. */
  load: FlowLoad;
  label: string;
  message: string;
  /** Kort förklaring av vad som drog upp/ner. */
  factors: { label: string; delta: number }[];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function computeFlowScore(input: FlowScoreInput, now = new Date()): FlowScore {
  const factors: { label: string; delta: number }[] = [];
  let score = 55;

  if (input.energy != null) {
    const d = (input.energy - 3) * 9;
    score += d;
    factors.push({ label: `Energi ${input.energy}/5`, delta: Math.round(d) });
  }

  if (input.mood != null) {
    const d = (input.mood - 3) * 5;
    score += d;
    factors.push({ label: `Mående ${input.mood}/5`, delta: Math.round(d) });
  }

  const hour = now.getHours();
  const timeDelta = hour < 7 ? -10 : hour < 10 ? 6 : hour < 14 ? 3 : hour < 17 ? -2 : hour < 20 ? -8 : -14;
  score += timeDelta;
  factors.push({ label: "Tid på dygnet", delta: timeDelta });

  if (input.minutesLeft <= 30) {
    score -= 8;
    factors.push({ label: "Lite tid kvar", delta: -8 });
  }

  if (input.openThoughts > 5) {
    const d = -Math.min(12, (input.openThoughts - 5) * 2);
    score += d;
    factors.push({ label: `${input.openThoughts} öppna tankar`, delta: d });
  }

  if (input.overdue > 0) {
    const d = -Math.min(10, input.overdue * 3);
    score += d;
    factors.push({ label: `${input.overdue} passerade deadlines`, delta: d });
  }

  if (input.doneToday > 0) {
    const d = Math.min(10, input.doneToday * 3);
    score += d;
    factors.push({ label: `${input.doneToday} klart idag`, delta: d });
  }

  score = Math.round(clamp(score, 5, 100));

  const load: FlowLoad = score >= 66 ? "låg" : score >= 40 ? "medel" : "hög";

  const capacityMinutes = clamp(
    Math.round((input.minutesLeft || 120) * (0.25 + (score / 100) * 0.45)),
    10,
    240,
  );

  const maxFriction = score >= 75 ? 10 : score >= 55 ? 7 : score >= 35 ? 5 : 3;
  const suggestedTasks = score >= 70 ? 3 : score >= 45 ? 2 : 1;

  const label = score >= 80 ? "Full fart" : score >= 60 ? "God kapacitet" : score >= 40 ? "Lagom" : score >= 25 ? "Låg" : "Skonsamt läge";

  const message =
    score >= 70
      ? "Du har utrymme idag. Ta gärna något du brukar skjuta på."
      : score >= 45
        ? "Lagom dag. En sak i taget räcker gott."
        : score >= 25
          ? "Kapaciteten är låg. Vi siktar på det lilla – det räknas också."
          : "Idag är det okej att bara göra det allra nödvändigaste. 💙";

  return { score, capacityMinutes, maxFriction, suggestedTasks, load, label, message, factors };
}

export function scoreTone(score: number): string {
  if (score >= 66) return "text-primary";
  if (score >= 40) return "text-gold";
  return "text-destructive";
}

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
  /** Minuter av den kvarvarande dagen som redan är bokade (möten, lektioner). */
  bookedMinutes?: number;
  /** Nästa hållpunkt idag, för förklaringen. */
  nextEvent?: { title: string; start: string } | null;
  /** Förväntad energi just nu enligt dina egna loggar över dygnet. */
  energyPattern?: { expected: number; diff: number; note: string } | null;
  /** Gårdagens Flow Reset – hur igår kändes. Påverkar bara förmiddagen. */
  yesterdayFeel?: "bra" | "sadar" | "kaos" | null;
  /** Rörelse idag: steg från hälsoappen och genomförda träningspass. */
  movementToday?: { steps?: number; sessions?: number } | null;
  /**
   * Energiflöde™: färdig faktor för det som gett/tagit energi idag.
   * Byggs i use-energy-flow så att användarens egen viktning gäller.
   */
  energyFlow?: FlowFactor | null;
}

export type FlowLoad = "låg" | "medel" | "hög";

export interface FlowFactor {
  label: string;
  delta: number;
  /** Var signalen kommer ifrån. */
  source: string;
  /** Vad som faktiskt mättes. */
  reading: string;
  /** Varför det påverkar kapaciteten. */
  why: string;
}

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
  /** Utgångsläget innan signalerna räknades in. */
  baseScore: number;
  /** Kort förklaring av vad som drog upp/ner. */
  factors: FlowFactor[];
  /** Minuter av dagen som redan är bokade. */
  bookedMinutes: number;
  /** Minuter som faktiskt är dina att planera i. */
  freeMinutes: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const BASE_SCORE = 55;

/** Härleder planvärdena ur en score – används även för "tänk om"-jämförelser. */
export function derivePlan(rawScore: number, minutesLeft: number) {
  const score = Math.round(clamp(rawScore, 5, 100));
  const load: FlowLoad = score >= 66 ? "låg" : score >= 40 ? "medel" : "hög";
  const capacityMinutes = clamp(
    Math.round((minutesLeft || 120) * (0.25 + (score / 100) * 0.45)),
    10,
    240,
  );
  const maxFriction = score >= 75 ? 10 : score >= 55 ? 7 : score >= 35 ? 5 : 3;
  const suggestedTasks = score >= 70 ? 3 : score >= 45 ? 2 : 1;
  const label =
    score >= 80
      ? "Full fart"
      : score >= 60
        ? "God kapacitet"
        : score >= 40
          ? "Lagom"
          : score >= 25
            ? "Låg"
            : "Skonsamt läge";
  return { score, load, capacityMinutes, maxFriction, suggestedTasks, label };
}

export function computeFlowScore(input: FlowScoreInput, now = new Date()): FlowScore {
  const factors: FlowFactor[] = [];
  let score = BASE_SCORE;

  if (input.energy != null) {
    const d = Math.round((input.energy - 3) * 9);
    score += d;
    factors.push({
      label: `Energi ${input.energy}/5`,
      delta: d,
      source: "Energikartan",
      reading: `Senaste loggen: ${input.energy} av 5`,
      why: "Energin väger tyngst – den styr både hur tunga uppgifter som föreslås och hur hårt friktion straffar i rankningen.",
    });
  } else {
    factors.push({
      label: "Ingen energilogg",
      delta: 0,
      source: "Energikartan",
      reading: "Inget loggat idag",
      why: "Utan energilogg antas neutralt läge (3/5). Logga energi för en mer träffsäker plan.",
    });
  }

  if (input.mood != null) {
    const d = Math.round((input.mood - 3) * 5);
    score += d;
    factors.push({
      label: `Mående ${input.mood}/5`,
      delta: d,
      source: "Måendeloggen",
      reading: `Senaste måendet: ${input.mood} av 5`,
      why: "Måendet justerar kapaciteten milt uppåt eller nedåt.",
    });
  }

  const hour = now.getHours();
  const timeDelta =
    hour < 7 ? -10 : hour < 10 ? 6 : hour < 14 ? 3 : hour < 17 ? -2 : hour < 20 ? -8 : -14;
  score += timeDelta;
  factors.push({
    label: "Tid på dygnet",
    delta: timeDelta,
    source: "Klockan",
    reading: `Kl ${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    why:
      timeDelta > 0
        ? "Du är inne i ett tidsfönster där de flesta har mest fokus."
        : "Sent eller tidigt på dygnet – kapaciteten dras ner för att planen ska bli realistisk.",
  });

  if (input.minutesLeft <= 30) {
    score -= 8;
    factors.push({
      label: "Lite tid kvar",
      delta: -8,
      source: "Arbetsdagens slut",
      reading: `${input.minutesLeft} min kvar av dagen`,
      why: "Kort tid kvar krymper både fokustiden och antalet saker i planen.",
    });
  }

  if (input.openThoughts > 5) {
    const d = -Math.min(12, (input.openThoughts - 5) * 2);
    score += d;
    factors.push({
      label: `${input.openThoughts} öppna tankar`,
      delta: d,
      source: "Quickflow",
      reading: `${input.openThoughts} osorterade tankar`,
      why: "Osorterade tankar tar plats i huvudet. Sortera några i Quickflow så stiger scoren.",
    });
  }

  if (input.overdue > 0) {
    const d = -Math.min(10, input.overdue * 3);
    score += d;
    factors.push({
      label: `${input.overdue} passerade deadlines`,
      delta: d,
      source: "Uppgifter",
      reading: `${input.overdue} uppgift(er) med passerat datum`,
      why: "Passerade deadlines ökar belastningen – men de rankas också högst upp i Nu-listan.",
    });
  }

  if (input.doneToday > 0) {
    const d = Math.min(10, input.doneToday * 3);
    score += d;
    factors.push({
      label: `${input.doneToday} klart idag`,
      delta: d,
      source: "Dagens klarmarkeringar",
      reading: `${input.doneToday} avklarade idag`,
      why: "Det du redan gjort räknas – medvind höjer kapaciteten.",
    });
  }

  if (input.energyPattern) {
    // Ditt eget dygnsmönster – väger lättare än dagens faktiska logg.
    const d = Math.round(input.energyPattern.diff * 4);
    score += d;
    factors.push({
      label:
        input.energyPattern.diff <= -0.4
          ? "Din vanliga svacka"
          : input.energyPattern.diff >= 0.4
            ? "Din vanliga toppetid"
            : "Ditt energimönster",
      delta: d,
      source: "Energikartan över tid",
      reading: `Du brukar ligga på ${input.energyPattern.expected}/5 den här tiden`,
      why: input.energyPattern.note,
    });
  }
  // Energiflöde™ – det du själv registrerat som gett eller tagit energi idag.
  if (input.energyFlow) {
    score += input.energyFlow.delta;
    factors.push(input.energyFlow);
  }

  // Gårdagens Flow Reset sätter startläget för dagen – men bara på förmiddagen.
  if (input.yesterdayFeel && hour < 13) {
    const map = {
      bra: { d: 4, why: "Igår kändes bra. Vi börjar dagen med lite mer utrymme." },
      sadar: { d: 0, why: "Igår var sådär. Vi börjar neutralt och ser hur det känns." },
      kaos: {
        d: -6,
        why: "Igår var kaos. Vi börjar lugnare idag – det är inte en bestraffning, bara vila.",
      },
    } as const;
    const m = map[input.yesterdayFeel];
    score += m.d;
    factors.push({
      label:
        input.yesterdayFeel === "kaos"
          ? "Igår var tungt"
          : input.yesterdayFeel === "bra"
            ? "Igår kändes bra"
            : "Igår var sådär",
      delta: m.d,
      source: "Kvällsavslut igår",
      reading: `Du beskrev igår som "${input.yesterdayFeel === "sadar" ? "sådär" : input.yesterdayFeel}"`,
      why: m.why,
    });
  }

  // Rörelse räknas – kroppen är en del av kapaciteten.
  if (
    input.movementToday &&
    ((input.movementToday.steps ?? 0) > 0 || (input.movementToday.sessions ?? 0) > 0)
  ) {
    const steps = input.movementToday.steps ?? 0;
    const sessions = input.movementToday.sessions ?? 0;
    const d = Math.min(
      8,
      (steps >= 7000 ? 5 : steps >= 3000 ? 3 : steps > 0 ? 1 : 0) + sessions * 3,
    );
    score += d;
    const readingParts = [
      steps > 0 ? `${steps.toLocaleString("sv-SE")} steg` : null,
      sessions > 0 ? `${sessions} pass` : null,
    ].filter(Boolean);
    factors.push({
      label: "Du har rört dig idag",
      delta: d,
      source: "Träning och hälsa",
      reading: readingParts.join(" · "),
      why: "Rörelse ger oftast mer ork senare på dagen. Det du redan gjort med kroppen räknas in.",
    });
  }

  const bookedMinutes = Math.max(0, Math.round(input.bookedMinutes ?? 0));
  const freeMinutes = Math.max(0, input.minutesLeft - bookedMinutes);
  if (bookedMinutes > 0) {
    const share = input.minutesLeft ? bookedMinutes / input.minutesLeft : 0;
    const d = -Math.min(14, Math.round(share * 20));
    score += d;
    factors.push({
      label: `${bookedMinutes} min redan bokat`,
      delta: d,
      source: "Kalender och schema",
      reading: input.nextEvent
        ? `Nästa: ${input.nextEvent.start} ${input.nextEvent.title}`
        : `${bookedMinutes} min av dagen är bokad`,
      why: "Bokad tid är inte fokustid. Kapaciteten räknas på de minuter som faktiskt är dina.",
    });
  }

  const derived = derivePlan(score, freeMinutes);

  const message =
    derived.score >= 70
      ? "Du har utrymme idag. Ta gärna något du brukar skjuta på."
      : derived.score >= 45
        ? "Lagom dag. En sak i taget räcker gott."
        : derived.score >= 25
          ? "Kapaciteten är låg. Vi siktar på det lilla – det räknas också."
          : "Idag är det okej att bara göra det allra nödvändigaste. 💙";

  return {
    score: derived.score,
    capacityMinutes: derived.capacityMinutes,
    maxFriction: derived.maxFriction,
    suggestedTasks: derived.suggestedTasks,
    load: derived.load,
    label: derived.label,
    message,
    baseScore: BASE_SCORE,
    factors,
    bookedMinutes,
    freeMinutes,
  };
}

export interface FlowFactorImpact extends FlowFactor {
  /** Score om signalen inte fanns. */
  scoreWithout: number;
  /** Hur planen hade sett ut utan signalen. */
  planWithout: ReturnType<typeof derivePlan>;
  /** Konkreta planändringar signalen orsakade. */
  changes: string[];
}

/**
 * "Tänk om"-analys: vad hade planen blivit utan varje enskild signal?
 * Ger en rad per signal med exakt vad den ändrade.
 */
export function explainFlowScore(
  flow: FlowScore,
  minutesLeft: number,
): { impacts: FlowFactorImpact[]; runningTotal: { label: string; score: number }[] } {
  const rawTotal = flow.baseScore + flow.factors.reduce((s, f) => s + f.delta, 0);

  const impacts = flow.factors.map((f) => {
    const without = derivePlan(rawTotal - f.delta, minutesLeft);
    const changes: string[] = [];
    if (f.delta === 0) {
      changes.push("Ingen effekt på scoren just nu.");
    } else {
      if (without.capacityMinutes !== flow.capacityMinutes) {
        const diff = flow.capacityMinutes - without.capacityMinutes;
        changes.push(
          `${diff > 0 ? "+" : ""}${diff} min fokustid (${without.capacityMinutes} → ${flow.capacityMinutes})`,
        );
      }
      if (without.maxFriction !== flow.maxFriction) {
        changes.push(
          `Friktionsgräns ${without.maxFriction} → ${flow.maxFriction} – ${
            flow.maxFriction < without.maxFriction
              ? 'tyngre uppgifter flyttades till "för tungt nu"'
              : "fler tunga uppgifter fick plats i planen"
          }`,
        );
      }
      if (without.suggestedTasks !== flow.suggestedTasks) {
        changes.push(`Antal saker i planen ${without.suggestedTasks} → ${flow.suggestedTasks}`);
      }
      if (without.load !== flow.load) changes.push(`Belastning ${without.load} → ${flow.load}`);
      if (!changes.length) changes.push("Flyttade scoren, men planen landade på samma nivå.");
    }
    return { ...f, scoreWithout: without.score, planWithout: without, changes };
  });

  let running = flow.baseScore;
  const runningTotal = [{ label: "Utgångsläge", score: running }];
  for (const f of flow.factors) {
    running += f.delta;
    runningTotal.push({ label: f.label, score: Math.round(clamp(running, 5, 100)) });
  }

  return { impacts, runningTotal };
}

export function scoreTone(score: number): string {
  if (score >= 66) return "text-primary";
  if (score >= 40) return "text-gold";
  return "text-destructive";
}

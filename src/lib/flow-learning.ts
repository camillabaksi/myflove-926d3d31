// Flow lär sig användaren.
//
// Ingen ny datamodell och ingen övervakning: allt härleds ur det som redan
// finns i MyFlove (uppgifter, påminnelser, energiloggar) plus en liten lokal
// minnesnotering om vilka Flow-meddelanden som redan visats.
//
// Ton: "Du behöver inte lära dig hur jag fungerar. Jag lär mig hur du fungerar."

export interface FlowLearningInput {
  /** Avklarade uppgifter (completedAt i ms). */
  completed: Array<{ completedAt?: number; time?: string; title: string }>;
  /** Öppna uppgifter/påminnelser. */
  open: Array<{ createdAt: number; dueDate?: string; snoozedUntil?: string; title: string }>;
  /** Registrerade energinivåer (0–100) med tidpunkt. */
  energy: Array<{ level: number; at: number }>;
  /** Antal dagar användaren varit aktiv i appen. */
  activeDays: number;
  /** Viktiga personer (barn/relationer). */
  people: number;
}

export interface FlowInsight {
  id: string;
  /** Flows egen mening om det han börjar förstå. */
  text: string;
  /** Hur säker Flow är – används för att inte påstå för mycket för tidigt. */
  confidence: "börjar" | "ser" | "vet";
}

export interface FlowKnowledge {
  /** 0–100: hur väl Flow känner användaren. */
  level: number;
  /** Kort etikett för nivån. */
  label: string;
  insights: FlowInsight[];
}

const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

const hourOf = (ts: number) => new Date(ts).getHours();

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round(((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2) : (s[mid] ?? 0);
}

function mostCommon(values: number[]): { value: number; count: number } | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: { value: number; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

/** Hur väl Flow känner användaren – mjuk kurva, aldrig ett betyg. */
export function learningLevel(input: FlowLearningInput): number {
  const days = Math.min(30, input.activeDays) / 30; // 0–1
  const done = Math.min(40, input.completed.length) / 40;
  const energy = Math.min(14, input.energy.length) / 14;
  const people = input.people > 0 ? 1 : 0;
  const raw = days * 0.4 + done * 0.3 + energy * 0.2 + people * 0.1;
  return Math.round(raw * 100);
}

export function levelLabel(level: number): string {
  if (level < 15) return "Vi har precis lärt känna varandra";
  if (level < 40) return "Jag börjar få koll på dig";
  if (level < 70) return "Jag känner igen dina mönster";
  return "Jag har bra koll på hur du fungerar";
}

/**
 * Vad Flow har lagt märke till. Returnerar bara sådant som faktiskt syns
 * i datan – hellre tyst än gissa.
 */
export function analyzeFlow(input: FlowLearningInput): FlowKnowledge {
  const level = learningLevel(input);
  const insights: FlowInsight[] = [];

  const doneTimes = input.completed
    .map((t) => t.completedAt)
    .filter((v): v is number => typeof v === "number");

  /* Morgnar och tider som brukar fungera. */
  const hours = doneTimes.map(hourOf);
  const medianHour = median(hours);
  if (hours.length >= 6 && medianHour != null) {
    if (medianHour <= 11) {
      insights.push({
        id: "mornings",
        text: "Jag börjar få koll på hur dina morgnar brukar fungera. 💜",
        confidence: hours.length >= 15 ? "vet" : "börjar",
      });
    } else if (medianHour >= 18) {
      insights.push({
        id: "evenings",
        text: "Flera uppgifter verkar bli klara på kvällen. Du kan själv välja om du vill planera efter det.",
        confidence: hours.length >= 15 ? "vet" : "ser",
      });
    } else {
      insights.push({
        id: "midday",
        text: `Runt kl ${medianHour} brukar saker faktiskt bli av för dig.`,
        confidence: "ser",
      });
    }
  }

  /* Vilken veckodag som brukar bli tyngst. */
  const heavyDays = input.open
    .map((t) => (t.dueDate ? new Date(`${t.dueDate}T12:00:00`).getDay() : null))
    .filter((v): v is number => v != null);
  const heavy = mostCommon(heavyDays);
  if (heavy && heavy.count >= 3) {
    insights.push({
      id: "heavy-day",
      text: `Du har flera öppna uppgifter planerade på ${WEEKDAYS[heavy.value]}ar. Det kan vara värt att se över utrymmet i planen.`,
      confidence: heavy.count >= 5 ? "ser" : "börjar",
    });
  }

  /* Vad som brukar skjutas upp. */
  const now = Date.now();
  const lingering = input.open.filter(
    (t) => t.snoozedUntil || now - t.createdAt > 1000 * 60 * 60 * 24 * 7,
  );
  if (lingering.length >= 3) {
    insights.push({
      id: "postponed",
      text: "Jag ser vilka saker som brukar bli liggande. Vi kan ta dem i mindre bitar.",
      confidence: "ser",
    });
  }

  /* Energimönster. */
  if (input.energy.length >= 5) {
    const low = input.energy.filter((e) => e.level <= 40);
    const lowHours = low.map((e) => hourOf(e.at));
    const lowPeak = mostCommon(lowHours);
    if (lowPeak && lowPeak.count >= 3) {
      insights.push({
        id: "energy-dip",
        text: `Du har registrerat låg energi flera gånger runt kl ${lowPeak.value}. Det kan vara värt att lämna utrymme då.`,
        confidence: "ser",
      });
    } else {
      insights.push({
        id: "energy",
        text: "Jag börjar förstå hur din energi rör sig under dagen.",
        confidence: "börjar",
      });
    }
  }

  if (input.people > 0) {
    insights.push({
      id: "people",
      text: "Du har lagt till personer som hör till din vardag. De kan vara relevanta när du själv planerar.",
      confidence: "ser",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "start",
      text: "Ju mer du använder mig, desto bättre kan jag anpassa hjälpen efter just dig.",
      confidence: "börjar",
    });
  }

  return { level, label: levelLabel(level), insights };
}

/** En lärande-mening att visa ibland – roterar så det inte blir tjatigt. */
export function learningMessage(knowledge: FlowKnowledge, seed: number): string {
  const list = knowledge.insights;
  const item = list[Math.abs(seed) % list.length];
  return item?.text ?? "Jag lär mig hur du fungerar, lite i taget. 💜";
}

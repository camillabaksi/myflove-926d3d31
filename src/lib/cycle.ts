/**
 * Menscykel – helt frivillig funktion. MyFlove antar aldrig kön och visar
 * inget av detta om användaren inte själv har aktiverat funktionen.
 *
 * Faser och ägglossning är UPPSKATTNINGAR som varierar mellan personer och
 * mellan cykler. MyFlove gör inga medicinska påståenden om vad användaren
 * "bör" känna – tidslinjen finns för att användaren ska kunna jämföra med
 * sin egen registrerade kapacitet och sina egna symtom.
 */

export type CyclePhase = "mens" | "follikular" | "agglossning" | "luteal";

export type CycleSymptom = "smarta" | "trotthet" | "kanslor" | "annat";

export interface CycleSymptomEntry {
  day: string; // YYYY-MM-DD
  kinds: CycleSymptom[];
}

export interface CycleData {
  /** Användaren har svarat på frågan om menscykel ska användas. */
  enabled: boolean;
  /** Har användaren tagit ställning? Annars frågar vi. */
  answered: boolean;
  /** Får Flow ta hänsyn till mönstren när dagen planeras? */
  useInFlow: boolean;
  /** Dagar markerade som mensdagar (YYYY-MM-DD). */
  periodDays: string[];
  symptoms: CycleSymptomEntry[];
}

export const EMPTY_CYCLE: CycleData = {
  enabled: false,
  answered: false,
  useInFlow: true,
  periodDays: [],
  symptoms: [],
};

export const CYCLE_SYMPTOMS: { id: CycleSymptom; labelSv: string; emoji: string }[] = [
  { id: "smarta", labelSv: "Smärta", emoji: "🩹" },
  { id: "trotthet", labelSv: "Extra trötthet", emoji: "🪫" },
  { id: "kanslor", labelSv: "Känslomässig påverkan", emoji: "💜" },
  { id: "annat", labelSv: "Annat", emoji: "✨" },
];

export const PHASE_LABEL_SV: Record<CyclePhase, string> = {
  mens: "Mens",
  follikular: "Follikulär fas",
  agglossning: "Ägglossning",
  luteal: "Lutealfas",
};

export const PHASE_ORDER: CyclePhase[] = ["mens", "follikular", "agglossning", "luteal"];

export const dayKey = (d: Date | string = new Date()): string =>
  typeof d === "string"
    ? d.slice(0, 10)
    : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const parse = (day: string) => new Date(`${day}T12:00:00`);

const daysBetween = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);

/** Sammanhängande mensperioder → startdagar, nyast först. */
export function periodStarts(periodDays: string[]): string[] {
  const sorted = [...new Set(periodDays)].sort();
  const starts: string[] = [];
  for (const day of sorted) {
    const prev = dayKey(new Date(parse(day).getTime() - 86_400_000));
    if (!sorted.includes(prev)) starts.push(day);
  }
  return starts.reverse();
}

/** Genomsnittlig cykellängd av användarens egna registreringar (fallback 28). */
export function averageCycleLength(periodDays: string[]): number {
  const starts = periodStarts(periodDays);
  const lengths: number[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const currentStart = starts[i];
    const previousStart = starts[i + 1];
    if (!currentStart || !previousStart) continue;
    const len = daysBetween(previousStart, currentStart);
    if (len >= 18 && len <= 45) lengths.push(len);
  }
  if (!lengths.length) return 28;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export interface CycleStatus {
  /** Cykeldag, 1 = första mensdagen. */
  day: number;
  phase: CyclePhase;
  length: number;
  /** Uppskattat antal dagar kvar till nästa mens. */
  daysToNext: number;
  lastStart: string;
}

/** Var i cykeln användaren ungefär befinner sig – enbart en uppskattning. */
export function cycleStatus(data: CycleData, today: string = dayKey()): CycleStatus | null {
  const starts = periodStarts(data.periodDays);
  const lastStart = starts.find((s) => daysBetween(s, today) >= 0);
  if (!lastStart) return null;
  const length = averageCycleLength(data.periodDays);
  const diff = daysBetween(lastStart, today);
  if (diff > length + 20) return null; // för gammal data för en meningsfull uppskattning
  const day = diff + 1;
  const ovulation = Math.max(10, length - 14);
  let phase: CyclePhase = "luteal";
  if (data.periodDays.includes(today) || day <= 5) phase = "mens";
  else if (day < ovulation - 1) phase = "follikular";
  else if (day <= ovulation + 1) phase = "agglossning";
  return { day, phase, length, daysToNext: Math.max(0, length - diff), lastStart };
}

/** Kort diskret indikator, t.ex. "Dag 24 · Lutealfas". */
export function cycleIndicator(status: CycleStatus | null): string | null {
  return status ? `Dag ${status.day} · ${PHASE_LABEL_SV[status.phase]}` : null;
}

/** Rad till Flow – bara om användaren aktiverat och tillåtit det. */
export function cycleContext(data: CycleData, today: string = dayKey()): string | null {
  if (!data.enabled || !data.useInFlow) return null;
  const status = cycleStatus(data, today);
  if (!status) return null;
  const symptoms = data.symptoms.find((s) => s.day === today);
  const lines = [
    `Menscykel (användarens egen registrering, uppskattad): cykeldag ${status.day}, ungefär ${PHASE_LABEL_SV[status.phase].toLowerCase()}.`,
  ];
  if (symptoms?.kinds.length) {
    const labels = symptoms.kinds.map(
      (k) => CYCLE_SYMPTOMS.find((s) => s.id === k)?.labelSv.toLowerCase() ?? "annat",
    );
    lines.push(`Registrerat idag: ${labels.join(", ")}.`);
  }
  lines.push(
    "Använd detta enbart som bakgrund när du hjälper till att prioritera. Säg aldrig att användaren känner något på grund av en fas, dra inga medicinska slutsatser och utgå alltid från det användaren själv har registrerat.",
  );
  return lines.join("\n");
}

/** Alla datum mellan start och slut (inklusive), max 14 dagar. */
export function daysInRange(start: string, end: string): string[] {
  const from = parse(start);
  const to = parse(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return [];
  const out: string[] = [];
  for (let t = from.getTime(); t <= to.getTime() && out.length < 14; t += 86_400_000) {
    out.push(dayKey(new Date(t)));
  }
  return out;
}

/** Perioden (sammanhängande mensdagar) som innehåller ett visst datum. */
export function periodRangeFor(
  periodDays: string[],
  day: string,
): { start: string; end: string } | null {
  const sorted = [...new Set(periodDays)].sort();
  if (!sorted.includes(day)) return null;
  let start = day;
  let end = day;
  for (;;) {
    const prev = dayKey(new Date(parse(start).getTime() - 86_400_000));
    if (!sorted.includes(prev)) break;
    start = prev;
  }
  for (;;) {
    const next = dayKey(new Date(parse(end).getTime() + 86_400_000));
    if (!sorted.includes(next)) break;
    end = next;
  }
  return { start, end };
}

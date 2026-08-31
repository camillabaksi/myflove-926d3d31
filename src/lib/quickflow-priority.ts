/**
 * QuickFlow – "Jag har mycket på en gång".
 *
 * Ren logik för att dela upp en fritext i flera saker och lägga dem i fyra
 * lugna nivåer. Ingen tid, inget datum, ingen kalenderhändelse skapas här.
 * AI-prioriteringen bor i quickflow-priority.functions.ts; den här filen är
 * fallback + typer och används av hooken och UI:t.
 */

export type PriorityBucket = "nu" | "sedan" | "om-du-orkar" | "kan-vanta";

export interface PriorityTask {
  id: string;
  title: string;
  bucket: PriorityBucket;
  /** Kort förklaring från Flow – aldrig en påhittad deadline. */
  why?: string;
  order: number;
  done?: boolean;
  doneAt?: number;
  createdAt: number;
}

export const BUCKETS: PriorityBucket[] = ["nu", "sedan", "om-du-orkar", "kan-vanta"];

export const BUCKET_META: Record<PriorityBucket, { emoji: string; label: string; dot: string }> = {
  nu: { emoji: "🔴", label: "Gör nu", dot: "bg-destructive" },
  sedan: { emoji: "🟠", label: "Gör sedan", dot: "bg-sun" },
  "om-du-orkar": { emoji: "🟢", label: "Om du orkar", dot: "bg-mint" },
  "kan-vanta": { emoji: "⚪", label: "Kan vänta", dot: "bg-muted" },
};

export function bucketRank(b: PriorityBucket): number {
  return BUCKETS.indexOf(b);
}

const SPLIT = /\n|;|,| och | samt |·|•/gi;

/** Delar upp fritext i flera saker – en per rad eller separerade med komma/och. */
export function splitTasks(raw: string): string[] {
  return raw
    .replace(/\.\s+/g, "\n")
    .split(SPLIT)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .map((s) => s.replace(/[.]+$/, "").trim())
    .filter((s) => s.length > 1)
    .slice(0, 20);
}

const URGENT = ["betala", "räkning", "svara", "läraren", "läkare", "boka", "ringa", "deadline"];
const HEAVY = ["städa", "storstäd", "flytta", "deklaration", "renovera", "packa", "förbered"];
const LIGHT = ["diska", "tvätta", "vattna", "posta", "hämta", "sortera"];

/**
 * Lugn fallback när AI inte är tillgänglig: viktigt/brådskande först,
 * lätta saker prioriteras upp när energin är låg.
 */
export function heuristicPriority(titles: string[], energyPercent?: number): PriorityTask[] {
  const low = typeof energyPercent === "number" && energyPercent < 40;
  const now = Date.now();
  const scored = titles.map((title, i) => {
    const t = title.toLowerCase();
    let score = 2;
    let why = "Kan göras när det passar.";
    if (URGENT.some((w) => t.includes(w))) {
      score = 0;
      why = "Känns viktigt att få ur världen.";
    } else if (LIGHT.some((w) => t.includes(w))) {
      score = low ? 1 : 2;
      why = low ? "Liten sak – går att göra även med lite energi." : "Liten sak som går snabbt.";
    } else if (HEAVY.some((w) => t.includes(w))) {
      score = low ? 3 : 1;
      why = low ? "Tung sak – den får gärna vänta idag." : "Kräver lite mer av dig.";
    }
    return { title, score, why, i };
  });

  return scored
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .map((s, order) => ({
      id: `${now}-${s.i}`,
      title: s.title,
      bucket: BUCKETS[Math.min(s.score, 3)] as PriorityBucket,
      why: s.why,
      order,
      createdAt: now,
    }));
}

/** Stödjande mening utifrån batteriet – aldrig ett krav. */
export function energyHint(energyPercent?: number): string {
  if (typeof energyPercent !== "number")
    return "Jag sorterar det viktigaste först. Du väljer själv var du börjar.";
  if (energyPercent < 40)
    return "Du har ganska lite energi just nu. Jag skulle börja med en liten uppgift som är viktig men inte kräver mycket av dig.";
  if (energyPercent > 70)
    return "Du har gott om energi just nu. Det här kan vara ett bra tillfälle att ta den uppgift som kräver mest fokus.";
  return "Energin är mitt emellan. Ta en sak i taget – det räcker.";
}

/** Sorterar listan efter nivå och användarens egen ordning. */
export function sortPriority(items: PriorityTask[]): PriorityTask[] {
  return [...items].sort(
    (a, b) => bucketRank(a.bucket) - bucketRank(b.bucket) || a.order - b.order,
  );
}

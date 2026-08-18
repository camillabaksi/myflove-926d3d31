// Kopplar Friktionsbiblioteket till uppgifternas friktionsvärde.
// I stället för att du själv ska gissa hur tungt något är, används det du
// (och andra) redan rapporterat som friktion.

export interface FrictionEntry {
  id: string;
  title: string;
  category: string;
  /** 1–5 hur mycket det påverkar. */
  impact: number;
  /** 1–5 hur ofta det händer. */
  frequency: number;
  /** 1–5 hur mycket mental belastning. */
  mentalLoad: number;
  voteCount: number;
  isMine: boolean;
}

const STOP_WORDS = new Set([
  "och",
  "att",
  "med",
  "för",
  "den",
  "det",
  "som",
  "till",
  "från",
  "min",
  "mitt",
  "mina",
  "ett",
  "en",
  "på",
  "av",
  "i",
  "om",
  "är",
  "ska",
  "kan",
  "göra",
  "gör",
  "inte",
  "hos",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-öA-ZÀ-Ö0-9åäöÅÄÖ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

/** 1–10-friktion ur en friktionsrapport (impact + mental load väger tyngst). */
export function frictionValue(entry: FrictionEntry): number {
  const raw = entry.impact * 1.1 + entry.mentalLoad * 0.7 + entry.frequency * 0.2;
  return Math.max(1, Math.min(10, Math.round(raw)));
}

export interface FrictionSuggestion {
  /** Föreslagen friktion 1–10. */
  friction: number;
  /** Rapporten som matchade. */
  entry: FrictionEntry;
  /** Kort motivering att visa i gränssnittet. */
  reason: string;
}

/**
 * Hittar den friktionsrapport som bäst matchar en uppgiftstitel.
 * Returnerar null när ingenting matchar tydligt – hellre tyst än fel.
 */
export function matchFriction(title: string, library: FrictionEntry[]): FrictionSuggestion | null {
  const taskWords = new Set(words(title));
  if (!taskWords.size || !library.length) return null;

  let best: { entry: FrictionEntry; hits: number } | null = null;
  for (const entry of library) {
    const entryWords = words(`${entry.title} ${entry.category}`);
    let hits = 0;
    for (const w of entryWords) {
      if (taskWords.has(w)) hits += 1;
      else if (
        [...taskWords].some((t) => t.startsWith(w.slice(0, 5)) || w.startsWith(t.slice(0, 5)))
      ) {
        hits += 0.5;
      }
    }
    if (entry.isMine) hits *= 1.3;
    if (hits >= 1 && (!best || hits > best.hits)) best = { entry, hits };
  }

  if (!best) return null;
  const friction = frictionValue(best.entry);
  return {
    friction,
    entry: best.entry,
    reason: best.entry.isMine
      ? `Du har rapporterat "${best.entry.title}" som friktion.`
      : `Liknar friktionen "${best.entry.title}" i biblioteket.`,
  };
}

/** Kort mening när något brukar vara tungt – används bl.a. i Stopp-läget. */
export function heavyNote(suggestion: FrictionSuggestion | null): string | null {
  if (!suggestion || suggestion.friction < 7) return null;
  return `Det här brukar vara tungt (${suggestion.friction}/10). Ta gärna en liten bit.`;
}

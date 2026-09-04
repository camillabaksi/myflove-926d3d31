/**
 * Ork – MyFloves enda energifråga till användaren.
 *
 * "Hur mycket ork har du idag?" med fyra tydliga svar. Ingen procent,
 * ingen skattningsskala, ingen medicinsk terminologi.
 *
 * Bakom kulisserna sparas svaret i BEFINTLIG datamodell (energy_logs via
 * useQuickCheckin, 1–10-skala som i sin tur blir 1–5). Ingen ny datamodell.
 */

export type OrkId = "mycket" | "okej" | "lite" | "slut";

export interface OrkLevel {
  id: OrkId;
  /** Färgprick i UI:t. */
  dot: string;
  label: string;
  /** Värdet som sparas i befintlig 1–10-skala. */
  value10: number;
}

export const ORK_LEVELS: OrkLevel[] = [
  { id: "mycket", dot: "🟢", label: "Mycket", value10: 9 },
  { id: "okej", dot: "🟡", label: "Okej", value10: 7 },
  { id: "lite", dot: "🟠", label: "Lite", value10: 4 },
  { id: "slut", dot: "🔴", label: "Nästan slut", value10: 2 },
];

/** Närmaste ork-nivå för ett sparat 1–10-värde (för att visa vad du valt). */
export function orkFromValue10(value: number | null | undefined): OrkLevel | null {
  if (value == null) return null;
  let best = ORK_LEVELS[0];
  for (const level of ORK_LEVELS) {
    if (Math.abs(level.value10 - value) < Math.abs(best.value10 - value)) best = level;
  }
  return best;
}

/** Fem ansikten – "Hur känns det just nu?". Alltid frivilligt. */
export const MOOD_FACES = [
  { score10: 2, emoji: "😞", label: "Tungt" },
  { score10: 4, emoji: "😕", label: "Sådär" },
  { score10: 6, emoji: "😐", label: "Okej" },
  { score10: 8, emoji: "🙂", label: "Bra" },
  { score10: 10, emoji: "😍", label: "Toppen" },
];

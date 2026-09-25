/**
 * Orkfrågan – samma tre kapacitetslägen som resten av MyFlove:
 * 🟢 Fullt / 🟡 Mellan / 🔴 Lågt. Ingen procent, ingen skala.
 *
 * Svaret sätter kapacitetsläget (useCapacityMode) och sparas dessutom som
 * tidigare i energy_logs (1–10) för historik. Gamla sparade värden från den
 * fyrgradiga modellen (Mycket 9, Okej 7, Lite 4, Nästan slut 2) läses in via
 * capacityFromOrk10 – ingenting skrivs om.
 */
import { CAPACITY_META, capacityFromOrk10, type CapacityMode } from "./priority-engine";

export type OrkId = CapacityMode;

export interface OrkLevel {
  id: OrkId;
  dot: string;
  label: string;
  /** Värdet som sparas i befintlig 1–10-skala (historik). */
  value10: number;
}

const VALUE10: Record<CapacityMode, number> = { fullt: 9, mellan: 6, lagt: 3 };

export const ORK_LEVELS: OrkLevel[] = (["fullt", "mellan", "lagt"] as const).map((id) => ({
  id,
  dot: CAPACITY_META[id].dot,
  label: CAPACITY_META[id].label,
  value10: VALUE10[id],
}));

/** Kapacitetsnivå för ett sparat 1–10-värde (även gamla fyrgradiga värden). */
export function orkFromValue10(value: number | null | undefined): OrkLevel | null {
  const mode = capacityFromOrk10(value);
  return mode ? (ORK_LEVELS.find((l) => l.id === mode) ?? null) : null;
}

/** Fem ansikten – "Hur känns det just nu?". Alltid frivilligt. */
export const MOOD_FACES = [
  { score10: 2, emoji: "😞", label: "Tungt" },
  { score10: 4, emoji: "😕", label: "Sådär" },
  { score10: 6, emoji: "😐", label: "Okej" },
  { score10: 8, emoji: "🙂", label: "Bra" },
  { score10: 10, emoji: "😍", label: "Toppen" },
];

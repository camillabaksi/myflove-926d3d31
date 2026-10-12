import { energyPercent } from "@/lib/energy-percent";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import type { MoodEntry } from "@/hooks/use-data";

export type Observation = {
  key: string;
  ts: number;
  energyPct?: number;
  mood?: number;
  note?: string;
};

/**
 * Slår ihop dagens energi- och måendeobservationer till kort per tidpunkt.
 * Poster inom samma minut hör ihop (samma sparning i formuläret ovanför).
 * Ingen ny datakälla – bara en presentation av befintliga observationer.
 */
export function buildObservations(
  energy: EnergyLogEntry[],
  moods: MoodEntry[],
  windowMs = 90_000,
): Observation[] {
  const out: Observation[] = [];
  const rest = [...moods];

  for (const e of energy) {
    const ts = new Date(e.logged_at).getTime();
    const i = rest.findIndex((m) => Math.abs(m.date - ts) <= windowMs);
    const paired = i >= 0 ? rest.splice(i, 1)[0] : undefined;
    out.push({
      key: e.id,
      ts,
      energyPct: energyPercent(e),
      ...(paired ? { mood: paired.score, ...(paired.note ? { note: paired.note } : {}) } : {}),
    });
  }
  for (const m of rest) {
    out.push({ key: m.id, ts: m.date, mood: m.score, ...(m.note ? { note: m.note } : {}) });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

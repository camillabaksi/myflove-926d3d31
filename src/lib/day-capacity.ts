import { edgeToPercent, type DayEdges } from "@/lib/day-window";

export interface EnergyLogEntry {
  level: number;
  logged_at: string;
}

export type CapacitySource = "morning" | "energy-log";

export interface DayCapacity {
  /** Avrundad procent 0–100, eller null när det saknas egen data för dagen. */
  percent: number | null;
  source: CapacitySource | null;
  /** Morgonens egna incheckning (procent), om den finns. */
  morning: number | null;
  /** Senast registrerade energinivå samma dag (1–5), om den finns. */
  reportedLevel: number | null;
}

const localDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Gemensam källa för dagens kapacitet i kalendern.
 * Bygger ENDAST på användarens egen registrering för just den dagen:
 * 1) morgonens batteri-incheckning (befintlig skala 1–10 → edgeToPercent),
 * 2) annars senaste energiloggen samma dag (1–5).
 * Planerade aktiviteter och klockan påverkar aldrig värdet; framtida dagar
 * utan egen registrering ger null (visas som "–").
 */
export function dayCapacity(date: string, edges: DayEdges | null | undefined, logs: EnergyLogEntry[] | null | undefined): DayCapacity {
  const m = edges?.[date]?.morning;
  const morning = typeof m === "number" && Number.isFinite(m) ? Math.round(edgeToPercent(m)) : null;
  const latest = (logs ?? [])
    .filter(e => typeof e?.level === "number" && localDate(e.logged_at) === date)
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0];
  const reportedLevel = latest ? Math.min(5, Math.max(1, latest.level)) : null;
  // Ny incheckning under dagen (energiloggen) får uppdatera värdet om den är senare än morgonen.
  if (reportedLevel != null && morning == null) {
    return { percent: Math.round(((reportedLevel - 1) / 4) * 100), source: "energy-log", morning, reportedLevel };
  }
  if (morning != null) return { percent: morning, source: "morning", morning, reportedLevel };
  return { percent: null, source: null, morning: null, reportedLevel: null };
}

export type CapacityTone = "high" | "middle" | "low";
export const capacityTone = (percent: number): CapacityTone => (percent >= 60 ? "high" : percent >= 35 ? "middle" : "low");

import { energyPercent } from "./energy-percent";
import { edgeToPercent, type DayEdges } from "@/lib/day-window";

export interface EnergyLogEntry {
  level: number;
  logged_at: string;
  note?: string | null;
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
 * Senaste tidsstämplade registreringen gäller: morgonincheckning (1–10)
 * eller energilogg (1–5). Äldre morgonposter utan tid används som fallback.
 * Planerade aktiviteter och klockan påverkar aldrig värdet; framtida dagar
 * utan egen registrering ger null (visas som "–").
 */
export function dayCapacity(
  date: string,
  edges: DayEdges | null | undefined,
  logs: EnergyLogEntry[] | null | undefined,
  today?: string,
): DayCapacity {
  const now = new Date();
  const currentDate =
    today ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date > currentDate)
    return { percent: null, source: null, morning: null, reportedLevel: null };
  const m = edges?.[date]?.morning;
  const morning = typeof m === "number" && Number.isFinite(m) ? Math.round(edgeToPercent(m)) : null;
  const latest = (logs ?? [])
    .filter((e) => Number.isFinite(e?.level) && localDate(e.logged_at) === date)
    .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at))[0];
  const reportedLevel = latest ? Math.min(5, Math.max(1, latest.level)) : null;
  const morningTime = Date.parse(edges?.[date]?.morningLoggedAt ?? "");
  const logIsLatest =
    latest && (!Number.isFinite(morningTime) || Date.parse(latest.logged_at) >= morningTime);
  if (reportedLevel != null && (morning == null || logIsLatest)) {
    return {
      percent: energyPercent(latest!),
      source: "energy-log",
      morning,
      reportedLevel,
    };
  }
  if (morning != null) return { percent: morning, source: "morning", morning, reportedLevel };
  return { percent: null, source: null, morning: null, reportedLevel: null };
}

export type CapacityTone = "high" | "middle" | "low";
export const capacityTone = (percent: number): CapacityTone =>
  percent >= 60 ? "high" : percent >= 35 ? "middle" : "low";

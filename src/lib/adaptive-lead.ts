// Anpassad framförhållning: justerar automatiskt hur långt innan en påminnelse kommer,
// baserat på om du brukar bli sen eller tidig för just den typen av hållpunkt.
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export type HoldpointType = "lektion" | "barn" | "uppgift" | "kalender" | "rutin";

export const HOLDPOINT_LABELS: Record<HoldpointType, string> = {
  lektion: "🎓 Lektioner",
  barn: "🎒 Barnens dag",
  uppgift: "✅ Att göra med tid",
  kalender: "📅 Kalenderhändelser",
  rutin: "🔁 Rutiner",
};

/** En rapport: hur det gick förra gången. */
export type Outcome = "sen" | "lagom" | "tidig";

export interface AdaptiveLeadState {
  /** Läget på/av. */
  enabled: boolean;
  /** Senaste utfallen per typ (nyast sist, max 10). */
  samples: Partial<Record<HoldpointType, Outcome[]>>;
}

export const ADAPTIVE_LEAD_KEY = "myflove-adaptive-lead";

export const DEFAULT_ADAPTIVE_LEAD: AdaptiveLeadState = {
  enabled: false,
  samples: {},
};

const MAX_SAMPLES = 10;
/** Hur mycket varje utfall väger, i minuter. */
const STEP = 5;
/** Tak för hur mycket vi flyttar en påminnelse. */
export const MAX_ADJUST = 30;
export const MIN_ADJUST = -15;

/**
 * Räknar ut hur många minuter påminnelsen ska flyttas för en typ.
 * Positivt = tidigare notis (du brukar bli sen). Negativt = senare notis.
 */
export function adjustmentFor(state: AdaptiveLeadState, type: HoldpointType): number {
  if (!state.enabled) return 0;
  const list = state.samples[type] ?? [];
  if (list.length < 2) return 0;
  const recent = list.slice(-MAX_SAMPLES);
  let score = 0;
  for (const s of recent) {
    if (s === "sen") score += 1;
    else if (s === "tidig") score -= 1;
  }
  const raw = Math.round((score / recent.length) * MAX_SAMPLES * STEP);
  const rounded = Math.round(raw / 5) * 5;
  return Math.max(MIN_ADJUST, Math.min(MAX_ADJUST, rounded));
}

export function describeAdjustment(minutes: number): string {
  if (minutes > 0) return `${minutes} min tidigare notis`;
  if (minutes < 0) return `${Math.abs(minutes)} min senare notis`;
  return "Ingen justering ännu";
}

export function useAdaptiveLead() {
  const [stored, setStored] = useCloudSyncedStorage<AdaptiveLeadState>(
    ADAPTIVE_LEAD_KEY,
    DEFAULT_ADAPTIVE_LEAD,
  );
  const state: AdaptiveLeadState = {
    ...DEFAULT_ADAPTIVE_LEAD,
    ...(stored ?? {}),
    samples: { ...(stored?.samples ?? {}) },
  };

  const setEnabled = (enabled: boolean) => setStored({ ...state, enabled });

  const record = (type: HoldpointType, outcome: Outcome) => {
    const list = [...(state.samples[type] ?? []), outcome].slice(-MAX_SAMPLES);
    setStored({ ...state, samples: { ...state.samples, [type]: list } });
  };

  const reset = (type: HoldpointType) => {
    const samples = { ...state.samples };
    delete samples[type];
    setStored({ ...state, samples });
  };

  return {
    state,
    setEnabled,
    record,
    reset,
    adjustment: (type: HoldpointType) => adjustmentFor(state, type),
  };
}

/** Applicerar justeringen på en framförhållning i minuter (aldrig negativ). */
export function applyAdaptiveLead(
  baseMinutes: number,
  state: AdaptiveLeadState,
  type: HoldpointType,
): number {
  return Math.max(0, baseMinutes + adjustmentFor(state, type));
}

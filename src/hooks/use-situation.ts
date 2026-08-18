import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useEnabledAreas } from "@/lib/life-areas";
import {
  EMPTY_SITUATION,
  SITUATION_META,
  type SituationId,
  type SituationState,
} from "@/lib/situation";

const KEY = "myflove-situation";

/**
 * Min situation – vilka livssituationer som pågår just nu.
 * Att pausa en situation raderar aldrig något; den kan aktiveras igen.
 */
export function useSituation() {
  const [state, setState] = useCloudSyncedStorage<SituationState>(KEY, EMPTY_SITUATION);
  const { enabled, toggleArea } = useEnabledAreas();

  const situation: SituationState = {
    ...EMPTY_SITUATION,
    ...state,
    entries: { ...(state?.entries ?? {}) },
  };

  const toggle = useCallback(
    (id: SituationId) => {
      const today = new Date().toISOString().slice(0, 10);
      setState((prev) => {
        const base: SituationState = { ...EMPTY_SITUATION, ...prev, entries: { ...(prev?.entries ?? {}) } };
        const cur = base.entries[id] ?? { active: false, note: "" };
        const nextActive = !cur.active;
        base.entries[id] = {
          ...cur,
          active: nextActive,
          since: nextActive ? today : cur.since,
          pausedAt: nextActive ? cur.pausedAt : today,
        };
        base.answered = true;
        return base;
      });

      // Situationen slår på sitt livsområde – men stänger aldrig av något åt användaren.
      const area = SITUATION_META[id].area;
      const wasActive = Boolean(state?.entries?.[id]?.active);
      if (area && !wasActive && !enabled.includes(area)) toggleArea(area);
    },
    [setState, state, enabled, toggleArea],
  );

  const setNote = useCallback(
    (id: SituationId, note: string) =>
      setState((prev) => {
        const base: SituationState = { ...EMPTY_SITUATION, ...prev, entries: { ...(prev?.entries ?? {}) } };
        const cur = base.entries[id] ?? { active: false, note: "" };
        base.entries[id] = { ...cur, note };
        return base;
      }),
    [setState],
  );

  return { situation, toggle, setNote };
}

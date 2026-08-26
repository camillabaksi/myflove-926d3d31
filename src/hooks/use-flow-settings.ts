import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/storage";

/**
 * Flow ska aldrig ta över appen.
 * Här bestämmer användaren hur mycket Flow får säga – och kan tysta honom helt.
 */

export type FlowHelpLevel = "tyst" | "diskret" | "aktiv";

export interface FlowSettings {
  /** Flow syns i vyerna. */
  enabled: boolean;
  /** Hur ofta Flow tar plats med egna kommentarer. */
  level: FlowHelpLevel;
  /** Flow får berätta vad han börjar lära sig om dig. */
  learning: boolean;
}

const KEY = "myflove-flow-settings";

export const DEFAULT_FLOW_SETTINGS: FlowSettings = {
  enabled: true,
  level: "diskret",
  learning: true,
};

/** Meddelanden användaren viftat bort idag – Flow tjatar inte. */
interface Dismissals {
  day: string;
  ids: string[];
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useFlowSettings() {
  const [settings, setSettings] = useLocalStorage<FlowSettings>(KEY, DEFAULT_FLOW_SETTINGS);
  const [dismissed, setDismissed] = useLocalStorage<Dismissals>("myflove-flow-dismissed", {
    day: todayKey(),
    ids: [],
  });

  const value = useMemo<FlowSettings>(
    () => ({ ...DEFAULT_FLOW_SETTINGS, ...(settings ?? {}) }),
    [settings],
  );

  const update = useCallback(
    (patch: Partial<FlowSettings>) => setSettings((prev) => ({ ...DEFAULT_FLOW_SETTINGS, ...prev, ...patch })),
    [setSettings],
  );

  const todaysDismissed = useMemo(
    () => (dismissed?.day === todayKey() ? (dismissed.ids ?? []) : []),
    [dismissed],
  );

  const dismiss = useCallback(
    (id: string) =>
      setDismissed((prev) => {
        const day = todayKey();
        const ids = prev?.day === day ? (prev.ids ?? []) : [];
        return { day, ids: ids.includes(id) ? ids : [...ids, id] };
      }),
    [setDismissed],
  );

  const isDismissed = useCallback((id: string) => todaysDismissed.includes(id), [todaysDismissed]);

  return { settings: value, update, dismiss, isDismissed };
}

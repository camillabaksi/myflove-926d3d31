import { useCallback, useMemo } from "react";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  DEFAULT_FLOW_PRIORITIES,
  type FlowPriorityKey,
  type FlowPriorityMap,
} from "@/lib/flow-priorities";

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
  /** Tidigast på dygnet Flow får höra av sig proaktivt. */
  quietFrom: string;
  /** Senast på dygnet Flow får höra av sig proaktivt. */
  quietTo: string;
  /** Hur långt före en viktig tid Flow förvarnar (minuter). */
  leadMinutes: number;
  /** Vilka typer av tider Flow ska prioritera. */
  priorities: FlowPriorityMap;
}

const KEY = "myflove-flow-settings";

export const DEFAULT_FLOW_SETTINGS: FlowSettings = {
  enabled: true,
  level: "diskret",
  learning: true,
  quietFrom: "07:00",
  quietTo: "21:00",
  leadMinutes: 30,
  priorities: DEFAULT_FLOW_PRIORITIES,
};

/** Meddelanden användaren viftat bort idag – Flow tjatar inte. */
interface Dismissals {
  day: string;
  ids: string[];
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useFlowSettings() {
  // Följer användaren mellan enheter via user_kv (lokalt först, moln som sanning).
  const [settings, setSettings] = useCloudSyncedStorage<FlowSettings>(KEY, DEFAULT_FLOW_SETTINGS);
  const [dismissed, setDismissed] = useCloudSyncedStorage<Dismissals>("myflove-flow-dismissed", {
    day: todayKey(),
    ids: [],
  });

  const value = useMemo<FlowSettings>(
    () => ({
      ...DEFAULT_FLOW_SETTINGS,
      ...(settings ?? {}),
      priorities: { ...DEFAULT_FLOW_PRIORITIES, ...(settings?.priorities ?? {}) },
    }),
    [settings],
  );

  const update = useCallback(
    (patch: Partial<FlowSettings>) =>
      setSettings((prev) => ({ ...DEFAULT_FLOW_SETTINGS, ...prev, ...patch })),
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

  const togglePriority = useCallback(
    (key: FlowPriorityKey, on: boolean) =>
      setSettings((prev) => {
        const merged = { ...DEFAULT_FLOW_SETTINGS, ...prev };
        return {
          ...merged,
          priorities: { ...DEFAULT_FLOW_PRIORITIES, ...merged.priorities, [key]: on },
        };
      }),
    [setSettings],
  );

  const reset = useCallback(() => setSettings(DEFAULT_FLOW_SETTINGS), [setSettings]);

  const isDismissed = useCallback((id: string) => todaysDismissed.includes(id), [todaysDismissed]);

  return { settings: value, update, togglePriority, reset, dismiss, isDismissed };
}

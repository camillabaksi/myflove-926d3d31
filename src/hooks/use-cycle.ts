import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  EMPTY_CYCLE,
  cycleStatus,
  dayKey,
  type CycleData,
  type CycleSymptom,
} from "@/lib/cycle";

const KEY = "myflove-cycle";

/**
 * Menscykel – helt frivillig och avstängd tills användaren själv svarar ja.
 * Sparas i befintlig kontosynkad user_kv-lagring, ingen ny datakälla.
 */
export function useCycle() {
  const [raw, setData] = useCloudSyncedStorage<CycleData>(KEY, EMPTY_CYCLE);
  const data = useMemo<CycleData>(() => ({ ...EMPTY_CYCLE, ...raw }), [raw]);

  const setEnabled = useCallback(
    (enabled: boolean) => setData({ ...data, enabled, answered: true }),
    [data, setData],
  );

  const setUseInFlow = useCallback(
    (useInFlow: boolean) => setData({ ...data, useInFlow }),
    [data, setData],
  );

  const togglePeriodDay = useCallback(
    (day: string = dayKey()) => {
      const has = data.periodDays.includes(day);
      setData({
        ...data,
        periodDays: has
          ? data.periodDays.filter((d) => d !== day)
          : [...data.periodDays, day].sort(),
      });
    },
    [data, setData],
  );

  const setSymptoms = useCallback(
    (kinds: CycleSymptom[], day: string = dayKey()) => {
      const rest = data.symptoms.filter((s) => s.day !== day);
      setData({ ...data, symptoms: kinds.length ? [...rest, { day, kinds }] : rest });
    },
    [data, setData],
  );

  const status = useMemo(() => cycleStatus(data), [data]);
  const todaySymptoms = useMemo(
    () => data.symptoms.find((s) => s.day === dayKey())?.kinds ?? [],
    [data.symptoms],
  );

  return { cycle: data, status, todaySymptoms, setEnabled, setUseInFlow, togglePeriodDay, setSymptoms };
}

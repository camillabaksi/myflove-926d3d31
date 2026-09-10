import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  EMPTY_CYCLE,
  cycleStatus,
  dayKey,
  daysInRange,
  periodRangeFor,
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

  /** Spara en hel period: från första till sista mensdagen. */
  const setPeriodRange = useCallback(
    (start: string, end: string) => {
      const days = daysInRange(start, end);
      if (!days.length) return;
      setData({ ...data, periodDays: [...new Set([...data.periodDays, ...days])].sort() });
    },
    [data, setData],
  );

  /** Ta bort alla dagar i en registrerad period. */
  const removePeriodRange = useCallback(
    (start: string, end: string) => {
      const days = new Set(daysInRange(start, end));
      setData({ ...data, periodDays: data.periodDays.filter((d) => !days.has(d)) });
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

  const currentPeriod = useMemo(() => periodRangeFor(data.periodDays, dayKey()), [data.periodDays]);

  return {
    cycle: data,
    status,
    todaySymptoms,
    currentPeriod,
    setEnabled,
    setUseInFlow,
    togglePeriodDay,
    setPeriodRange,
    removePeriodRange,
    setSymptoms,
  };
}

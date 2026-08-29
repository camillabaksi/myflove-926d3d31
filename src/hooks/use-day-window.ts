import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/storage";
import {
  DEFAULT_DAY_WINDOW,
  dayKey,
  type DayEdgeEntry,
  type DayEdges,
  type DayWindow,
} from "@/lib/day-window";

/**
 * Dagens ramar: när morgonen startar, när dagen slutar och hur
 * batteriet kändes vid de två tidpunkterna. Sparas lokalt (krypterat
 * som övrig energidata) – ingen ny tabell behövs.
 */
export function useDayWindow() {
  const [window, setWindowRaw] = useLocalStorage<DayWindow>(
    "myflove-day-window",
    DEFAULT_DAY_WINDOW,
  );
  const [edges, setEdges] = useLocalStorage<DayEdges>("myflove-day-edges", {});

  const today = dayKey();
  const todayEdges = useMemo<DayEdgeEntry>(() => edges?.[today] ?? {}, [edges, today]);

  const setWindow = useCallback(
    (next: Partial<DayWindow>) =>
      setWindowRaw((prev) => ({ ...DEFAULT_DAY_WINDOW, ...prev, ...next })),
    [setWindowRaw],
  );

  const setMorning = useCallback(
    (value: number) =>
      setEdges((prev) => ({
        ...(prev ?? {}),
        [today]: { ...(prev?.[today] ?? {}), morning: value },
      })),
    [setEdges, today],
  );

  const setEvening = useCallback(
    (value: number) =>
      setEdges((prev) => ({
        ...(prev ?? {}),
        [today]: { ...(prev?.[today] ?? {}), evening: value },
      })),
    [setEdges, today],
  );

  return {
    window: { ...DEFAULT_DAY_WINDOW, ...(window ?? {}) },
    setWindow,
    todayEdges,
    setMorning,
    setEvening,
  };
}

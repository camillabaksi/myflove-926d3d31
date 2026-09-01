import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useLocalStorage } from "@/lib/storage";
import { todayISO, type DailyCheckin, type TimeAvailability } from "@/lib/daily-flow";

/* ── Dagens incheckning ──────────────────────────────────────────── */

export function useDailyCheckin() {
  const [history, setHistory] = useCloudSyncedStorage<DailyCheckin[]>("myflove-daily-checkin", []);

  const today = todayISO();
  const checkin = useMemo(() => history.find((c) => c.date === today) ?? null, [history, today]);

  const save = useCallback(
    (input: { energy: number; load: number; time: TimeAvailability }) => {
      const entry: DailyCheckin = { ...input, date: todayISO(), at: Date.now() };
      setHistory((prev) => [entry, ...prev.filter((c) => c.date !== entry.date)].slice(0, 120));
      return entry;
    },
    [setHistory],
  );

  const clearToday = useCallback(
    () => setHistory((prev) => prev.filter((c) => c.date !== todayISO())),
    [setHistory],
  );

  return { checkin, history, save, clearToday };
}

/* ── Flow Reset (kvällsläge) ─────────────────────────────────────── */

export type DayFeel = "bra" | "sadar" | "kaos";

export interface FlowReset {
  date: string;
  feel: DayFeel;
  at: number;
  note?: string;
}

export function useFlowReset() {
  const [entries, setEntries] = useCloudSyncedStorage<FlowReset[]>("myflove-flow-reset", []);
  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today) ?? null;

  const save = useCallback(
    (feel: DayFeel, note?: string) => {
      const entry: FlowReset = { date: todayISO(), feel, at: Date.now(), note };
      setEntries((prev) => [entry, ...prev.filter((e) => e.date !== entry.date)].slice(0, 180));
    },
    [setEntries],
  );

  return { entries, todayEntry, save };
}

/* ── Vad som faktiskt hjälpte (för Veckans Flow) ─────────────────── */

export type FlowUsageKind = "quickflow" | "fokus" | "planering" | "omplanering";

export interface FlowUsageEvent {
  kind: FlowUsageKind;
  at: number;
}

export const USAGE_META: Record<FlowUsageKind, { emoji: string; label: string }> = {
  quickflow: { emoji: "⚡", label: "QuickFlow" },
  fokus: { emoji: "🎯", label: "Fokusläge" },
  planering: { emoji: "📅", label: "Planering" },
  omplanering: { emoji: "↻", label: "Omplanering" },
};

export function useFlowUsage() {
  const [events, setEvents] = useCloudSyncedStorage<FlowUsageEvent[]>("myflove-flow-usage", []);

  const log = useCallback(
    (kind: FlowUsageKind) => {
      setEvents((prev) => [{ kind, at: Date.now() }, ...prev].slice(0, 500));
    },
    [setEvents],
  );

  const lastWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return events.filter((e) => e.at >= cutoff);
  }, [events]);

  const weekCounts = useMemo(() => {
    const counts: Record<FlowUsageKind, number> = {
      quickflow: 0,
      fokus: 0,
      planering: 0,
      omplanering: 0,
    };
    for (const e of lastWeek) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    return counts;
  }, [lastWeek]);

  return { events, log, weekCounts };
}

/* ── Onboarding: vad vill du att MyFlove hjälper dig med? ────────── */

export const FLOW_GOALS = [
  { id: "minnas", label: "Komma ihåg saker" },
  { id: "planera", label: "Planera min dag" },
  { id: "prioritera", label: "Prioritera" },
  { id: "komma-igang", label: "Komma igång" },
  { id: "kalender", label: "Hålla koll på kalendern" },
  { id: "stress", label: "Minska stressen kring allt jag måste göra" },
  { id: "struktur", label: "Få bättre struktur på jobb/studier" },
  { id: "annat", label: "Annat" },
] as const;

export type FlowGoalId = (typeof FLOW_GOALS)[number]["id"];

export interface FlowPrefs {
  goals: FlowGoalId[];
  onboardedAt?: number;
}

export function useFlowPrefs() {
  const [prefs, setPrefs] = useCloudSyncedStorage<FlowPrefs>("myflove-flow-prefs", { goals: [] });

  const complete = useCallback(
    (goals: FlowGoalId[]) => setPrefs({ goals, onboardedAt: Date.now() }),
    [setPrefs],
  );

  return { prefs, setPrefs, complete, done: !!prefs.onboardedAt };
}

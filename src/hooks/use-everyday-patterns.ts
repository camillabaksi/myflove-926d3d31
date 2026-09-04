import { useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import {
  buildEverydayPatterns,
  everydayPatternLines,
  type EverydayPatterns,
} from "@/lib/everyday-patterns";

/**
 * MyFlove lär sig din vardag utifrån data som redan finns:
 * dina aktiviteter (uppgifter + påminnelser) och dina energiloggar.
 * Ingen ny datamodell – bara en läsning av det du redan gjort.
 */
export function useEverydayPatterns(): EverydayPatterns & { lines: string[] } {
  const { tasks } = useTasks();
  const { reminders } = useReminders();
  // Samma lokala cache av energy_logs som insikter och mönster redan läser.
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);

  return useMemo(() => {
    const activities = [
      ...tasks
        .filter((t) => t.dueDate)
        .map((t) => ({ title: t.title, date: t.dueDate as string })),
      ...reminders
        .filter((r) => !r.canceled)
        .map((r) => ({ title: r.title, date: r.date })),
    ];
    const patterns = buildEverydayPatterns({
      activities,
      energy: energyLog.map((e) => ({ level: e.level, loggedAt: e.logged_at })),
    });
    return { ...patterns, lines: everydayPatternLines(patterns) };
  }, [tasks, reminders, energyLog]);
}

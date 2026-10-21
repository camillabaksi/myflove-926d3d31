import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { daySummaryLines } from "@/lib/day-summary";
import { useLang } from "@/hooks/use-language";

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Idag: mjuk summering av det som faktiskt hänt, utan poäng eller krav. */
export function DaySummaryCard() {
  const { t } = useLang();
  const { tasks } = useTasks();
  const { entries } = useEnergyFlow();
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);
  const lines = useMemo(() => {
    const now = new Date();
    return daySummaryLines({
      completedToday: tasks.filter((x) => x.completed && x.completedAt && sameDay(new Date(x.completedAt), now)).length,
      energyGivers: entries.filter((e) => e.direction === "gives" && sameDay(new Date(e.occurredAt), now)).length,
      checkedIn: (energyLog ?? []).some((e) => sameDay(new Date(e.logged_at), now)),
    });
  }, [tasks, entries, energyLog]);
  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5 sm:px-4" aria-labelledby="day-summary-title" data-testid="day-summary">
      <h2 id="day-summary-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Sparkles size={15} className="text-primary" aria-hidden />{t("Din dag hittills")}
      </h2>
      <ul className="mt-1 space-y-0.5 text-sm text-foreground">
        {lines.map((line) => <li key={line}>{t(line)}</li>)}
      </ul>
    </section>
  );
}

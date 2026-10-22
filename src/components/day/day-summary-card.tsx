import { useId, useMemo, useState } from "react";
import { ChevronRight, Feather, Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { daySummaryLines, waitingCapturesLine } from "@/lib/day-summary";
import { useQuickflow } from "@/hooks/use-quickflow";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/hooks/use-language";

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Idag: mjuk summering av det som faktiskt hänt, utan poäng eller krav. */
export function DaySummaryCard() {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const { tasks } = useTasks();
  const { entries } = useEnergyFlow();
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);
  const { openItems } = useQuickflow();
  const waiting = waitingCapturesLine(openItems.length, new Date().getHours());
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
      <h2 id="day-summary-title">
        <button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)} className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-semibold text-ink">
          <span className="flex min-w-0 items-center gap-2"><Sparkles size={17} className="shrink-0 text-primary" aria-hidden />{t("Din dag hittills")}</span>
          <ChevronRight size={21} aria-hidden className={`shrink-0 text-[#512654] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
      </h2>
      <div id={detailsId} hidden={!expanded}>
      <ul className="mt-1 space-y-0.5 text-sm text-foreground">
        {lines.map((line) => <li key={line}>{t(line)}</li>)}
      </ul>
      {waiting && (
        <Link to="/quickflow" className="mt-2 inline-flex min-h-11 w-full items-center gap-2 rounded-xl bg-lavender/40 px-3 text-sm font-medium text-ink hover:bg-lavender/60" data-testid="waiting-captures">
          <Feather size={15} className="shrink-0 text-primary" aria-hidden /><span className="min-w-0">{t(waiting)}</span>
        </Link>
      )}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-data";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useDailyCheckin, useFlowUsage } from "@/hooks/use-daily-flow";
import { useFlowScore } from "@/hooks/use-flowscore";
import {
  FRICTION_LABEL,
  PRIORITY_DOT,
  TIME_META,
  recommendTasks,
  todayISO,
  type ScoredTask,
} from "@/lib/daily-flow";
import { minutesLeftOfWorkday } from "@/lib/workflow";
import { useReducedMotion } from "@/components/myflove/motion";

/**
 * "Din dag blev annorlunda än planerat."
 * Bygger om resten av dagen utifrån kvarvarande tid, deadlines, energi och friktion.
 * Ingen skuld – bara en realistisk plan.
 */
export default function DayRebuild() {
  const { activeTasks, snoozeTask } = useTasks();
  const { checkin } = useDailyCheckin();
  const { flow } = useFlowScore();
  const { log } = useFlowUsage();
  const [dismissed, setDismissed] = useCloudSyncedStorage<string>("myflove-rebuild-dismissed", "");
  const [plan, setPlan] = useState<ScoredTask[] | null>(null);

  const today = todayISO();
  const minutesLeft = minutesLeftOfWorkday(22);

  const planTasks = useMemo(
    () =>
      activeTasks.filter(
        (t) => !t.syncKey?.includes(":exam:") && !t.syncKey?.includes(":revision:"),
      ),
    [activeTasks],
  );

  /** Saker med tid idag som redan passerat, plus dagens saker som inte hunnits med. */
  const missed = useMemo(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return planTasks.filter(
      (t) => t.dueDate && (t.dueDate < today || (t.dueDate === today && t.time && t.time < hhmm)),
    );
  }, [planTasks, today]);

  const availableMinutes = checkin
    ? Math.min(TIME_META[checkin.time].minutes, Math.max(15, minutesLeft))
    : Math.max(15, Math.min(minutesLeft, 120));

  const ctx = {
    energy: checkin?.energy ?? 3,
    load: checkin?.load ?? 3,
    availableMinutes,
    maxFriction: flow.maxFriction,
    today,
  };

  const reduced = useReducedMotion();
  const [movingId, setMovingId] = useState<string | null>(null);

  const rebuild = () => {
    const ranked = recommendTasks(planTasks, ctx, 12);
    const fits: ScoredTask[] = [];
    let budget = availableMinutes;
    for (const item of ranked) {
      if (item.minutes <= budget) {
        fits.push(item);
        budget -= item.minutes;
      }
      if (fits.length >= 3) break;
    }
    setPlan(fits);
    log("omplanering");
    setDismissed(today);
    toast.success("Jag har byggt om resten av dagen. 💙");
  };

  const moveToTomorrow = (item: ScoredTask) => {
    const commit = () => {
      snoozeTask(item.task.id, 1);
      setPlan((prev) => prev?.filter((p) => p.task.id !== item.task.id) ?? null);
      setMovingId(null);
      toast("Den får ta imorgon istället.");
    };
    if (reduced) {
      commit();
      return;
    }
    // Uppgiften glider iväg mot morgondagen innan den försvinner.
    setMovingId(item.task.id);
    setTimeout(commit, 420);
  };

  if (plan) {
    return (
      <div className="surface-card p-5 space-y-3 border-primary/30">
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-primary" />
          <h3 className="font-semibold text-ink">Resten av dagen, som den ser ut nu</h3>
        </div>
        {plan.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Det finns inte tid för något mer idag som är rimligt. Det räcker så.
          </p>
        ) : (
          <ul className="space-y-2">
            {plan.map((item) => (
              <li
                key={item.task.id}
                data-motion="living"
                className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3 transition-all duration-500"
                style={
                  movingId === item.task.id
                    ? { transform: "translateX(38%)", opacity: 0 }
                    : undefined
                }
              >
                <span>{PRIORITY_DOT[item.priority]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{item.task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.minutes} min · {FRICTION_LABEL(item.friction)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => moveToTomorrow(item)}
                  className="text-xs text-muted-foreground underline underline-offset-2 shrink-0"
                >
                  {movingId === item.task.id ? "Flyttar →" : "Flytta"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Det här är en realistisk plan för {availableMinutes} minuter – inte en perfekt plan.
        </p>
        <button
          type="button"
          onClick={() => setPlan(null)}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Stäng
        </button>
      </div>
    );
  }

  const dayChanged = missed.length >= 1;
  if (!dayChanged || dismissed === today) return null;

  return (
    <div className="surface-card p-4 space-y-3 border-gold/40">
      <div>
        <p className="font-medium text-ink">Din dag blev annorlunda än planerat.</p>
        <p className="text-sm text-muted-foreground">
          {missed.length} {missed.length === 1 ? "sak" : "saker"} har passerat sin tid. Vill du att
          jag bygger om resten av dagen?
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={rebuild}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
        >
          Ja, bygg om
        </button>
        <button
          type="button"
          onClick={() => setDismissed(today)}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          Jag gör det själv
        </button>
        <button
          type="button"
          onClick={() => setDismissed(today)}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground"
        >
          Inte nu
        </button>
      </div>
    </div>
  );
}

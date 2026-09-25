import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Undo2 } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { todayISO, daysUntilDate } from "@/lib/flow-items";
import {
  ADJUST_META,
  adjustSummary,
  suggestAdjustments,
  type AdjustKind,
  type AdjustSuggestion,
  type AdjustTask,
} from "@/lib/day-adjust";

const EMPTY: Record<AdjustKind, number> = { flytta: 0, forenkla: 0, dela: 0 };

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
}

/**
 * Steg 3 – "Behöver du planera om?"
 * Flow föreslår att flytta, förenkla eller dela upp dagens saker.
 * Ingenting händer förrän du trycker på godkännandeknappen.
 */
export default function DayAdjust() {
  const { activeTasks, snoozeTask, setTaskDueDate, updateTask, addTaskSteps } = useTasks();
  const capacity = useCapacityMode();
  // Kapacitetsläget (användarens val) är källan – inte FlowScore.
  const flow = { score: capacity.percent, capacityMinutes: capacity.minutes, suggestedTasks: capacity.suggestedTasks };
  const [handled, setHandled] = useState<Record<string, AdjustKind>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const today = todayISO();

  const candidates = useMemo<AdjustTask[]>(() => {
    return activeTasks
      .filter((t) => !t.completed && (!t.dueDate || t.dueDate <= today))
      .slice(0, 12)
      .map((t) => ({
        id: t.id,
        title: t.title,
        time: t.time,
        dueDate: t.dueDate,
        daysUntil: t.dueDate ? daysUntilDate(t.dueDate) : undefined,
        friction: t.friction,
        energyImpact: t.energyImpact,
        kind: t.kind,
        steps: t.steps?.length ?? 0,
      }));
  }, [activeTasks, today]);

  const suggestions = useMemo(
    () => suggestAdjustments(candidates, { capacity: Math.max(1, flow.suggestedTasks || 3) }),
    [candidates, flow.suggestedTasks],
  );

  const open = suggestions.filter(
    (s) => !handled[`${s.taskId}:${s.kind}`] && !skipped.includes(`${s.taskId}:${s.kind}`),
  );

  const counts = useMemo(() => {
    const c = { ...EMPTY };
    for (const kind of Object.values(handled)) c[kind] += 1;
    return c;
  }, [handled]);

  const approve = (s: AdjustSuggestion) => {
    if (s.kind === "flytta") {
      setTaskDueDate(s.taskId, tomorrowISO());
      snoozeTask(s.taskId, 1);
      toast.success("Den får ta imorgon i stället.");
    } else if (s.kind === "forenkla") {
      updateTask(s.taskId, { friction: "small" });
      toast.success("Nu räcker en mindre version idag.");
    } else {
      addTaskSteps(
        s.taskId,
        (s.steps ?? []).map((title) => ({ title })),
      );
      toast.success("Uppdelad i två små steg.");
    }
    setHandled((prev) => ({ ...prev, [`${s.taskId}:${s.kind}`]: s.kind }));
  };

  const anyHandled = Object.keys(handled).length > 0;

  if (!open.length && !anyHandled) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm text-muted-foreground">
          Dagen ser rimlig ut som den är. Om något ändras kommer förslagen tillbaka här.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="day-adjust">
      {open.map((s) => {
        const meta = ADJUST_META[s.kind];
        return (
          <div key={`${s.taskId}:${s.kind}`} className="surface-card space-y-3 p-4">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-lg">
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {meta.label}
                </p>
                <p className="truncate font-medium text-ink">{s.title}</p>
                <p className="text-sm text-ink">{s.what}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.why}</p>
                {s.steps && (
                  <ul className="mt-2 space-y-1">
                    {s.steps.map((step) => (
                      <li key={step} className="text-sm text-muted-foreground">
                        · {step}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => approve(s)}
                className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                <Check size={16} aria-hidden /> {s.cta}
              </button>
              <button
                type="button"
                onClick={() => setSkipped((prev) => [...prev, `${s.taskId}:${s.kind}`])}
                className="press inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-ink"
              >
                Nej, låt den vara
              </button>
            </div>
          </div>
        );
      })}

      {anyHandled && (
        <div className="surface-card flex items-start gap-2 p-4">
          <Undo2 size={16} aria-hidden className="mt-0.5 text-primary" />
          <p className="text-sm text-muted-foreground">{adjustSummary(counts)}</p>
        </div>
      )}
    </div>
  );
}

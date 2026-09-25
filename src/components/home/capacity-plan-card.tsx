import { useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { useTasks } from "@/hooks/use-data";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, todayISO } from "@/lib/day";
import {
  CAPACITY_META,
  PRIORITY_LABEL,
  isDayFull,
  recalcMessage,
  simplifyTask,
  type CapacityMode,
} from "@/lib/priority-engine";

const MODES: CapacityMode[] = ["fullt", "mellan", "lagt"];

/**
 * "Hur är läget idag?" – kapacitetsläge + prioritetsmotor på Hem.
 * Planen krymper när kapaciteten minskar. Flytt föreslås, användaren bestämmer.
 */
export default function CapacityPlanCard() {
  const { t } = useLang();
  const { updateTask } = useTasks();
  const { mode, setMode } = useCapacityMode();
  const [note, setNote] = useState<string | null>(null);
  const [moved, setMoved] = useState<Array<{ id: string; title: string; prev?: string }>>([]);
  const today = todayISO();

  // FlowPlan äger ordningen och urvalet – kortet visar bara resultatet.
  const plan = useFlowPlan();
  const movable = plan.waiting.filter((d) => d.item.movable);
  const tip = mode === "fullt" ? plan.parallel : null;
  const shown = mode === "lagt" ? plan.order.slice(0, 1) : plan.order;

  const choose = (next: CapacityMode) => {
    setNote(recalcMessage(mode, next));
    setMode(next);
  };

  const moveAll = () => {
    const tomorrow = addDaysISO(today, 1);
    const list = movable.map((d) => ({
      id: d.item.id.slice(5),
      title: d.item.title,
      prev: d.item.dueDate,
    }));
    list.forEach((m) => updateTask(m.id, { dueDate: tomorrow }));
    setMoved(list);
  };

  const undo = () => {
    moved.forEach((m) => updateTask(m.id, { dueDate: m.prev ?? today }));
    setMoved([]);
  };

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
      aria-label={t("Hur är läget idag?")}
      data-testid="capacity-plan"
    >
      <p className="font-display text-base font-bold text-ink">{t("Hur är läget idag?")}</p>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => choose(m)}
            className={`min-h-11 rounded-2xl border px-2 text-sm font-semibold transition ${
              mode === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-ink"
            }`}
          >
            <span aria-hidden>{CAPACITY_META[m].dot}</span> {t(CAPACITY_META[m].label)}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {t(note ?? (mode === "lagt" && plan.now ? `Vi tar en sak i taget. Först: ${plan.now.item.title}.` : plan.message))}
      </p>

      {shown.length > 0 && (
        <ol className="mt-3 space-y-2">
          {shown.map((p) => {
            const simpler = simplifyTask(p.item.title, mode);
            return (
              <li key={p.item.id} className="rounded-2xl bg-secondary/40 px-3 py-2">
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-ink">
                    {p.item.time && <span className="mr-2 text-muted-foreground">{p.item.time}</span>}
                    {p.item.title}
                  </span>
                  {mode !== "lagt" && (
                    <span className="shrink-0 text-[11px] font-semibold text-primary">
                      {t(PRIORITY_LABEL[p.priority])}
                    </span>
                  )}
                </div>
                {simpler && <p className="text-xs text-muted-foreground">{t(simpler)}</p>}
              </li>
            );
          })}
        </ol>
      )}
      {mode === "lagt" && plan.now && (
        <p className="mt-2 text-xs text-muted-foreground">{t("Det räcker just nu.")}</p>
      )}

      {tip && (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          {t(tip.text)}
        </p>
      )}

      {mode === "fullt" && plan.extras.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Om du vill och hinner:")} {plan.extras.map((e) => e.item.title).join(", ")}
        </p>
      )}

      {isDayFull(plan.order.length, mode) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Dagen är redan ganska full. Det är okej att flytta något.")}
        </p>
      )}

      {moved.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border/60 p-3 text-sm">
          <p className="text-ink">{t("Jag har flyttat till imorgon:")}</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {moved.map((m) => (
              <li key={m.id}>{m.title}</li>
            ))}
          </ul>
          <p className="mt-1 text-muted-foreground">{t("Det som behöver göras idag ligger kvar.")}</p>
          <Button type="button" variant="ghost" size="sm" onClick={undo} className="mt-2 min-h-11">
            <Undo2 className="h-4 w-4" aria-hidden /> {t("Ångra")}
          </Button>
        </div>
      ) : (
        movable.length > 0 &&
        mode !== "fullt" && (
          <div className="mt-4 rounded-2xl border border-border/60 p-3 text-sm">
            <p className="text-ink">
              {t("Det här kan vänta:")} {movable.map((d) => d.item.title).join(", ")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={moveAll}
              className="mt-2 min-h-11 rounded-full"
            >
              {t("Flytta till imorgon")}
            </Button>
          </div>
        )
      )}
    </section>
  );
}

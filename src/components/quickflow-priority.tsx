import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Loader2,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MyFloveBlock } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WhyHint from "@/components/why-hint";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import QuickflowPlanDialog, { type PlanChoice } from "@/components/quickflow-plan-dialog";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useTasks } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { guessArea, guessEmoji } from "@/lib/quickflow";
import {
  BUCKETS,
  BUCKET_META,
  energyHint,
  splitTasks,
  type PriorityTask,
} from "@/lib/quickflow-priority";
import { todayISO } from "@/lib/task-agenda";
import { clarifyQuickflowTask } from "@/lib/quickflow-clarify.functions";
import { ENERGY_LEVEL_META } from "@/lib/quickflow-clarify";
import type { FlowItem } from "@/lib/flow-items";
import { cn } from "@/lib/utils";

/**
 * "Min lista just nu" – resultatet av QuickFlow-flödet. Uppgifterna kommer
 * från den gemensamma fånga-dialogen (skriv/prata → uppdelning → godkänn)
 * och prioriteringen körs av samma motor överallt.
 */
export function QuickflowPriority() {
  const { openItems, doneItems, intro, add, update, remove, move, clear, splitItem } =
    usePriorityList();
  const { reading } = useEnergyBattery();
  const { tasks, addTask, updateTask } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  const clarify = useServerFn(clarifyQuickflowTask);

  const [newTitle, setNewTitle] = useState("");
  const [reorder, setReorder] = useState(false);
  const [askEnergyFor, setAskEnergyFor] = useState<FlowItem | null>(null);
  const [clarifyingId, setClarifyingId] = useState<string | null>(null);
  const [expandedClarificationId, setExpandedClarificationId] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<PriorityTask | null>(null);

  const energyPercent = reading?.now;
  const hint = useMemo(() => energyHint(energyPercent), [energyPercent]);

  const clarifyTask = async (item: PriorityTask) => {
    if (item.clarify) {
      setExpandedClarificationId((current) => (current === item.id ? null : item.id));
      return;
    }

    setClarifyingId(item.id);
    try {
      const result = await clarify({ data: { title: item.title, energyPercent } });
      update(item.id, { clarify: result });
      setExpandedClarificationId(item.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Flow kunde inte förtydliga uppgiften just nu.";
      toast({ description: message });
    } finally {
      setClarifyingId(null);
    }
  };

  const markDone = (item: PriorityTask) => {
    update(item.id, { done: true, doneAt: Date.now() });
    setAskEnergyFor({
      id: `quickflow-${item.id}`,
      title: item.title,
      source: "tanke",
      area: guessArea(item.title),
      emoji: guessEmoji(item.title, "snabbt"),
      priority: "idag",
      completable: true,
    });
  };

  const splitIt = (item: PriorityTask) => {
    const count = splitItem(item.id);
    toast({
      description:
        count > 1 ? `Uppdelad i ${count} enskilda saker.` : "Den här går inte att dela upp mer.",
    });
  };

  const confirmPlan = (choice: PlanChoice) => {
    const item = planFor;
    if (!item) return;
    const linkedTask = tasks.find((task) => task.quickflowId === item.id);
    if (linkedTask) {
      // Planering ändrar den gemensamma posten – den får aldrig kopieras.
      updateTask(linkedTask.id, {
        dueDate: choice.dueDate,
        time: choice.time,
        endTime: undefined,
        reminderMinutesBefore: choice.reminderMinutesBefore,
      });
    } else {
      // Skydd för äldre data som ännu inte hunnit migreras till Idag.
      addTask(item.title, choice.dueDate, {
        id: item.id,
        quickflowId: item.id,
        quickflowBucket: item.bucket,
        quickflowOrder: item.order,
        area: guessArea(item.title),
        time: choice.time,
        reminderMinutesBefore: choice.reminderMinutesBefore,
      });
    }
    setPlanFor(null);
    const day = choice.dueDate === todayISO() ? "idag" : choice.dueDate;
    const reminder = choice.reminderMinutesBefore !== undefined ? " med egen påminnelse." : ".";
    toast({
      description: choice.time
        ? `Planerad i kalendern ${day} kl ${choice.time}${reminder}`
        : `Planerad i kalendern ${day} – utan tid.`,
    });
    navigate({ to: "/kalender" });
  };

  return (
    <>
      {(openItems.length > 0 || doneItems.length > 0) && (
        <MyFloveBlock
          title="Min lista just nu"
          subtitle="Ingen tid, ingen deadline. Bara ordning."
          eyebrow="Flows förslag"
          icon={Sparkles}
          tone="mint"
          action={
            <button
              type="button"
              onClick={() => setReorder((r) => !r)}
              className="press rounded-full border-2 border-border px-3 py-1.5 text-xs font-medium"
            >
              ↕ {reorder ? "Klar" : "Ändra ordning"}
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {typeof energyPercent === "number" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border-2 border-border/60 bg-card px-2.5 py-1 text-xs font-medium"
                  aria-label={`Ditt batteri just nu: ${Math.round(energyPercent)} procent`}
                >
                  🔋 {Math.round(energyPercent)} %
                </span>
              )}
              {intro ? (
                <p className="min-w-0 flex-1 text-sm text-muted-foreground">{intro}</p>
              ) : (
                <p className="min-w-0 flex-1 text-sm text-muted-foreground">{hint}</p>
              )}
              <WhyHint label="prioriteringen">
                Flow hjälper dig att sortera när allt känns lika viktigt. Prioriteringen bygger på
                vad som verkar viktigt, brådskande och möjligt utifrån din energi just nu.
              </WhyHint>
            </div>

            {BUCKETS.map((bucket) => {
              const rows = openItems.filter((i) => i.bucket === bucket);
              if (rows.length === 0) return null;
              const meta = BUCKET_META[bucket];
              return (
                <div key={bucket} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.emoji} {meta.label}
                  </p>
                  {rows.map((item) => (
                    <div key={item.id} className="rounded-2xl border-2 border-border bg-card p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-[8rem] flex-1 basis-full sm:basis-0">
                          <span className="block break-words font-medium text-foreground">
                            {item.title}
                          </span>
                          {item.why && (
                            <span className="block text-xs text-muted-foreground">{item.why}</span>
                          )}
                        </span>

                        {reorder ? (
                          <span className="flex flex-wrap items-center gap-1">
                            {BUCKETS.map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => update(item.id, { bucket: b })}
                                className={cn(
                                  "press rounded-full border-2 px-2 py-1 text-xs",
                                  item.bucket === b
                                    ? "border-primary text-primary"
                                    : "border-border text-muted-foreground",
                                )}
                                aria-label={BUCKET_META[b].label}
                              >
                                {BUCKET_META[b].emoji}
                              </button>
                            ))}
                            <IconBtn label="Flytta upp" onClick={() => move(item.id, -1)}>
                              <ArrowUp size={16} />
                            </IconBtn>
                            <IconBtn label="Flytta ner" onClick={() => move(item.id, 1)}>
                              <ArrowDown size={16} />
                            </IconBtn>
                          </span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-1">
                            <IconBtn
                              label={item.clarify ? "Visa förtydligande" : "Förtydliga uppgiften"}
                              onClick={() => clarifyTask(item)}
                            >
                              {clarifyingId === item.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : item.clarify && expandedClarificationId === item.id ? (
                                <ChevronUp size={16} />
                              ) : item.clarify ? (
                                <ChevronDown size={16} />
                              ) : (
                                <CircleHelp size={16} />
                              )}
                            </IconBtn>
                            <IconBtn
                              label="Börja med denna"
                              onClick={() => navigate({ to: "/fokus" })}
                            >
                              <Play size={16} />
                            </IconBtn>
                            <IconBtn label="Klar" onClick={() => markDone(item)}>
                              <Check size={16} />
                            </IconBtn>
                            {splitTasks(item.title).length > 1 && (
                              <IconBtn
                                label="Dela upp i enskilda saker"
                                onClick={() => splitIt(item)}
                              >
                                <Scissors size={16} />
                              </IconBtn>
                            )}
                            <IconBtn label="Planera den" onClick={() => setPlanFor(item)}>
                              <CalendarPlus size={16} />
                            </IconBtn>
                            <IconBtn label="Ta bort" onClick={() => remove(item.id)}>
                              <Trash2 size={16} />
                            </IconBtn>
                          </span>
                        )}
                      </div>

                      {item.clarify && expandedClarificationId === item.id && (
                        <ClarificationPanel clarification={item.clarify} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                add(newTitle);
                setNewTitle("");
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Lägg till något – flera går bra, separera med komma"
                className="h-11 min-w-[10rem] flex-1 rounded-xl"
              />
              <Button type="submit" variant="outline" className="h-11 rounded-xl">
                <Plus size={16} className="mr-1" /> Lägg till
              </Button>
            </form>

            {doneItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {doneItems.length} klar{doneItems.length === 1 ? "" : "a"} idag.{" "}
                <button type="button" onClick={clear} className="underline underline-offset-4">
                  Rensa listan
                </button>
              </p>
            )}
          </div>
        </MyFloveBlock>
      )}

      <QuickflowPlanDialog
        open={planFor !== null}
        title={planFor?.title ?? ""}
        onCancel={() => setPlanFor(null)}
        onConfirm={confirmPlan}
      />

      <ActivityEnergyPrompt item={askEnergyFor} onClose={() => setAskEnergyFor(null)} />
    </>
  );
}

function ClarificationPanel({ clarification }: { clarification: PriorityTask["clarify"] }) {
  if (!clarification) return null;
  const energyMeta = ENERGY_LEVEL_META[clarification.energyLevel];

  return (
    <div className="mt-3 grid gap-3 rounded-2xl border-2 border-border/70 bg-muted/30 p-3 text-sm sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <p className="font-medium text-foreground">Varför?</p>
        <p className="text-muted-foreground">{clarification.why}</p>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Energi</p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-full", energyMeta.dot)} aria-hidden="true" />
          {energyMeta.label}
        </p>
        <p className="text-xs text-muted-foreground">{clarification.energyNote}</p>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Börja här</p>
        <p className="text-muted-foreground">{clarification.firstStep}</p>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="press flex h-9 w-9 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
    >
      {children}
    </button>
  );
}

export default QuickflowPriority;

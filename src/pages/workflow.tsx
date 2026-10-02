import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Zap,
  Timer,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Mic,
  ArrowRightLeft,
  AlarmClock,
  LifeBuoy,
  ClipboardList,
  Gauge,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-data";
import { useWorkflow, useLatestEnergy } from "@/hooks/use-workflow";
import { useFlowScore } from "@/hooks/use-flowscore";
import { FlowReplanDiff } from "@/components/flow-replan-diff";
import CollapsibleSection from "@/components/collapsible-section";
import { diffSnapshots, makeSnapshot, type FlowDiff, type FlowSnapshot } from "@/lib/flow-diff";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { QuickflowCapture } from "@/components/quickflow-capture";
import { QuickflowList } from "@/components/quickflow-list";
import { breakDownWorkTask } from "@/lib/work.functions";
import { celebrateFromEvent } from "@/lib/celebrate";
import { MyFloveThinking, MyFloveEnergyDots } from "@/components/myflove/motion";
import FrictionSuggestion from "@/components/friction-suggestion";
import {
  END_OF_DAY_CHECK,
  MINUTE_CHOICES,
  PRIORITY_META,
  fallbackSteps,
  metaFor,
  minutesLeftOfWorkday,
  pickForMinutes,
  planWithinCapacity,
  rankTasks,
  rebuildDay,
  transitionPlan,
  type WorkPriority,
} from "@/lib/workflow";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Jobbplaneringens innehåll, utan egen sida. Renderas inuti /jobb:
 * "plan" = dagens rimliga plan, "more" = fördjupningen under "Mer i jobb".
 */
export function WorkflowContent({ section = "all" }: { section?: "plan" | "more" | "all" }) {
  const showPlan = section !== "more";
  const showMore = section !== "plan";
  const { tasks, addTask, toggleTask, addTaskSteps, setTaskDueDate } = useTasks();
  const { metaMap, setMeta, dayChecks, toggleCheck, settings, setSettings } = useWorkflow();
  const energy = useLatestEnergy();
  const { flow } = useFlowScore();
  const { add: addQuickflow } = useQuickflow();
  const run = useServerFn(breakDownWorkTask);

  const [availableMinutes, setAvailableMinutes] = useState<number | null>(null);
  const [gap, setGap] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [rebuild, setRebuild] = useState<ReturnType<typeof rebuildDay> | null>(null);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);

  const voice = useVoiceInput((t) => setMeetingNotes((prev) => (prev ? `${prev} ${t}` : t)));

  const workTasks = useMemo(() => tasks.filter((t) => t.area === "jobb" && !t.completed), [tasks]);

  const ranked = useMemo(
    () => rankTasks(workTasks, metaMap, { energy }),
    [workTasks, metaMap, energy],
  );

  const capacityPlan = useMemo(
    () =>
      planWithinCapacity(workTasks, metaMap, {
        capacityMinutes: flow.capacityMinutes,
        maxFriction: flow.maxFriction,
        suggestedTasks: flow.suggestedTasks,
        energy,
      }),
    [workTasks, metaMap, flow, energy],
  );

  const timeFit = useMemo(
    () => (availableMinutes ? pickForMinutes(workTasks, metaMap, availableMinutes, energy) : null),
    [availableMinutes, workTasks, metaMap, energy],
  );

  const minutesLeft = minutesLeftOfWorkday(settings.endHour);

  // ---- Replanning: jämför nuläget mot senaste sparade läget ----
  const [replanDiff, setReplanDiff] = useState<FlowDiff | null>(null);
  const snapshotRef = useRef<FlowSnapshot | null>(null);

  const currentSnapshot = useCallback(
    () =>
      makeSnapshot(
        flow,
        energy,
        capacityPlan.plan,
        capacityPlan.tooHeavy,
        capacityPlan.plannedMinutes,
      ),
    [flow, energy, capacityPlan],
  );

  const recalc = useCallback(
    (silent = false) => {
      const next = currentSnapshot();
      const prev = snapshotRef.current;
      snapshotRef.current = next;
      if (!prev) {
        if (!silent) toast.success("Planen är uppdaterad 💙");
        return;
      }
      const d = diffSnapshots(prev, next);
      setReplanDiff(d);
      if (!silent) {
        toast.success(
          d.scoreDelta === 0
            ? "Omräknat – planen står sig"
            : `Omräknat: dagens balans ${d.scoreDelta > 0 ? "+" : ""}${d.scoreDelta}`,
        );
      }
    },
    [currentSnapshot],
  );

  // Init-läge utan att visa någon diff.
  useEffect(() => {
    if (!snapshotRef.current) snapshotRef.current = currentSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Räkna om automatiskt när energin ändras eller något markeras klart.
  const doneWorkCount = useMemo(
    () => tasks.filter((t) => t.area === "jobb" && t.completed).length,
    [tasks],
  );
  const autoKey = `${energy ?? "-"}|${doneWorkCount}`;
  const lastAutoKey = useRef(autoKey);
  useEffect(() => {
    if (lastAutoKey.current === autoKey) return;
    lastAutoKey.current = autoKey;
    recalc(true);
  }, [autoKey, recalc]);

  const handleBreakDown = async (id: string, title: string) => {
    setBusyId(id);
    try {
      const res = await run({ data: { title } });
      addTaskSteps(
        id,
        res.steps.map((s) => ({ title: s.title, when: s.when })),
      );
      toast.success("Uppdelad i små steg 💙", { description: res.intro });
    } catch {
      addTaskSteps(
        id,
        fallbackSteps(title).map((t) => ({ title: t })),
      );
      toast.success("Uppdelad i små steg 💙");
    } finally {
      setBusyId(null);
    }
  };

  const applyRebuild = () => {
    if (!rebuild) return;
    rebuild.moveOn.forEach(({ task }) => setTaskDueDate(task.id, tomorrowISO()));
    toast.success("Ny plan klar. Resten tar vi imorgon. 💙");
    setRebuild(null);
  };

  const saveMeetingNotes = () => {
    const lines = meetingNotes
      .split(/\n|(?:\.\s+)|(?:\soch\s)/i)
      .map((l) => l.trim())
      .filter((l) => l.length > 3);
    if (!lines.length) return;
    lines.forEach((l) => addTask(l, undefined, { area: "jobb" }));
    setMeetingNotes("");
    toast.success(`${lines.length} uppgifter skapade från mötet`);
  };

  return (
    <div className="space-y-5">
      {showPlan && (
        <>
          <header className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className={sectionTitle}>
                  <Zap className="h-5 w-5 text-gold" /> Jobb – din planering
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Du behöver inte välja bland allt. Jag säger vad som är rimligt just nu.
                </p>
              </div>
              <div className="shrink-0 rounded-2xl bg-sage/30 px-3 py-2 text-center text-xs text-ink">
                <div className="font-semibold">⚡ {energy ? `${energy}/5` : "–"}</div>
                <MyFloveEnergyDots value={energy ?? 3} className="my-1 justify-center" />
                <div className="text-muted-foreground">Energi</div>
              </div>
            </div>

            {busyId && (
              <MyFloveThinking
                steps={["🎯", "🧠", "✂️", "✨"]}
                label="Jag delar upp den i mindre steg…"
              />
            )}

            <Button
              type="button"
              className="mt-4 w-full rounded-full"
              onClick={() => setNewTaskDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Lägg till uppgift
            </Button>

            <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
              <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Lägg till en arbetsuppgift</DialogTitle>
                </DialogHeader>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTask.trim()) return;
                    addTask(newTask.trim(), undefined, { area: "jobb" });
                    setNewTask("");
                    setNewTaskDialogOpen(false);
                  }}
                >
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Lägg till en arbetsuppgift…"
                    autoFocus
                  />
                  <Button type="submit" size="icon" aria-label="Lägg till uppgift">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          <Button variant="secondary" className="w-full rounded-full" onClick={() => recalc(false)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Räkna om planen
          </Button>

          {replanDiff && <FlowReplanDiff diff={replanDiff} onClose={() => setReplanDiff(null)} />}

          {/* Dynamisk plan efter FlowScore */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <Gauge className="h-5 w-5 text-primary" /> Rimligt just nu
              </>
            }
            help="Hur mycket som är realistiskt idag utifrån din ork och tiden som är kvar."
          >
            <p className="mt-1 text-sm text-muted-foreground">
              Anpassat efter dagens balans {flow.score} och energi{" "}
              {energy ? `${energy}/5` : "okänd"} – ca {flow.capacityMinutes} min fokustid.
            </p>
            {capacityPlan.plan.length ? (
              <ul className="mt-3 space-y-2">
                {capacityPlan.plan.map(({ task, meta }) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3 text-sm"
                  >
                    <button
                      onClick={(e) => {
                        toggleTask(task.id);
                        celebrateFromEvent(e);
                      }}
                      aria-label="Markera klar"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                    <span className="flex-1 text-ink">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{meta.minutes} min</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Inget som passar din kapacitet just nu. Vila är också ett val. 💙
              </p>
            )}
            {capacityPlan.plannedMinutes > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Planerat {capacityPlan.plannedMinutes} min av {flow.capacityMinutes} min.
              </p>
            )}
            {capacityPlan.tooHeavy.length > 0 && (
              <div className="mt-3 rounded-2xl bg-gold/10 p-3 text-xs text-ink">
                <p className="font-medium">Sparas till en starkare stund (för tunga just nu):</p>
                <ul className="mt-1 space-y-1">
                  {capacityPlan.tooHeavy.slice(0, 3).map(({ task, meta }) => (
                    <li key={task.id} className="flex items-center justify-between gap-2">
                      <span>
                        ◯ {task.title} · svårighetsgrad {meta.friction}/10
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === task.id}
                        onClick={() => handleBreakDown(task.id, task.title)}
                      >
                        {busyId === task.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        <span className="ml-1">Dela upp</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleSection>

          {/* 1. Bäst att göra nu */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <AlarmClock className="h-5 w-5 text-primary" /> Bäst att göra nu
              </>
            }
            help="Nästa sak att ta itu med. En i taget – resten kan vänta."
          >
            {ranked.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Inget som väntar just nu. Det är också ett svar. 💙
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ranked.slice(0, 5).map(({ task, meta }, i) => (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-border/70 bg-background p-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          toggleTask(task.id);
                          celebrateFromEvent(e);
                        }}
                        aria-label="Markera klar"
                        className="mt-0.5 text-muted-foreground hover:text-primary"
                      >
                        <Circle className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {i === 0 && <span className="mr-1 font-semibold">NU</span>}
                          {PRIORITY_META[meta.priority].dot} {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {meta.minutes} min · svårighetsgrad {meta.friction}/10
                          {task.dueDate ? ` · deadline ${task.dueDate}` : ""}
                        </p>

                        {meta.friction >= 7 && (
                          <div className="mt-2 rounded-xl bg-gold/10 p-2 text-xs text-ink">
                            Den här verkar tung att börja med. Vill du dela upp den?
                            <Button
                              size="sm"
                              variant="secondary"
                              className="ml-2"
                              disabled={busyId === task.id}
                              onClick={() => handleBreakDown(task.id, task.title)}
                            >
                              {busyId === task.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              <span className="ml-1">Dela upp</span>
                            </Button>
                          </div>
                        )}

                        {task.steps && task.steps.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {task.steps.map((s) => (
                              <li key={s.id}>→ {s.title}</li>
                            ))}
                          </ul>
                        )}

                        <button
                          className="mt-2 text-xs text-primary underline"
                          onClick={() => setEditing(editing === task.id ? null : task.id)}
                        >
                          {editing === task.id ? "Dölj" : "Justera tid, svårighet & prioritet"}
                        </button>

                        {editing === task.id && (
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {MINUTE_CHOICES.map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setMeta(task.id, { minutes: m })}
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    metaFor(metaMap, task.id).minutes === m
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground"
                                  }`}
                                >
                                  {m} min
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(Object.keys(PRIORITY_META) as WorkPriority[]).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => setMeta(task.id, { priority: p })}
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    meta.priority === p
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground"
                                  }`}
                                >
                                  {PRIORITY_META[p].dot} {PRIORITY_META[p].label}
                                </button>
                              ))}
                            </div>
                            <label className="block text-xs text-muted-foreground">
                              Svårighetsgrad: {meta.friction}/10
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={meta.friction}
                                onChange={(e) =>
                                  setMeta(task.id, { friction: Number(e.target.value) })
                                }
                                className="mt-1 w-full accent-[hsl(var(--primary))]"
                              />
                            </label>
                            <FrictionSuggestion
                              title={task.title}
                              current={meta.friction}
                              onApply={(f) => setMeta(task.id, { friction: f })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>
        </>
      )}

      {showMore && (
        <>
          {/* 2. Jag har X minuter */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <Timer className="h-5 w-5 text-primary" /> Jag har …
              </>
            }
          >
            <div className="mt-3 flex flex-wrap gap-2">
              {[10, 20, 30, 45, 60].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={availableMinutes === m ? "default" : "secondary"}
                  onClick={() => setAvailableMinutes(availableMinutes === m ? null : m)}
                >
                  {m} minuter
                </Button>
              ))}
            </div>
            {timeFit && (
              <div className="mt-3 rounded-2xl bg-sage/20 p-3 text-sm">
                <p className="font-medium text-ink">
                  ⚡ Bäst användning av dina {availableMinutes} minuter
                </p>
                {timeFit.picks.length ? (
                  <>
                    <ul className="mt-2 space-y-1">
                      {timeFit.picks.map(({ task, meta }) => (
                        <li key={task.id}>
                          🟢 {task.title} – {meta.minutes} min
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Totalt {timeFit.usedMinutes} min av {availableMinutes}.
                    </p>
                  </>
                ) : timeFit.stretch ? (
                  <p className="mt-2">
                    🟡 Påbörja "{timeFit.stretch.task.title}" – du hinner en bit på vägen.
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    Inget som passar. Ta en paus istället. 💙
                  </p>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* 3. Övergångar */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <ArrowRightLeft className="h-5 w-5 text-primary" /> Hjälp vid övergångar
              </>
            }
          >
            <p className="mt-1 text-sm text-muted-foreground">
              Mötet är slut – hur mycket tid har du innan nästa?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 15, 25, 45].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={gap === m ? "default" : "secondary"}
                  onClick={() => setGap(gap === m ? null : m)}
                >
                  {m} min
                </Button>
              ))}
            </div>
            {gap && (
              <ul className="mt-3 space-y-1 rounded-2xl bg-background p-3 text-sm">
                {transitionPlan(gap).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          {/* 4. Mötesläge */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <ClipboardList className="h-5 w-5 text-primary" /> Mötesläge
              </>
            }
            help="Stöd under möten: vad som sades och vad du lovade göra."
          >
            <p className="mt-1 text-sm text-muted-foreground">
              Inför mötet: vad behöver du ta upp?
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={meetingAgenda}
                onChange={(e) => setMeetingAgenda(e.target.value)}
                placeholder="T.ex. Fråga om schemat"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!meetingAgenda.trim()) return;
                  addQuickflow({ text: meetingAgenda.trim(), level: "viktigt" });
                  setMeetingAgenda("");
                  toast.success("Sparat i Quickflow – jag påminner dig i mötet. 💙");
                }}
              >
                Spara
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">Efter mötet: vad kom fram?</p>
            <div className="mt-2 flex gap-2">
              <Input
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Prata eller skriv – jag gör uppgifter av det"
              />
              {voice.isSupported && (
                <Button
                  variant={voice.isListening ? "default" : "secondary"}
                  size="icon"
                  aria-label="Prata in"
                  onClick={voice.toggleListening}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={saveMeetingNotes}>Gör uppgifter</Button>
            </div>
          </CollapsibleSection>

          {/* 5. Avslutningscheck */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" /> Avslutningscheck
              </>
            }
          >
            <p className="mt-1 text-sm text-muted-foreground">
              {minutesLeft > 0 ? `${minutesLeft} min kvar av arbetsdagen.` : "Arbetsdagen är slut."}{" "}
              Så du slipper komma på saker 21:47.
            </p>
            <ul className="mt-3 space-y-2">
              {END_OF_DAY_CHECK.map((label) => {
                const done = dayChecks.includes(label);
                return (
                  <li key={label}>
                    <button
                      onClick={() => toggleCheck(label)}
                      className="flex w-full items-center gap-2 rounded-2xl border border-border/70 bg-background p-3 text-left text-sm"
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={done ? "text-muted-foreground line-through" : "text-ink"}>
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <label className="mt-3 block text-xs text-muted-foreground">
              Arbetsdagen slutar kl.
              <select
                className="ml-2 rounded-lg border border-border bg-background px-2 py-1 text-ink"
                value={settings.endHour}
                onChange={(e) => setSettings({ endHour: Number(e.target.value) })}
              >
                {[14, 15, 16, 17, 18, 19, 20].map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
          </CollapsibleSection>

          {/* 6. Min dag gick åt helvete */}
          <CollapsibleSection
            className={card}
            headingClassName={sectionTitle}
            title={
              <>
                <LifeBuoy className="h-5 w-5 text-primary" /> Min dag gick åt pipsvängen
              </>
            }
            help="Tryck här när det spårat ur. Du får hjälp att välja en enda sak istället."
          >
            <p className="mt-1 text-sm text-muted-foreground">
              Det blev inte som planerat. Ingen fara. Vill du att jag bygger om resten av dagen?
            </p>
            <Button
              className="mt-3"
              onClick={() =>
                setRebuild(
                  rebuildDay(
                    workTasks,
                    metaMap,
                    Math.min(minutesLeft, flow.capacityMinutes),
                    energy,
                  ),
                )
              }
            >
              Bygg om dagen
            </Button>
            {rebuild && (
              <div className="mt-3 space-y-3 rounded-2xl bg-background p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">Det här hinner du:</p>
                  {rebuild.keep.length ? (
                    <ul className="mt-1 space-y-1">
                      {rebuild.keep.map(({ task, meta }) => (
                        <li key={task.id}>
                          🟢 {task.title} – {meta.minutes} min
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Inget mer idag. Det är okej. 💙</p>
                  )}
                </div>
                {rebuild.moveOn.length > 0 && (
                  <div>
                    <p className="font-medium text-ink">Flyttas till imorgon:</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {rebuild.moveOn.map(({ task }) => (
                        <li key={task.id}>→ {task.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyRebuild}>
                    Ja, gör så
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setRebuild(null)}>
                    Nej tack
                  </Button>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* 7. Quickflow för jobbet */}
          <CollapsibleSection
            className="space-y-3"
            headingClassName={sectionTitle}
            title={
              <>
                <Sparkles className="h-5 w-5 text-gold" /> Quickflow på jobbet
              </>
            }
          >
            <QuickflowCapture />
            <QuickflowList />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

export default WorkflowContent;

import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-data";
import { useWorkflow, useLatestEnergy } from "@/hooks/use-workflow";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { QuickflowCapture } from "@/components/quickflow-capture";
import { QuickflowList } from "@/components/quickflow-list";
import { breakDownWorkTask } from "@/lib/work.functions";
import { celebrateFromEvent } from "@/lib/celebrate";
import {
  END_OF_DAY_CHECK,
  MINUTE_CHOICES,
  PRIORITY_META,
  fallbackSteps,
  metaFor,
  minutesLeftOfWorkday,
  pickForMinutes,
  rankTasks,
  rebuildDay,
  transitionPlan,
  type WorkPriority,
} from "@/lib/workflow";

const card = "rounded-3xl border border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function WorkflowPage() {
  const { tasks, addTask, toggleTask, addTaskSteps, setTaskDueDate } = useTasks();
  const { metaMap, setMeta, dayChecks, toggleCheck, settings, setSettings } = useWorkflow();
  const energy = useLatestEnergy();
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

  const voice = useVoiceInput((t) => setMeetingNotes((prev) => (prev ? `${prev} ${t}` : t)));

  const workTasks = useMemo(() => tasks.filter((t) => t.area === "jobb" && !t.completed), [tasks]);

  const ranked = useMemo(
    () => rankTasks(workTasks, metaMap, { energy }),
    [workTasks, metaMap, energy],
  );

  const timeFit = useMemo(
    () => (availableMinutes ? pickForMinutes(workTasks, metaMap, availableMinutes, energy) : null),
    [availableMinutes, workTasks, metaMap, energy],
  );

  const minutesLeft = minutesLeftOfWorkday(settings.endHour);

  const handleBreakDown = async (id: string, title: string) => {
    setBusyId(id);
    try {
      const res = await run({ data: { title } });
      addTaskSteps(id, res.steps.map((s) => ({ title: s.title, when: s.when })));
      toast.success("Uppdelad i små steg 💙", { description: res.intro });
    } catch {
      addTaskSteps(id, fallbackSteps(title).map((t) => ({ title: t })));
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
    <Layout>
      <div className="space-y-5 pb-24">
        <header className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className={sectionTitle}>
                <Zap className="h-5 w-5 text-gold" /> WorkFlow – MyFlove på jobbet
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Du behöver inte välja bland allt. Jag säger vad som är rimligt just nu.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-sage/30 px-3 py-2 text-center text-xs text-ink">
              <div className="font-semibold">⚡ {energy ? `${energy}/5` : "–"}</div>
              <div className="text-muted-foreground">Energi</div>
            </div>
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTask.trim()) return;
              addTask(newTask.trim(), undefined, { area: "jobb" });
              setNewTask("");
            }}
          >
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Lägg till en arbetsuppgift…"
            />
            <Button type="submit" size="icon" aria-label="Lägg till uppgift">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </header>

        {/* 1. Vad ska jag göra nu? */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <AlarmClock className="h-5 w-5 text-primary" /> Vad ska jag göra nu?
          </h2>
          {ranked.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Inget som väntar just nu. Det är också ett svar. 💙
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {ranked.slice(0, 5).map(({ task, meta }, i) => (
                <li key={task.id} className="rounded-2xl border border-border/70 bg-background p-3">
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
                        {meta.minutes} min · friktion {meta.friction}/10
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
                        {editing === task.id ? "Dölj" : "Justera tid, friktion & prioritet"}
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
                            Friktion: {meta.friction}/10
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
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 2. Jag har X minuter */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <Timer className="h-5 w-5 text-primary" /> Jag har …
          </h2>
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
                <p className="mt-2 text-muted-foreground">Inget som passar. Ta en paus istället. 💙</p>
              )}
            </div>
          )}
        </section>

        {/* 3. Övergångar */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <ArrowRightLeft className="h-5 w-5 text-primary" /> Hjälp vid övergångar
          </h2>
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
        </section>

        {/* 4. Mötesläge */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <ClipboardList className="h-5 w-5 text-primary" /> Mötesläge
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Inför mötet: vad behöver du ta upp?</p>
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
        </section>

        {/* 5. Avslutningscheck */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <CheckCircle2 className="h-5 w-5 text-primary" /> Avslutningscheck
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {minutesLeft > 0
              ? `${minutesLeft} min kvar av arbetsdagen.`
              : "Arbetsdagen är slut."}{" "}
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
        </section>

        {/* 6. Min dag gick åt helvete */}
        <section className={card}>
          <h2 className={sectionTitle}>
            <LifeBuoy className="h-5 w-5 text-primary" /> Min dag gick åt pipsvängen
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Det blev inte som planerat. Ingen fara. Vill du att jag bygger om resten av dagen?
          </p>
          <Button
            className="mt-3"
            onClick={() => setRebuild(rebuildDay(workTasks, metaMap, minutesLeft, energy))}
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
        </section>

        {/* 7. Quickflow för jobbet */}
        <section className="space-y-3">
          <h2 className={sectionTitle}>
            <Sparkles className="h-5 w-5 text-gold" /> Quickflow på jobbet
          </h2>
          <QuickflowCapture />
          <QuickflowList />
        </section>
      </div>
    </Layout>
  );
}

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import AdaptiveIntentPrompt from "@/components/adaptive-intent-prompt";
import AreaFocus from "@/components/area-focus";
import WorkoutBuilderPanel from "@/components/workout/workout-builder-panel";
import { TrainingCreationChoice } from "@/components/workout/training-creation-choice";
import { TrainingSessionVisual } from "@/components/workout/training-session-visual";
import { ManualExercises } from "@/components/workout/manual-exercises";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveThinking } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dumbbell,
  Loader2,
  Sparkles,
  Footprints,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Smartphone,
  AlertTriangle,
  CalendarRange,
  Target,
  Scale,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { generateTrainingProgram } from "@/lib/training.functions";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useTraining, type TrainingGoal, type TrainingSession } from "@/hooks/use-training";
import { FEEDBACK_LABEL, weekStartKey, type WeekFeedback } from "@/lib/weekly-plan";
import { isHealthAppAvailable, openHealthSettings, readStepsForDays } from "@/lib/health-steps";
import {
  MOVEMENT_IDEAS,
  MOVEMENT_TAG_HUE,
  MOVEMENT_TAG_LABEL,
  movementById,
  movementOfTheDay,
} from "@/lib/everyday-movement";

import { useToast } from "@/hooks/use-toast";
import CollapsibleSection from "@/components/collapsible-section";
import { celebrateFromEvent } from "@/lib/celebrate";
import { manualWorkout, sessionFromWorkout } from "@/lib/training-program";
import type { Workout, WorkoutBlock } from "@/lib/workout-generator";

const FOCUS: { id: TrainingGoal["focus"]; label: string }[] = [
  { id: "styrka", label: "Styrka" },
  { id: "kondition", label: "Kondition" },
  { id: "blandat", label: "Blandat" },
  { id: "viktnedgång", label: "Viktnedgång" },
];
const LEVELS: TrainingGoal["level"][] = ["nybörjare", "van", "erfaren"];
const LAST_SYNC_KEY = "myflove.steps.lastSync";

/** Veckodagar för pass-schemat – måndag först. */
const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"] as const;

type TrainingView = "overview" | "steg" | "plan" | "motion" | "program" | "vikt";

const SECTIONS: {
  id: Exclude<TrainingView, "overview">;
  label: string;
  desc: string;
  icon: LucideIcon;
  hue: string;
}[] = [
  {
    id: "program",
    label: "Träningsprogram",
    desc: "Visuella pass med Pace eller ett eget upplägg.",
    icon: Dumbbell,
    hue: "205 45% 34%",
  },
  {
    id: "steg",
    label: "Steg",
    desc: "Steg idag och synk med hälsoappen.",
    icon: Footprints,
    hue: "152 30% 32%",
  },
  {
    id: "motion",
    label: "Vardagsmotion",
    desc: "Små rörelser som räknas – varje dag.",
    icon: Sparkles,
    hue: "42 62% 45%",
  },
  {
    id: "vikt",
    label: "Vikt",
    desc: "Följ vikten över tid om viktnedgång är ditt mål.",
    icon: Scale,
    hue: "7 47% 49%",
  },
];

function formatSyncTime(stamp: number): string {
  const d = new Date(stamp);
  const diffMin = Math.round((Date.now() - stamp) / 60000);
  if (diffMin < 1) return "just nu";
  if (diffMin < 60) return `för ${diffMin} min sedan`;
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `idag ${time}`;
  return `${d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} ${time}`;
}

const TYPE_TINT: Record<string, string> = {
  styrka: "205 45% 34%",
  kondition: "7 47% 49%",
  rörlighet: "265 32% 45%",
  vila: "152 30% 32%",
};

export default function TrainingPage() {
  const {
    state,
    saveProgram,
    clearProgram,
    updateSession,
    addSession,
    addSessions,
    removeSession,
    toggleSessionDone,
    setSteps,
    setStepGoal,
    lastDays,
    doneToday,
    stepsToday,
    toggleMovement,
    setMovementGoal,
    movementDays,
    movementToday,
    movementGoal,
    weeklyPlan,
    weekFeedback,
    setWeekFeedback,
    regenerateWeeklyPlan,
    setWeight,
    removeWeight,
    setWeightGoal,
    weightEntries,
    weightGoal,
  } = useTraining();

  const { toast } = useToast();
  const run = useServerFn(generateTrainingProgram);

  const [view, setView] = useState<TrainingView>("overview");
  // Vikt är frivilligt – den som inte vill se vikt alls kan dölja delen helt.
  const [hideWeight, setHideWeight] = useCloudSyncedStorage<boolean>(
    "myflove-hide-weight",
    false,
  );
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [showProgramCreator, setShowProgramCreator] = useState(false);
  const [programWorkout, setProgramWorkout] = useState<Workout | null>(null);
  const [builderCreationKey, setBuilderCreationKey] = useState(0);
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightNote, setWeightNote] = useState("");
  const [weightGoalInput, setWeightGoalInput] = useState(weightGoal ? String(weightGoal) : "");

  const [goal, setGoal] = useState(state.goal?.goal ?? "");
  const [focus, setFocus] = useState<TrainingGoal["focus"]>(state.goal?.focus ?? "blandat");
  const [daysPerWeek, setDaysPerWeek] = useState(state.goal?.daysPerWeek ?? 3);
  const [preferredDays, setPreferredDays] = useState<string[]>(
    state.goal?.days ?? ["Måndag", "Onsdag", "Fredag"],
  );
  const togglePreferredDay = (day: string) =>
    setPreferredDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      const sorted = WEEKDAYS.filter((d) => next.includes(d));
      if (sorted.length > 0) setDaysPerWeek(sorted.length);
      return sorted;
    });
  const [minutes, setMinutes] = useState(state.goal?.minutesPerSession ?? 45);
  const [level, setLevel] = useState<TrainingGoal["level"]>(state.goal?.level ?? "nybörjare");
  const [equipment, setEquipment] = useState(state.goal?.equipment ?? "");
  const [limitations, setLimitations] = useState(state.goal?.limitations ?? "");
  const [loading, setLoading] = useState(false);
  const settingsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!showProgramCreator) return;
    settingsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    settingsRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [showProgramCreator]);

  const [sessionEdit, setSessionEdit] = useState<{
    index: number | null;
    days: string[];
    title: string;
    type: TrainingSession["type"];
    minutes: string;
    exercises: string;
    blocks: WorkoutBlock[];
  } | null>(null);

  const openAddSession = () =>
    setSessionEdit({
      index: null,
      days: ["Måndag"],
      title: "",
      type: "styrka",
      minutes: "45",
      exercises: "",
      blocks: [],
    });

  const openEditSession = (index: number) => {
    const s = state.program?.sessions[index];
    if (!s) return;
    setSessionEdit({
      index,
      days: [WEEKDAYS.includes(s.day as (typeof WEEKDAYS)[number]) ? s.day : "Måndag"],
      title: s.title,
      type: s.type,
      minutes: s.minutes ? String(s.minutes) : "",
      exercises: s.workout ? "" : s.exercises.join("\n"),
      blocks: s.workout?.blocks ?? [],
    });
  };

  const toggleSessionDay = (day: string) => {
    if (!sessionEdit) return;
    // Vid redigering av ett befintligt pass gäller en dag i taget.
    if (sessionEdit.index !== null) {
      setSessionEdit({ ...sessionEdit, days: [day] });
      return;
    }
    const has = sessionEdit.days.includes(day);
    const days = has ? sessionEdit.days.filter((d) => d !== day) : [...sessionEdit.days, day];
    setSessionEdit({ ...sessionEdit, days });
  };

  const saveSessionEdit = () => {
    if (!sessionEdit) return;
    if (!sessionEdit.title.trim() || sessionEdit.days.length === 0) {
      toast({
        title: "Fyll i dag och namn",
        description: "Passet behöver minst en dag och ett namn.",
      });
      return;
    }
    const mins = Number(sessionEdit.minutes);
    if (sessionEdit.blocks.length && (!Number.isInteger(mins) || mins < 5 || mins > 180)) {
      toast({ title: "Välj en maxtid mellan 5 och 180 minuter" });
      return;
    }
    const previousWorkout = sessionEdit.index === null ? undefined : state.program?.sessions[sessionEdit.index]?.workout;
    const visual = sessionEdit.blocks.length ? manualWorkout(sessionEdit.title.trim(), sessionEdit.blocks, sessionEdit.type, previousWorkout, mins) : undefined;
    const base: Omit<TrainingSession, "day"> = {
      title: sessionEdit.title.trim(),
      type: sessionEdit.type,
      ...(Number.isFinite(mins) && mins > 0 ? { minutes: Math.round(mins) } : {}),
      exercises: visual ? sessionFromWorkout(visual).exercises : sessionEdit.exercises
        .split("\n")
        .map((l) => l.replace(/^[-•*\s]+/, "").trim())
        .filter(Boolean),
      ...(visual ? { workout: visual, minutes: visual.maxMinutes ?? visual.minutes } : {}),
    };
    if (sessionEdit.index === null) {
      // Skapa ett pass per vald dag – samma innehåll, flera dagar.
      addSessions(sessionEdit.days.map((day) => ({ ...base, day, ...(visual ? { workout: { ...visual, id: `manual-${crypto.randomUUID()}` } } : {}) })));
      toast({
        title:
          sessionEdit.days.length > 1
            ? `${sessionEdit.days.length} pass tillagda`
            : "Passet är tillagt",
      });
    } else {
      updateSession(sessionEdit.index, {
        ...base,
        day: sessionEdit.days[0]!,
        workout: visual,
      });
      toast({ title: "Passet är ändrat" });
    }
    setSessionEdit(null);
  };

  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [manualSteps, setManualSteps] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedDays, setSyncedDays] = useState(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem(LAST_SYNC_KEY));
    if (Number.isFinite(saved) && saved > 0) setLastSyncAt(saved);
  }, []);

  useEffect(() => {
    let active = true;
    isHealthAppAvailable().then((ok) => {
      if (!active) return;
      setHealthAvailable(ok);
      setHealthChecked(true);
      if (ok) syncSteps(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSteps = async (silent = false) => {
    setSyncing(true);
    setSyncError(null);
    const rows = await readStepsForDays(7);
    setSyncing(false);
    if (!rows || rows.length === 0) {
      setSyncError(
        rows
          ? "Hälsoappen svarade men innehöll inga steg för den senaste veckan."
          : "Kunde inte läsa steg. Godkänn åtkomst till steg i hälsoappen – eller fyll i stegen manuellt.",
      );
      if (!silent) {
        toast({
          title: "Hittade ingen hälsodata",
          description: "Godkänn åtkomst till steg i hälsoappen – eller fyll i steg manuellt.",
        });
        await openHealthSettings();
      }
      return;
    }
    for (const row of rows) setSteps(row.steps, row.date);
    const stamp = Date.now();
    setLastSyncAt(stamp);
    setSyncedDays(rows.length);
    localStorage.setItem(LAST_SYNC_KEY, String(stamp));
    const today = new Date().toISOString().slice(0, 10);
    const count = rows.find((r) => r.date === today)?.steps ?? rows.at(-1)?.steps ?? 0;
    if (!silent)
      toast({ title: "Steg hämtade", description: `${count.toLocaleString("sv-SE")} steg idag.` });
  };

  const generateWith = async (payload: TrainingGoal, successTitle = "Programmet är klart") => {
    setLoading(true);
    try {
      const program = await run({ data: payload });
      const wanted = payload.days ?? [];
      // Lägg passen på exakt de dagar användaren valt (viloapass behåller sin dag).
      const adjusted =
        wanted.length > 0
          ? {
              ...program,
              sessions: (() => {
                let i = 0;
                return program.sessions.map((s) =>
                  s.type === "vila" ? s : { ...s, day: wanted[i++ % wanted.length]! },
                );
              })(),
            }
          : program;
      saveProgram(payload, adjusted);
      setShowProgramCreator(false);
      toast({ title: successTitle, description: program.intro });
    } catch (err) {
      toast({
        title: "Det gick inte just nu",
        description: err instanceof Error ? err.message : "Försök igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProgram = () => {
    const g = state.goal;
    if (!g) return;
    setGoal(g.goal);
    setFocus(g.focus);
    setDaysPerWeek(g.daysPerWeek);
    if (g.days?.length) setPreferredDays(g.days);

    setMinutes(g.minutesPerSession);
    setLevel(g.level);
    setEquipment(g.equipment ?? "");
    setLimitations(g.limitations ?? "");
    setShowProgramCreator(true);
    settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast({
      title: "Redigera programmet",
      description: "Ändra inställningarna och skapa om programmet.",
    });
  };

  const handleRecreate = async () => {
    if (!state.goal) return;
    await generateWith(state.goal, "Programmet är omgjort");
  };

  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast({ title: "Berätta vad du vill", description: "Skriv ditt mål med träningen först." });
      return;
    }
    if (preferredDays.length === 0) {
      toast({ title: "Välj dagar", description: "Markera minst en träningsdag." });
      return;
    }
    const payload: TrainingGoal = {
      goal: goal.trim(),
      focus,
      daysPerWeek: preferredDays.length,
      minutesPerSession: minutes,
      level,
      days: preferredDays,
      ...(equipment.trim() ? { equipment: equipment.trim() } : {}),
      ...(limitations.trim() ? { limitations: limitations.trim() } : {}),
    };
    await generateWith(payload);
  };

  const addWorkoutToProgram = (workout: Workout) => {
    const session = sessionFromWorkout(workout);

    if (state.program) {
      addSession(session);
    } else {
      saveProgram(
        {
          goal: "Träna på ett sätt som passar dagens energi",
          focus: workout.intent === "styrka" ? "styrka" : "blandat",
          daysPerWeek: 1,
          minutesPerSession: workout.minutes,
          level: "nybörjare",
          days: ["Valfri dag"],
          equipment: workout.equipment.join(", "),
          limitations: workout.limitations.join(", "),
        },
        {
          intro: "Ditt Pace-pass ligger redo i programmet.",
          sessions: [session],
          note: "Du väljer själv när passet passar.",
        },
      );
    }

    toast({
      title: "Tillagt i ditt program",
      description: `${workout.title} finns nu bland dina färdiga pass.`,
    });
    setProgramWorkout(workout);
  };

  const week = lastDays(7);
  const maxSteps = Math.max(state.stepGoal, ...week.map((d) => d.steps), 1);
  const stepPct = Math.min(100, Math.round((stepsToday / state.stepGoal) * 100));

  const todayIso = new Date().toISOString().slice(0, 10);
  const tipOfDay = movementOfTheDay(todayIso);
  const movementMinutes = movementToday.reduce(
    (sum, id) => sum + (movementById(id)?.minutes ?? 0),
    0,
  );
  const movementPct = Math.min(100, Math.round((movementMinutes / movementGoal) * 100));
  const movementWeek = movementDays(7);
  const movementStreak = (() => {
    let n = 0;
    for (let i = movementWeek.length - 1; i >= 0; i--) {
      if ((movementWeek[i]?.ids.length ?? 0) > 0) n++;
      else break;
    }
    return n;
  })();

  const sessionsThisWeek = (() => {
    const start = weekStartKey();
    return Object.entries(state.done).reduce(
      (sum, [date, list]) => (date >= start ? sum + list.length : sum),
      0,
    );
  })();

  const weights = weightEntries();
  const latestWeight = weights.at(-1) ?? null;
  const firstWeight = weights[0] ?? null;
  const weightChange =
    latestWeight && firstWeight && weights.length > 1
      ? Math.round((latestWeight.kg - firstWeight.kg) * 10) / 10
      : null;

  const summary: Record<Exclude<TrainingView, "overview">, string> = {
    program: state.program
      ? `${state.program.sessions.length} pass i veckan`
      : "Inget program ännu",
    steg: `${stepsToday.toLocaleString("sv-SE")} steg idag`,
    motion: `${movementMinutes} av ${movementGoal} min idag`,
    plan: weeklyPlan
      ? `${sessionsThisWeek}/${weeklyPlan.sessionTarget} pass denna vecka`
      : "Ingen plan ännu",
    vikt: latestWeight ? `${latestWeight.kg} kg senast` : "Ingen vikt inlagd",
  };

  return (
    <Layout>
      <MyFlovePageGrid area="halsa">
        <MyFloveWide>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            <header className="space-y-2">
              {view !== "overview" && (
                <button
                  type="button"
                  onClick={() => setView("overview")}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
                >
                  <ChevronLeft size={16} /> Tillbaka till översikten
                </button>
              )}
              <h1 className="pace-app-title font-display text-2xl font-bold text-ink sm:text-3xl flex items-center gap-2">
                <Dumbbell className="text-primary" />{" "}
                {view === "overview"
                  ? "Träning"
                  : (SECTIONS.find((s) => s.id === view)?.label ?? "Träning")}
              </h1>
              <p className="text-muted-foreground">
                {view === "overview"
                  ? "Välj en del i taget – du behöver inte se allt på en gång."
                  : (SECTIONS.find((s) => s.id === view)?.desc ?? "")}
              </p>
            </header>

            {view === "overview" && (
              <AreaFocus
                intent="Jag vill träna"
                lowHint="Låg ork idag – mjuk rörlighet eller en kort promenad räcker."
              />
            )}

            {view === "overview" && (

              <AdaptiveIntentPrompt
                source="traning"
                chips={["Jag vill träna", "Jag vill gå en promenad", "Jag vill röra på mig lite"]}
                placeholder="Vad vill du göra idag?"
                className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
              />
            )}

            {view === "overview" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {SECTIONS.filter((s) => s.id !== "vikt" || !hideWeight).map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setView(s.id)}
                      className="surface-card p-4 text-left transition hover:opacity-90"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `hsl(${s.hue} / 0.14)`,
                            color: `hsl(${s.hue})`,
                          }}
                        >
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink">{s.label}</span>
                            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                          <p className="mt-1 text-sm font-medium text-ink">{summary[s.id]}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {view === "overview" && (
              <button
                type="button"
                onClick={() => setHideWeight(!hideWeight)}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                {hideWeight ? "Visa vikt igen" : "Dölj vikt helt"}
              </button>
            )}


            {view === "steg" && (
              <CollapsibleSection
                className="surface-card p-5"
                headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
                title={
                  <>
                    <Footprints size={18} className="text-primary" /> Steg idag
                  </>
                }
                help="Steg hämtade från mobilens hälsoapp. Ingen siffra? Då är kopplingen inte påslagen än."
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => syncSteps()}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Hämta från hälsoappen
                  </Button>
                }
              >
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold text-ink">
                      {stepsToday.toLocaleString("sv-SE")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      mål {state.stepGoal.toLocaleString("sv-SE")}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${stepPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2 h-24">
                  {week.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg bg-primary/30"
                        style={{ height: `${Math.max(4, (d.steps / maxSteps) * 72)}px` }}
                        title={`${d.steps} steg`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(d.date + "T00:00:00")
                          .toLocaleDateString("sv-SE", { weekday: "short" })
                          .slice(0, 2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Steg manuellt"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(e.target.value)}
                    className="w-40 rounded-xl"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      const n = Number(manualSteps);
                      if (!Number.isFinite(n) || n <= 0) return;
                      setSteps(n);
                      setManualSteps("");
                    }}
                  >
                    Spara
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={state.stepGoal}
                    onChange={(e) => setStepGoal(Number(e.target.value) || 7000)}
                    className="w-32 rounded-xl"
                    aria-label="Stegmål"
                  />
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target size={14} /> stegmål
                  </span>
                </div>

                {/* Statuspanel för stegsynk */}
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                          syncing
                            ? "bg-amber-500 animate-pulse"
                            : syncError
                              ? "bg-destructive"
                              : lastSyncAt
                                ? "bg-primary"
                                : "bg-muted-foreground/50"
                        }`}
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-ink">
                          {syncing
                            ? "Synkar steg…"
                            : !healthChecked
                              ? "Kontrollerar hälsoapp…"
                              : healthAvailable
                                ? syncError
                                  ? "Synk misslyckades"
                                  : "Kopplad till hälsoappen"
                                : "Manuellt läge"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lastSyncAt
                            ? `Senast uppdaterad ${formatSyncTime(lastSyncAt)}${syncedDays ? ` · ${syncedDays} dagar hämtade` : ""}`
                            : healthAvailable
                              ? "Ingen synk gjord ännu."
                              : "Stegen sparas från det du fyller i nedan."}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 shrink-0"
                      onClick={() => syncSteps()}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Hämta om
                    </Button>
                  </div>

                  {syncError && (
                    <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p>{syncError}</p>
                        {healthAvailable && (
                          <button
                            type="button"
                            onClick={() => void openHealthSettings()}
                            className="underline underline-offset-2 font-medium"
                          >
                            Öppna hälsoinställningar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {healthChecked && !healthAvailable && (
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Smartphone size={14} className="mt-0.5 shrink-0" />
                      Automatisk stegräkning läses från Apple Hälsa eller Health Connect när du
                      använder Paceable som app i mobilen. I webbläsaren fyller du i stegen själv.
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {view === "plan" && (
              <CollapsibleSection
                className="surface-card p-5"
                headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
                title={
                  <>
                    <CalendarRange size={18} className="text-primary" /> Din veckoplan
                  </>
                }
                help="Pass fördelade över veckan. Du kan byta dag eller hoppa över utan att något går sönder."
                description="Målen anpassas efter vad du faktiskt gjorde – och hur veckan kändes."
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 shrink-0"
                    onClick={() => {
                      regenerateWeeklyPlan();
                      toast({
                        title: "Veckoplanen är uppdaterad",
                        description: "Målen är justerade efter din senaste vecka.",
                      });
                    }}
                  >
                    <Sparkles size={16} /> Uppdatera
                  </Button>
                }
              >
                {weeklyPlan ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Steg per dag
                        </p>
                        <p className="text-2xl font-bold text-ink">
                          {weeklyPlan.stepTarget.toLocaleString("sv-SE")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          snitt förra veckan {weeklyPlan.basis.avgSteps.toLocaleString("sv-SE")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Vardagsmotion
                        </p>
                        <p className="text-2xl font-bold text-ink">
                          {weeklyPlan.movementTarget} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          snitt förra veckan {weeklyPlan.basis.avgMovement} min
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Pass denna vecka
                        </p>
                        <p className="text-2xl font-bold text-ink">
                          {sessionsThisWeek}/{weeklyPlan.sessionTarget}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {weeklyPlan.basis.doneSessions} pass förra perioden
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-ink">
                      {weeklyPlan.note}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ingen plan ännu. Tryck på <strong>Uppdatera</strong> så bygger vi en utifrån
                    dina senaste dagar.
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">Hur känns nivån just nu?</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(FEEDBACK_LABEL) as WeekFeedback[]).map((f) => {
                      const active = weekFeedback === f;
                      return (
                        <Button
                          key={f}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setWeekFeedback(f);
                            toast({
                              title: "Tack – jag justerar",
                              description: "Tryck på Uppdatera för att räkna om veckans mål.",
                            });
                          }}
                          aria-pressed={active}
                        >
                          {FEEDBACK_LABEL[f]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {view === "motion" && (
              <CollapsibleSection
                className="surface-card p-5"
                headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
                title={
                  <>
                    <Footprints size={18} className="text-primary" /> Vardagsmotion
                  </>
                }
                description="Allt räknas. Små rörelser flera gånger om dagen gör mer för måendet än ett perfekt pass du aldrig blir av med."
                actions={
                  movementStreak > 1 && (
                    <span className="shrink-0 rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {movementStreak} dagar i rad
                    </span>
                  )
                }
              >
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-ink">{movementMinutes} min idag</span>
                    <span className="text-sm text-muted-foreground">mål {movementGoal} min</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${movementPct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-primary">
                    Dagens minsta möjliga steg
                  </p>
                  <p className="font-semibold text-ink">
                    {tipOfDay.label} · {tipOfDay.minutes} min
                  </p>
                  <p className="text-sm text-muted-foreground">{tipOfDay.hint}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {MOVEMENT_IDEAS.map((m) => {
                    const done = movementToday.includes(m.id);
                    const hue = MOVEMENT_TAG_HUE[m.tag];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          if (!done) celebrateFromEvent(e);
                          toggleMovement(m.id);
                        }}
                        className="rounded-2xl border p-3 text-left transition hover:opacity-90"
                        style={{
                          backgroundColor: done ? `hsl(${hue} / 0.14)` : "transparent",
                          borderColor: `hsl(${hue} / ${done ? 0.5 : 0.25})`,
                        }}
                        aria-pressed={done}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div
                              className="text-[11px] uppercase tracking-wide"
                              style={{ color: `hsl(${hue})` }}
                            >
                              {MOVEMENT_TAG_LABEL[m.tag]} · {m.minutes} min
                            </div>
                            <div className="font-medium text-ink">{m.label}</div>
                            <div className="text-xs text-muted-foreground">{m.hint}</div>
                          </div>
                          {done ? (
                            <CheckCircle2 size={20} className="shrink-0 text-primary" />
                          ) : (
                            <Circle size={20} className="shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={movementGoal}
                    onChange={(e) => setMovementGoal(Number(e.target.value) || 20)}
                    className="w-28 rounded-xl"
                    aria-label="Mål för vardagsmotion i minuter"
                  />
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target size={14} /> minuter vardagsmotion per dag
                  </span>
                </div>

                <div className="flex items-end gap-2">
                  {movementWeek.map((d) => {
                    const mins = d.ids.reduce((s, id) => s + (movementById(id)?.minutes ?? 0), 0);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-lg bg-primary/30"
                          style={{
                            height: `${Math.max(4, Math.min(1, mins / Math.max(movementGoal, 1)) * 48)}px`,
                          }}
                          title={`${mins} min`}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(d.date + "T00:00:00")
                            .toLocaleDateString("sv-SE", { weekday: "short" })
                            .slice(0, 2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {view === "program" && (
              <>
                <TrainingCreationChoice
                  disabled={loading}
                  onPace={() => setShowProgramCreator(true)}
                  onManual={openAddSession}
                />

                {showProgramCreator && <section ref={settingsRef} className="surface-card space-y-4 p-5" aria-label="Mina önskemål för Pace">
                  <h2 tabIndex={-1} className="text-xl font-semibold text-ink">Mina önskemål för Pace</h2>
                  <p className="text-sm text-muted-foreground">Välj dagar och berätta vad som passar dig. Pace gör ett program med bildpass.</p>
                  {state.program && <p className="text-sm text-muted-foreground">Ett nytt program ersätter passen i ditt nuvarande program när det är klart.</p>}
                  <Input
                    aria-label="Ditt träningsmål"
                    maxLength={300}
                    placeholder="T.ex. bli starkare i ryggen och orka springa 5 km"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="rounded-xl"
                  />

                  <div className="flex flex-wrap gap-2">
                    {FOCUS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFocus(f.id)}
                        className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                          focus === f.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-ink"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <fieldset>
                    <legend className="text-sm text-muted-foreground">
                      Träningsdagar – välj de dagar som passar dig
                    </legend>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((day) => {
                        const active = preferredDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            aria-pressed={active}
                            onClick={() => togglePreferredDay(day)}
                            className={`min-h-11 rounded-xl border px-3 text-sm transition ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-ink hover:bg-muted"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {preferredDays.length > 0
                        ? `${preferredDays.length} pass i veckan: ${preferredDays.join(", ")}`
                        : "Välj minst en dag."}
                    </p>
                  </fieldset>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
                    <label className="text-sm text-muted-foreground">
                      Minuter/pass
                      <Input
                        type="number"
                        min={10}
                        max={90}
                        value={minutes}
                        onChange={(e) =>
                          setMinutes(Math.min(90, Math.max(10, Number(e.target.value) || 45)))
                        }
                        className="rounded-xl mt-1"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLevel(l)}
                        className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition ${
                          level === l
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-ink"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <Input
                    aria-label="Utrustning"
                    maxLength={300}
                    placeholder="Utrustning (gym, hantlar, inget alls…)"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    aria-label="Något att ta hänsyn till"
                    maxLength={500}
                    placeholder="Något att ta hänsyn till? (t.ex. ont i knät)"
                    value={limitations}
                    onChange={(e) => setLimitations(e.target.value)}
                    className="rounded-xl"
                  />

                  {loading && (
                    <MyFloveThinking
                      steps={["🏃", "⚡", "📋", "✨"]}
                      label="Pace sätter ihop ditt visuella program…"
                    />
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="rounded-xl gap-2 w-full"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {state.program ? "Skapa nytt program med Pace" : "Skapa mitt program med Pace"}
                  </Button>
                  <Button type="button" variant="ghost" disabled={loading} onClick={() => setShowProgramCreator(false)}>Stäng önskemål</Button>
                </section>}


                <Button type="button" variant="outline" className="min-h-12 h-auto w-full whitespace-normal rounded-2xl" onClick={() => {
                  setProgramWorkout(null);
                  setBuilderCreationKey((key) => key + 1);
                  setShowWorkoutBuilder(true);
                }}>
                  <Sparkles size={18} className="shrink-0" aria-hidden /> Skapa ett bildpass för idag
                </Button>
                <WorkoutBuilderPanel
                  key={builderCreationKey}
                  showBuilder={showWorkoutBuilder}
                  programWorkout={programWorkout}
                  onOpenBuilder={() => setShowWorkoutBuilder(true)}
                  onCloseBuilder={() => setShowWorkoutBuilder(false)}
                  onAddToProgram={addWorkoutToProgram}
                  onWorkoutFinished={(workout) => {
                    const index = state.program?.sessions.findIndex((session) => session.workout?.id === workout.id) ?? -1;
                    if (index >= 0 && !doneToday.includes(index)) toggleSessionDone(index);
                  }}
                />
                {/* Programmet */}
                {state.program && (
                  <CollapsibleSection
                    className="surface-card p-5"
                    headingClassName="text-lg font-semibold text-ink"
                    title="Mitt träningsprogram"
                    id="Din vecka"
                    description={state.program.intro}
                    actions={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={clearProgram}
                      >
                        Rensa
                      </Button>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2"
                        onClick={handleEditProgram}
                      >
                        <Pencil size={15} /> Redigera programmet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2"
                        onClick={handleRecreate}
                        disabled={loading || !state.goal}
                      >
                        {loading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <RefreshCw size={15} />
                        )}
                        Skapa om med samma inställningar
                      </Button>
                    </div>

                    <ul className="space-y-3">
                      {state.program.sessions.map((s, i) => {
                        const done = doneToday.includes(i);
                        const hue = TYPE_TINT[s.type] ?? "205 45% 34%";
                        return (
                          <li
                            key={`${s.day}-${i}`}
                            className="rounded-2xl border p-4"
                            style={{
                              backgroundColor: `hsl(${hue} / 0.08)`,
                              borderColor: `hsl(${hue} / 0.3)`,
                            }}
                          >
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div
                                  className="text-xs uppercase tracking-wide"
                                  style={{ color: `hsl(${hue})` }}
                                >
                                  {s.day} · {s.type}
                                  {s.minutes ? ` · ${s.minutes} min` : ""}
                                </div>
                                <div className="font-semibold text-ink">{s.title}</div>
                              </div>
                              <div className="flex shrink-0 items-center justify-end gap-1">
                                <button
                                  type="button"
                                  aria-label="Ändra passet"
                                  onClick={() => openEditSession(i)}
                                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-ink"
                                >
                                  <Pencil size={17} />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Ta bort passet"
                                  onClick={() => {
                                    removeSession(i);
                                    toast({ title: "Passet är borttaget" });
                                  }}
                                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 size={17} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={done ? "Markera som ej klar" : "Markera som klar"}
                                  onClick={(e) => {
                                    if (!done) celebrateFromEvent(e);
                                    toggleSessionDone(i);
                                  }}
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary"
                                >
                                  {done ? (
                                    <CheckCircle2 size={22} />
                                  ) : (
                                    <Circle size={22} className="text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {s.workout ? <TrainingSessionVisual workout={s.workout} onOpen={() => {
                              setProgramWorkout({ ...s.workout! });
                              setShowWorkoutBuilder(true);
                            }} /> : s.exercises.length > 0 && (
                              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                                {s.exercises.map((ex, j) => (
                                  <li key={j}>• {ex}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <Button
                      variant="outline"
                      className="rounded-xl gap-2 w-full"
                      onClick={openAddSession}
                    >
                      <Plus size={16} /> Lägg till pass
                    </Button>

                    <p className="text-sm text-muted-foreground">{state.program.note}</p>
                  </CollapsibleSection>
                )}
              </>
            )}

            {view === "vikt" && (
              <CollapsibleSection
                className="surface-card p-5"
                headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
                title={
                  <>
                    <Scale size={18} className="text-primary" /> Vikt & viktnedgång
                  </>
                }
                description="Väg dig när det känns bra – inte varje dag. Kurvan över tid säger mer än en enskild morgon."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Senaste vikt
                    </p>
                    <p className="text-2xl font-bold text-ink">
                      {latestWeight ? `${latestWeight.kg} kg` : "–"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latestWeight
                        ? new Date(latestWeight.date + "T00:00:00").toLocaleDateString("sv-SE", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Ingen vikt inlagd ännu"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Målvikt</p>
                    <p className="text-2xl font-bold text-ink">
                      {weightGoal ? `${weightGoal} kg` : "–"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weightGoal && latestWeight
                        ? `${Math.abs(Math.round((latestWeight.kg - weightGoal) * 10) / 10)} kg kvar`
                        : "Sätt ett mål om du vill"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Förändring
                    </p>
                    <p className="text-2xl font-bold text-ink">
                      {weightChange === null
                        ? "–"
                        : `${weightChange > 0 ? "+" : ""}${weightChange} kg`}
                    </p>
                    <p className="text-xs text-muted-foreground">sedan första mätningen</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-4 space-y-3">
                  <p className="text-sm font-medium text-ink">Registrera en vägning</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Vikt (kg)"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="rounded-xl"
                      aria-label="Vikt i kg"
                    />
                    <Input
                      type="date"
                      value={weightDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setWeightDate(e.target.value)}
                      className="rounded-xl"
                      aria-label="Datum för vägningen"
                    />
                  </div>
                  <Input
                    placeholder="Notering (valfritt) – t.ex. sov dåligt, tränat mycket"
                    value={weightNote}
                    onChange={(e) => setWeightNote(e.target.value)}
                    className="rounded-xl"
                    aria-label="Notering"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      const n = Number(weightInput.replace(",", "."));
                      if (!Number.isFinite(n) || n <= 0) {
                        toast({
                          title: "Fyll i vikten",
                          description: "Skriv en vikt i kilo först.",
                        });
                        return;
                      }
                      const date = weightDate || new Date().toISOString().slice(0, 10);
                      setWeight(n, date, weightNote);
                      setWeightInput("");
                      setWeightNote("");
                      toast({ title: "Sparat", description: `Vikten är loggad för ${date}.` });
                    }}
                  >
                    Spara vägning
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Målvikt"
                    value={weightGoalInput}
                    onChange={(e) => setWeightGoalInput(e.target.value)}
                    className="w-32 rounded-xl"
                    aria-label="Målvikt i kg"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      const raw = weightGoalInput.trim();
                      if (!raw) {
                        setWeightGoal(null);
                        toast({ title: "Målvikt borttagen" });
                        return;
                      }
                      const n = Number(raw.replace(",", "."));
                      if (!Number.isFinite(n) || n < 20 || n > 400) {
                        toast({
                          title: "Kontrollera målvikten",
                          description: "Ange ett tal mellan 20 och 400 kg.",
                        });
                        return;
                      }
                      setWeightGoal(n);
                      setWeightGoalInput(String(Math.round(n * 10) / 10));
                      toast({
                        title: "Målvikt sparad",
                        description: `${Math.round(n * 10) / 10} kg`,
                      });
                    }}
                  >
                    Spara målvikt
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target size={14} /> målvikt
                  </span>
                </div>

                {weights.length > 1 && (
                  <div className="flex items-end gap-1 h-28">
                    {weights.slice(-14).map((w) => {
                      const min = Math.min(...weights.slice(-14).map((x) => x.kg));
                      const max = Math.max(...weights.slice(-14).map((x) => x.kg));
                      const span = Math.max(1, max - min);
                      return (
                        <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-lg bg-primary/30"
                            style={{ height: `${16 + ((w.kg - min) / span) * 60}px` }}
                            title={`${w.kg} kg`}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(w.date + "T00:00:00").toLocaleDateString("sv-SE", {
                              day: "numeric",
                              month: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">Vikthistorik</p>
                  {weights.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inga vägningar än. Din första registrering hamnar här.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/70 rounded-2xl border border-border/70">
                      {[...weights].reverse().map((w, i, arr) => {
                        const prev = arr[i + 1];
                        const diff = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
                        return (
                          <li key={w.date} className="flex items-start gap-3 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink">
                                {w.kg} kg
                                {diff !== null && diff !== 0 && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {diff > 0 ? "+" : ""}
                                    {diff} kg
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(w.date + "T00:00:00").toLocaleDateString("sv-SE", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "long",
                                })}
                              </p>
                              {w.note && (
                                <p className="text-sm text-muted-foreground mt-1 break-words">
                                  {w.note}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-muted-foreground"
                              onClick={() => {
                                removeWeight(w.date);
                                toast({ title: "Borttagen", description: "Vägningen är raderad." });
                              }}
                            >
                              Ta bort
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Paceable ger inga kost- eller kaloriråd. Prata med vården om du behöver stöd med
                  kost eller hälsa.
                </p>
              </CollapsibleSection>
            )}
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>

      <Dialog open={sessionEdit !== null} onOpenChange={(o) => !o && setSessionEdit(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {sessionEdit?.index === null ? "Skapa pass manuellt" : "Ändra passet"}
            </DialogTitle>
          </DialogHeader>
          {sessionEdit && (
            <div className="space-y-3">
              <fieldset>
                <legend className="text-sm text-muted-foreground">
                  {sessionEdit.index === null ? "Dagar – välj en eller flera" : "Dag"}
                </legend>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const active = sessionEdit.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSessionDay(day)}
                        className={`min-h-11 rounded-xl border px-3 text-sm transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-ink hover:bg-muted"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                {sessionEdit.index === null && sessionEdit.days.length > 1 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Samma pass läggs på {sessionEdit.days.length} dagar.
                  </p>
                )}
              </fieldset>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
                <label className="text-sm text-muted-foreground">
                  {sessionEdit.blocks.length ? "Maxtid (minuter)" : "Minuter"}
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={sessionEdit.minutes}
                    onChange={(e) => setSessionEdit({ ...sessionEdit, minutes: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </label>
              </div>
              {sessionEdit.blocks.length > 0 && <p className="text-sm text-muted-foreground">Maxtiden sparas med bildpasset. Dina valda övningar och doser behålls.</p>}
              <label className="text-sm text-muted-foreground block">
                Namn på passet
                <Input
                  value={sessionEdit.title}
                  onChange={(e) => setSessionEdit({ ...sessionEdit, title: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {(["styrka", "kondition", "rörlighet", "vila"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSessionEdit({ ...sessionEdit, type: t })}
                    className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition ${
                      sessionEdit.type === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <ManualExercises disabled={Boolean(sessionEdit.exercises.trim() && !sessionEdit.blocks.length)} blocks={sessionEdit.blocks} onChange={(blocks) => setSessionEdit({ ...sessionEdit, blocks })} />
              {sessionEdit.exercises.trim() && !sessionEdit.blocks.length && <p className="text-sm text-muted-foreground">Töm listan med egna övningar om du vill välja övningar med bilder istället.</p>}
              {sessionEdit.blocks.length > 0 ? <p className="text-sm text-muted-foreground">Övningarnas uppskattade tid beror på set och vilor. Spelaren stannar senast vid vald maxtid.</p> : <label className="text-sm text-muted-foreground block">
                Övningar – en per rad
                <Textarea
                  rows={5}
                  value={sessionEdit.exercises}
                  onChange={(e) => setSessionEdit({ ...sessionEdit, exercises: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </label>}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setSessionEdit(null)}>
              Avbryt
            </Button>
            <Button className="rounded-xl" onClick={saveSessionEdit}>
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

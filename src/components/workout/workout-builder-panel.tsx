import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  BatteryMedium,
  Dumbbell,
  Flame,
  HeartPulse,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ExerciseCard from "@/components/workout/exercise-card";
import WorkoutRunner from "@/components/workout/workout-runner";
import WorkoutAutoRunner from "@/components/workout/workout-auto-runner";
import { useWorkouts } from "@/hooks/use-workouts";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useTasks } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { emitActivityDone } from "@/lib/activity-energy-event";
import { cn } from "@/lib/utils";
import { orkWord } from "@/lib/ork-word";
import { BODY_AREAS, EQUIPMENT_LABEL, type BodyArea, type Equipment, type ExerciseFocus ,
} from "@/lib/exercise-library";
import {
  DEFAULT_REQUEST,
  buildWorkoutFromPlan,
  energyFromScore,
  generateWorkout,
  parseWorkoutText,
  swapExercise,
  type EnergyLevel,
  type Place,
  type Workout,
  type WorkoutIntent,
  type WorkoutRequest,
} from "@/lib/workout-generator";
import { generateAiWorkout } from "@/lib/workout-ai.functions";

type Step = "intent" | "beskriv" | "tanker" | "resultat" | "kor" | "klar";

const INTENTS: { id: WorkoutIntent; label: string; desc: string; icon: typeof Dumbbell }[] = [
  { id: "styrka", label: "Styrka", desc: "Bygg lite kraft med lugna övningar.", icon: Dumbbell },
  { id: "rörlighet", label: "Rörlighet", desc: "Mjuka upp kroppen.", icon: Activity },
  { id: "återhämtning", label: "Återhämtning", desc: "Väldigt lugnt, nästan ingen ansträngning.", icon: HeartPulse ,
  },
  { id: "eget", label: "Eget upplägg", desc: "Beskriv själv vad du vill göra.", icon: Sparkles },
];

const ENERGIES: EnergyLevel[] = ["låg", "normal", "mycket"];
const TIMES = [5, 10, 15, 20, 30, 45, 60];
const PLACES: Place[] = ["hemma", "gym", "ute"];
const EQUIPMENTS: Equipment[] = ["kroppsvikt", "hantlar", "kettlebell", "medicinboll", "miniband"];
const FOCUSES: ExerciseFocus[] = ["helkropp", "överkropp", "underkropp", "bål", "rörlighet"];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * "Flow skapar ditt pass" – en sak i taget: välj typ, beskriv, få passet.
 * Återanvänder befintlig energi (FlowScore), befintliga uppgifter för
 * historiken och MyFloves vanliga block/typografi.
 */
export interface WorkoutBuilderPanelProps {
  showBuilder: boolean;
  onOpenBuilder: () => void;
  onCloseBuilder: () => void;
  onAddToProgram: (workout: Workout) => void;
  programWorkout?: Workout | null;
  onWorkoutFinished?: (workout: Workout) => void;
}

export default function WorkoutBuilderPanel({
  showBuilder,
  onOpenBuilder,
  onCloseBuilder,
  onAddToProgram,
  programWorkout,
  onWorkoutFinished,
}: WorkoutBuilderPanelProps) {
  const [step, setStep] = useState<Step>("intent");
  const [req, setReq] = useState<WorkoutRequest>(DEFAULT_REQUEST);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [autoMode, setAutoMode] = useState(true);
  const [usedTemplate, setUsedTemplate] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [maxMinutesInput, setMaxMinutesInput] = useState("30");
  const maxMinutes = Number(maxMinutesInput);
  const validMaxMinutes = Number.isInteger(maxMinutes) && maxMinutes >= 5 && maxMinutes <= 180;
  const { saved, logs, saveWorkout, removeWorkout, logWorkout } = useWorkouts();
  const { percent: capacityPercent } = useCapacityMode();
  const { addTask } = useTasks();
  const { toast } = useToast();

  const energyPercent = capacityPercent;
  const suggestedEnergy = useMemo(() => energyFromScore(capacityPercent), [capacityPercent]);

  useEffect(() => {
    if (showBuilder) track("workout_builder_opened", { source: "traningsprogram" });
  }, [showBuilder]);

  useEffect(() => {
    if (!programWorkout) return;
    setWorkout(programWorkout);
    setReq({
      ...DEFAULT_REQUEST,
      ...programWorkout,
      minutes: programWorkout.maxMinutes ?? programWorkout.minutes,
    });
    setDoneIds([]);
    setUsedTemplate(false);
    setStep("resultat");
  }, [programWorkout]);

  useEffect(() => {
    if (workout) setMaxMinutesInput(String(workout.maxMinutes ?? Math.max(5, workout.minutes)));
  }, [workout]);

  useEffect(() => {
    if (!showBuilder || (step !== "resultat" && step !== "kor")) return;
    playerRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    playerRef.current?.focus({ preventScroll: true });
  }, [showBuilder, step, programWorkout]);

  useEffect(() => {
    setReq((r) => ({ ...r, energy: suggestedEnergy }));
  }, [suggestedEnergy]);

  const startIntent = (intent: WorkoutIntent) => {
    setReq((r) => ({
      ...r,
      intent,
      focus: intent === "rörlighet" ? ["rörlighet"] : r.focus,
      minutes: intent === "återhämtning" ? Math.min(r.minutes, 20) : r.minutes,
    }));
    setStep("beskriv");
  };

  /**
   * Flow bygger passet. Först AI:n, som väger in energi, fritext och ömma
   * områden. Går det inte fram används den lokala generatorn – användaren
   * får alltid ett pass.
   */
  const create = async () => {
    const parsed = parseWorkoutText(req.text ?? "", req);
    setReq(parsed);
    setStep("tanker");
    track("workout_generated", { source: parsed.intent });

    let result: Workout | null = null;
    try {
      const plan = await generateAiWorkout({
        data: {
          intent: parsed.intent,
          text: parsed.text?.slice(0, 600) || undefined,
          minutes: parsed.minutes,
          energy: parsed.energy,
          energyPercent,
          place: parsed.place,
          equipment: parsed.equipment,
          focus: parsed.focus,
          limitations: parsed.limitations,
        },
      });
      result = buildWorkoutFromPlan(
        {
          title: plan.title,
          note: plan.note,
          blocks: plan.blocks.map((b) => ({
            exerciseId: b.exerciseId,
            section: b.section,
            sets: b.sets,
            reps: b.reps ?? undefined,
            seconds: b.seconds ?? undefined,
            restSeconds: b.restSeconds,
          })),
        },
        parsed,
      );
    } catch {
      result = null;
    }

    setWorkout({ ...(result ?? generateWorkout(parsed)), maxMinutes: parsed.minutes });
    setUsedTemplate(!result);
    setDoneIds([]);
    setStep("resultat");
  };

  const finish = (doneCount: number, elapsedSeconds?: number) => {
    if (!workout) return;
    const loggedWorkout =
      elapsedSeconds == null ? workout : { ...workout, minutes: Math.ceil(elapsedSeconds / 60) };
    logWorkout(loggedWorkout, doneCount);
    saveWorkout(workout);
    if (doneCount > 0)
      addTask(`${doneCount === workout.blocks.length ? "Träningspass" : "Del av träningspass"}: ${workout.title}`, new Date().toISOString().slice(0, 10), {
      completed: true,
      note: `${loggedWorkout.minutes} min · ${doneCount}/${workout.blocks.length} övningar`,
    },
      );
    track("workout_completed", { source: workout.intent });
    if (doneCount > 0)
      emitActivityDone({
      id: `workout-${workout.id}`,
      title: `Träningspass: ${workout.title}`,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    if (doneCount === workout.blocks.length && doneCount > 0) onWorkoutFinished?.(workout);
    setStep("klar");
  };

  return (
    <div ref={playerRef}
      tabIndex={-1}
      aria-label="Träningsspelaren"
      className="space-y-5 scroll-mt-6"
    >
        {showBuilder && (
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Träning</p>
            <h1 className="text-2xl font-semibold text-ink">Pace skapar ditt pass</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Berätta vad du behöver, så gör jag ett pass som passar dagen.
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <BatteryMedium size={14} aria-hidden /> Din energi just nu:{" "}
              {orkWord(energyPercent).label}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={onCloseBuilder}>
              Stäng skaparen
            </Button>
          </header>
        )}

        {showBuilder && step === "intent" && (
          <>
            <section className="space-y-3" aria-label="Vad vill du göra idag?">
              <h2 className="text-lg font-semibold text-ink">Vad vill du göra idag?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {INTENTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => startIntent(item.id)}
                      className="surface-card flex min-h-[92px] items-center gap-3 p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={20} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold text-ink">{item.label}</span>
                        <span className="block text-sm text-muted-foreground">{item.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {showBuilder && step === "beskriv" && (
          <>
            <section className="space-y-4" aria-label="Beskriv vad du behöver">
              <div className="surface-card p-4">
                <label htmlFor="workout-text" className="text-base font-semibold text-ink">
                  Beskriv vad du behöver
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Skriv fritt, t.ex. "hemma i 30 minuter, hantlar, ont i knäna, fokus rumpa och mage". Du kan också bara välja nedan.
                </p>
                <Textarea
                  id="workout-text"
                  rows={4}
                  className="mt-3 rounded-2xl text-base"
                  placeholder="Beskriv vad du behöver..."
                  value={req.text ?? ""}
                  onChange={(e) => setReq({ ...req, text: e.target.value })}
                />
              </div>

              <div className="surface-card space-y-4 p-4">
                <ChipGroup label="Energi">
                  {ENERGIES.map((e) => (
                    <Chip key={e} active={req.energy === e} onClick={() => setReq({ ...req, energy: e })}>
                      {e}
                    </Chip>
                  ))}
                </ChipGroup>
                <ChipGroup label="Tid">
                  {TIMES.map((m) => (
                    <Chip key={m} active={req.minutes === m} onClick={() => setReq({ ...req, minutes: m })}>
                      {m} min
                    </Chip>
                  ))}
                <label className="block w-full text-sm text-ink" htmlFor="workout-minutes">
                  Egen tid (5–90 minuter)
                  <Input
                    id="workout-minutes"
                    type="number"
                    min={5}
                    max={90}
                    step={1}
                    value={req.minutes || ""}
                    className="mt-1 max-w-48"
                    onChange={(event) => setReq({ ...req, minutes: Number(event.target.value) })}
                  />
                </label>
              </ChipGroup>
                <ChipGroup label="Plats">
                  {PLACES.map((p) => (
                    <Chip key={p} active={req.place === p} onClick={() => setReq({ ...req, place: p })}>
                      {p}
                    </Chip>
                  ))}
                </ChipGroup>
                <ChipGroup label="Utrustning">
                  {EQUIPMENTS.map((e) => (
                    <Chip
                      key={e}
                      active={req.equipment.includes(e)}
                      onClick={() => setReq({ ...req, equipment: toggle(req.equipment, e) })}
                    >
                      {EQUIPMENT_LABEL[e]}
                    </Chip>
                  ))}
                </ChipGroup>
                <ChipGroup label="Fokus">
                  {FOCUSES.map((f) => (
                    <Chip
                      key={f}
                      active={req.focus.includes(f)}
                      onClick={() => setReq({ ...req, focus: toggle(req.focus, f) })}
                    >
                      {f}
                    </Chip>
                  ))}
                </ChipGroup>
                <ChipGroup label="Känsligt just nu">
                  {BODY_AREAS.map((a: BodyArea) => (
                    <Chip
                      key={a}
                      active={req.limitations.includes(a)}
                      onClick={() => setReq({ ...req, limitations: toggle(req.limitations, a) })}
                    >
                      {a}
                    </Chip>
                  ))}
                </ChipGroup>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="lg" className="h-14 flex-1 rounded-2xl text-base" onClick={create}disabled={!Number.isInteger(req.minutes) || req.minutes < 5 || req.minutes > 90}
              >
                  <Sparkles size={18} className="mr-2" aria-hidden /> Skapa mitt pass
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 rounded-2xl"
                  onClick={() => setStep("intent")}
                >
                  Tillbaka
                </Button>
              </div>
            </section>
          </>
        )}

        {showBuilder && step === "tanker" && (
          <>
            <div className="surface-card p-8 text-center">
              <Sparkles size={28} className="mx-auto animate-pulse text-primary" aria-hidden />
              <p className="mt-3 text-base font-medium text-ink">Pace tänker...</p>
              <p className="text-sm text-muted-foreground">Sätter ihop något som passar dagen.</p>
            </div>
          </>
        )}

        {showBuilder && step === "resultat" && workout && (
          <>
            <section className="space-y-4" aria-label="Ditt pass">
              <div className="surface-card p-4">
                <h2 className="text-xl font-semibold text-ink">{workout.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{workout.note}</p>
                {usedTemplate && (
                <p role="status" className="mt-2 text-sm text-muted-foreground">Pace kunde inte svara just nu. Här är ett pass från bildbiblioteket utifrån dina val.</p>)}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge>{workout.minutes} min</Badge>
                  <Badge>Energi: {workout.energy}</Badge>
                  <Badge>{workout.place}</Badge>
                  <Badge>{workout.equipment.join(", ")}</Badge>
                  <Badge>
                    <Flame size={12} className="mr-1 inline" aria-hidden /> ca {workout.kcalLow}–
                    {workout.kcalHigh} kcal
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Kalorierna är en grov uppskattning – det varierar med tempo, vila, kroppsvikt och
                  intensitet.
                </p>
              </div>

            <section className="surface-card space-y-3 p-4" aria-label="Starta ditt pass">
              <label
                htmlFor="workout-max-minutes"
                className="block text-base font-semibold text-ink"
              >
                Hur länge vill du träna?
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((minutes) => (
                  <Chip
                    key={minutes}
                    active={maxMinutes === minutes}
                    onClick={() => setMaxMinutesInput(String(minutes))}
                  >
                    {minutes} min
                  </Chip>
                ))}
              </div>
              <label htmlFor="workout-max-minutes" className="block text-sm text-muted-foreground">
                Maxtid i minuter (5–180)
              </label>
              <Input
                id="workout-max-minutes"
                type="number"
                min={5}
                max={180}
                step={1}
                value={maxMinutesInput}
                onChange={(event) => setMaxMinutesInput(event.target.value)}
                className="max-w-48"
                aria-invalid={!validMaxMinutes}
              />
              <p className="text-sm text-muted-foreground">
                I automatiskt läge stannar passet vid maxtiden eller när övningarna är klara. Pauser
                räknas inte. Dina övningar och doser behålls.
              </p>
              <Button
                size="lg"
                disabled={!validMaxMinutes}
                className="min-h-14 h-auto w-full whitespace-normal rounded-2xl text-base"
                onClick={() => {
                  setWorkout({ ...workout, maxMinutes });
                  setAutoMode(true);
                  setStep("kor");
                }}
              >
                <Play size={18} className="mr-2 shrink-0" aria-hidden /> Starta med nedräkning
              </Button>
              <p className="text-sm text-muted-foreground">
                Övningsbilder, byt sida och nästa övning visas automatiskt. Tiden för repetitioner
                är uppskattad.
              </p>
              <Button
                variant="outline"
                className="min-h-12 h-auto w-full whitespace-normal rounded-2xl"
                onClick={() => {
                  setAutoMode(false);
                  setStep("kor");
                }}
              >
                Kör manuellt i egen takt
              </Button>
            </section>

              {(["uppvärmning", "huvuddel", "nedvarvning"] as const).map((section) => {
                const items = workout.blocks
                  .map((b, i) => ({ b, i }))
                  .filter(({ b }) => b.section === section);
                if (!items.length) return null;
                return (
                  <div key={section} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {section}
                    </h3>
                    {items.map(({ b, i }) => (
                      <ExerciseCard
                        key={`${b.exerciseId}-${i}`}
                        block={b}
                        index={i}
                        done={doneIds.includes(b.exerciseId)}
                        onToggleDone={() => setDoneIds((d) => toggle(d, b.exerciseId))}
                        onSwap={() => setWorkout(swapExercise(workout, i))}
                      />
                    ))}
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground">
                Allmän träningsvägledning, inte vård. Avbryt om något gör tydligt eller ökande ont.
              </p>

              <div className="grid gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    disabled={!validMaxMinutes}
                  onClick={() => {
                      if (!validMaxMinutes) return;
                    const selected = { ...workout, maxMinutes };
                    setWorkout(selected);
                    saveWorkout(selected);
                      toast({ title: "Sparat i Mina pass" });
                    }}
                  >
                    <Save size={16} className="mr-1" aria-hidden /> Spara
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => validMaxMinutes && onAddToProgram({ ...workout, maxMinutes })}
                    disabled={!validMaxMinutes || programWorkout?.id === workout.id}
                  >
                    <Dumbbell size={16} className="mr-1" aria-hidden /> Lägg i mitt program
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => setWorkout(generateWorkout(req))}
                  >
                    <RefreshCw size={16} className="mr-1" aria-hidden /> Ny variant
                  </Button>
                  <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => setStep("beskriv")}>
                    Ändra
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}

        {showBuilder && step === "kor" && workout && (
          <>
            {autoMode ? (
              <WorkoutAutoRunner
                workout={workout}
                onFinish={finish}
                onClose={() => setStep("resultat")}
                onManual={() => setAutoMode(false)}
              />
            ) : (
              <WorkoutRunner workout={workout} onFinish={finish} onClose={() => setStep("resultat")} />
            )}
          </>
        )}

        {showBuilder && step === "klar" && workout && (
          <>
            <section className="surface-card p-6 text-center">
              <h2 className="text-2xl font-semibold text-ink">Du gjorde det! 💜</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Passet är sparat i Mina pass och loggat i din historik.
              </p>
              <div className="mt-4 grid gap-2">
                <Button className="h-12 rounded-2xl" onClick={() => setStep("resultat")}>
                  Se passet igen
                </Button>
                <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setStep("intent")}>
                  Skapa ett nytt pass
                </Button>
                <Link href="/historik" className="text-sm text-primary underline-offset-2 hover:underline">
                  Se dina mönster i historiken
                </Link>
              </div>
            </section>
          </>
        )}

        <>
          <section className="space-y-3" aria-label="Mina pass">
            <h2 className="text-lg font-semibold text-ink">Mina pass</h2>
            {logs.length === 0 && saved.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Här samlas dina sparade och genomförda pass.
              </p>
            )}
            {logs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Genomförda
                </h3>
                {logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="surface-card flex items-center gap-3 p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Dumbbell size={16} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{log.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.date} · {log.minutes} min · {log.doneExercises}/{log.totalExercises}{" "}
                        övningar
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {saved.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Sparade
                </h3>
                {saved.slice(0, 8).map((w) => (
                  <div key={w.id} className="surface-card flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{w.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.minutes} min · {w.blocks.length} övningar
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setWorkout(w);
                        setReq({ ...DEFAULT_REQUEST, ...w, minutes: w.maxMinutes ?? w.minutes });
                      setDoneIds([]);
                        setStep("resultat");
                        onOpenBuilder();
                      }}
                    >
                      Gör om
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      aria-label={`Ta bort ${w.title}`}
                      onClick={() => removeWorkout(w.id)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

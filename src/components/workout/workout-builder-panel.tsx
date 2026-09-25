import { useEffect, useMemo, useState } from "react";
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
import { BODY_AREAS, EQUIPMENT_LABEL, type BodyArea, type Equipment, type ExerciseFocus } from "@/lib/exercise-library";
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
  { id: "återhämtning", label: "Återhämtning", desc: "Väldigt lugnt, nästan ingen ansträngning.", icon: HeartPulse },
  { id: "eget", label: "Eget upplägg", desc: "Beskriv själv vad du vill göra.", icon: Sparkles },
];

const ENERGIES: EnergyLevel[] = ["låg", "normal", "mycket"];
const TIMES = [10, 20, 30, 45, 60];
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
}

export default function WorkoutBuilderPanel({
  showBuilder,
  onOpenBuilder,
  onCloseBuilder,
  onAddToProgram,
}: WorkoutBuilderPanelProps) {
  const [step, setStep] = useState<Step>("intent");
  const [req, setReq] = useState<WorkoutRequest>(DEFAULT_REQUEST);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [autoMode, setAutoMode] = useState(true);
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

    setWorkout(result ?? generateWorkout(parsed));
    setDoneIds([]);
    setStep("resultat");
  };

  const finish = (doneCount: number) => {
    if (!workout) return;
    logWorkout(workout, doneCount);
    saveWorkout(workout);
    addTask(`Träningspass: ${workout.title}`, new Date().toISOString().slice(0, 10), {
      completed: true,
      note: `${workout.minutes} min · ca ${workout.kcalLow}–${workout.kcalHigh} kcal`,
      energyImpact: "gives",
    });
    track("workout_completed", { source: workout.intent });
    emitActivityDone({
      id: `workout-${workout.id}`,
      title: `Träningspass: ${workout.title}`,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setStep("klar");
  };

  return (
    <div className="space-y-5">
        {showBuilder && (
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Träning</p>
            <h1 className="text-2xl font-semibold text-ink">Flow skapar ditt pass</h1>
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
                  Skriv fritt, t.ex. "hemma i 30 minuter, hantlar, ont i knäna, fokus rumpa och
                  mage". Du kan också bara välja nedan.
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
                <Button size="lg" className="h-14 flex-1 rounded-2xl text-base" onClick={create}>
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
              <p className="mt-3 text-base font-medium text-ink">Flow tänker...</p>
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
                <Button
                  size="lg"
                  className="h-14 rounded-2xl text-base"
                  onClick={() => {
                    setAutoMode(true);
                    setStep("kor");
                  }}
                >
                  <Play size={18} className="mr-2" aria-hidden /> Starta passet (automatiskt)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Timern räknar ner, säger till vid byt sida och startar nästa övning åt dig.
                </p>
                <Button
                  variant="outline"
                  className="h-12 rounded-2xl"
                  onClick={() => {
                    setAutoMode(false);
                    setStep("kor");
                  }}
                >
                  Kör manuellt i egen takt
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => {
                      saveWorkout(workout);
                      toast({ title: "Sparat i Mina pass" });
                    }}
                  >
                    <Save size={16} className="mr-1" aria-hidden /> Spara
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => onAddToProgram(workout)}
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

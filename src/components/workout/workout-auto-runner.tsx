import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hand,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseVisual from "@/components/workout/exercise-visual";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { exerciseById } from "@/lib/exercise-library";
import { buildWorkoutTimeline, type TimelineStep } from "@/lib/workout-timeline";
import {
  announceWorkout,
  isWorkoutSoundEnabled,
  setWorkoutSoundEnabled,
  subscribeWorkoutSound,
} from "@/lib/workout-voice";
import type { Workout } from "@/lib/workout-generator";
import { cn } from "@/lib/utils";

/**
 * Automatiskt pass – passet går av sig självt.
 *
 * Stor timer, tydlig text och nästan inga tryck: förvarning, arbete, "Byt
 * sida" och vila kommer automatiskt. Användaren kan alltid pausa, hoppa över
 * eller gå tillbaka.
 */
export default function WorkoutAutoRunner({
  workout,
  onFinish,
  onClose,
  onManual,
  breakEvery = 0,
  breakSeconds = 30,
}: {
  workout: Workout;
  onFinish: (doneCount: number) => void;
  onClose: () => void;
  onManual: () => void;
  breakEvery?: number;
  breakSeconds?: number;
}) {
  const steps = useMemo(() => buildWorkoutTimeline(workout, { breakEvery, breakSeconds }), [workout, breakEvery, breakSeconds]);
  const [soundOn, setSoundOn] = useState(() => isWorkoutSoundEnabled());
  const [finished, setFinished] = useState(false);
  const doneBlocks = useRef<Set<number>>(new Set());

  useEffect(() => subscribeWorkoutSound(setSoundOn), []);

  const handleStepStart = useCallback((step: TimelineStep) => {
    if (step.kind === "arbete") {
      doneBlocks.current.add(step.blockIndex);
      announceWorkout(step.announce, step.announce === "Byt sida" ? "byt" : "start");
    } else if (step.kind === "vila") {
      announceWorkout("Vila", "vila");
    } else {
      announceWorkout(step.announce, "start");
    }
  }, []);

  const timer = useWorkoutTimer(steps, {
    totalExercises: workout.blocks.length,
    onStepStart: handleStepStart,
    onFinish: () => {
      announceWorkout("Passet är klart", "klar");
      setFinished(true);
    },
  });

  const { step, remaining, running } = timer;

  // Håll skärmen tänd så länge passet rullar, där webbläsaren tillåter det.
  useEffect(() => {
    if (finished || !running) return;
    let released = false;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    void nav.wakeLock
      ?.request("screen")
      .then((l) => {
        if (released) void l.release().catch(() => {});
        else lock = l;
      })
      .catch(() => {});
    return () => {
      released = true;
      void lock?.release().catch(() => {});
    };
  }, [finished, running]);

  const ex = step ? exerciseById(step.exerciseId) : undefined;
  const progressPercent = steps.length
    ? Math.round(((timer.stepIndex + 1) / steps.length) * 100)
    : 0;

  const toggleSound = () => {
    const next = !soundOn;
    setWorkoutSoundEnabled(next);
    setSoundOn(next);
  };

  if (finished) {
    return (
      <section className="surface-card p-6 text-center">
        <h2 className="text-2xl font-semibold text-ink">Passet klart 💜</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Du gick igenom {doneBlocks.current.size} av {workout.blocks.length} övningar. Fint jobbat.
        </p>
        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            className="h-auto min-h-14 whitespace-normal rounded-2xl px-3 py-3 text-base"
            onClick={() => onFinish(doneBlocks.current.size)}
          >
            <Check size={18} className="mr-2" aria-hidden /> Spara och logga passet
          </Button>
          <Button variant="outline" className="h-12 rounded-2xl" onClick={onClose}>
            Tillbaka till passet
          </Button>
        </div>
      </section>
    );
  }

  if (!step || !ex) return null;

  const isRest = step.kind === "vila";
  const isPrep = step.kind === "förvarning";
  const isReps = step.seconds == null;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Övning {Math.min(timer.exerciseNumber, workout.blocks.length)} av {workout.blocks.length}
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
            <span className="ml-1">Ljud {soundOn ? "på" : "av"}</span>
          </Button>
          <Button variant="ghost" size="sm" className="min-w-0 rounded-full" onClick={onClose}>
            <X size={16} className="mr-1" aria-hidden /> Avsluta
          </Button>
        </div>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <section
        className={cn(
          "surface-card min-w-0 p-3 text-center sm:p-5",
          isRest && "bg-muted/40",
          isPrep && "bg-primary/5",
        )}
        aria-live="polite"
      >
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          {isRest ? "Vila" : isPrep ? "Gör dig redo" : step.side ? `${step.side} sida` : "Kör"}
        </p>
        <h2 className="pace-type-activity mt-1 break-words text-xl font-semibold leading-snug text-ink sm:text-2xl">{step.title}</h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">{step.detail}</p>

        {isReps ? (
          <p className="mt-4 text-5xl font-bold tabular-nums text-ink sm:text-6xl">{step.reps}</p>
        ) : (
          <p
            className={cn(
              "mt-4 text-5xl font-bold tabular-nums text-ink sm:text-7xl",
              !running && "opacity-60",
            )}
          >
            {remaining ?? step.seconds}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {isReps ? "repetitioner – tryck klart när du är färdig" : "sekunder"}
        </p>

        {!isRest && ex.cues.length > 0 && (
          <ul className="mx-auto mt-4 max-w-[280px] space-y-1 text-left text-sm text-ink">
            {ex.cues.slice(0, 3).map((cue) => (
              <li key={cue} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {cue}
              </li>
            ))}
          </ul>
        )}
        {!isRest && (
          <ExerciseVisual
            visual={ex.visual}
            name={ex.name}
            eager
            className="mx-auto mt-4 aspect-square w-full max-w-[280px] rounded-3xl border border-border/50 object-cover"
          />
        )}

        <div className="mt-5 grid gap-2">
          {isReps ? (
            <Button size="lg" className="h-auto min-h-14 whitespace-normal rounded-2xl px-3 py-3 text-base" onClick={timer.next}>
              <Check size={20} className="mr-2" aria-hidden /> Klar
            </Button>
          ) : (
            <Button
              size="lg"
              variant={running ? "outline" : "default"}
              className="h-16 rounded-2xl text-lg"
              onClick={timer.toggle}
            >
              {running ? (
                <>
                  <Pause size={20} className="mr-2" aria-hidden /> Pausa
                </>
              ) : (
                <>
                  <Play size={20} className="mr-2" aria-hidden /> Fortsätt
                </>
              )}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-auto min-h-12 min-w-0 flex-1 whitespace-normal rounded-2xl px-2 py-3 text-sm"
              onClick={timer.previous}
              disabled={timer.stepIndex === 0}
            >
              <ArrowLeft size={18} className="mr-1" aria-hidden /> Föregående
            </Button>
            <Button variant="outline" className="h-14 flex-1 rounded-2xl" onClick={timer.next}>
              Hoppa över <ArrowRight size={18} className="ml-1" aria-hidden />
            </Button>
          </div>
          <Button variant="ghost" className="h-12 rounded-2xl" onClick={onManual}>
            <Hand size={16} className="mr-2" aria-hidden /> Gör passet manuellt istället
          </Button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Avbryt om något gör tydligt eller ökande ont. Det här är allmän träningsvägledning – vid
        besvär som håller i sig, prata med vården eller en fysioterapeut.
      </p>
    </div>
  );
}

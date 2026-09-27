import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import type { TimelineStep } from "@/lib/workout-timeline";
import { durationLabel } from "@/lib/saved-exercises";

export interface PlayableExercise {
  title: string;
  icon: string;
  steps: string[];
  minutes?: number;
  situation?: string;
  subtitle?: string;
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Enkel timer – återanvänder träningens klockmotor med ett enda moment. */
function ExerciseTimer({ minutes }: { minutes: number }) {
  const [started, setStarted] = useState(false);
  const steps = useMemo<TimelineStep[]>(
    () => [{ id: "t", kind: "arbete", blockIndex: 0, exerciseId: "t", exerciseName: "Övning", setNumber: 1, totalSets: 1, seconds: Math.round(minutes * 60), title: "", detail: "", announce: "" }],
    [minutes],
  );
  const timer = useWorkoutTimer(steps, { totalExercises: 1, autoStart: false });
  const remaining = timer.finished ? 0 : (timer.remaining ?? minutes * 60);
  return (
    <div className="rounded-2xl bg-secondary/60 p-3 text-center" data-testid="exercise-timer">
      <p className="font-display text-3xl font-bold tabular-nums text-ink" aria-live="polite">{fmt(remaining)}</p>
      {timer.finished ? (
        <p className="mt-1 text-sm text-primary">Tiden är slut. Fint gjort 💜</p>
      ) : (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {!started || !timer.running ? (
            <Button size="sm" className="rounded-full" onClick={() => { setStarted(true); timer.resume(); }}>
              <Play className="h-4 w-4" /> {started ? "Fortsätt" : "Starta"}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="rounded-full" onClick={timer.pause}>
              <Pause className="h-4 w-4" /> Pausa
            </Button>
          )}
          {started && (
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { timer.pause(); timer.restart(); timer.pause(); setStarted(false); }}>
              <Square className="h-4 w-4" /> Avsluta
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** "Starta övning" – intro, sedan ett steg i taget. */
export default function ExercisePlayer({ exercise, onClose, onDone }: { exercise: PlayableExercise; onClose?: () => void; onDone?: () => void }) {
  const [index, setIndex] = useState<number | null>(null);
  const total = exercise.steps.length;
  const done = index !== null && index >= total;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" data-testid="exercise-player">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{exercise.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold text-ink">{exercise.title}</h3>
          <p className="text-xs text-muted-foreground">
            {[durationLabel(exercise.minutes), exercise.situation ? `För ${exercise.situation}` : null].filter(Boolean).join(" · ")}
          </p>
          {exercise.subtitle && <p className="text-xs text-muted-foreground">{exercise.subtitle}</p>}
        </div>
        {onClose && (
          <button type="button" aria-label="Stäng" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {index === null ? (
        <Button className="mt-4 min-h-12 w-full rounded-2xl" onClick={() => setIndex(0)}>
          <Play className="h-4 w-4" /> Starta
        </Button>
      ) : done ? (
        <div className="mt-4 space-y-3 text-center">
          <p className="text-lg font-semibold text-ink">Klart 💜</p>
          <p className="text-sm text-muted-foreground">Ni tog en stund tillsammans. Det räcker.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" className="rounded-full" onClick={() => setIndex(0)}>Gör igen</Button>
            <Button className="rounded-full" onClick={() => { onDone?.(); onClose?.(); }}><Check className="h-4 w-4" /> Jag gjorde det</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex justify-center gap-1.5" aria-hidden>
            {exercise.steps.map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i <= index ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
          <div className="min-h-28 rounded-2xl bg-secondary/50 px-4 py-6 text-center">
            <p className="text-xs font-semibold text-primary">Steg {index + 1} av {total}</p>
            <p className="mt-2 break-words text-lg leading-snug text-ink" aria-live="polite">{exercise.steps[index]}</p>
          </div>
          {exercise.minutes ? <ExerciseTimer minutes={exercise.minutes} /> : null}
          <div className="flex gap-2">
            <Button variant="ghost" className="min-h-12 rounded-2xl" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Föregående">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button className="min-h-12 flex-1 rounded-2xl" onClick={() => setIndex(index + 1)}>
              Nästa <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

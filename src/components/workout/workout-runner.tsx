import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseIllustration from "@/components/workout/exercise-illustration";
import { exerciseById } from "@/lib/exercise-library";
import type { Workout } from "@/lib/workout-generator";

/**
 * Steg-för-steg-läget: en övning i taget, tydlig progress och en vilotimer.
 * Inga extra beslut – bara "klar", "vidare" och "avsluta".
 */
export default function WorkoutRunner({
  workout,
  onFinish,
  onClose,
}: {
  workout: Workout;
  onFinish: (doneCount: number) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [rest, setRest] = useState<number | null>(null);
  const [running, setRunning] = useState(true);

  const block = workout.blocks[index];
  const ex = block ? exerciseById(block.exerciseId) : undefined;
  const total = workout.blocks.length;
  const progress = Math.round(((index + 1) / total) * 100);

  useEffect(() => {
    if (rest == null || !running) return;
    if (rest <= 0) {
      setRest(null);
      return;
    }
    const id = setTimeout(() => setRest((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [rest, running]);

  const dose = useMemo(() => {
    if (!block) return "";
    return block.seconds
      ? `${block.sets} × ${block.seconds} sekunder`
      : `${block.sets} × ${block.reps} repetitioner`;
  }, [block]);

  if (!block || !ex) return null;

  const markDone = () => {
    const nextDone = done.includes(block.exerciseId) ? done : [...done, block.exerciseId];
    setDone(nextDone);
    if (index + 1 >= total) {
      onFinish(nextDone.length);
      return;
    }
    setRest(block.restSeconds);
    setIndex(index + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Övning {index + 1} av {total}
        </p>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
          <X size={16} className="mr-1" aria-hidden /> Avsluta
        </Button>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <section className="surface-card p-4 text-center">
        <ExerciseIllustration
          variant={ex.illustration}
          className="mx-auto h-36 w-full max-w-[280px] rounded-3xl"
        />
        <h2 className="mt-3 text-xl font-semibold text-ink">{ex.name}</h2>
        <p className="mt-1 text-base font-medium text-primary">{dose}</p>
        <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-sm text-muted-foreground">
          {ex.cues.map((cue) => (
            <li key={cue}>• {cue}</li>
          ))}
        </ul>

        {rest != null && (
          <div className="mt-4 rounded-2xl bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Vila</p>
            <p className="text-3xl font-semibold text-ink">{rest} s</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 rounded-full"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? (
                <>
                  <Pause size={16} className="mr-1" aria-hidden /> Pausa
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" aria-hidden /> Fortsätt
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          <Button size="lg" className="h-14 rounded-2xl text-base" onClick={markDone}>
            <Check size={18} className="mr-2" aria-hidden />
            {index + 1 >= total ? "Klar med passet" : "Klar – nästa övning"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-2xl"
              disabled={index === 0}
              onClick={() => {
                setRest(null);
                setIndex((i) => Math.max(0, i - 1));
              }}
            >
              <ArrowLeft size={16} className="mr-1" aria-hidden /> Tillbaka
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-2xl"
              onClick={() => {
                setRest(null);
                if (index + 1 >= total) onFinish(done.length);
                else setIndex(index + 1);
              }}
            >
              Hoppa över <ArrowRight size={16} className="ml-1" aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Avbryt om något gör tydligt eller ökande ont. Det här är allmän träningsvägledning – vid
        besvär som håller i sig, prata med vården eller en fysioterapeut.
      </p>
    </div>
  );
}

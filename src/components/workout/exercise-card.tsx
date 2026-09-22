import { useState } from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseIllustration from "@/components/workout/exercise-illustration";
import { exerciseById } from "@/lib/exercise-library";
import type { WorkoutBlock } from "@/lib/workout-generator";
import { cn } from "@/lib/utils";

/**
 * Ett träningskort: numrerat, luftigt och lätt att skanna på mobil.
 * Allt utom det viktigaste ligger bakom "Visa hur".
 */
export default function ExerciseCard({
  block,
  index,
  done,
  onToggleDone,
  onSwap,
}: {
  block: WorkoutBlock;
  index: number;
  done?: boolean;
  onToggleDone?: () => void;
  onSwap?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ex = exerciseById(block.exerciseId);
  if (!ex) return null;

  const dose = block.seconds
    ? `${block.sets} × ${block.seconds} sek`
    : `${block.sets} × ${block.reps} reps`;

  return (
    <article
      className={cn(
        "surface-card min-w-0 p-3 transition-opacity sm:p-4",
        done && "opacity-60",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <ExerciseIllustration
          variant={ex.illustration}
          className="h-20 w-24 shrink-0 rounded-2xl sm:h-24 sm:w-28"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <h3
              className={cn(
                "truncate text-base font-semibold text-ink",
                done && "line-through",
              )}
            >
              {ex.name}
            </h3>
          </div>
          <p className="mt-1 text-sm font-medium text-primary">{dose}</p>
          <p className="mt-1 text-sm text-muted-foreground">{ex.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">Vila {block.restSeconds} sek</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <ChevronDown
            size={16}
            className={cn("mr-1 transition-transform", open && "rotate-180")}
            aria-hidden
          />
          Visa hur
        </Button>
        {onSwap && (
          <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onSwap}>
            <RefreshCw size={16} className="mr-1" aria-hidden /> Byt övning
          </Button>
        )}
        {onToggleDone && (
          <Button
            type="button"
            variant={done ? "secondary" : "outline"}
            size="sm"
            className="ml-auto rounded-full"
            onClick={onToggleDone}
          >
            <Check size={16} className="mr-1" aria-hidden /> {done ? "Klar" : "Markera klar"}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-3 text-sm text-ink">
          <ul className="list-disc space-y-1 pl-5">
            {ex.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Fokus: {ex.muscles.join(", ")} · Nivå: {ex.difficulty}
          </p>
          {ex.modification && (
            <p className="text-xs text-muted-foreground">Mjukare variant: {ex.modification}</p>
          )}
          {ex.progression && (
            <p className="text-xs text-muted-foreground">Vill du ha mer: {ex.progression}</p>
          )}
          {ex.safety && <p className="text-xs text-muted-foreground">{ex.safety}</p>}
        </div>
      )}
    </article>
  );
}

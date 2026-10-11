import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExerciseVisual from "@/components/workout/exercise-visual";
import { EXERCISES, exerciseById } from "@/lib/exercise-library";
import type { WorkoutBlock } from "@/lib/workout-generator";

export function ManualExercises({
  blocks,
  onChange,
  disabled = false,
}: {
  blocks: WorkoutBlock[];
  onChange: (blocks: WorkoutBlock[]) => void;
  disabled?: boolean;
}) {
  const patch = (index: number, values: Partial<WorkoutBlock>) =>
    onChange(blocks.map((block, i) => (i === index ? { ...block, ...values } : block)));
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-sm font-medium text-ink">Övningar med bilder</legend>
      <label className="block text-sm text-muted-foreground">
        Lägg till en övning
        <select
          disabled={disabled}
          value=""
          className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-ink"
          onChange={(event) => {
            const exercise = exerciseById(event.target.value);
            if (!exercise) return;
            onChange([
              ...blocks,
              {
                exerciseId: exercise.id,
                sets: exercise.defaultSets,
                ...(exercise.measure === "tid"
                  ? { seconds: exercise.defaultSeconds ?? 30 }
                  : { reps: exercise.defaultReps ?? 10 }),
                restSeconds: exercise.role === "huvuddel" ? 30 : 0,
                section: exercise.role,
                sideSplit: exercise.sideSplit,
              },
            ]);
          }}
        >
          <option value="">Välj från bildbiblioteket</option>
          {EXERCISES.filter(
            (exercise) => !blocks.some((block) => block.exerciseId === exercise.id),
          ).map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </label>
      {blocks.map((block, index) => {
        const exercise = exerciseById(block.exerciseId);
        if (!exercise) return null;
        return (
          <div
            key={`${block.exerciseId}-${index}`}
            className="min-w-0 space-y-2 rounded-xl border p-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <ExerciseVisual
                visual={exercise.visual}
                name={exercise.name}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1 break-words text-sm font-medium">
                {exercise.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0 p-0"
                aria-label={`Ta bort ${exercise.name}`}
                onClick={() => onChange(blocks.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))] gap-2">
              <label className="min-w-0 text-xs">
                Set
                <Input
                  aria-label={`Set för ${exercise.name}`}
                  type="number"
                  min={1}
                  max={5}
                  value={block.sets}
                  onChange={(event) =>
                    patch(index, {
                      sets: Math.max(1, Math.min(5, Number(event.target.value) || 1)),
                    })
                  }
                />
              </label>
              <label className="min-w-0 text-xs">
                {block.seconds != null ? "Sekunder" : "Repetitioner"}
                <Input
                  aria-label={`Dos för ${exercise.name}`}
                  type="number"
                  min={1}
                  max={block.seconds != null ? 300 : 40}
                  value={block.seconds ?? block.reps ?? 10}
                  onChange={(event) => {
                    const value = Math.max(
                      1,
                      Math.min(block.seconds != null ? 300 : 40, Number(event.target.value) || 1),
                    );
                    patch(index, block.seconds != null ? { seconds: value } : { reps: value });
                  }}
                />
              </label>
              <label className="min-w-0 text-xs">
                Vila, sek
                <Input
                  aria-label={`Vila för ${exercise.name}`}
                  type="number"
                  min={0}
                  max={180}
                  value={block.restSeconds}
                  onChange={(event) =>
                    patch(index, {
                      restSeconds: Math.max(0, Math.min(180, Number(event.target.value) || 0)),
                    })
                  }
                />
              </label>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

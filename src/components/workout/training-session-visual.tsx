import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/components/workout/exercise-card";
import type { Workout } from "@/lib/workout-generator";

export function TrainingSessionVisual({
  workout,
  onOpen,
}: {
  workout: Workout;
  onOpen?: () => void;
}) {
  return (
    <div className="mt-3 min-w-0 space-y-3">
      {onOpen && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-auto whitespace-normal rounded-xl"
          onClick={onOpen}
        >
          <Play size={16} className="shrink-0" aria-hidden /> Öppna bildpasset
        </Button>
      )}
      <details className="min-w-0">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-primary">
          Visa övningar · {workout.blocks.length}
        </summary>
        <div className="space-y-3">
          {workout.blocks.map((block, index) => (
            <ExerciseCard key={`${block.exerciseId}-${index}`} block={block} index={index} />
          ))}
        </div>
      </details>
    </div>
  );
}

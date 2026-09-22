import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Workout } from "@/lib/workout-generator";

export interface WorkoutLog {
  id: string;
  workoutId: string;
  title: string;
  /** ISO-datum YYYY-MM-DD */
  date: string;
  completedAt: number;
  minutes: number;
  doneExercises: number;
  totalExercises: number;
}

export const SAVED_WORKOUTS_KEY = "myflove-workouts-saved";
export const WORKOUT_LOGS_KEY = "myflove-workout-logs";

/**
 * Mina pass – sparade pass och genomförda pass.
 * Samma molnsynk som resten av appen, ingen ny datamodell utanför detta.
 */
export function useWorkouts() {
  const [saved, setSaved] = useCloudSyncedStorage<Workout[]>(SAVED_WORKOUTS_KEY, []);
  const [logs, setLogs] = useCloudSyncedStorage<WorkoutLog[]>(WORKOUT_LOGS_KEY, []);

  const saveWorkout = useCallback(
    (workout: Workout) => {
      setSaved((prev) => [workout, ...prev.filter((w) => w.id !== workout.id)].slice(0, 30));
    },
    [setSaved],
  );

  const removeWorkout = useCallback(
    (id: string) => setSaved((prev) => prev.filter((w) => w.id !== id)),
    [setSaved],
  );

  const logWorkout = useCallback(
    (workout: Workout, doneExercises: number) => {
      const entry: WorkoutLog = {
        id: `log-${Date.now().toString(36)}`,
        workoutId: workout.id,
        title: workout.title,
        date: new Date().toISOString().slice(0, 10),
        completedAt: Date.now(),
        minutes: workout.minutes,
        doneExercises,
        totalExercises: workout.blocks.length,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));
      return entry;
    },
    [setLogs],
  );

  return { saved, logs, saveWorkout, removeWorkout, logWorkout };
}

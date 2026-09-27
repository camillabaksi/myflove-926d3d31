import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { SAVED_EXERCISES_KEY, type SavedExercise } from "@/lib/saved-exercises";

/** Sparade övningar i Återhämtningsbiblioteket (synkas mellan enheter). */
export function useSavedExercises() {
  const [raw, setRaw] = useCloudSyncedStorage<SavedExercise[]>(SAVED_EXERCISES_KEY, []);
  const exercises = raw ?? [];

  const save = useCallback(
    (ex: SavedExercise) => setRaw((prev) => [ex, ...(prev ?? [])].slice(0, 200)),
    [setRaw],
  );
  const remove = useCallback(
    (id: string) => setRaw((prev) => (prev ?? []).filter((e) => e.id !== id)),
    [setRaw],
  );

  return { exercises, save, remove };
}

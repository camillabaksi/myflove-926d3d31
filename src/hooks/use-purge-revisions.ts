import { useEffect } from "react";
import { useTasks } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";

const REVISION_PREFIX = "studyflow:revision:";

/**
 * Rensar bort gamla automatiska repetitionspass som ligger kvar i listorna
 * från innan de blev ett aktivt val. Körs så länge repetition är avslaget.
 */
export function usePurgeRevisions() {
  const { tasks, deleteTask } = useTasks();
  const { settings } = useStudySchedule();

  useEffect(() => {
    if (settings.includeRevisions) return;
    const stale = tasks.filter(
      (t) =>
        t.syncKey?.startsWith(REVISION_PREFIX) ||
        t.title.startsWith("🃏 Repetition:") ||
        t.title.startsWith("🃏 Lugn genomläsning:"),
    );
    if (!stale.length) return;
    stale.forEach((t) => deleteTask(t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, settings.includeRevisions]);
}

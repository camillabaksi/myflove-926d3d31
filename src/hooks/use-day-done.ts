import { useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useDoneLog } from "@/hooks/use-done-log";
import { useMedications } from "@/hooks/use-data";
import { useTraining } from "@/hooks/use-training";
import { routineOccursOn, type Routine } from "@/pages/routines";
import { medicationOccursOn } from "@/lib/medications";

export interface DayDoneLine {
  emoji: string;
  text: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * "Det här blev gjort idag" – samlar signaler som redan finns i appen
 * (rutiner, medicin, rörelse) så reflektionen inte bara mäter uppgifter.
 */
export function useDayDone(): { lines: DayDoneLine[]; anything: boolean } {
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { isDone } = useDoneLog();
  const { medications, isTaken } = useMedications();
  const { doneToday: sessionsDone, stepsToday, state: trainingState } = useTraining();
  const stepGoal = trainingState.stepGoal;

  return useMemo(() => {
    const today = todayIso();

    const activeRoutines = routines.filter((r) => r.enabled && routineOccursOn(r, today));
    const routinesDone = activeRoutines.filter((routine) => isDone(`routine-${routine.id}`)).length;

    let doses = 0;
    let dosesTaken = 0;
    for (const med of medications) {
      if (!medicationOccursOn(med, today)) continue;
      for (const time of med.times) {
        doses += 1;
        if (isTaken(med.id, time, today)) dosesTaken += 1;
      }
    }

    const lines: DayDoneLine[] = [];
    if (activeRoutines.length > 0) {
      lines.push({
        emoji: "🔁",
        text: `${routinesDone} av ${activeRoutines.length} rutiner`,
      });
    }
    if (doses > 0) {
      lines.push({ emoji: "💊", text: `${dosesTaken} av ${doses} medicintider` });
    }
    if (sessionsDone.length > 0) {
      lines.push({
        emoji: "🏃",
        text: `${sessionsDone.length} ${sessionsDone.length === 1 ? "träningspass" : "träningspass"}`,
      });
    }
    if (stepsToday > 0) {
      lines.push({
        emoji: "👟",
        text: `${stepsToday.toLocaleString("sv-SE")} steg${stepGoal ? ` av ${stepGoal.toLocaleString("sv-SE")}` : ""}`,
      });
    }

    return { lines, anything: lines.length > 0 };
  }, [routines, reminders, isDone, medications, isTaken, sessionsDone.length, stepsToday, stepGoal]);
}

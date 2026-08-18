import { useMemo } from "react";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useSituation } from "@/hooks/use-situation";
import { useWorkProfile } from "@/hooks/use-work-profile";
import { useStudyProfile } from "@/hooks/use-study-profile";
import { getArea } from "@/lib/life-areas";
import { hasWorkProfile, isMeeting, workDemand } from "@/lib/work-profile";
import { hasStudyProfile, isBigAssignment, isExam, studyDemand } from "@/lib/study-profile";
import { resolveSituationPriority, type SituationPriority } from "@/lib/situation-priority";

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * En gemensam prioritering mellan aktiva situationer, så att jobbprofilen
 * och studieprofilen inte ger motstridiga förslag samma dag.
 */
export function useSituationPriority(): SituationPriority {
  const { situation } = useSituation();
  const { activeTasks } = useTasks();
  const { flow, energy } = useFlowScore();
  const { profile: work } = useWorkProfile();
  const { profile: study } = useStudyProfile();

  return useMemo(() => {
    const today = iso();
    const weekEnd = iso(9);

    const jobToday = activeTasks.filter(
      (t) => getArea(t) === "jobb" && (!t.dueDate || t.dueDate === today),
    );
    const studySoon = activeTasks.filter(
      (t) =>
        getArea(t) === "studier" && (!t.dueDate || (t.dueDate >= today && t.dueDate <= weekEnd)),
    );

    return resolveSituationPriority({
      situation,
      workDemand: workDemand({
        meetings: jobToday.filter((t) => isMeeting(t.title)).length,
        jobItems: jobToday.length,
      }),
      studyDemand: studyDemand({
        exams: studySoon.filter((t) => isExam(t.title)).length,
        assignments: studySoon.filter((t) => isBigAssignment(t.title)).length,
      }),
      hasWorkProfile: hasWorkProfile(work) && work.enabled,
      hasStudyProfile: hasStudyProfile(study) && study.enabled,
      energy,
      score: flow.score,
    });
  }, [situation, activeTasks, work, study, energy, flow.score]);
}

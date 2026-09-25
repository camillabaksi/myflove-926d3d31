import { useMemo } from "react";
import { useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { CAPACITY_META } from "@/lib/priority-engine";
import { useChildEvents } from "@/hooks/use-child-events";
import { getArea } from "@/lib/life-areas";
import { isMeeting, workDemand } from "@/lib/work-profile";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { lifeProfileContext } from "@/lib/life-profile";
import { useSituation } from "@/hooks/use-situation";
import { situationContext } from "@/lib/situation";
import { isBigAssignment, isExam, studyDemand } from "@/lib/study-profile";
import {
  buildLifePuzzle,
  emptyAreaLoads,
  lifeContextPrompt,
  type AreaLoad,
  type LifePuzzle,
  type LifePuzzleInput,
} from "@/lib/life-puzzle";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(due: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${due}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

/**
 * Livspusslet: samlar signaler från olika livsområden till en gemensam bild
 * som både hemskärmen och Flow kan utgå ifrån.
 */
export function useLifePuzzle(): {
  puzzle: LifePuzzle;
  input: LifePuzzleInput;
  contextPrompt: string;
} {
  const { activeTasks } = useTasks();
  const { openItems } = useQuickflow();
  const { lectures } = useStudySchedule();
  // FlowScore används bara för belastning/historik – kapaciteten är användarens val.
  const { flow, energy, mood, minutesLeft } = useFlowScore();
  const capacity = useCapacityMode();
  const childEvents = useChildEvents();
  const { profile: lifeProfile } = useLifeProfile();
  const { situation } = useSituation();

  const input = useMemo<LifePuzzleInput>(() => {
    const today = todayISO();
    const byArea = new Map<string, AreaLoad>(emptyAreaLoads().map((a) => [a.area, { ...a }]));

    for (const t of activeTasks) {
      const load = byArea.get(getArea(t));
      if (!load) continue;
      if (!t.dueDate) {
        load.today += 1;
        continue;
      }
      const d = daysUntil(t.dueDate);
      if (d < 0) load.overdue += 1;
      else if (d === 0) load.today += 1;
      else if (d <= 7) load.soon += 1;
      if (load.nextInDays === undefined || d < load.nextInDays) {
        load.nextInDays = d;
        load.nextTitle = t.title;
      }
    }

    // Fasta hållpunkter idag: uppgifter med klockslag + dagens lektioner.
    const weekday = (new Date().getDay() + 6) % 7;
    const events = [
      ...activeTasks
        .filter((t) => t.time && (!t.dueDate || t.dueDate === today))
        .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
        .map((t) => `${t.time} ${t.title}`),
      ...lectures
        .filter((l) => l.weekday === weekday)
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((l) => `${l.start} ${l.title}`),
      // Barnens hållpunkter hör till dagen på samma sätt som mina egna.
      ...childEvents.map((e) => `${e.time} ${e.title} (${e.childName})`),
    ].sort((a, b) => a.localeCompare(b));

    // Jobbets krav idag – så att kvällen inte fylls när arbetsdagen är tung.
    const jobToday = activeTasks.filter(
      (t) => getArea(t) === "jobb" && (!t.dueDate || t.dueDate === today),
    );
    const demand = workDemand({
      meetings: jobToday.filter((t) => isMeeting(t.title)).length,
      jobItems: jobToday.length,
    });

    // Studiernas krav den närmaste veckan.
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 9);
    const weekEndIso = weekEnd.toISOString().slice(0, 10);
    const studySoon = activeTasks.filter(
      (t) =>
        getArea(t) === "studier" && (!t.dueDate || (t.dueDate >= today && t.dueDate <= weekEndIso)),
    );
    const sDemand = studyDemand({
      exams: studySoon.filter((t) => isExam(t.title)).length,
      assignments: studySoon.filter((t) => isBigAssignment(t.title)).length,
    });

    return {
      situationContext: situationContext(situation),
      studyContext: lifeProfileContext(lifeProfile),
      studyDemand: sDemand,
      workContext: "",
      workDemand: demand,
      score: capacity.percent,
      capacityLabel: CAPACITY_META[capacity.mode].label,
      load: flow.load,
      capacityMinutes: capacity.minutes,
      suggestedTasks: capacity.suggestedTasks,
      energy,
      mood,
      minutesLeft,
      openThoughts: openItems.length,
      areas: [...byArea.values()],
      todaysEvents: events,
    };
  }, [
    activeTasks,
    lectures,
    childEvents,
    flow,
    capacity.percent,
    capacity.mode,
    capacity.minutes,
    capacity.suggestedTasks,
    energy,
    mood,
    minutesLeft,
    openItems.length,
    lifeProfile,
    situation,
  ]);

  const puzzle = useMemo(() => buildLifePuzzle(input), [input]);
  const contextPrompt = useMemo(() => lifeContextPrompt(input), [input]);

  return { puzzle, input, contextPrompt };
}

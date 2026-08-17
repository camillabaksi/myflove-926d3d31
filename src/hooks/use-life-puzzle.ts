import { useMemo } from "react";
import { useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useChildEvents } from "@/hooks/use-child-events";
import { getArea } from "@/lib/life-areas";
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
  const { flow, energy, mood, minutesLeft } = useFlowScore();
  const childEvents = useChildEvents();

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

    return {
      score: flow.score,
      load: flow.load,
      capacityMinutes: flow.capacityMinutes,
      suggestedTasks: flow.suggestedTasks,
      energy,
      mood,
      minutesLeft,
      openThoughts: openItems.length,
      areas: [...byArea.values()],
      todaysEvents: events,
    };
  }, [activeTasks, lectures, childEvents, flow, energy, mood, minutesLeft, openItems.length]);

  const puzzle = useMemo(() => buildLifePuzzle(input), [input]);
  const contextPrompt = useMemo(() => lifeContextPrompt(input), [input]);

  return { puzzle, input, contextPrompt };
}

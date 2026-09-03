import { useCallback, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { prioritizeQuickflow } from "@/lib/quickflow-priority.functions";
import { heuristicPriority } from "@/lib/quickflow-priority";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useTasks } from "@/hooks/use-data";
import { dayOf, todayISO } from "@/lib/day";

/**
 * EN prioriteringsmotor för QuickFlow – används av både fånga-dialogen
 * och listvyn så att det aldrig finns parallella QuickFlow-flöden.
 * Tar hänsyn till Mitt batteri men hittar aldrig på tider eller deadlines.
 */
export function useQuickflowPrioritization() {
  const run = useServerFn(prioritizeQuickflow);
  const { reading } = useEnergyBattery();
  const { items: priorityItems, merge, setIntro } = usePriorityList();
  const { tasks, addTask } = useTasks();

  // Prioriteringslistan är bakåtkompatibel lagring, men varje post ska också
  // finnas som samma uppgift i Idag. ID:t återanvänds så ingen textmatchning
  // behövs och ändringar kan synkas i båda riktningarna.
  useEffect(() => {
    const linkedIds = new Set(tasks.map((task) => task.quickflowId));
    priorityItems.forEach((item) => {
      if (linkedIds.has(item.id)) return;
      addTask(item.title, todayISO(), {
        id: item.id,
        quickflowId: item.id,
        quickflowBucket: item.bucket,
        quickflowOrder: item.order,
        completed: item.done,
        completedAt: item.doneAt,
        area: "vardag",
      });
    });
  }, [priorityItems, tasks, addTask]);

  const prioritizeTitles = useCallback(
    async (titles: string[]) => {
      const clean = titles.map((t) => t.trim()).filter(Boolean);
      if (clean.length === 0) return;
      const energyPercent = reading?.now;
      const now = Date.now();
      try {
        const result = await run({ data: { titles: clean, energyPercent } });
        merge(
          result.items.map((it, i) => ({
            id: `${now}-${i}`,
            title: it.title,
            bucket: it.bucket,
            why: it.why,
            order: now + i,
            createdAt: now,
          })),
        );
        setIntro(result.intro);
      } catch {
        merge(heuristicPriority(clean, energyPercent));
        setIntro("Jag sorterade dem så gott jag kunde. Du får gärna ändra ordningen.");
      }
    },
    [run, reading?.now, merge, setIntro],
  );

  return { prioritizeTitles, energyPercent: reading?.now };
}

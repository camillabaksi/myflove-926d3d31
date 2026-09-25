import { useCallback, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { prioritizeQuickflow } from "@/lib/quickflow-priority.functions";
import { heuristicPriority } from "@/lib/quickflow-priority";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useCapacityContext } from "@/hooks/use-capacity-context";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useTasks } from "@/hooks/use-data";
import { dayOf, todayISO } from "@/lib/day";

/**
 * EN prioriteringsmotor för QuickFlow – används av både fånga-dialogen
 * och listvyn så att det aldrig finns parallella QuickFlow-flöden.
 * Tar hänsyn till kapacitetsläget men hittar aldrig på tider eller deadlines.
 */
export function useQuickflowPrioritization() {
  const run = useServerFn(prioritizeQuickflow);
  const { percent } = useCapacityMode();
  const capacityContext = useCapacityContext();
  const { items: priorityItems, merge, setIntro } = usePriorityList();
  const { tasks, addTask, updateTask } = useTasks();

  // Prioriteringslistan är bakåtkompatibel lagring, men varje post ska också
  // finnas som samma uppgift i Idag. ID:t återanvänds så ingen textmatchning
  // behövs och ändringar kan synkas i båda riktningarna.
  //
  // Datumet får ALDRIG bli "idag" bara för att bryggan råkar köra idag. En
  // sak som gjordes i tisdags hör till tisdagen – annars hamnar gamla saker
  // under "Genomfört idag".
  useEffect(() => {
    const linkedIds = new Set(tasks.map((task) => task.quickflowId));
    priorityItems.forEach((item) => {
      const day = item.done
        ? (dayOf(item.doneAt) ?? dayOf(item.createdAt) ?? todayISO())
        : todayISO();
      if (linkedIds.has(item.id)) return;
      addTask(item.title, day, {
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
      const energyPercent = percent;
      const now = Date.now();
      try {
        const result = await run({
          data: { titles: clean, energyPercent, context: capacityContext },
        });
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
    [run, percent, capacityContext, merge, setIntro],
  );

  return { prioritizeTitles, energyPercent: percent };
}

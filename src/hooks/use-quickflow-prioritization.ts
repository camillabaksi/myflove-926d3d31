import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { prioritizeQuickflow } from "@/lib/quickflow-priority.functions";
import { heuristicPriority } from "@/lib/quickflow-priority";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { usePriorityList } from "@/hooks/use-priority-list";

/**
 * EN prioriteringsmotor för QuickFlow – används av både fånga-dialogen
 * och listvyn så att det aldrig finns parallella QuickFlow-flöden.
 * Tar hänsyn till Mitt batteri men hittar aldrig på tider eller deadlines.
 */
export function useQuickflowPrioritization() {
  const run = useServerFn(prioritizeQuickflow);
  const { reading } = useEnergyBattery();
  const { replace, setIntro } = usePriorityList();

  const prioritizeTitles = useCallback(
    async (titles: string[]) => {
      const clean = titles.map((t) => t.trim()).filter(Boolean);
      if (clean.length === 0) return;
      const energyPercent = reading?.now;
      const now = Date.now();
      try {
        const result = await run({ data: { titles: clean, energyPercent } });
        replace(
          result.items.map((it, i) => ({
            id: `${now}-${i}`,
            title: it.title,
            bucket: it.bucket,
            why: it.why,
            order: i,
            createdAt: now,
          })),
        );
        setIntro(result.intro);
      } catch {
        replace(heuristicPriority(clean, energyPercent));
        setIntro("Jag sorterade dem så gott jag kunde. Du får gärna ändra ordningen.");
      }
    },
    [run, reading?.now, replace, setIntro],
  );

  return { prioritizeTitles, energyPercent: reading?.now };
}

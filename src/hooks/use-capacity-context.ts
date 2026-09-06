import { useMemo } from "react";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useCycle } from "@/hooks/use-cycle";
import { impactContext } from "@/lib/impact-checkin";
import { cycleContext } from "@/lib/cycle";

/**
 * Dagens kapacitetskontext – vad användaren själv registrerat som påverkan
 * och (om hen valt det) menscykeln. Används som bakgrund när Flow föreslår
 * dagens prioriteringar. Ingen ny data samlas in, inget diagnostiseras och
 * batteriprocenten ändras aldrig av detta.
 */
export function useCapacityContext(): string | undefined {
  const { impact } = useImpactCheckin();
  const { cycle } = useCycle();

  return useMemo(() => {
    const parts = [impactContext(impact), cycleContext(cycle)].filter(Boolean) as string[];
    return parts.length ? parts.join("\n") : undefined;
  }, [impact, cycle]);
}

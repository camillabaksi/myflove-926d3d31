import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildEnergyPattern,
  EMPTY_ENERGY_PATTERN,
  expectationFor,
  type EnergyExpectation,
  type EnergyPattern,
} from "@/lib/energy-pattern";

/**
 * Ditt eget energimönster över dygnet, byggt på loggarna i Energikartan
 * (senaste 30 dagarna). Används för att göra planen realistisk – aldrig för
 * att säga att en viss tid på dygnet är "dålig".
 */
export function useEnergyPattern(): {
  pattern: EnergyPattern;
  expectation: EnergyExpectation | null;
  loading: boolean;
} {
  const [pattern, setPattern] = useState<EnergyPattern>(EMPTY_ENERGY_PATTERN);
  const [loading, setLoading] = useState(true);
  const [expectation, setExpectation] = useState<EnergyExpectation | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data } = await supabase
          .from("energy_logs")
          .select("level, logged_at")
          .gte("logged_at", since)
          .order("logged_at", { ascending: false })
          .limit(500);
        if (cancelled) return;
        const built = buildEnergyPattern(
          (data ?? []).map((r) => ({ level: r.level as number, loggedAt: r.logged_at as string })),
        );
        setPattern(built);
        setExpectation(expectationFor(built));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Uppdatera förväntan när timmen slår om.
  useEffect(() => {
    const id = setInterval(() => setExpectation(expectationFor(pattern)), 5 * 60_000);
    return () => clearInterval(id);
  }, [pattern]);

  return { pattern, expectation, loading };
}

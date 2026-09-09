import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAnalyticsSessionId, analyticsEnabled } from "@/lib/analytics";
import { claimAnalyticsSessionFn } from "@/lib/analytics-audit.functions";

const CLAIMED_KEY = "myflove-analytics-claimed";

/**
 * Kopplar webbläsarens anonyma statistik-id till det inloggade kontot en gång
 * per enhet. Det gör att interna test kan räknas bort i adminvyn. Ingen
 * händelserad ändras — kopplingen sparas i en separat tabell som bara admin
 * kan läsa.
 */
export function useAnalyticsClaim(): void {
  useEffect(() => {
    let done = false;
    const run = async () => {
      if (done || !analyticsEnabled()) return;
      try {
        if (window.localStorage.getItem(CLAIMED_KEY) === "1") return;
      } catch {
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      done = true;
      try {
        await claimAnalyticsSessionFn({ data: { sessionId: getAnalyticsSessionId() } });
        window.localStorage.setItem(CLAIMED_KEY, "1");
      } catch {
        /* kopplingen är inte kritisk */
      }
    };
    void run();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void run();
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}

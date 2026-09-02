import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoUser, setDemoSession, DEMO_DISPLAY_NAME } from "@/lib/demo-account";
import { seedDemoAccountFn } from "@/lib/demo-seed.functions";

/**
 * Känner igen investerar-/demokontot och ser till att det har exempeldata.
 *
 * Riktiga konton berörs aldrig: seedingen anropas bara när den inloggade
 * användaren är markerad som demokonto, och servern kontrollerar det igen.
 */
export function useDemoAccount(): { isDemo: boolean; label: string } {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true;
    let seedRequested = false;

    const apply = async (user: Parameters<typeof isDemoUser>[0]) => {
      const demo = isDemoUser(user);
      if (!active) return;
      setIsDemo(demo);
      setDemoSession(demo);
      if (!demo || seedRequested) return;
      seedRequested = true;
      try {
        const result = await seedDemoAccountFn();
        // Först vid faktisk påfyllning behöver vyerna läsa om molnvärdena.
        if (result?.seeded && typeof window !== "undefined") window.location.reload();
      } catch {
        // Demoseeding får aldrig blockera inloggningen.
      }
    };

    void supabase.auth.getUser().then(({ data }) => apply(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isDemo, label: DEMO_DISPLAY_NAME };
}

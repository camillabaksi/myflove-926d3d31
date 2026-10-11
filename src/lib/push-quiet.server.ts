import {
  DEFAULT_QUIET_STATE,
  isQuietNow,
  QUIET_MODE_KEY,
  type QuietModeState,
} from "@/lib/quiet-mode";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Cachen lever endast under ett cron-anrop, aldrig mellan användare/sessioner. */
export function createPushQuietChecker(db: SupabaseClient<Database>, now: Date) {
  const cache = new Map<string, Promise<boolean>>();
  return (userId: string): Promise<boolean> => {
    let result = cache.get(userId);
    if (!result) {
      result = (async () => {
        try {
          const { data, error } = await db
            .from("user_kv")
            .select("value")
            .eq("user_id", userId)
            .eq("key", QUIET_MODE_KEY)
            .maybeSingle();
          if (error) throw error;
          const value = data?.value;
          const state =
            value && typeof value === "object" && !Array.isArray(value)
              ? ({ ...DEFAULT_QUIET_STATE, ...value } as QuietModeState)
              : DEFAULT_QUIET_STATE;
          return isQuietNow(state, now);
        } catch (error) {
          // Läsfel betyder att vi inte vet om personen vill vara ostörd.
          // Behåll kön och prova på nästa tick i stället för att skicka ändå.
          console.error("[push] quiet mode lookup failed", error);
          return true;
        }
      })();
      cache.set(userId, result);
    }
    return result;
  };
}

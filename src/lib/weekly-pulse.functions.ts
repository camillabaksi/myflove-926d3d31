import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  pulseActionInput,
  pulseReadInput,
  pulseStatsSchema,
  pulseWeekStart,
  type PulseState,
  type PulseWeekStats,
} from "@/lib/weekly-pulse";

export const getMyWeeklyPulseFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(pulseReadInput)
  .handler(async ({ context, data }): Promise<PulseState> => {
    if (data.expectedUserId !== context.userId)
      throw new Error("Kontot har ändrats. Öppna veckopulsen igen.");
    const weekStart = pulseWeekStart();
    const { data: entry, error } = await context.supabase
      .from("pilot_weekly_pulses")
      .select(
        "week_start, opened_at, dismissed_at, submitted_at, updated_at, revision, overview, relief, burden",
      )
      .eq("user_id", context.userId)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (error) throw new Error("Veckopulsen kunde inte hämtas. Försök igen.");
    return { weekStart, entry };
  });

export const updateMyWeeklyPulseFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(pulseActionInput)
  .handler(async ({ context, data }): Promise<void> => {
    if (data.expectedUserId !== context.userId)
      throw new Error("Kontot har ändrats. Öppna veckopulsen igen.");
    if (data.weekStart !== pulseWeekStart())
      throw new Error("En ny vecka har börjat. Öppna veckopulsen igen.");
    const { error } = await context.supabase.rpc("update_my_weekly_pulse", {
      p_week: data.weekStart,
      p_action: data.action,
      p_revision: data.action === "submit" || data.action === "withdraw" ? data.revision : undefined,
      p_consent: data.action === "submit" && data.consent,
      p_overview: data.action === "submit" ? data.overview : undefined,
      p_relief: data.action === "submit" ? data.relief : undefined,
      p_burden: data.action === "submit" ? data.burden : undefined,
    });
    if (error?.code === "40001")
      throw new Error(
        "Ditt svar har ändrats på en annan enhet. Stäng och öppna formuläret igen innan du sparar.",
      );
    if (error?.code === "22023")
      throw new Error("Veckan eller underlaget har ändrats. Öppna veckopulsen igen.");
    if (error)
      throw new Error(
        "Kunde inte spara. Dina val finns kvar här. Försök igen när du har internet.",
      );
  });

/** The database returns aggregates only and checks the admin role again. */
export const getWeeklyPulseStatsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PulseWeekStats[]> => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) throw new Error("Forbidden");
    const { data, error } = await context.supabase.rpc("get_weekly_pulse_stats");
    if (error) throw new Error("Veckopulsens statistik kunde inte hämtas fullständigt.");
    const result = pulseStatsSchema.parse(data);
    if (
      result.length !== 8 ||
      new Set(result.map((row) => row.week_start)).size !== 8 ||
      !result.some((row) => row.week_start === pulseWeekStart())
    ) {
      throw new Error("Ofullständigt enkätunderlag.");
    }
    return result;
  });

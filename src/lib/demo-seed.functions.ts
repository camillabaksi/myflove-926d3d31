import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isDemoUser } from "@/lib/demo-account";
import { buildDemoSeed, DEMO_SEED_KEY, DEMO_SEED_VERSION } from "@/lib/demo-seed-data";

/**
 * Fyller ENDAST demokontot med syntetisk exempeldata.
 *
 * Säkerhet:
 * - Kräver inloggning (requireSupabaseAuth) och skriver bara för context.userId.
 * - Avbryter direkt om kontot inte är markerat som demokonto i metadata.
 * - Använder användarens egen klient, så RLS gäller precis som vanligt.
 * - Idempotent: en markör i user_kv gör att den bara körs en gång per version.
 */
export const seedDemoAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ seeded: boolean; reason?: string }> => {
    const { supabase, userId } = context;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { seeded: false, reason: "no-user" };
    if (!isDemoUser(userData.user)) return { seeded: false, reason: "not-demo" };

    const { data: marker } = await supabase
      .from("user_kv")
      .select("value")
      .eq("user_id", userId)
      .eq("key", DEMO_SEED_KEY)
      .maybeSingle();

    const seededVersion = Number(
      (marker?.value as { version?: number } | null | undefined)?.version ?? 0,
    );
    if (seededVersion >= DEMO_SEED_VERSION) return { seeded: false, reason: "already-seeded" };

    const seed = buildDemoSeed();

    const rows = Object.entries(seed.kv).map(([key, value]) => ({
      user_id: userId,
      key,
      value: value as never,
    }));

    const { error: kvError } = await supabase
      .from("user_kv")
      .upsert(rows, { onConflict: "user_id,key" });
    if (kvError) throw new Error(kvError.message);

    // Energiloggar: lägg bara till om kontot saknar loggar, så att en omkörning
    // aldrig dubblerar historiken.
    const { count } = await supabase
      .from("energy_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!count) {
      const { error: energyError } = await supabase
        .from("energy_logs")
        .insert(seed.energy.map((e) => ({ ...e, user_id: userId })));
      if (energyError) throw new Error(energyError.message);
    }

    await supabase.from("user_kv").upsert(
      {
        user_id: userId,
        key: DEMO_SEED_KEY,
        value: { version: DEMO_SEED_VERSION, at: new Date().toISOString() } as never,
      },
      { onConflict: "user_id,key" },
    );

    return { seeded: true };
  });

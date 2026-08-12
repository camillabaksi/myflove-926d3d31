import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Subscribe --------------------------------------------------------------

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
});

export const subscribeToPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SubscribeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Unsubscribe ------------------------------------------------------------

const UnsubscribeSchema = z.object({ endpoint: z.string().url() });

export const unsubscribeFromPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UnsubscribeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Send test push ---------------------------------------------------------

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    if (!subs || subs.length === 0) return { sent: 0 };

    const { sendPushTo } = await import("./push.server");
    let sent = 0;
    for (const s of subs) {
      const result = await sendPushTo(s, {
        title: "MyFlove",
        body: "Notiser är på 🌿 Du får dem även när appen är stängd.",
        url: "/hem",
      });
      if (result === "ok") sent++;
    }
    return { sent };
  });

// ---- Sync a scheduled reminder ---------------------------------------------

const ReminderKind = z.enum(["medication", "task", "loop", "weather", "custom"]);
const SyncSchema = z.object({
  clientKey: z.string().min(1).max(200),
  kind: ReminderKind,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  deliverAt: z.string(), // ISO
  url: z.string().optional(),
});

export const syncReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SyncSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("push_reminders").upsert(
      {
        user_id: userId,
        client_key: data.clientKey,
        kind: data.kind,
        title: data.title,
        body: data.body,
        deliver_at: data.deliverAt,
        url: data.url ?? null,
        delivered_at: null,
        canceled_at: null,
      },
      { onConflict: "user_id,client_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CancelSchema = z.object({ clientKey: z.string().min(1) });

export const cancelReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CancelSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_reminders")
      .update({ canceled_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("client_key", data.clientKey)
      .is("delivered_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Preferences ------------------------------------------------------------

const PrefsSchema = z.object({
  medication_enabled: z.boolean().optional(),
  tasks_enabled: z.boolean().optional(),
  loops_enabled: z.boolean().optional(),
  weather_enabled: z.boolean().optional(),
  weather_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  last_lat: z.number().optional(),
  last_lon: z.number().optional(),
  personal_enabled: z.boolean().optional(),
  personal_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  personal_evening_enabled: z.boolean().optional(),
  personal_evening_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  personal_name: z.string().max(40).optional(),
});

export const savePushPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PrefsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_preferences")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPushPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("push_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;

    // Ingen rad ännu – skapa defaults så att cron-jobbet hittar användaren.
    const defaults = {
      user_id: userId,
      medication_enabled: true,
      tasks_enabled: true,
      loops_enabled: true,
      weather_enabled: true,
      weather_time: "07:00",
      personal_enabled: true,
      personal_time: "08:00",
      personal_evening_enabled: false,
      personal_evening_time: "20:30",
    };
    const { data: created } = await supabase
      .from("push_preferences")
      .upsert(defaults, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    return created ?? { ...defaults, last_lat: null, last_lon: null, personal_name: null };
  });

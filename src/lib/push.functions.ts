import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Subscribe --------------------------------------------------------------

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional(),
  /** Accepteras från äldre klienter; webbläsarinformation identifierar inte en enhet. */
  replaceOthers: z.boolean().optional(),
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

    // Flera enheter och domäner kan ha samma userAgent. Behåll dem;
    // döda endpoints städas när pushtjänsten svarar 404/410.
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
      const result = await sendPushTo(
        s,
        {
          title: "Paceable",
          body: "Notiser är på 🌿 Du får dem även när appen är stängd.",
          url: "/idag",
        },
        { userId, source: "test" },
      );
      if (result === "ok") sent++;
    }
    return { sent };
  });

// ---- Status: vilka enheter kan ta emot notiser -----------------------------

/** Returnerar de enheter (endpoints) som kan ta emot notiser för kontot. */
export const getPushStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, last_seen_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return {
      devices: (data ?? []).length,
      endpoints: (data ?? []).map((d) => d.endpoint as string),
    };
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
    const { data: existing, error: readError } = await supabase
      .from("push_reminders")
      .select("title, body, kind, deliver_at, url, canceled_at")
      .eq("user_id", userId)
      .eq("client_key", data.clientKey)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    // Periodisk synk får inte återaktivera ett redan levererat oförändrat utskick.
    if (
      existing &&
      existing.canceled_at === null &&
      existing.title === data.title &&
      existing.body === data.body &&
      existing.kind === data.kind &&
      existing.url === (data.url ?? null) &&
      new Date(existing.deliver_at).getTime() === new Date(data.deliverAt).getTime()
    ) {
      return { ok: true };
    }
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
        sent_endpoints: [],
        processing_token: null,
        processing_until: null,
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

/**
 * Städar bort köade påminnelser som inte längre hör till något aktivt objekt.
 * Används framför allt för medicin: tas en medicin bort (eller finns den inte
 * längre i listan) ska inga gamla notiser fortsätta skickas – även om de
 * schemalades i en tidigare session.
 */
const ReconcileSchema = z.object({
  prefix: z.string().min(1).max(40),
  keepKeys: z.array(z.string().min(1).max(200)).max(2000),
});

export const reconcileReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ReconcileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("push_reminders")
      .select("client_key")
      .eq("user_id", userId)
      .is("delivered_at", null)
      .is("canceled_at", null)
      .like("client_key", `${data.prefix}%`);
    if (error) throw new Error(error.message);

    const keep = new Set(data.keepKeys);
    const stale = (rows ?? []).map((r) => r.client_key).filter((k) => !keep.has(k));
    if (stale.length === 0) return { canceled: 0 };

    const { error: cancelError } = await supabase
      .from("push_reminders")
      .update({ canceled_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("delivered_at", null)
      .in("client_key", stale);
    if (cancelError) throw new Error(cancelError.message);
    return { canceled: stale.length };
  });

// ---- Preferences ------------------------------------------------------------

// Tåligt schema: klienten kan skicka hela raden (med null-värden) utan att
// hela sparningen faller. Null och odefinierat plockas bort innan upsert.
const optTime = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((v) => v.slice(0, 5))
  .nullish();

const PrefsSchema = z
  .object({
    medication_enabled: z.boolean().nullish(),
    tasks_enabled: z.boolean().nullish(),
    loops_enabled: z.boolean().nullish(),
    weather_enabled: z.boolean().nullish(),
    weather_time: optTime,
    last_lat: z.number().nullish(),
    last_lon: z.number().nullish(),
    personal_enabled: z.boolean().nullish(),
    personal_time: optTime,
    personal_evening_enabled: z.boolean().nullish(),
    personal_evening_time: optTime,
    personal_name: z.string().max(40).nullish(),
    wake_enabled: z.boolean().nullish(),
    wake_time: optTime,
    wake_interval_min: z.number().int().min(3).max(30).nullish(),
    wake_max_followups: z.number().int().min(1).max(6).nullish(),
  })
  .transform((obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)),
  );

/** Kvitterar att man är vaken – stoppar dagens uppföljningar direkt. */
export const acknowledgeWake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { localDateKey } = await import("./wake-up");
    const { error } = await supabase
      .from("push_preferences")
      .upsert(
        { user_id: userId, wake_ack_on: localDateKey(), wake_stage: 0 },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
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
      weather_enabled: false,
      weather_time: "07:00",
      personal_enabled: false,
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

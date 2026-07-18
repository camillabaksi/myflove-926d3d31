import { createFileRoute } from "@tanstack/react-router";

// Cron-hit endpoint. Called every ~5 minutes by pg_cron with an `apikey`
// header equal to the Supabase publishable key. We use `supabaseAdmin` to
// scan due reminders across all users, send Web Push, and mark them
// delivered. Weather morning-nudge is generated inline here per user.

export const Route = createFileRoute("/api/public/hooks/push-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPushTo } = await import("@/lib/push.server");

        const now = new Date();
        const nowIso = now.toISOString();

        // 1) Due reminders
        const { data: due, error: dueErr } = await supabaseAdmin
          .from("push_reminders")
          .select("id, user_id, kind, title, body, url")
          .lte("deliver_at", nowIso)
          .is("delivered_at", null)
          .is("canceled_at", null)
          .limit(200);
        if (dueErr) {
          console.error("[push-tick] load reminders", dueErr);
          return Response.json({ ok: false, error: dueErr.message }, { status: 500 });
        }

        let sentCount = 0;
        let goneCount = 0;

        // Group by user for one subs-lookup per user
        const byUser = new Map<string, typeof due>();
        for (const r of due ?? []) {
          if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
          byUser.get(r.user_id)!.push(r);
        }

        for (const [userId, reminders] of byUser.entries()) {
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", userId);
          if (!subs || subs.length === 0) {
            // Still mark delivered so we don't keep scanning them
            await supabaseAdmin
              .from("push_reminders")
              .update({ delivered_at: nowIso })
              .in("id", reminders.map((r) => r.id));
            continue;
          }

          for (const r of reminders) {
            let anyOk = false;
            for (const s of subs) {
              const res = await sendPushTo(s, {
                title: r.title,
                body: r.body,
                url: r.url ?? "/hem",
                tag: `${r.kind}-${r.id}`,
              });
              if (res === "ok") { anyOk = true; sentCount++; }
              if (res === "gone") {
                goneCount++;
                await supabaseAdmin
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", s.endpoint);
              }
            }
            await supabaseAdmin
              .from("push_reminders")
              .update({ delivered_at: nowIso })
              .eq("id", r.id);
            void anyOk;
          }
        }

        // 2) Weather morning nudge (once per user per day, near their weather_time)
        const hh = String(now.getUTCHours()).padStart(2, "0");
        const { data: prefs } = await supabaseAdmin
          .from("push_preferences")
          .select("user_id, weather_enabled, weather_time, last_lat, last_lon, last_weather_check_at")
          .eq("weather_enabled", true);

        for (const p of prefs ?? []) {
          if (p.last_lat == null || p.last_lon == null) continue;
          const [wh] = (p.weather_time ?? "07:00").split(":");
          if (wh !== hh) continue;
          if (p.last_weather_check_at) {
            const last = new Date(p.last_weather_check_at);
            if (last.toDateString() === now.toDateString()) continue;
          }
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.last_lat}&longitude=${p.last_lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
            const wres = await fetch(url);
            if (!wres.ok) continue;
            const wjson = (await wres.json()) as {
              daily?: { precipitation_sum?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[] };
            };
            const rain = wjson.daily?.precipitation_sum?.[0] ?? 0;
            const tmax = wjson.daily?.temperature_2m_max?.[0] ?? 15;
            const tmin = wjson.daily?.temperature_2m_min?.[0] ?? 10;

            let msg: string | null = null;
            if (rain >= 2) msg = "Regn väntas idag – ta med paraply eller regnjacka. ☂️";
            else if (tmin <= 2) msg = "Kallt idag – varma kläder rekommenderas. 🧣";
            else if (tmax >= 26) msg = "Varmt idag – ta med vatten och sol­skydd. ☀️";

            if (msg) {
              const { data: subs } = await supabaseAdmin
                .from("push_subscriptions")
                .select("endpoint, p256dh, auth")
                .eq("user_id", p.user_id);
              for (const s of subs ?? []) {
                const r = await sendPushTo(s, {
                  title: "God morgon 🌿",
                  body: msg,
                  url: "/hem",
                  tag: `weather-${now.toDateString()}`,
                });
                if (r === "ok") sentCount++;
                if (r === "gone") {
                  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
                  goneCount++;
                }
              }
            }
            await supabaseAdmin
              .from("push_preferences")
              .update({ last_weather_check_at: nowIso })
              .eq("user_id", p.user_id);
          } catch (err) {
            console.error("[push-tick] weather", err);
          }
        }

        return Response.json({ ok: true, sent: sentCount, gone: goneCount });
      },
    },
  },
});

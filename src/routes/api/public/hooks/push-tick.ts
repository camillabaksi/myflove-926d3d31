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
          .select("id, user_id, kind, title, body, url, client_key")
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
              .in(
                "id",
                reminders.map((r) => r.id),
              );
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
                itemKey: r.client_key,
              }, { userId, source: `reminder:${r.kind}`, ref: r.client_key });
              if (res === "ok") {
                anyOk = true;
                sentCount++;
              }
              if (res === "gone") {
                goneCount++;
                await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
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
          .select(
            "user_id, weather_enabled, weather_time, last_lat, last_lon, last_weather_check_at",
          )
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
              daily?: {
                precipitation_sum?: number[];
                temperature_2m_max?: number[];
                temperature_2m_min?: number[];
              };
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
                }, { userId: p.user_id, source: "weather" });
                if (r === "ok") sentCount++;
                if (r === "gone") {
                  await supabaseAdmin
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", s.endpoint);
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

        // 3) Personliga puffar (morgon + valfri kväll), i svensk lokaltid
        const { getMorningPush, getEveningPush } = await import("@/lib/personal-push-messages");
        const fmt = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Europe/Stockholm",
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
        const localHour = parts.hour ?? "00";
        const localMinutes = Number(localHour) * 60 + Number(parts.minute ?? "0");
        const localDate = `${parts.year}-${parts.month}-${parts.day}`;
        // Fönster: skicka om vi är på eller strax efter vald tid (0–9 min).
        const isDue = (hhmm: string) => {
          const [h, m] = hhmm.split(":").map(Number);
          const target = (h || 0) * 60 + (m || 0);
          const diff = localMinutes - target;
          return diff >= 0 && diff < 10;
        };

        const { data: personalPrefs } = await supabaseAdmin
          .from("push_preferences")
          .select(
            "user_id, personal_enabled, personal_time, personal_evening_enabled, personal_evening_time, personal_name, last_personal_sent_on",
          )
          .or("personal_enabled.eq.true,personal_evening_enabled.eq.true");

        for (const p of personalPrefs ?? []) {
          const isMorning = !!p.personal_enabled && isDue(p.personal_time ?? "08:00");
          const isEvening =
            !!p.personal_evening_enabled && isDue(p.personal_evening_time ?? "20:30");
          if (!isMorning && !isEvening) continue;

          const slot = isMorning ? `${localDate}-m` : `${localDate}-e`;
          if (p.last_personal_sent_on === slot) continue;

          const seed = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
          const note = isMorning
            ? getMorningPush(p.personal_name, seed)
            : getEveningPush(p.personal_name, seed);

          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", p.user_id);
          for (const s of subs ?? []) {
            const r = await sendPushTo(s, {
              title: note.title,
              body: note.body,
              url: "/hem",
              tag: `personal-${slot}`,
            }, { userId: p.user_id, source: isMorning ? "personal-morning" : "personal-evening" });
            if (r === "ok") sentCount++;
            if (r === "gone") {
              await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
              goneCount++;
            }
          }
          await supabaseAdmin
            .from("push_preferences")
            .update({ last_personal_sent_on: slot })
            .eq("user_id", p.user_id);
        }

        // 4) Morgonstart – envis men mjuk uppföljning för den som snoozar bort alarmet
        const { getWakePush, hhmmToMinutes } = await import("@/lib/wake-up");
        const { data: wakePrefs } = await supabaseAdmin
          .from("push_preferences")
          .select(
            "user_id, wake_enabled, wake_time, wake_interval_min, wake_max_followups, wake_stage, wake_started_on, wake_last_sent_at, wake_ack_on, personal_name",
          )
          .eq("wake_enabled", true);

        for (const p of wakePrefs ?? []) {
          if (p.wake_ack_on === localDate) continue;
          const target = hhmmToMinutes(p.wake_time ?? "07:00");
          const interval = p.wake_interval_min ?? 8;
          const maxFollowups = p.wake_max_followups ?? 4;
          const diff = localMinutes - target;
          if (diff < 0 || diff > interval * (maxFollowups + 1) + 15) continue;

          const freshDay = p.wake_started_on !== localDate;
          const stage = freshDay ? 0 : (p.wake_stage ?? 0);
          if (!freshDay) {
            if (stage > maxFollowups) continue;
            const lastMs = p.wake_last_sent_at ? new Date(p.wake_last_sent_at).getTime() : 0;
            if (now.getTime() - lastMs < interval * 60 * 1000 - 60 * 1000) continue;
          }

          const note = getWakePush(p.personal_name, stage, maxFollowups);
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", p.user_id);
          for (const s of subs ?? []) {
            const r = await sendPushTo(s, {
              title: note.title,
              body: note.body,
              url: "/daglig-rutin",
              tag: `wake-${localDate}`,
              requireInteraction: note.requireInteraction,
              vibrate: note.vibrate,
            }, { userId: p.user_id, source: "wake", ref: `stage-${stage}` });
            if (r === "ok") sentCount++;
            if (r === "gone") {
              await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
              goneCount++;
            }
          }

          await supabaseAdmin
            .from("push_preferences")
            .update({
              wake_started_on: localDate,
              wake_stage: stage + 1,
              wake_last_sent_at: nowIso,
            })
            .eq("user_id", p.user_id);
        }

        return Response.json({ ok: true, sent: sentCount, gone: goneCount });
      },
    },
  },
});

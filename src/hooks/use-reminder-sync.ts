import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useTasks, useMedications } from "@/hooks/use-data";
import { syncReminder, cancelReminder } from "@/lib/push.functions";
import { getCurrentSubscription } from "@/lib/push-client";

// Mirror today's + tomorrow's timed tasks and medications into the server
// so the cron tick can deliver push notifications even when the app is closed.

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function combineDateTime(date: string, time: string): Date | null {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, (mo ?? 1) - 1, d, h, m, 0, 0);
}

export function useReminderSync() {
  const { tasks } = useTasks();
  const { medications, isTaken } = useMedications();
  const syncFn = useServerFn(syncReminder);
  const cancelFn = useServerFn(cancelReminder);
  const lastKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      // Only sync when signed in AND actually subscribed to push
      const { data } = await supabase.auth.getUser();
      if (!alive || !data.user) return;
      const sub = await getCurrentSubscription();
      if (!alive || !sub) return;

      const now = Date.now();
      const dates = [todayIso(0), todayIso(1)];
      const desired = new Map<string, {
        clientKey: string;
        kind: "task" | "medication";
        title: string;
        body: string;
        deliverAt: string;
        url: string;
      }>();

      // Timed tasks
      for (const t of tasks) {
        if (t.completed || !t.time || !t.dueDate) continue;
        if (!dates.includes(t.dueDate)) continue;
        const when = combineDateTime(t.dueDate, t.time);
        if (!when) continue;
        const minsBefore = t.reminderMinutesBefore ?? 0;
        const deliver = new Date(when.getTime() - minsBefore * 60_000);
        if (deliver.getTime() < now + 30_000) continue; // skip past-due
        const key = `task:${t.id}`;
        desired.set(key, {
          clientKey: key,
          kind: "task",
          title: minsBefore > 0 ? `Om ${minsBefore} min: ${t.title}` : t.title,
          body: `Kl ${t.time}${minsBefore > 0 ? ` – kommer snart` : ""}`,
          deliverAt: deliver.toISOString(),
          url: "/hem",
        });
      }

      // Medications (today only – tomorrow's "taken" isn't known yet, we still schedule)
      for (const med of medications) {
        for (const time of med.times) {
          for (const date of dates) {
            const when = combineDateTime(date, time);
            if (!when) continue;
            if (date === dates[0] && isTaken(med.id, time, date)) continue;
            if (when.getTime() < now + 30_000) continue;
            const key = `med:${med.id}:${date}:${time}`;
            desired.set(key, {
              clientKey: key,
              kind: "medication",
              title: `💊 ${med.name}`,
              body: med.dosage ? `${med.dosage} – kl ${time}` : `Dags kl ${time}`,
              deliverAt: when.toISOString(),
              url: "/daglig-rutin",
            });
          }
        }
      }

      // Push all desired
      for (const r of desired.values()) {
        try {
          await syncFn({ data: r });
        } catch (err) {
          console.error("[reminder-sync] sync", r.clientKey, err);
        }
      }

      // Cancel ones we previously scheduled but no longer want
      for (const oldKey of lastKeys.current) {
        if (!desired.has(oldKey)) {
          try {
            await cancelFn({ data: { clientKey: oldKey } });
          } catch (err) {
            console.error("[reminder-sync] cancel", oldKey, err);
          }
        }
      }

      lastKeys.current = new Set(desired.keys());
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Rerun on any change to timed tasks or medications
    JSON.stringify(tasks.map((t) => [t.id, t.completed, t.time, t.dueDate, t.reminderMinutesBefore])),
    JSON.stringify(medications.map((m) => [m.id, m.name, m.dosage, m.times.join(",")])),
  ]);
}

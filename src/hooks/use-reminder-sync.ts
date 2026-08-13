import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useTasks, useMedications, useReminders } from "@/hooks/use-data";
import { syncReminder, cancelReminder } from "@/lib/push.functions";
import { getCurrentSubscription } from "@/lib/push-client";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Routine } from "@/pages/routines";
import { useQuickflow } from "@/hooks/use-quickflow";

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
  const { reminders } = useReminders();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { openItems: quickflowItems } = useQuickflow();
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
      // Timed tasks: today + tomorrow. Medications: daily for 14 days ahead.
      const taskDates = [todayIso(0), todayIso(1)];
      const medDates: string[] = [];
      for (let i = 0; i < 14; i++) medDates.push(todayIso(i));
      const desired = new Map<string, {
        clientKey: string;
        kind: "task" | "medication" | "custom";
        title: string;
        body: string;
        deliverAt: string;
        url: string;
      }>();

      // Timed tasks
      for (const t of tasks) {
        if (t.completed || !t.time || !t.dueDate) continue;
        if (!taskDates.includes(t.dueDate)) continue;
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

      // Smarta deadline-påminnelser (Studier m.fl.): X dagar innan förfallodatum.
      const horizon = todayIso(14);
      for (const t of tasks) {
        if (t.completed || !t.dueDate) continue;
        const leads = t.deadlineLeadDays ?? [];
        if (leads.length === 0) continue;
        const at = t.deadlineReminderTime ?? "09:00";
        for (const lead of leads) {
          const due = new Date(t.dueDate + "T00:00:00");
          due.setDate(due.getDate() - lead);
          const date = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
          if (date > horizon) continue;
          const when = combineDateTime(date, at);
          if (!when) continue;
          if (when.getTime() < now + 30_000) continue;
          const key = `deadline:${t.id}:${lead}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title:
              lead === 0
                ? `📅 Deadline idag: ${t.title}`
                : `📅 ${lead} dag${lead === 1 ? "" : "ar"} kvar: ${t.title}`,
            body:
              lead === 0
                ? "Sista dagen – ett litet steg räcker."
                : `Deadline ${t.dueDate}. Vill du ta ett steg idag?`,
            deliverAt: when.toISOString(),
            url: t.area === "studier" ? "/studyflow" : "/tasks",
          });
        }
      }

      // Medications: daily for the next 14 days so notiser fortsätter komma
      for (const med of medications) {
        for (const time of med.times) {
          for (const date of medDates) {
            const when = combineDateTime(date, time);
            if (!when) continue;
            if (date === medDates[0] && isTaken(med.id, time, date)) continue;
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
      // Calendar reminders: one-off or recurring (daily / weekdays / weekly) for 14 dagar
      const horizonDates: string[] = [];
      for (let i = 0; i < 14; i++) horizonDates.push(todayIso(i));
      for (const r of reminders) {
        if (r.completed || !r.time) continue;
        const repeat = r.repeat ?? "none";
        const occurrences: string[] = [];
        if (repeat === "none") {
          if (horizonDates.includes(r.date)) occurrences.push(r.date);
        } else {
          for (const date of horizonDates) {
            if (date < r.date) continue;
            const d = new Date(date + "T00:00:00");
            const dow = d.getDay(); // 0=Sö,1=Må..6=Lö
            if (repeat === "daily") occurrences.push(date);
            else if (repeat === "weekdays" && dow >= 1 && dow <= 5) occurrences.push(date);
            else if (repeat === "weekly") {
              const start = new Date(r.date + "T00:00:00");
              const diffDays = Math.round((d.getTime() - start.getTime()) / 86_400_000);
              if (diffDays % 7 === 0) occurrences.push(date);
            }
          }
        }
        for (const date of occurrences) {
          const when = combineDateTime(date, r.time);
          if (!when) continue;
          if (when.getTime() < now + 30_000) continue;
          const key = repeat === "none" ? `rem:${r.id}` : `rem:${r.id}:${date}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title: `🔔 ${r.title}`,
            body: `Påminnelse kl ${r.time}`,
            deliverAt: when.toISOString(),
            url: "/kalender",
          });
        }
      }


      // Dagliga rutiner: schemalägg 14 dagar framåt
      for (const routine of routines) {
        if (!routine.enabled || !routine.time) continue;
        for (const date of horizonDates) {
          const when = combineDateTime(date, routine.time);
          if (!when) continue;
          if (when.getTime() < now + 30_000) continue;
          const key = `routine:${routine.id}:${date}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title: `🔁 ${routine.title}`,
            body: `Dags kl ${routine.time}`,
            deliverAt: when.toISOString(),
            url: "/daglig-rutin",
          });
        }
      }

      // Quickflow – "du bad mig komma ihåg". Får aldrig försvinna.
      for (const item of quickflowItems) {
        if (!item.remindAt || item.done) continue;
        if (item.remindAt < now + 30_000) continue;
        const key = `quickflow:${item.id}`;
        desired.set(key, {
          clientKey: key,
          kind: "custom",
          title: "🔔 MyFlove: Du bad mig komma ihåg detta.",
          body: item.text,
          deliverAt: new Date(item.remindAt).toISOString(),
          url: "/hem",
        });
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
    // Rerun on any change to timed tasks, medications, or reminders
    JSON.stringify(tasks.map((t) => [t.id, t.completed, t.time, t.dueDate, t.reminderMinutesBefore, (t.deadlineLeadDays ?? []).join(","), t.deadlineReminderTime])),
    JSON.stringify(medications.map((m) => [m.id, m.name, m.dosage, m.times.join(",")])),
    JSON.stringify(reminders.map((r) => [r.id, r.completed, r.date, r.time, r.repeat])),
    JSON.stringify(routines.map((r) => [r.id, r.title, r.time, r.enabled])),
    JSON.stringify(quickflowItems.map((q) => [q.id, q.text, q.remindAt, q.done])),
  ]);
}

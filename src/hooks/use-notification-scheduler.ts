import { useEffect, useRef } from "react";
import { useTasks, useReminders } from "./use-data";
import { sendPushNotification } from "../lib/push-notifications";
import { todayISO } from "@/lib/day";

/**
 * Kollar varje minut om det finns uppgifter/påminnelser med tid som
 * matchar "nu" (eller minuter-före enligt reminderMinutesBefore) och
 * skickar en desktop-notifikation. Duplicerar aldrig en notis för
 * samma nyckel under samma minut.
 */
export function useNotificationScheduler() {
  const { tasks } = useTasks();
  const { reminders } = useReminders();
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const todayStr = todayISO(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const parseHM = (hm: string): number | null => {
        const parts = hm.split(":");
        if (parts.length < 2) return null;
        const h = parseInt(parts[0]!, 10);
        const m = parseInt(parts[1]!, 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
      };

      // Tasks med tid idag
      for (const t of tasks) {
        if (t.completed || !t.time || t.dueDate !== todayStr) continue;
        const target = parseHM(t.time);
        if (target === null) continue;

        // Ingen notis alls om användaren inte själv bett om påminnelse.
        if (t.reminderMinutesBefore == null) continue;

        if (target === nowMinutes) {
          const key = `task-${t.id}-${todayStr}-start`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(t.title, {
              body: `Dags nu (${t.time})`,
              tag: key,
              itemKey: `task:${t.id}`,
            });
          }
        }
        const remind = t.reminderMinutesBefore;
        if (remind && target - remind === nowMinutes && target !== nowMinutes) {
          const key = `task-${t.id}-${todayStr}-remind`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(t.title, {
              body: `Om ${remind} min kl ${t.time}`,
              tag: key,
              itemKey: `task:${t.id}`,
            });
          }
        }
      }

      // Aktiva påminnelser (ej klara, ej avbokade) – inkl. upprepning och "minuter innan"
      const dow = now.getDay(); // 0=Sö .. 6=Lö
      for (const r of reminders) {
        if (r.completed || r.canceled || !r.time) continue;

        const repeat = r.repeat ?? "none";
        let occursToday = false;
        if (repeat === "none") {
          occursToday = r.date === todayStr;
        } else if (todayStr >= r.date) {
          if (repeat === "daily") occursToday = true;
          else if (repeat === "weekdays") occursToday = dow >= 1 && dow <= 5;
          else if (repeat === "weekly") {
            const start = new Date(r.date + "T00:00:00");
            const today = new Date(todayStr + "T00:00:00");
            const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);
            occursToday = diffDays % 7 === 0;
          }
        }
        if (!occursToday) continue;

        const target = parseHM(r.time);
        if (target === null) continue;

        if (target === nowMinutes) {
          const key = `rem-${r.id}-${todayStr}`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(`🔔 ${r.title}`, {
              body: r.note ? `Kl ${r.time} – ${r.note}` : `Påminnelse kl ${r.time}`,
              tag: key,
              itemKey: `reminder:${r.id}:${todayStr}`,
            });
          }
        }

        const lead = r.remindMinutesBefore;
        if (lead && target - lead === nowMinutes && target !== nowMinutes) {
          const key = `rem-${r.id}-${todayStr}-lead`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(`🔔 Om ${lead} min: ${r.title}`, {
              body: `Kl ${r.time}`,
              tag: key,
              itemKey: `reminder:${r.id}:${todayStr}`,
            });
          }
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tasks, reminders]);
}

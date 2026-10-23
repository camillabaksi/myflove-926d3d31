import { useEffect, useRef } from "react";
import { useTasks, useReminders } from "./use-data";
import { sendPushNotification } from "../lib/push-notifications";
import { todayISO } from "@/lib/day";
import { reminderOccurrencesForDay } from "@/lib/reminder-occurrences";

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

      // Foreground reminders use the same occurrence projection as the
      // calendar and queued native/web reminders. Both instances are retained
      // if one is moved onto an otherwise occupied recurring day.
      for (const r of reminders) {
        if (r.completed || r.canceled) continue;
        for (const occurrence of reminderOccurrencesForDay(r, todayStr)) {
          if (!occurrence.time) continue;
          const target = parseHM(occurrence.time);
          if (target === null) continue;
          const occurrenceKey = `rem-${r.id}-${occurrence.occurrenceDate}`;
          if (target === nowMinutes) {
            const key = `${occurrenceKey}-start`;
            if (!firedRef.current.has(key)) {
              firedRef.current.add(key);
              sendPushNotification(`🔔 ${r.title}`, {
                body: r.note ? `Kl ${occurrence.time} – ${r.note}` : `Påminnelse kl ${occurrence.time}`,
                tag: key,
                itemKey: `reminder:${r.id}:${occurrence.occurrenceDate}`,
              });
            }
          }

          const lead = r.remindMinutesBefore;
          if (lead && target - lead === nowMinutes && target !== nowMinutes) {
            const key = `${occurrenceKey}-lead`;
            if (!firedRef.current.has(key)) {
              firedRef.current.add(key);
              sendPushNotification(`🔔 Om ${lead} min: ${r.title}`, {
                body: `Kl ${occurrence.time}`,
                tag: key,
                itemKey: `reminder:${r.id}:${occurrence.occurrenceDate}`,
              });
            }
          }
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tasks, reminders]);
}

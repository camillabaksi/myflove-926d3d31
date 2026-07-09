import { useEffect, useRef } from 'react';
import { useTasks, useReminders } from './use-data';
import { sendPushNotification, getNotificationPermission } from '../lib/push-notifications';

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
      if (getNotificationPermission() !== 'granted') return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0] as string;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const parseHM = (hm: string): number | null => {
        const parts = hm.split(':');
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

        if (target === nowMinutes) {
          const key = `task-${t.id}-${todayStr}-start`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(t.title, { body: `Dags nu (${t.time})`, tag: key });
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
            });
          }
        }
      }

      // Reminders (kalender-påminnelser) med tid idag
      for (const r of reminders) {
        if (r.completed || !r.time || r.date !== todayStr) continue;
        const target = parseHM(r.time);
        if (target === null) continue;
        if (target === nowMinutes) {
          const key = `rem-${r.id}-${todayStr}`;
          if (!firedRef.current.has(key)) {
            firedRef.current.add(key);
            sendPushNotification(r.title, { body: `Påminnelse kl ${r.time}`, tag: key });
          }
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tasks, reminders]);
}

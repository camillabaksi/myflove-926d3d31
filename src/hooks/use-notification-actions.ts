import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTasks, useReminders, useMedications } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { syncReminder } from "@/lib/push.functions";
import {
  captureActionFromUrl,
  clearNotificationActions,
  readNotificationActions,
  shiftTime,
  SNOOZE_MINUTES,
  type NotificationActionType,
} from "@/lib/notification-actions";

/**
 * Tar emot snabbval från notiser ("Klar" / "Skjut upp 10 min") och utför dem
 * på rätt uppgift, påminnelse eller Quickflow-tanke. Åtgärder som kom in när
 * appen var stängd ligger kvar i kön och körs vid nästa start.
 */
export function useNotificationActions() {
  const { tasks, toggleTask, setTaskTime } = useTasks();
  const { reminders, toggleReminder, updateReminder } = useReminders();
  const {
    items: quickflowItems,
    complete: completeQuickflow,
    snooze: snoozeQuickflow,
  } = useQuickflow();

  // Håll senaste datan i en ref så lyssnaren inte behöver återskapas.
  const stateRef = useRef({
    tasks,
    reminders,
    quickflowItems,
    toggleTask,
    setTaskTime,
    toggleReminder,
    updateReminder,
    completeQuickflow,
    snoozeQuickflow,
  });
  stateRef.current = {
    tasks,
    reminders,
    quickflowItems,
    toggleTask,
    setTaskTime,
    toggleReminder,
    updateReminder,
    completeQuickflow,
    snoozeQuickflow,
  };

  useEffect(() => {
    const apply = (itemKey: string, action: NotificationActionType) => {
      const s = stateRef.current;
      const [kind, id] = itemKey.split(":");
      if (!kind || !id) return;

      if (kind === "task" || kind === "deadline") {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return;
        if (action === "done") {
          if (!task.completed) s.toggleTask(task.id);
          toast.success("Klart ✓", { description: task.title });
        } else {
          if (task.time)
            s.setTaskTime(
              task.id,
              shiftTime(task.time, SNOOZE_MINUTES),
              task.reminderMinutesBefore,
            );
          toast(`Skjuten ${SNOOZE_MINUTES} min`, { description: task.title });
        }
        return;
      }

      if (kind === "reminder") {
        const rem = s.reminders.find((r) => r.id === id);
        if (!rem) return;
        if (action === "done") {
          if (!rem.completed) s.toggleReminder(rem.id);
          toast.success("Klart ✓", { description: rem.title });
        } else {
          if (rem.time) s.updateReminder(rem.id, { time: shiftTime(rem.time, SNOOZE_MINUTES) });
          toast(`Skjuten ${SNOOZE_MINUTES} min`, { description: rem.title });
        }
        return;
      }

      if (kind === "quickflow") {
        const item = s.quickflowItems.find((i) => i.id === id);
        if (!item) return;
        if (action === "done") {
          s.completeQuickflow(item.id);
          toast.success("Klart ✓", { description: item.text });
        } else {
          s.snoozeQuickflow(item.id, Date.now() + SNOOZE_MINUTES * 60_000);
          toast(`Skjuten ${SNOOZE_MINUTES} min`, { description: item.text });
        }
      }
    };

    const drain = () => {
      const queue = readNotificationActions();
      if (queue.length === 0) return;
      clearNotificationActions();
      for (const q of queue) apply(q.itemKey, q.action);
    };

    captureActionFromUrl();
    drain();

    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; itemKey?: string; action?: NotificationActionType }
        | undefined;
      if (!data || data.type !== "myflove-notification-action") return;
      if (!data.itemKey || !data.action) return;
      apply(data.itemKey, data.action);
    };

    navigator.serviceWorker?.addEventListener("message", onMessage);
    const onVisible = () => {
      if (document.visibilityState === "visible") drain();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

import { useEffect, useRef } from "react";
import { useMoods, useTasks, useFocus, useMedications } from "@/hooks/use-data";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { getAchievements } from "@/lib/achievements";
import { sendPushNotification } from "@/lib/push-notifications";

const SEEN_KEY = "myflove-achievements-notified";

/**
 * Bevakar belöningar i bakgrunden och skickar en notis när något nytt låses upp.
 * Belöningarna syns inte längre på hemskärmen – de kommer till dig i stället.
 */
export function useAchievementPush(): void {
  const { moods } = useMoods();
  const { completedTasks } = useTasks();
  const { completedFocusCount } = useFocus();
  const { log } = useMedications();
  const [pomodoroTotalSessions] = useCloudSyncedStorage<number>("myflow-pomodoro-total-sessions", 0);
  const [seen, setSeen] = useCloudSyncedStorage<string[]>(SEEN_KEY, []);
  const initialized = useRef(false);

  const achievements = getAchievements({
    moods,
    completedTasks,
    pomodoroTotalSessions,
    completedFocusCount,
    medicationLogCount: log.length,
  });

  const unlockedIds = achievements.filter((a) => a.unlocked).map((a) => a.id);
  const unlockedKey = unlockedIds.join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Första körningen: bara memorera nuläget, inga notiser för gammalt.
    if (!initialized.current) {
      initialized.current = true;
      const missing = unlockedIds.filter((id) => !seen.includes(id));
      if (seen.length === 0 && missing.length > 0) {
        setSeen(unlockedIds);
        return;
      }
    }

    const fresh = achievements.filter((a) => a.unlocked && !seen.includes(a.id));
    if (fresh.length === 0) return;

    for (const a of fresh) {
      sendPushNotification(`${a.emoji} ${a.title}`, {
        body: `Du klarade något: ${a.description}`,
        tag: `myflove-achievement-${a.id}`,
        silentAlarm: true,
      });
    }
    setSeen([...seen, ...fresh.map((a) => a.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedKey]);
}

import { useEffect, useMemo } from "react";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const KEY = "myflove-visit-days";
const MAX_DAYS = 120;

function todayKey(d = new Date()): string {
  return d.toLocaleDateString("sv-SE");
}

function dayKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return todayKey(d);
}

/**
 * Håller reda på vilka dagar användaren varit inne – utan skam.
 * Vi visar "dagar i rad" och "dagar den här veckan", aldrig missade dagar.
 */
export function useVisitStreak() {
  const [days, setDays] = useCloudSyncedStorage<string[]>(KEY, []);

  useEffect(() => {
    const today = todayKey();
    if (days.includes(today)) return;
    setDays([...days, today].slice(-MAX_DAYS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  return useMemo(() => {
    const set = new Set(days);
    let streak = 0;
    for (let i = 0; i < MAX_DAYS; i++) {
      if (set.has(dayKeyOffset(i))) streak += 1;
      else if (i > 0) break;
      else continue; // idag hunnit inte sparas än – bryt inte streaken
    }
    let thisWeek = 0;
    for (let i = 0; i < 7; i++) if (set.has(dayKeyOffset(i))) thisWeek += 1;
    return { streak, thisWeek, totalDays: set.size };
  }, [days]);
}

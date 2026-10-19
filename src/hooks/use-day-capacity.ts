import { useCallback, useEffect, useState } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { DayEdges } from "@/lib/day-window";
import { dayCapacity } from "@/lib/day-capacity";
import { capacityWithActivityFeedback } from "@/lib/capacity-activity-feedback";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { rhythmAdjustment } from "@/lib/capacity-rhythm";

/** Gemensam kapacitet för Idag, Kalender och Mitt batteri.\n * Kvällsregistrering och separat prognoskurva påverkar inte detta värde.\n * Endast genomförda, uttryckligen energimärkta aktiviteter efter senaste\n * manuella incheckning får justera batteriet.\n */
export function useDayCapacity() {
  const [edges] = useCloudSyncedStorage<DayEdges>("myflove-day-edges", {});
  const { energyEntries: logs } = useQuickCheckin();
  const { entries: factors } = useEnergyFlow();
  const { pattern } = useEnergyPattern();
  const [followRhythm] = useCloudSyncedStorage<boolean>("paceable-follow-energy-rhythm", false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const id = window.setInterval(refresh, 5 * 60_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(id); window.removeEventListener("focus", refresh); };
  }, []);
  return useCallback((date: string) => {
    const baseline = dayCapacity(date, edges, logs);
    const morningTime = Date.parse(edges?.[date]?.morningLoggedAt ?? "");
    const latestLogTime = Math.max(...logs.filter(log => Number.isFinite(log.level)).filter(log => {
      const d = new Date(log.logged_at);
      return !Number.isNaN(d.getTime()) && [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-") === date;
    }).map(log => Date.parse(log.logged_at)), -Infinity);
    const latestManualAt = baseline.source === "morning" ? morningTime : latestLogTime;
    const lastCheckin = Number.isFinite(latestManualAt) ? new Date(latestManualAt).toISOString() : null;
    const reported = capacityWithActivityFeedback(baseline, date, factors, lastCheckin);
    if (!followRhythm || date !== [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-") || reported.percent == null) return reported;
    const delta = rhythmAdjustment(pattern, lastCheckin, now);
    return delta ? { ...reported, percent: Math.max(0, reported.percent + delta) } : reported;
  }, [edges, logs, factors, followRhythm, pattern, now]);
}

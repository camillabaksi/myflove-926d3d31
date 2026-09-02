import { useCallback, useEffect, useMemo, useState } from "react";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";

/** Tre mjuka tidsfönster under dagen. Popupen visas max en gång per fönster. */
export type CheckinSlot = "morgon" | "dag" | "kvall";

export const CHECKIN_WINDOWS: Record<CheckinSlot, { from: number; to: number }> = {
  morgon: { from: 6, to: 11 },
  dag: { from: 11, to: 17 },
  kvall: { from: 17, to: 23 },
};

export function slotForHour(hour: number): CheckinSlot | null {
  if (hour >= 6 && hour < 11) return "morgon";
  if (hour >= 11 && hour < 17) return "dag";
  if (hour >= 17 && hour < 23) return "kvall";
  return null;
}

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

type SeenState = { day: string; slots: Partial<Record<CheckinSlot, true>> };

const inSlot = (ts: number | string, slot: CheckinSlot) => {
  const d = new Date(ts);
  if (d.toDateString() !== new Date().toDateString()) return false;
  const w = CHECKIN_WINDOWS[slot];
  return d.getHours() >= w.from && d.getHours() < w.to;
};

/**
 * Avgör om Flow ska bjuda in till en incheckning just nu.
 * Aldrig tjat: har användaren redan loggat i fönstret – eller hoppat över –
 * så frågar Flow inte igen förrän nästa tidsfönster.
 */
export function useFlowCheckin() {
  const { todayMoods, todayEnergyEntries } = useQuickCheckin();
  const [seen, setSeen] = useCloudSyncedStorage<SeenState>("myflove-flow-checkin-seen", {
    day: dayKey(),
    slots: {},
  });
  const [now, setNow] = useState(() => new Date());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Liten fördröjning så popupen inte krockar med sidans inladdning.
    const t = window.setTimeout(() => setReady(true), 1500);
    const i = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(i);
    };
  }, []);

  const slot = slotForHour(now.getHours());
  const today = dayKey(now);
  const alreadySeen = seen?.day === today && slot ? !!seen.slots?.[slot] : false;

  const alreadyLogged = useMemo(() => {
    if (!slot) return false;
    return (
      todayMoods.some((m) => inSlot(m.date, slot)) ||
      todayEnergyEntries.some((e) => inSlot(e.logged_at, slot))
    );
  }, [slot, todayMoods, todayEnergyEntries]);

  const dismiss = useCallback(() => {
    if (!slot) return;
    setSeen((prev) =>
      prev?.day === today
        ? { day: today, slots: { ...(prev.slots ?? {}), [slot]: true } }
        : { day: today, slots: { [slot]: true } },
    );
  }, [slot, today, setSeen]);

  return {
    slot,
    open: ready && !!slot && !alreadySeen && !alreadyLogged,
    dismiss,
  };
}

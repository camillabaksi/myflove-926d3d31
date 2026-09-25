import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { syncReminder } from "@/lib/push.functions";
import { buildFlowNudges } from "@/lib/flow-nudges";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks } from "@/hooks/use-data";
import { todayISO } from "@/lib/day";
import { useFlowPlan } from "@/hooks/use-flow-plan";

/**
 * Flow hör av sig när det faktiskt behövs.
 *
 * Puffarna läggs i samma påminnelsekö som allt annat (push_reminders), så de
 * kommer fram även när appen är stängd. Nyckeln innehåller datumet – därför
 * kan hooken köra om hur ofta som helst utan att det blir dubbletter.
 */
export function useFlowProactivePush(): void {
  const { energyValue } = useQuickCheckin();
  const { openItems } = useQuickflow();
  const { tasks } = useTasks();
  const sync = useServerFn(syncReminder);
  const sentKeys = useRef<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  const today = todayISO();
  // Samma FlowPlan som Hem och Flow – puffen hittar aldrig på en egen "första sak".
  const flowPlan = useFlowPlan();
  const firstMustDo = flowPlan.order.find((p) => p.priority === 1)?.item.title ?? null;
  const timedTodayCount = tasks.filter(
    (t) => !t.completed && t.dueDate === today && !!t.time,
  ).length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setTick((n) => n + 1);
    const id = window.setInterval(bump, 30 * 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const nudges = buildFlowNudges({
      now: new Date(),
      orkValue10: energyValue,
      openQuickflowCount: openItems.length,
      timedTodayCount,
      capacityMode: flowPlan.mode,
      firstMustDo,
    });

    const run = async () => {
      for (const nudge of nudges) {
        if (sentKeys.current.has(nudge.key)) continue;
        sentKeys.current.add(nudge.key);
        try {
          await sync({
            data: {
              clientKey: nudge.key,
              kind: "custom",
              title: nudge.title,
              body: nudge.body,
              deliverAt: nudge.deliverAt,
              url: nudge.url,
            },
          });
        } catch (err) {
          sentKeys.current.delete(nudge.key);
          console.error("[flow] proaktiv puff misslyckades", err);
        }
      }
    };

    void run();
  }, [energyValue, openItems.length, timedTodayCount, sync, tick, flowPlan.mode, firstMustDo]);
}

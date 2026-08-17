import { useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import DayTimeline, { type TimelineEntry } from "@/components/day-timeline";
import { DailyFocusCard } from "@/components/daily-focus-card";
import { FlowScoreCard } from "@/components/flow-score-card";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useFlowItems } from "@/hooks/use-flow-items";
import { withinCapacity, type FlowItem } from "@/lib/flow-items";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Routine } from "@/pages/routines";
import { CalendarDays, Sun, ListOrdered } from "lucide-react";
import { MyFloveTransition } from "@/components/myflove/motion";

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

/**
 * Min dag – dagens konkreta plan på ett ställe.
 * Återanvänder befintliga kort: hållpunkter, dagens fokus, uppgifter och ork.
 */
export default function MyDay() {
  const today = todayStr();
  const { activeTasks, toggleTask } = useTasks();
  const { activeReminders } = useReminders();
  const { flow, minutesLeft } = useFlowScore();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);

  const todaysTasks = useMemo(
    () => activeTasks.filter((t) => !t.dueDate || t.dueDate <= today),
    [activeTasks, today],
  );

  const entries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [];
    for (const r of activeReminders) {
      if (r.date !== today || !r.time) continue;
      list.push({ id: `rem-${r.id}`, title: r.title, time: r.time, endTime: r.endTime, emoji: "📅" });
    }
    for (const t of todaysTasks) {
      if (!t.time) continue;
      list.push({ id: `task-${t.id}`, title: t.title, time: t.time, endTime: t.endTime, emoji: "✅" });
    }
    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      list.push({ id: `routine-${r.id}`, title: r.title, time: r.time, emoji: "🔁" });
    }
    return list;
  }, [activeReminders, todaysTasks, routines, today]);

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-primary" /> Min dag
          </h1>
          <p className="mt-1 text-muted-foreground">
            Dagens plan i lugn ordning – hållpunkter, en viktig sak och det som får plats.
          </p>
        </header>

        <section className="surface-card p-5">
          <CollapsibleSection
            title="Dagens hållpunkter"
            headingClassName="text-lg font-semibold"
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Sun size={16} className="mt-0.5 shrink-0" />
              Tider som redan är bokade idag.
              <HelpHint label="dagens hållpunkter">
                Här samlas kalenderhändelser, uppgifter med klockslag och dina rutiner.
              </HelpHint>
            </p>
            {entries.length > 0 ? (
              <DayTimeline entries={entries} isToday />
            ) : (
              <p className="text-sm text-muted-foreground">
                Inget bokat idag. Hela dagen är din.
              </p>
            )}
          </CollapsibleSection>
        </section>

        <DailyFocusCard />

        <section className="surface-card p-5">
          <CollapsibleSection
            title="Det som får plats idag"
            headingClassName="text-lg font-semibold"
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Samlat från hela ditt liv – uppgifter, deadlines, lektioner, barnens dag och
              tankar du lagt i Quickflow.
              <HelpHint label="det som får plats">
                MyFlove väljer utifrån din kapacitet just nu. Det som inte får plats försvinner
                inte – det ligger kvar under "Resten kan vänta".
              </HelpHint>
            </p>
            {keep.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Inga uppgifter väntar. Det räcker att bara vara idag. 💙
              </p>
            ) : (
              <ul className="space-y-2">
                {keep.map((item) => (
                  <li key={item.id}>
                    <MyFloveTransition transitionKey={String(item.done)}>
                      <FlowItemCard
                        item={item}
                        {...(item.source === "uppgift"
                          ? { onToggle: (i: FlowItem) => toggleTask(i.id.replace(/^task-/, "")) }
                          : {})}
                      />
                    </MyFloveTransition>
                  </li>
                ))}
              </ul>
            )}
            {rest.length > 0 && (
              <details className="rounded-2xl bg-muted/50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-ink">
                  Resten kan vänta ({rest.length})
                </summary>
                <ul className="mt-3 space-y-2">
                  {rest.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <FlowItemCard item={item} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
            >
              <ListOrdered size={16} /> Se hela listan
            </Link>
          </CollapsibleSection>
        </section>

        <FlowScoreCard flow={flow} minutesLeft={minutesLeft} compact />
      </div>
    </Layout>
  );
}

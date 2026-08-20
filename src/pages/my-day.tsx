import { useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import DayTimeline, { type TimelineEntry } from "@/components/day-timeline";
import EnergyBattery from "@/components/energy-battery";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import { DailyFocusCard } from "@/components/daily-focus-card";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { FlowReplan } from "@/components/flow-replan";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useReplanMode } from "@/hooks/use-replan";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { capacityForMode, shouldOfferReplan } from "@/lib/replan";
import { withinCapacity, type FlowItem } from "@/lib/flow-items";
import { itemCost, minutesToTime } from "@/lib/energy-battery";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Routine } from "@/pages/routines";
import { CalendarDays, ListOrdered, Sparkles } from "lucide-react";
import { MyFloveTransition } from "@/components/myflove/motion";

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

/**
 * Min dag – appens kärna.
 * En lugn vy: dagens tidslinje, batteriet, snabb inmatning och ETT förslag.
 * Allt bygger på befintlig kalender-, uppgifts- och energilogik.
 */
export default function MyDay() {
  const today = todayStr();
  const { activeTasks, toggleTask, addTask } = useTasks();
  const { activeReminders } = useReminders();
  const { flow } = useFlowScore();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { reading, suggestions, items: batteryItems } = useEnergyBattery();

  const todaysTasks = useMemo(
    () => activeTasks.filter((t) => !t.dueDate || t.dueDate <= today),
    [activeTasks, today],
  );

  const entries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [];
    for (const r of activeReminders) {
      if (r.date !== today) continue;
      list.push({
        id: `rem-${r.id}`,
        title: r.title,
        time: r.time ?? "",
        endTime: r.endTime,
        emoji: "📅",
      });
    }
    for (const t of todaysTasks) {
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        time: t.time ?? "",
        endTime: t.endTime,
        emoji: "✅",
      });
    }
    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      list.push({ id: `routine-${r.id}`, title: r.title, time: r.time, emoji: "🔁" });
    }
    return list;
  }, [activeReminders, todaysTasks, routines, today]);

  /** Mycket svag energiton bakom timmarna – samma kurva som batteriet. */
  const energyByHour = useMemo(() => {
    const out: Record<number, number> = {};
    for (const s of reading.slots) {
      const h = Math.floor(s.minutes / 60);
      out[h] = Math.max(out[h] ?? 0, s.level);
    }
    return out;
  }, [reading.slots]);

  /** Dagens energibalans i vanlig svenska – inga tekniska begrepp. */
  const balanceText = useMemo(() => {
    const cost = batteryItems.reduce((sum, i) => sum + Math.min(0, itemCost(i)), 0);
    const gives = batteryItems.reduce((sum, i) => sum + Math.max(0, itemCost(i)), 0);
    if (batteryItems.length === 0) return "Dagen är öppen. Det räcker att bara vara idag. 💙";
    if (reading.overloaded)
      return "Dagen kostar mer än du har kvar just nu. Välj en sak som får vänta.";
    if (cost < -30 && gives < 10)
      return "Flera energikrävande saker ligger nära varandra. Lägg gärna in en paus emellan.";
    if (gives >= Math.abs(cost)) return "Dagen ser återhämtande ut – bra balans mellan krav och ork.";
    return "Din dag ser ganska balanserad ut.";
  }, [batteryItems, reading.overloaded]);

  /** Ett enda förslag – hjälp, inte fler beslut. */
  const suggestion = useMemo(() => {
    if (suggestions.length > 0) return suggestions[0].text;
    if (reading.peak)
      return `Du har bäst fokus ${reading.peak.label}. Spara det tyngsta till dess.`;
    return null;
  }, [suggestions, reading.peak]);

  const handleQuickAdd = (r: QuickAddResult) => {
    addTask(r.title, r.dueDate, {
      time: r.time,
      energyImpact: r.energyImpact,
      friction: r.friction,
    });
  };

  const { today: todaysItems } = useFlowItems();
  const { mode, chosen, setMode } = useReplanMode();
  const { keep, rest } = useMemo(
    () => withinCapacity(todaysItems, capacityForMode(flow, mode)),
    [todaysItems, flow, mode],
  );
  const offerReplan = shouldOfferReplan(flow.score) || chosen;

  return (
    <Layout>
      <div className="space-y-5">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-primary" /> Min dag
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vad som händer, hur mycket ork du har och vad som är nästa steg.
          </p>
        </header>

        {/* 🔋 Batteriet – lugn nivå + riktning, detaljer först vid tryck */}
        <EnergyBattery />

        {/* ✅ Snabb inmatning */}
        <TaskQuickAdd onAdd={handleQuickAdd} />

        {/* 📅 Dagens plan */}
        <section className="surface-card p-5">
          <CollapsibleSection
            title="Dagens plan"
            headingClassName="text-lg font-semibold"
            className="space-y-3"
          >
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              Allt som hör till idag – händelser, uppgifter och rutiner.
              <HelpHint label="dagens plan">
                Tryck på en rad för att ändra tid, text eller ta bort den. Saker utan klockslag
                ligger samlade längst ner.
              </HelpHint>
            </p>
            {entries.length > 0 ? (
              <DayTimeline entries={entries} isToday energyByHour={energyByHour} />
            ) : (
              <p className="text-sm text-muted-foreground">Inget bokat idag. Hela dagen är din.</p>
            )}
            <Link
              href="/kalender"
              className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
            >
              <CalendarDays size={16} /> Öppna kalendern (dag/vecka/månad)
            </Link>
          </CollapsibleSection>
        </section>

        {/* ⚡ Dagens energibalans + ✨ ett förslag */}
        <section className="surface-card space-y-3 p-5">
          <h2 className="text-lg font-semibold text-ink">Dagens energibalans</h2>
          <p className="text-sm text-foreground">{balanceText}</p>
          {reading.peak && (
            <p className="text-xs text-muted-foreground">
              Starkast {reading.peak.label}
              {reading.dip ? ` · lägst ${reading.dip.label}` : ""}
              {reading.peak.startMinutes ? "" : ""}
            </p>
          )}
          {suggestion && (
            <p className="flex items-start gap-2 rounded-2xl bg-secondary/40 px-3 py-2 text-sm text-foreground">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
              {suggestion}
            </p>
          )}
        </section>

        <DailyFocusCard />

        {offerReplan && (
          <FlowReplan
            flow={flow}
            items={todaysItems}
            mode={mode}
            chosen={chosen}
            onChange={setMode}
            keepCount={keep.length}
            restCount={rest.length}
          />
        )}

        <section className="surface-card p-5">
          <CollapsibleSection
            title="Det som får plats idag"
            headingClassName="text-lg font-semibold"
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Samlat från hela ditt liv – uppgifter, deadlines, lektioner, barnens dag och tankar du
              lagt i Quickflow.
              <HelpHint label="det som får plats">
                MyFlove väljer utifrån din kapacitet just nu. Det som inte får plats försvinner inte
                – det ligger kvar under "Resten kan vänta".
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
      </div>
    </Layout>
  );
}

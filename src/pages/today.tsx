import { track } from "@/lib/analytics";
import { useMemo, useEffect, useState } from "react";
import { Link } from "wouter";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import StepSection from "@/components/step-section";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import FlowCompanion from "@/components/flow/flow-companion";
import DayTimeline, { type TimelineEntry } from "@/components/day-timeline";
import EnergyBattery from "@/components/energy-battery";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { FlowReplan } from "@/components/flow-replan";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useReplanMode } from "@/hooks/use-replan";
import { useEnergyBattery } from "@/hooks/use-energy-battery";

import { capacityForMode, shouldOfferReplan } from "@/lib/replan";
import { assessToday, suggestNow } from "@/lib/flow-engine";
import { withinCapacity, type FlowItem } from "@/lib/flow-items";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useDayPlan } from "@/lib/day-plan";
import { todayISO as todayStr } from "@/lib/day";
import { isUntimedActivity } from "@/lib/activity-semantics";
import type { Routine } from "@/lib/recurrence";
import { CalendarDays, ListOrdered, Sparkles, Heart, Waves, ListChecks } from "lucide-react";
import { MyFloveTransition } from "@/components/myflove/motion";

type DayView = "flow" | "lista";

/**
 * ❤️ Idag – appens huvudupplevelse för dagen.
 * Här bor allt som förut låg i "Min dag" och "Daily Flow": batteriet,
 * dagens tidslinje, energiflödet och dagens lista.
 *
 * Två vyer på SAMMA data:
 *  🌊 Flow  – den levande dagen: nu, energi och nästa steg.
 *  📋 Lista – allt som ska göras idag, avbockningsbart.
 */
export function TodayContent() {
  useEffect(() => {
    track("today_viewed", { source: "sida" });
  }, []);

  const today = todayStr();
  const { activeTasks, completedTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { flow } = useFlowScore();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { reading, items: batteryItems } = useEnergyBattery();
  const [view, setView] = useCloudSyncedStorage<DayView>("myflove-today-view", "flow");
  const { plan: dayPlan } = useDayPlan();

  const { todayOpen: todaysItems, todayDone, toggleItem } = useFlowItems();
  const { mode, chosen, setMode } = useReplanMode();
  const { keep, rest } = useMemo(
    () => withinCapacity(todaysItems, capacityForMode(flow, mode)),
    [todaysItems, flow, mode],
  );
  const offerReplan = shouldOfferReplan(flow.score) || chosen;

  const todaysTasks = useMemo(
    () =>
      [...activeTasks, ...completedTasks].filter((task) => !task.dueDate || task.dueDate === today),
    [activeTasks, completedTasks, today],
  );
  const doneActivities = useMemo(
    () => todaysTasks.filter((task) => task.completed && isUntimedActivity(task)),
    [todaysTasks],
  );
  const timedTasks = useMemo(
    () => todaysTasks.filter((task) => !isUntimedActivity(task)),
    [todaysTasks],
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
    for (const t of timedTasks) {
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
  }, [activeReminders, timedTasks, routines, today]);

  /** Mycket svag energiton bakom timmarna – samma kurva som batteriet. */
  const energyByHour = useMemo(() => {
    const out: Record<number, number> = {};
    for (const s of reading.slots) {
      const h = Math.floor(s.minutes / 60);
      out[h] = Math.max(out[h] ?? 0, s.level);
    }
    return out;
  }, [reading.slots]);

  /** Dagens belastning – samma bedömning som Flow → IDAG. */
  const load = useMemo(() => assessToday(reading, batteryItems), [reading, batteryItems]);

  /** Ett enda förslag – samma svar som Flow → NU. */
  const suggestion = useMemo(
    () =>
      suggestNow({
        tasks: activeTasks,
        batteryNow: reading.now,
        peakLabel: reading.peak?.label ?? null,
      }),
    [activeTasks, reading.now, reading.peak],
  );


  // Planerad → genomförd → (frivillig) faktisk energipåverkan.
  // Ingen energi loggas automatiskt; först när användaren svarar i dialogen.
  const [energyItem, setEnergyItem] = useState<FlowItem | null>(null);

  const toggle = (i: FlowItem) => {
    const wasDone = i.done;
    toggleItem(i);
    if (!wasDone && i.completable) setEnergyItem(i);
  };

  return (
    <MyFlovePageGrid area="idag">
      <MyFloveWide>
        <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
          <Heart className="h-7 w-7 text-primary" /> Idag
        </h1>
        <p className="mt-1 text-sm font-medium text-primary">Vad som händer idag</p>
        <p className="mt-0.5 text-muted-foreground">
          Allt som hör till idag – på ett ställe. Vill du ändra ordningen gör du det i Planera.
        </p>
      </MyFloveWide>

      {/* 🌊 Flow / 📋 Lista – två vyer av samma dag */}
      <MyFloveWide
        role="tablist"
        aria-label="Visningsläge för dagen"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-1 rounded-2xl bg-muted/60 p-1"
      >
        {(
          [
            { id: "flow", label: "Flow", icon: Waves },
            { id: "lista", label: "Lista", icon: ListChecks },
          ] as const
        ).map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(v.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-card text-ink shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Icon size={16} /> {v.label}
            </button>
          );
        })}
      </MyFloveWide>

      {/* Steg 1 – hur du mår just nu. Incheckningen bor i Mitt batteri,
            här visas bara statusen som en klickbar sammanfattning. */}
      <StepSection
        step={1}
        className="col-span-full"
        id="idag::steg-mabra"
        title="Så mår du just nu"
        description="Energin styr dagens förslag – öppna Mitt batteri om du vill checka in."
      >
        <EnergyBattery
          href="/mitt-batteri"
          onNavigate={() => track("battery_opened", { source: "idag" })}
        />
        <FlowCompanion stage="mini" />
      </StepSection>

      {view === "flow" ? (
        <>
          {/* Primärt: dagens faktiska arbete, utan krav på klockslag. */}
          <StepSection
            step={2}
            className="col-span-full md:col-span-2 xl:col-span-2"
            id="idag::det-har-gjort"
            title="Det här har du gjort idag"
            description={`Du har gjort ${doneActivities.length} ${doneActivities.length === 1 ? "sak" : "saker"} idag.`}
          >
            {doneActivities.length > 0 ? (
              <ul className="space-y-2">
                {doneActivities.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5"
                  >
                    <span aria-hidden className="text-primary">
                      ✓
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Det du bär och gör får ta plats här.</p>
            )}
          </StepSection>

          {/* Sekundärt: bara sådant som faktiskt har en tid. */}
          <StepSection
            step={3}
            className="col-span-full md:col-span-2 xl:col-span-2"
            id="idag::tider"
            title="Tider idag"
            description="Det tidsbestämda – resten av dagen behöver ingen klocka."
          >
            {entries.length > 0 ? (
              <DayTimeline entries={entries} isToday energyByHour={energyByHour} />
            ) : (
              <p className="text-sm text-muted-foreground">Inga tider idag.</p>
            )}
          </StepSection>

          {/* 📋 Dagens ordning – planen du valt i Planera */}
          {dayPlan && dayPlan.steps.length > 0 && (
            <ExpandableBlock
              title="Dagens ordning"
              subtitle="Planen du valt i Planera"
              icon={ListOrdered}
              tone="lavender"
              area="planera"
              widget
              label="Ordning"
              status={`${dayPlan.steps.length}`}
            >
              {dayPlan.intro && <p className="text-sm text-foreground">{dayPlan.intro}</p>}
              <ol className="space-y-2">
                {dayPlan.steps.map((step, i) => (
                  <li
                    key={`${step.taskId}-${i}`}
                    className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.estimatedMin ? `ca ${step.estimatedMin} min · ` : ""}
                        {step.why}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/flow"
                className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
              >
                <ListOrdered size={16} /> Ändra ordningen i Planera
              </Link>
            </ExpandableBlock>
          )}

          {offerReplan && (
            <FlowReplan
              className="col-span-full md:col-span-2"
              flow={flow}
              items={todaysItems}
              mode={mode}
              chosen={chosen}
              onChange={setMode}
              keepCount={keep.length}
              restCount={rest.length}
            />
          )}

          {/* Steg 4 – Nu → Nästa → Senare */}
          <StepSection
            step={4}
            className="col-span-full md:col-span-2 xl:col-span-2"
            id="idag::steg-far-plats"
            title="Det som får plats idag"
            help={
              'MyFlove väljer utifrån din kapacitet just nu. Det som inte får plats försvinner inte – det ligger kvar under "Resten kan vänta".'
            }
          >
            <p className="text-sm text-muted-foreground">
              Samlat från hela ditt liv – uppgifter, deadlines, lektioner, barnens dag och tankar du
              lagt i Quickflow.
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
                        {...(item.completable ? { onToggle: toggle } : {})}
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
                      <FlowItemCard
                        item={item}
                        {...(item.completable ? { onToggle: toggle } : {})}
                      />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </StepSection>

          {/* Extra – energibalans och ett förslag, hopfällt tills du vill se det */}
          <StepSection
            step={5}
            id="idag::steg-energibalans"
            title="Dagens energibalans"
            description="Hur dagen belastar dig – och ett förslag från Flow."
            defaultCollapsed
          >
            <p className="text-sm text-foreground">{load.summary}</p>
            {reading.peak && (
              <p className="text-xs text-muted-foreground">
                Starkast {reading.peak.label}
                {reading.dip ? ` · lägst ${reading.dip.label}` : ""}
              </p>
            )}
            <div className="flex items-start gap-2 rounded-2xl bg-secondary/40 px-3 py-2 text-sm text-foreground">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
              <p>
                {suggestion.headline}
                {suggestion.task ? ` Börja gärna med "${suggestion.task.title}".` : ""}{" "}
                <Link href="/flow" className="text-primary underline-offset-2 hover:underline">
                  Öppna Flow
                </Link>
              </p>
            </div>
          </StepSection>
        </>
      ) : (
        <StepSection
          step={2}
          className="col-span-full md:col-span-2 xl:col-span-2"
          id="idag::steg-lista"
          title="Dagens lista"
        >
          <p className="text-sm text-muted-foreground">
            Samma dag, samma aktiviteter – även sådant som inte behöver en tid.
          </p>
          <ul className="space-y-2">
            {[...todaysItems, ...todayDone].map((item) => (
              <li key={item.id}>
                <MyFloveTransition transitionKey={String(item.done)}>
                  <FlowItemCard item={item} {...(item.completable ? { onToggle: toggle } : {})} />
                </MyFloveTransition>
              </li>
            ))}
          </ul>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
          >
            <ListOrdered size={16} /> Öppna alla uppgifter
          </Link>
        </StepSection>
      )}
      <ActivityEnergyPrompt item={energyItem} onClose={() => setEnergyItem(null)} />
    </MyFlovePageGrid>
  );
}

/** ☑️ Genomfört idag – samma lista i båda vyerna, går att minimera. */
function DoneToday({ items, onToggle }: { items: FlowItem[]; onToggle: (i: FlowItem) => void }) {
  if (items.length === 0) return null;
  return (
    <MyFloveBlock
      title={`Genomfört idag · ${items.length}`}
      subtitle="Det du redan hunnit med"
      collapsible
      collapseId="idag::genomfort-idag"
      defaultCollapsed
      tone="mint"
      surface="mint"
    >
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <FlowItemCard item={item} className="opacity-80" onToggle={onToggle} />
          </li>
        ))}
      </ul>
    </MyFloveBlock>
  );
}

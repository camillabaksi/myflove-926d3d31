import { useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import DayTimeline, { type TimelineEntry } from "@/components/day-timeline";
import EnergyBattery from "@/components/energy-battery";
import QuickCheckin from "@/components/quick-checkin";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import DidThisQuickAdd from "@/components/did-this-quick-add";
import DayEnergyFlow from "@/components/day-energy-flow";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { FlowReplan } from "@/components/flow-replan";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useReplanMode } from "@/hooks/use-replan";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useLocalStorage } from "@/lib/storage";
import { capacityForMode, shouldOfferReplan } from "@/lib/replan";
import { assessToday, suggestNow } from "@/lib/flow-engine";
import { withinCapacity, type FlowItem } from "@/lib/flow-items";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useDayPlan } from "@/lib/day-plan";
import type { Routine } from "@/pages/routines";
import { CalendarDays, ListOrdered, Sparkles, Heart, Waves, ListChecks } from "lucide-react";
import { MyFloveTransition } from "@/components/myflove/motion";

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

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
export default function TodayPage() {
  const today = todayStr();
  const { activeTasks, addTask } = useTasks();
  const { activeReminders } = useReminders();
  const { flow } = useFlowScore();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { reading, items: batteryItems } = useEnergyBattery();
  const [view, setView] = useLocalStorage<DayView>("myflove-today-view", "flow");
  const { plan: dayPlan } = useDayPlan();

  const { todayOpen: todaysItems, todayDone, toggleItem } = useFlowItems();
  const { mode, chosen, setMode } = useReplanMode();
  const { keep, rest } = useMemo(
    () => withinCapacity(todaysItems, capacityForMode(flow, mode)),
    [todaysItems, flow, mode],
  );
  const offerReplan = shouldOfferReplan(flow.score) || chosen;

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

  const handleQuickAdd = (r: QuickAddResult) => {
    addTask(r.title, r.dueDate, {
      time: r.time,
      energyImpact: r.energyImpact,
      friction: r.friction,
    });
  };

  const toggle = (i: FlowItem) => toggleItem(i);

  return (
    <Layout>
      <div className="space-y-5">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <Heart className="h-7 w-7 text-primary" /> Min dag
          </h1>
          <p className="mt-1 text-muted-foreground">
            Allt som hör till idag – på ett ställe. Välj hur du vill se det.
          </p>
        </header>

        {/* 🌊 Flow / 📋 Lista – två vyer av samma dag */}
        <div
          role="tablist"
          aria-label="Visningsläge för dagen"
          className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1"
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
                  active ? "bg-card text-ink shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Icon size={16} /> {v.label}
              </button>
            );
          })}
        </div>

        {/* ❤️ Snabb registrering – samma värden som på Hem */}
        <QuickCheckin />

        {/* 🔋 Batteriet – gemensamt för båda vyerna */}
        <EnergyBattery />

        {/* ✅ Snabb inmatning */}
        <TaskQuickAdd onAdd={handleQuickAdd} />

        {view === "flow" ? (
          <>
            {/* 🏠 Lägg till det du gjorde – vardagen som kalendern missar */}
            <DidThisQuickAdd />

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
                  <p className="text-sm text-muted-foreground">
                    Inget bokat idag. Hela dagen är din.
                  </p>
                )}
                <Link
                  href="/kalender"
                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
                >
                  <CalendarDays size={16} /> Öppna kalendern (dag/vecka/månad)
                </Link>
              </CollapsibleSection>
            </section>

            {/* ⚡ Dagens energibalans + ✨ ett förslag (från Flow-motorn) */}
            <section className="surface-card space-y-3 p-5">
              <CollapsibleSection
                title="Dagens energibalans"
                headingClassName="text-lg font-semibold"
                className="space-y-3"
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
              </CollapsibleSection>
            </section>

            {/* 📋 Dagens ordning – planen du valt i Planera */}
            {dayPlan && dayPlan.steps.length > 0 && (
              <section className="surface-card space-y-3 p-5">
                <CollapsibleSection
                  id="idag::dagens-ordning"
                  title={
                    <span className="flex items-center gap-2">
                      <ListOrdered size={18} className="text-primary" aria-hidden="true" /> Dagens
                      ordning
                    </span>
                  }
                  headingClassName="text-lg font-semibold"
                  className="space-y-3"
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
                </CollapsibleSection>
              </section>
            )}

            <DayEnergyFlow />


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

            {/* Nu → Nästa → Senare, samma data och samma avbockning som listan */}
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
                <DoneToday items={todayDone} onToggle={toggle} />
              </CollapsibleSection>
            </section>
          </>
        ) : (
          <section className="surface-card space-y-3 p-5">
            <CollapsibleSection
              title="Dagens lista"
              headingClassName="text-lg font-semibold"
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Allt som ska hända eller göras idag. Bocka av direkt här – statusen är densamma i
                Flow, på Hem och i Att göra.
              </p>
              {todaysItems.length === 0 ? (
                <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                  {todayDone.length > 0
                    ? "Allt som hörde till idag är genomfört. Fint jobbat. 💙"
                    : "Inget på listan idag. Släpp en tanke i QuickFlow så landar den här."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {todaysItems.map((item) => (
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
              <DoneToday items={todayDone} onToggle={toggle} />
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
              >
                <ListOrdered size={16} /> Öppna hela Att göra (även kommande dagar)
              </Link>
            </CollapsibleSection>
          </section>
        )}
      </div>
    </Layout>
  );
}

/** ☑️ Genomfört idag – samma lista i båda vyerna, går att minimera. */
function DoneToday({ items, onToggle }: { items: FlowItem[]; onToggle: (i: FlowItem) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl bg-secondary/30 p-3">
      <CollapsibleSection
        id="idag::genomfort-idag"
        title={`☑️ ${items.length} ${items.length === 1 ? "sak" : "saker"} genomförda idag 💙`}
        headingClassName="text-sm font-medium text-ink"
        className="space-y-3"
        defaultCollapsed
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <FlowItemCard item={item} className="opacity-80" onToggle={onToggle} />
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}

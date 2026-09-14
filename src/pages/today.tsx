import { track } from "@/lib/analytics";
import { useMemo, useEffect, useState } from "react";
import { Link } from "wouter";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import EnergyBattery from "@/components/energy-battery";
import DailyFlowList from "@/components/day/daily-flow-list";
import { FlowReplan } from "@/components/flow-replan";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useReplanMode } from "@/hooks/use-replan";
import { useEnergyBattery } from "@/hooks/use-energy-battery";

import { capacityForMode, shouldOfferReplan } from "@/lib/replan";
import { assessToday } from "@/lib/flow-engine";
import { withinCapacity, type FlowItem } from "@/lib/flow-items";
import { useDayPlan } from "@/lib/day-plan";
import { todayISO as todayStr } from "@/lib/day";
import { Bell, CalendarDays, Heart, ListOrdered, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";

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
  const { t } = useLang();
  useEffect(() => {
    track("today_viewed", { source: "sida" });
  }, []);

  const today = todayStr();
  const { flow } = useFlowScore();
  const { reading, items: batteryItems } = useEnergyBattery();
  const { plan: dayPlan } = useDayPlan();

  const { today: todaysItems } = useFlowItems();
  const { mode, chosen, setMode } = useReplanMode();
  const { keep, rest } = useMemo(
    () => withinCapacity(todaysItems.filter((item) => !item.done), capacityForMode(flow, mode)),
    [todaysItems, flow, mode],
  );
  const offerReplan = shouldOfferReplan(flow.score) || chosen;

  /** Dagens belastning – samma bedömning som Flow → IDAG. */
  const load = useMemo(() => assessToday(reading, batteryItems), [reading, batteryItems]);

  const [energyItem, setEnergyItem] = useState<FlowItem | null>(null);
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
  });

  return (
    <MyFlovePageGrid area="idag">
      <MyFloveWide>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
          <Heart className="h-7 w-7 text-primary" /> {t("Idag")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("Vad händer idag och vad behöver du göra?")}</p>
      </MyFloveWide>

      <MyFloveWide>
        <section className="rounded-3xl border-2 border-border/60 bg-card px-4 py-4 shadow-soft sm:px-5">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <p className="font-display text-xl font-bold capitalize text-ink">{dateLabel}</p>
              <p className="text-xs text-muted-foreground">
                {todaysItems.length} {todaysItems.length === 1 ? t("punkt") : t("punkter")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/lagg-till"><Plus size={15} /> {t("Lägg till")}</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/paminnelser"><Bell size={15} /> {t("Påminnelse")}</Link>
              </Button>
            </div>
          </header>
          <DailyFlowList onCompleted={setEnergyItem} />
        </section>
      </MyFloveWide>

      <MyFloveWide>
        <CollapsibleSection
          id="today-support"
          defaultCollapsed
          title={t("Planering och energi")}
          description={t("Öppna om du vill se batteriet, dagens ordning eller planera om.")}
          className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
          headingClassName="text-base font-semibold text-ink"
        >
          <div className="space-y-4 pt-2">
            <EnergyBattery
              href="/mitt-batteri"
              onNavigate={() => track("battery_opened", { source: "idag" })}
            />
            {dayPlan && dayPlan.steps.length > 0 && (
              <div className="rounded-2xl bg-secondary/30 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <ListOrdered size={16} className="text-primary" /> {t("Dagens ordning")}
                </p>
                <ol className="space-y-1.5 text-sm text-foreground">
                  {dayPlan.steps.map((step, index) => (
                    <li key={`${step.taskId}-${index}`}>{index + 1}. {step.title}</li>
                  ))}
                </ol>
              </div>
            )}
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
            <div className="rounded-2xl bg-secondary/30 p-4 text-sm text-foreground">
              <p>{load.summary}</p>
              <Link href="/flow" className="mt-2 inline-flex items-center gap-2 text-primary hover:underline">
                <CalendarDays size={15} /> {t("Öppna Flow för mer stöd")}
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      </MyFloveWide>
      <ActivityEnergyPrompt item={energyItem} onClose={() => setEnergyItem(null)} />
    </MyFlovePageGrid>
  );
}

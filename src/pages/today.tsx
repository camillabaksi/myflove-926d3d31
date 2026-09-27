import { CopyDayButton } from "@/components/day/copy-day-dialog";
import { track } from "@/lib/analytics";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import EnergyBattery from "@/components/energy-battery";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useEnergyBattery } from "@/hooks/use-energy-battery";

import { assessToday } from "@/lib/flow-engine";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { CAPACITY_META } from "@/lib/priority-engine";
import { todayISO as todayStr } from "@/lib/day";
import { Bell, CalendarDays, Heart, ListOrdered, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import QuickAddSheet from "@/components/quick-add-sheet";
import JourneySteps from "@/components/journey/journey-steps";
import NextStepCard from "@/components/journey/next-step-card";
import WeekReviewCard from "@/components/week-review-card";
import { useWeekReview } from "@/hooks/use-activity-history";
import { weekStartISO } from "@/lib/week-review";
import { parseISODate } from "@/lib/day";

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
  const [addOpen, setAddOpen] = useState(false);
  useEffect(() => {
    track("today_viewed", { source: "sida" });
  }, []);

  const today = todayStr();
  const isSunday = parseISODate(today).getDay() === 0;
  const weekReview = useWeekReview(weekStartISO(today));
  const { reading, items: batteryItems } = useEnergyBattery();

  const { today: todaysItems } = useFlowItems();
  // Hur mycket som ryms avgörs av FlowPlan (prioritet + kapacitetsläge) –
  // inte av FlowScore eller batteriet.
  const flowPlan = useFlowPlan();
  const capacity = useCapacityMode();

  /** Dagens belastning – samma bedömning som Flow → IDAG. */
  const load = useMemo(() => assessToday(reading, batteryItems), [reading, batteryItems]);

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
  });

  return (
    <MyFlovePageGrid area="idag">
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <MyFloveWide>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
          <Heart className="h-7 w-7 text-primary" /> {t("Idag")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Vad händer idag och vad behöver du göra?")}
        </p>
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
                <Link href="/lagg-till">
                  <Plus size={15} /> {t("Lägg till")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/paminnelser">
                  <Bell size={15} /> {t("Påminnelse")}
                </Link>
              </Button>
              <CopyDayButton date={today} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm font-medium hover:bg-secondary/50" />
            </div>
          </header>
          <div className="pt-3">
             <FamilyDayPerspectives myDay={<DailyFlowList dayHeadings />} />
          </div>
        </section>
      </MyFloveWide>

      <MyFloveWide>
        <CollapsibleSection
          id="today-day-deep-dive"
          title={t("Din dag – när du vill fördjupa")}
          description={t("Se dagens steg och nästa rimliga sak.")}
          defaultCollapsed
          className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
          headingClassName="text-base font-semibold text-ink"
        >
          <div className="space-y-4">
            <JourneySteps onAddOpen={() => setAddOpen(true)} />
            <NextStepCard />
            {isSunday && <WeekReviewCard review={weekReview} />}
          </div>
        </CollapsibleSection>
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
            <div className="rounded-2xl bg-secondary/30 p-4">
              <p className="text-sm font-semibold text-ink">
                {CAPACITY_META[capacity.mode].dot} {t("Dagens kapacitet")}: {t(CAPACITY_META[capacity.mode].label)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t(CAPACITY_META[capacity.mode].meaning)}</p>
            </div>
            {flowPlan.order.length > 0 && (
              <div className="rounded-2xl bg-secondary/30 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <ListOrdered size={16} className="text-primary" /> {t("Dagens ordning")}
                </p>
                <ol className="space-y-1.5 text-sm text-foreground">
                  {(capacity.mode === "lagt" ? flowPlan.order.slice(0, 1) : flowPlan.order).map((step, index) => (
                    <li key={step.item.id}>
                      {index === 0 ? `${t("Nu")}: ` : `${t("Sedan")}: `}{step.item.title}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="rounded-2xl bg-secondary/30 p-4 text-sm text-foreground">
              <p>{load.summary}</p>
              <Link
                href="/flow"
                className="mt-2 inline-flex items-center gap-2 text-primary hover:underline"
              >
                <CalendarDays size={15} /> {t("Öppna Flow för mer stöd")}
              </Link>
            </div>
          </div>
        </CollapsibleSection>
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

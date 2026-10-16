import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Bell, Plus } from "lucide-react";
import IntroTour from "@/components/intro-tour";
import { CopyDayButton } from "@/components/day/copy-day-dialog";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import { GreetingNameMenu } from "@/components/day/greeting-name-menu";
import { DayGreeting } from "@/components/day/day-greeting";
import { TodayCapacity } from "@/components/day/today-capacity";
import { TodayPace } from "@/components/day/today-pace";
import { DayReplanButton } from "@/components/day/day-replan";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import QuickAddSheet from "@/components/quick-add-sheet";
import { Button } from "@/components/ui/button";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useLang } from "@/hooks/use-language";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { applyFamilyPresence, DEFAULT_FAMILY_LAYER, type FamilyLayerPreferences } from "@/lib/family-calendar";
import { deriveDayPace } from "@/lib/day-pace";
import { todayISO } from "@/lib/day";
import { dateHeadingLabel } from "@/lib/date-presentation";
import { useTextLayout } from "@/hooks/use-text-layout";
import { track } from "@/lib/analytics";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import WeeklyPulse from "@/components/weekly-pulse";

/** Primär dagsupplevelse: faktisk Capacity, egen dag och en transparent Pace. */
export function TodayContent() {
  const textLayout = useTextLayout();
  const { t, locale } = useLang();
  const { name, hasChosenName, saveName } = useUserProfile();
  const [addOpen, setAddOpen] = useState(false);
  useEffect(() => {
    track("today_viewed", { source: "sida" });
  }, []);

  const today = todayISO();
  const dates = useMemo(() => [today], [today]);
  const { days, planningReady, planningError } = useVisualCalendar(dates);
  const [familyPreferences] = useCloudSyncedStorage<FamilyLayerPreferences>("myflove-calendar-family-layer", DEFAULT_FAMILY_LAYER);
  const capacityOf = useDayCapacity();
  const dayCapacity = capacityOf(today);
  const calendarEntries = applyFamilyPresence(days[today] ?? [], familyPreferences);
  const pace = deriveDayPace({ date: today, today, capacity: dayCapacity.percent, entries: calendarEntries });
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <MyFlovePageGrid area="idag" className={`pace-today-desktop${textLayout.enlarged ? " pace-text-enlarged" : ""}`}>
      <span ref={textLayout.ref} className="pace-text-probe" aria-hidden="true" />
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <IntroTour />
      <MyFloveWide>
        <DayGreeting
          tagline={t("Din dag, i din takt")}
          greeting={t("Hej")}
          name={name}
          date={dateHeadingLabel(dateLabel, locale)}
          action={<GreetingNameMenu name={hasChosenName ? name : ""} onSave={saveName} />}
        />
        <div className="pace-today-capacity mt-5"><TodayCapacity percent={dayCapacity.percent} /></div>
      </MyFloveWide>

      <MyFloveWide>
        <section className="pt-4" aria-labelledby="your-day-title">
          <header className="flex flex-wrap items-end justify-between gap-3 pb-2">
            <div>
              <h2 id="your-day-title" className="pace-editorial pace-editorial-section text-2xl text-ink">{t("Din dag")}</h2>
            </div>
            <div className="pace-today-actions flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <Button asChild size="sm" className="pace-today-action relative h-auto min-h-9 gap-1.5 rounded-full px-3 py-1.5 text-sm after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']">
                <Link href="/lagg-till">
                  <Plus size={16} aria-hidden /> {t("Lägg till")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="pace-today-action relative h-auto min-h-9 gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-ink after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']">
                <Link href="/paminnelser">
                  <Bell size={16} aria-hidden /> {t("Påminnelse")}
                </Link>
              </Button>
              <CopyDayButton date={today} className="pace-today-action relative inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-ink after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']" />
            </div>
          </header>
          <div className="pt-2">
            <DayReplanButton date={today} entries={calendarEntries} capacity={dayCapacity.percent} calendarReady={planningReady} calendarError={planningError} />
            <FamilyDayPerspectives defaultPerspective="me" myDay={<DailyFlowList dayHeadings presentation="integrated" includeChildSchedules={false} />} />
            <div className="mt-1 flex justify-end">
              <Button asChild size="sm" variant="ghost" className="min-h-10 gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-ink">
                <Link href="/flowplan?day=tomorrow">
                  {t("Planera morgondagen")} <ArrowRight size={16} aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </MyFloveWide>

      <MyFloveWide className="pace-today-pace pt-4">
        <TodayPace pace={pace} />
      </MyFloveWide>
      <MyFloveWide className="pt-4">
        <WeeklyPulse />
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

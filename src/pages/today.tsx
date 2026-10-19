import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Link as RouterLink } from "@tanstack/react-router";
import { Bell, CalendarDays, Plus } from "lucide-react";
import IntroTour from "@/components/intro-tour";
import { CopyDayButton } from "@/components/day/copy-day-dialog";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import { GreetingNameMenu } from "@/components/day/greeting-name-menu";
import { DayGreeting } from "@/components/day/day-greeting";
import { TodayCapacity } from "@/components/day/today-capacity";
import { TodayPace } from "@/components/day/today-pace";
import { DayReplanButton } from "@/components/day/day-replan";
import { PlanningEntry } from "@/components/day/planning-workspace";
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
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    const interval = window.setInterval(updateHour, 60_000);
    window.addEventListener("focus", updateHour);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", updateHour); };
  }, []);
  const greeting = hour >= 5 && hour < 10 ? "God morgon" : hour >= 10 && hour < 17 ? "Hej igen" : hour >= 17 && hour < 22 ? "God kväll" : "Fortfarande vaken?";
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

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <MyFlovePageGrid area="idag" className={`pace-today-desktop${textLayout.enlarged ? " pace-text-enlarged" : ""}`}>
      <span ref={textLayout.ref} className="pace-text-probe" aria-hidden="true" />
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <IntroTour />
      <MyFloveWide>
        <DayGreeting
          tagline={t("Vi tar dagen i din takt.")}
          greeting={t(greeting)}
          name={hasChosenName ? name : ""}
          action={<GreetingNameMenu name={hasChosenName ? name : ""} onSave={saveName} />}
        />
        <div className="pace-today-capacity mt-3"><TodayCapacity percent={dayCapacity.percent} /></div>
      </MyFloveWide>

      <MyFloveWide>
        <section className="min-w-0 rounded-[2rem] border border-border/70 bg-card px-3 py-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:px-5 sm:py-5" aria-labelledby="your-day-title">
          <header className="mb-3 space-y-3">
            <div className="flex items-center justify-between gap-2"><div><h2 id="your-day-title" className="pace-editorial pace-editorial-section text-2xl text-ink">{t("Din dag")}</h2><p className="mt-1 text-sm text-muted-foreground">{dateHeadingLabel(dateLabel, locale)}</p></div><RouterLink to="/kalender" search={{ view: "vecka" }} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"><CalendarDays size={15} aria-hidden />{t("Visa veckan")}</RouterLink></div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2" aria-label={t("Snabbval för din dag")}>
              <Button asChild size="sm" className="h-10 min-w-0 gap-1 rounded-xl px-1 text-[11px] sm:text-sm">
                <Link href="/lagg-till"><Plus size={15} className="shrink-0" aria-hidden />{t("Lägg till")}</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-10 min-w-0 gap-1 rounded-xl px-1 text-[11px] sm:text-sm">
                <Link href="/paminnelser" aria-label={t("Påminnelse")}><Bell size={15} className="shrink-0" aria-hidden />{t("Påminn")}</Link>
              </Button>
              <CopyDayButton date={today} shortLabel className="h-10 min-w-0 gap-1 rounded-xl px-1 text-[11px] sm:text-sm" />
            </div>
          </header>
          <div className="pt-2">
            <FamilyDayPerspectives defaultPerspective="me" compactSelector myDay={<DailyFlowList dayHeadings presentation="integrated" includeChildSchedules={false} showFilter />} />
            <div className="mt-4 space-y-2 border-t border-border/50 pt-3"><PlanningEntry compact><DayReplanButton compact date={today} entries={calendarEntries} capacity={dayCapacity.percent} calendarReady={planningReady} calendarError={planningError} /></PlanningEntry><PlanningEntry childrenOnly /></div>
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

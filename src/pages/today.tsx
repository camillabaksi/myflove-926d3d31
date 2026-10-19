import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Link as RouterLink } from "@tanstack/react-router";
import { CalendarDays, Plus, ChevronDown, NotebookPen, Images } from "lucide-react";
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
  const [todayPictograms, setTodayPictograms] = useCloudSyncedStorage<boolean>("paceable-today-pictograms", false);
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
        <div className="pace-today-capacity mt-1.5"><TodayCapacity percent={dayCapacity.percent} /></div>
      </MyFloveWide>

      <MyFloveWide>
        <section className="min-w-0 rounded-2xl border border-border/60 bg-card/80 px-2.5 py-2 sm:px-4 sm:py-3" aria-labelledby="your-day-title">
          <header className="mb-1.5 space-y-1.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0"><h2 id="your-day-title" className="pace-editorial pace-editorial-section text-xl sm:text-2xl text-ink">{t("Din dag")}</h2><p className="text-xs sm:text-sm text-muted-foreground">{dateHeadingLabel(dateLabel, locale)}</p></div>
              <div className="flex shrink-0 items-center gap-1">
                <RouterLink to="/planera" search={{ audience: "me", period: "today" }} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-lavender/55 px-2 text-xs font-semibold text-ink hover:bg-lavender/75"><NotebookPen size={15} aria-hidden />{t("Planera")}</RouterLink>
                <RouterLink to="/kalender" search={{ view: "vecka" }} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/50"><CalendarDays size={15} aria-hidden /><span className="hidden min-[390px]:inline">{t("Veckan")}</span><span className="sr-only min-[390px]:hidden">{t("Visa veckan")}</span></RouterLink>
              </div>
            </div>
            <div className="flex items-center gap-1.5" aria-label={t("Snabbval för din dag")}>
              <Button type="button" size="sm" className="min-h-11 shrink-0 gap-1 rounded-xl px-2.5 text-xs sm:text-sm" onClick={() => setAddOpen(true)}><Plus size={16} aria-hidden />{t("Lägg till")}</Button>
              <details className="group relative min-w-0 flex-1 rounded-xl border border-border/60 bg-card/80 px-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">{t("Fler val")}<ChevronDown size={15} aria-hidden className="transition-transform group-open:rotate-180" /></summary>
                <div className="flex flex-wrap gap-2 pb-2"><Button asChild size="sm" variant="outline" className="min-h-11 rounded-xl"><Link href="/paminnelser">{t("Påminnelse")}</Link></Button><CopyDayButton date={today} shortLabel className="min-h-11 rounded-xl" /></div>
              </details>
            </div>
          </header>
          <div className="pt-0.5">
            <FamilyDayPerspectives defaultPerspective="me" compactSelector selectorTrailingControl={<button type="button" title={`Bildstöd ${todayPictograms ? "på" : "av"}`} aria-label={`Bildstöd ${todayPictograms ? "på" : "av"}`} aria-pressed={todayPictograms} onClick={() => setTodayPictograms(v => !v)} className={`ml-auto inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${todayPictograms ? "border-primary/40 bg-lavender/60 text-primary" : "border-border bg-card text-muted-foreground"}`}><Images size={18} aria-hidden /></button>} myDay={<DailyFlowList dayHeadings presentation="integrated" includeChildSchedules={false} showFilter showPictograms={todayPictograms} pictogramLibrary="mulberry" />} />
            <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2"><PlanningEntry compact><DayReplanButton compact date={today} entries={calendarEntries} capacity={dayCapacity.percent} calendarReady={planningReady} calendarError={planningError} /></PlanningEntry><PlanningEntry childrenOnly /></div>
          </div>
        </section>
      </MyFloveWide>

      <MyFloveWide className="pace-today-pace pt-2">
        <TodayPace pace={pace} />
      </MyFloveWide>
      <MyFloveWide className="pt-2">
        <WeeklyPulse />
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

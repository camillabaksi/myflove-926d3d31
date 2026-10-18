import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Link as RouterLink } from "@tanstack/react-router";
import { Bell, CalendarDays, Copy, MoreHorizontal, Plus, ChevronRight } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [planningExpanded, setPlanningExpanded] = useState(false);
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
          action={<GreetingNameMenu name={hasChosenName ? name : ""} onSave={saveName} />}
        />
        <div className="pace-today-capacity mt-5"><TodayCapacity percent={dayCapacity.percent} /></div>
      </MyFloveWide>

      <MyFloveWide>
        <section className="min-w-0 rounded-[2rem] border border-border/70 bg-card px-3 py-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:px-5 sm:py-5" aria-labelledby="your-day-title">
Name="" /></div>
          </header>
          <div className="pt-2">
            <div className="mb-3">
              <div className="rounded-2xl border border-border/60 bg-mint/30 px-3 py-2">
                <button type="button" aria-expanded={planningExpanded} aria-controls="today-planning-options" onClick={() => setPlanningExpanded(v => !v)} className="flex min-h-11 w-full items-center justify-between gap-2 text-left">
                  <span className="font-medium text-ink">{t("Planera i din takt")}<span className="block text-xs font-normal text-muted-foreground">{t("Idag, imorgon eller veckan")}</span></span>
                  <ChevronRight size={18} className={planningExpanded ? "rotate-90 transition-transform" : "transition-transform"} aria-hidden />
                </button>
                {planningExpanded && <div id="today-planning-options" className="pt-2"><PlanningEntry compact><DayReplanButton compact date={today} entries={calendarEntries} capacity={dayCapacity.percent} calendarReady={planningReady} calendarError={planningError} /></PlanningEntry><div className="mt-2"><PlanningEntry childrenOnly /></div></div>}
              </div>
            </div>

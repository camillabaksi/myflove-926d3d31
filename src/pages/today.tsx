import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Bell, Plus, Sun } from "lucide-react";
import { PaceableStones } from "@/components/paceable/paceable-stones";
import { CopyDayButton } from "@/components/day/copy-day-dialog";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import { TodayCapacity } from "@/components/day/today-capacity";
import { TodayPace } from "@/components/day/today-pace";
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
import { track } from "@/lib/analytics";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/** Primär dagsupplevelse: faktisk Capacity, egen dag och en transparent Pace. */
export function TodayContent() {
  const { t, locale } = useLang();
  const { name } = useUserProfile();
  const [addOpen, setAddOpen] = useState(false);
  useEffect(() => {
    track("today_viewed", { source: "sida" });
  }, []);

  const today = todayISO();
  const dates = useMemo(() => [today], [today]);
  const { days } = useVisualCalendar(dates);
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
    <MyFlovePageGrid area="idag">
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <MyFloveWide>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-primary"><Sun size={14} className="text-sun-ink" aria-hidden />{t("Din dag, i din takt")}</p>
            <h1 className="mt-1 break-words font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">{name ? `${t("Hej")} ${name}` : t("Hej")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dateHeadingLabel(dateLabel, locale)}</p>
          </div>
          <PaceableStones compact tactile className="-mt-2 h-20 w-32 shrink-0" />
        </div>
        <div className="mt-5"><TodayCapacity percent={dayCapacity.percent} /></div>
      </MyFloveWide>

      <MyFloveWide>
        <section className="pt-4" aria-labelledby="your-day-title">
          <header className="flex flex-wrap items-end justify-between gap-3 pb-2">
            <div>
              <h2 id="your-day-title" className="font-display text-2xl font-bold text-ink">{t("Din dag")}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/lagg-till">
                  <Plus size={15} /> {t("Lägg till")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="rounded-full text-muted-foreground hover:text-ink">
                <Link href="/paminnelser">
                  <Bell size={15} /> {t("Påminnelse")}
                </Link>
              </Button>
              <CopyDayButton date={today} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-ink" />
            </div>
          </header>
          <div className="pt-2">
            <FamilyDayPerspectives defaultPerspective="me" myDay={<DailyFlowList dayHeadings presentation="integrated" />} />
          </div>
        </section>
      </MyFloveWide>

      <MyFloveWide className="pt-4">
        <TodayPace pace={pace} />
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

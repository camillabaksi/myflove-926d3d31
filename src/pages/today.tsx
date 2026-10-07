import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Bell, Heart, Plus } from "lucide-react";
import { CopyDayButton } from "@/components/day/copy-day-dialog";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import { TodayCapacity } from "@/components/day/today-capacity";
import { TodayPace } from "@/components/day/today-pace";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import QuickAddSheet from "@/components/quick-add-sheet";
import { Button } from "@/components/ui/button";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useLang } from "@/hooks/use-language";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { applyFamilyPresence, DEFAULT_FAMILY_LAYER, type FamilyLayerPreferences } from "@/lib/family-calendar";
import { deriveDayPace } from "@/lib/day-pace";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/** Primär dagsupplevelse: faktisk Capacity, egen dag och en transparent Pace. */
export function TodayContent() {
  const { t } = useLang();
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
  const { today: todaysItems } = useFlowItems();
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <MyFlovePageGrid area="idag">
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <MyFloveWide>
        <p className="text-xs font-semibold uppercase text-primary">{t("Din dag, i din takt")}</p>
        <h1 className="mt-1 font-handwritten break-words text-4xl font-semibold leading-tight text-ink sm:text-5xl">{name ? `${t("Hej")} ${name}` : t("Hej")}</h1>
        <p className="mt-1 capitalize text-sm text-muted-foreground">{dateLabel}</p>
        <TodayCapacity percent={dayCapacity.percent} />
        </section>
      </MyFloveWide>

      <MyFloveWide>
        <section className="rounded-3xl border border-border/60 bg-card px-4 py-4 shadow-soft sm:px-5" aria-labelledby="your-day-title">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h2 id="your-day-title" className="font-display text-xl font-bold text-ink">{t("Din dag")}</h2>
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
             <FamilyDayPerspectives defaultPerspective="me" myDay={<DailyFlowList dayHeadings />} />
          </div>
        </section>
      </MyFloveWide>

      <MyFloveWide>
        <TodayPace pace={pace} />
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

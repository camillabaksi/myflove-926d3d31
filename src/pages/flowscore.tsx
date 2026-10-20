import { PacePageHeader } from "@/components/paceable/page-header";
import { useMemo } from "react";
import { Link } from "wouter";
import { CalendarDays, Gauge } from "lucide-react";
import Layout from "@/components/layout";
import { TodayCapacity } from "@/components/day/today-capacity";
import { TodayPace } from "@/components/day/today-pace";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useLang } from "@/hooks/use-language";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/day";
import { deriveDayPace } from "@/lib/day-pace";
import {
  applyFamilyPresence,
  DEFAULT_FAMILY_LAYER,
  type FamilyLayerPreferences,
} from "@/lib/family-calendar";

/** Befintlig länk visar samma registrering och tolkning som Idag, utan ett separat poängvärde. */
export default function FlowScorePage() {
  const { t } = useLang();
  const today = todayISO();
  const dates = useMemo(() => [today], [today]);
  const { days } = useVisualCalendar(dates);
  const capacity = useDayCapacity()(today);
  const [preferences] = useCloudSyncedStorage<FamilyLayerPreferences>(
    "myflove-calendar-family-layer",
    DEFAULT_FAMILY_LAYER,
  );
  const entries = applyFamilyPresence(days[today] ?? [], preferences);
  const pace = deriveDayPace({ date: today, today, capacity: capacity.percent, entries });

  return (
    <Layout>
      <MyFlovePageGrid area="halsa" className="pace-ds pace-compact-page pace-next-page pace-next-health">
        <MyFloveWide>
<PacePageHeader icon={Gauge} title={t("Dagens balans")} description={t("Din egen kapacitet och det du har planerat, sida vid sida. Samma underlag som i Idag och Kalender.")} />
        </MyFloveWide>
        <MyFloveWide>
          <TodayCapacity percent={capacity.percent} />
        </MyFloveWide>
        <MyFloveWide>
          <TodayPace pace={pace} />
        </MyFloveWide>
        <MyFloveWide>
          <Button asChild variant="outline" className="min-h-11 rounded-2xl">
            <Link href="/kalender">
              <CalendarDays size={16} aria-hidden />
              {t("Öppna kalendern")}
            </Link>
          </Button>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}

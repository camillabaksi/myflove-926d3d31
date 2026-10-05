import { useEffect } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { CalendarContent } from "@/pages/calendar";
import { TodayContent } from "@/pages/today";
import AddToDay from "@/components/day/add-to-day";
import OwnChildCalendar from "@/components/family/own-child-calendar";
import { track } from "@/lib/analytics";
import { useLang } from "@/hooks/use-language";
import { CalendarDays, Heart, Plus } from "lucide-react";

export type DayTab = "idag" | "kalender" | "lagg-till";

const TABS: { id: DayTab; href: string; label: string; icon: typeof Heart }[] = [
  { id: "idag", href: "/idag", label: "Idag", icon: Heart },
  { id: "kalender", href: "/kalender", label: "Kalender", icon: CalendarDays },
  { id: "lagg-till", href: "/lagg-till", label: "Lägg till", icon: Plus },
];

/**
 * 📅 Kalender – appens enda plats för dagens planering.
 *
 * Tre flikar på samma data:
 *  ❤️ Idag      – det du faktiskt ska göra idag.
 *  🗓️ Kalender  – planerade dagar framåt.
 *  ➕ Lägg till – den gemensamma vägen in för allt nytt.
 *
 * Varje flik har en egen adress, så länkar, bakåtknapp och delning fungerar.
 */
export function DayHub({ tab }: { tab: DayTab }) {
  const { t } = useLang();
  useEffect(() => {
    track("day_hub_viewed", { source: tab });
  }, [tab]);

  return (
    <Layout>
      <nav
        aria-label={t("Dagens planering")}
        className="mb-4 grid grid-cols-3 gap-1 rounded-3xl border-2 border-border bg-muted/50 p-1"
      >
        {TABS.map((tabItem) => {
          const Icon = tabItem.icon;
          const active = tabItem.id === tab;
          return (
            <Link
              key={tabItem.id}
              href={tabItem.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-card text-ink shadow-soft" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Icon size={16} aria-hidden /> {t(tabItem.label)}
            </Link>
          );
        })}
      </nav>

      {tab === "idag" && <TodayContent />}
      {tab === "kalender" && <><OwnChildCalendar /><CalendarContent /></>}
      {tab === "lagg-till" && <AddToDay />}
    </Layout>
  );
}

export default DayHub;

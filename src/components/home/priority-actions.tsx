import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BatteryMedium, Brain, CalendarDays, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import SimpleCheckin from "@/components/simple-checkin";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useLang } from "@/hooks/use-language";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";

const tile = "h-full min-h-32 min-w-0 flex-col items-start justify-between gap-3 rounded-3xl p-4 text-left shadow-soft motion-reduce:transition-none";

/** Compact entries into the existing calendar, check-in and QuickFlow. */
export default function HomePriorityActions({ onQuickflow }: { onQuickflow: () => void }) {
  const { t } = useLang();
  const capacityOf = useDayCapacity();
  const capacity = capacityOf(todayISO());
  const [dialog, setDialog] = useState<"capacity" | "checkin" | null>(null);
  const open = (kind: "capacity" | "checkin") => {
    track("home_widget_opened", { source: kind === "capacity" ? "batteri" : "maende" });
    setDialog(kind);
  };

  return <>
    <nav className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4" data-testid="home-widgets" aria-label={t("Din dag") }>
      <Button asChild variant="outline" className={`${tile} border-border/60 bg-card/90 text-ink`}>
        <Link to="/kalender" data-testid="home-widget-calendar" onClick={() => track("home_widget_opened", { source: "kalender" })}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender text-primary"><CalendarDays aria-hidden /></span>
          <span className="min-w-0"><span className="block font-display text-sm font-bold">{t("Kalender")}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t("Öppna kalendern")} <ArrowRight className="inline" aria-hidden /></span></span>
        </Link>
      </Button>
      <Button variant="outline" className={`${tile} border-border/60 bg-card/90 text-ink`} data-testid="home-widget-capacity" onClick={() => open("capacity")}>
        <CapacityBattery percent={capacity.percent} size="sm" className="min-h-8 [&>span:last-child]:text-xl" />
        <span className="min-w-0"><span className="block font-display text-sm font-bold">{t("Din kapacitet idag")}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{capacity.percent == null ? t("Ingen incheckning idag") : t("Utifrån din incheckning")}</span></span>
      </Button>
      <Button variant="outline" className={`${tile} border-border/60 bg-blush/40 text-ink`} data-testid="home-widget-mood" onClick={() => open("checkin")}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blush text-primary"><Heart aria-hidden /></span>
        <span className="min-w-0"><span className="block font-display text-sm font-bold">{t("Logga hur du mår")}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t("Hur känns det just nu?")}</span></span>
      </Button>
      <Button className={`${tile} text-primary-foreground`} data-testid="home-widget-quickflow" onClick={onQuickflow}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-foreground/15"><Brain aria-hidden /></span>
        <span className="min-w-0"><span className="block font-display text-sm font-bold">QuickFlow</span><span className="mt-1 block text-xs font-normal text-primary-foreground/90">{t("Fånga en tanke")}</span></span>
      </Button>
    </nav>
    <Dialog open={dialog !== null} onOpenChange={(isOpen) => { if (!isOpen) setDialog(null); }}>
      <DialogContent className="rounded-3xl sm:rounded-3xl">
        <DialogTitle className="pr-6 font-display">{dialog === "checkin" ? t("Logga hur du mår") : t("Din kapacitet idag")}</DialogTitle>
        <DialogDescription>{dialog === "checkin" ? t("Din energi och ditt mående just nu.") : t("Samma kapacitet som i kalendern, utifrån din egen incheckning idag.")}</DialogDescription>
        {dialog === "checkin" ? <SimpleCheckin source="hem" /> : <div className="space-y-4">
          <CapacityBattery percent={capacity.percent} size="lg" className="w-full" />
          <p className="text-sm text-muted-foreground">{capacity.source === "morning" ? t("Värdet kommer från din morgonincheckning idag.") : capacity.source === "energy-log" ? t("Värdet kommer från din senaste energilogg idag.") : t("Du har ingen incheckning idag ännu. Därför visas inget procenttal.")}</p>
          <p className="text-sm text-muted-foreground">{t("Planerade aktiviteter visas som belastning i kalendern och ändrar inte den här kapaciteten.")}</p>
          <Button className="min-h-11 w-full" onClick={() => setDialog("checkin")}><Heart aria-hidden />{t("Logga energi & mående")}</Button>
          <Button asChild variant="outline" className="min-h-11 w-full"><Link to="/kalender"><CalendarDays aria-hidden />{t("Se dagens balans i kalendern")}</Link></Button>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
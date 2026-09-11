import { useState } from "react";
import { Activity, BatteryMedium, TrendingDown, TrendingUp } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { useBatteryLoadTrend } from "@/hooks/use-battery-load-trend";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BatteryLoadPeriod, BatteryLoadRange } from "@/lib/battery-load-trend";

const RANGE_LABELS: Record<BatteryLoadRange, string> = {
  days: "Dagar",
  weeks: "Veckor",
  months: "Månader",
};

const RANGE_DESCRIPTIONS: Record<BatteryLoadRange, string> = {
  days: "Senaste 28 dagarna",
  weeks: "Senaste 12 veckorna",
  months: "Senaste 12 månaderna",
};

function batteryTone(battery: number | null): string {
  if (battery == null) return "bg-muted/60";
  if (battery >= 70) return "bg-primary/75";
  if (battery >= 40) return "bg-accent/75";
  return "bg-secondary";
}

function LoadMap({ periods }: { periods: BatteryLoadPeriod[] }) {
  const maxLoad = Math.max(1, ...periods.map((period) => period.loadCount));
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="list">
      {periods.map((period) => {
        const loadHeight = period.loadCount === 0 ? 0 : Math.max(12, (period.loadCount / maxLoad) * 100);
        const description = `${period.accessibleLabel}: ${period.battery == null ? "ingen batteriincheckning" : `${period.battery} procent batteri`}, ${period.loadCount} genomförda aktiviteter`;
        return (
          <div
            key={period.key}
            role="listitem"
            aria-label={description}
            title={description}
            className="min-w-0 text-center"
          >
            <div className="relative mx-auto h-20 w-full max-w-14 overflow-hidden rounded-xl border border-border bg-background">
              <div
                className="absolute inset-x-0 bottom-0 bg-accent/35 transition-[height] duration-500"
                style={{ height: `${loadHeight}%` }}
              />
              <div
                className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-card shadow-sm transition-[bottom,background-color] duration-500 ${batteryTone(period.battery)}`}
                style={{ bottom: `${Math.max(5, Math.min(82, period.battery ?? 5))}%` }}
              />
              {period.loadCount > 0 && (
                <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-ink">
                  {period.loadCount}
                </span>
              )}
            </div>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">{period.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function BatteryLoadTrend() {
  const trend = useBatteryLoadTrend();
  const [range, setRange] = useState<BatteryLoadRange>("days");
  const periods = trend.periods[range];
  const visibleEnergyPeriods = periods.filter((period) => period.battery != null).length;
  const TrendIcon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : BatteryMedium;

  return (
    <CollapsibleSection
      id="insight-battery-load-trend"
      title="Batteri & faktisk belastning"
      description="Din energi över tid, jämförd med det du faktiskt genomförde"
      className="rounded-3xl border border-border bg-card p-5"
      headingClassName="font-semibold"
      data-testid="battery-load-trend"
    >
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendIcon size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{trend.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upp till 12 månader · {trend.loadOccasions} genomförda tillfällen · {trend.energyLogs} incheckningar
            </p>
          </div>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as BatteryLoadRange)}>
          <TabsList className="grid w-full grid-cols-3 rounded-full">
            {(Object.keys(RANGE_LABELS) as BatteryLoadRange[]).map((value) => (
              <TabsTrigger key={value} value={value} className="rounded-full">
                {RANGE_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="overflow-hidden rounded-2xl border border-border bg-background/60 p-3">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-primary/75" /> Batteri
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Genomförda aktiviteter
            </span>
          </div>
          <p className="mb-3 text-xs font-medium text-ink">{RANGE_DESCRIPTIONS[range]}</p>
          <LoadMap periods={periods} />
          {visibleEnergyPeriods === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Din karta börjar synas efter dina första batteriincheckningar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-secondary/30 p-3">
            <BatteryMedium size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{visibleEnergyPeriods} perioder</p>
            <p className="text-xs text-muted-foreground">med batteridata i vald vy</p>
          </div>
          <div className="rounded-2xl bg-secondary/30 p-3">
            <Activity size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{trend.pairedOccasions} tillfällen</p>
            <p className="text-xs text-muted-foreground">med mätning före och efter</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Punkten visar genomsnittligt batteri. Den mjuka stapeln visar faktisk belastning. Bara
          genomförda aktiviteter räknas; namn och privata anteckningar visas aldrig här.
        </p>
      </div>
    </CollapsibleSection>
  );
}

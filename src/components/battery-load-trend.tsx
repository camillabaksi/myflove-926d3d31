import { useEffect, useId, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, BatteryMedium, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function batteryTone(battery: number | null): string {
  if (battery == null) return "bg-muted/60";
  if (battery >= 70) return "bg-primary/75";
  if (battery >= 40) return "bg-accent/75";
  return "bg-secondary";
}

export function BatteryLoadPeriods({ periods }: { periods: BatteryLoadPeriod[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const timelineId = useId();
  const [edges, setEdges] = useState({ start: true, end: true });
  const updateEdges = () => {
    const node = viewport.current;
    if (!node) return;
    setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 });
  };
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    node.scrollLeft = 0;
    updateEdges();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [periods]);
  const move = (direction: number) => {
    const node = viewport.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "auto" });
  };
  const maxMinutes = Math.max(1, ...periods.map((period) => period.loadMinutes));
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex justify-end gap-2">
        <Button type="button" size="icon" variant="ghost" title="Tidigare perioder" aria-label="Tidigare perioder" aria-controls={timelineId} disabled={edges.start} onClick={() => move(-1)}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" variant="ghost" title="Senare perioder" aria-label="Senare perioder" aria-controls={timelineId} disabled={edges.end} onClick={() => move(1)}>
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div ref={viewport} id={timelineId} onScroll={updateEdges} role="region" aria-label="Tidslinje för batteri och faktisk tid" tabIndex={0} className="min-w-0 overflow-x-auto snap-x snap-proximity rounded-lg pb-2 focus-visible:outline-2 focus-visible:outline-ring">
      <div className="flex w-max min-w-full gap-2 p-1" role="list" aria-label="Perioder" onKeyDown={(event) => {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="listitem"]'));
        const index = items.indexOf(event.target as HTMLElement);
        if (index < 0) return;
        const next = event.key === "ArrowRight" ? Math.min(index + 1, items.length - 1)
          : event.key === "ArrowLeft" ? Math.max(index - 1, 0)
          : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
        if (next == null) return;
        event.preventDefault();
        items[next]?.focus({ preventScroll: true });
        items[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
      }}>
      {periods.map((period) => {
        const loadHeight =
          period.loadMinutes === 0 ? 0 : Math.max(12, (period.loadMinutes / maxMinutes) * 100);
        const description = `${period.accessibleLabel}: ${period.battery == null ? "ingen batteriincheckning" : `${period.battery} procent batteri`}, ${formatMinutes(period.loadMinutes)} på ${period.loadCount} genomförda aktiviteter`;
        return (
          <div
            key={period.key}
            role="listitem"
            tabIndex={0}
            aria-label={description}
            title={description}
            className="w-32 shrink-0 snap-start rounded-lg text-center focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <div aria-hidden="true" className="relative mx-auto h-20 w-full max-w-14 overflow-hidden rounded-xl border border-border bg-background">
              {period.loadMinutes > 0 && <div
                data-series="time"
                className="absolute inset-x-0 bottom-0 bg-accent/35 transition-[height] duration-500 motion-reduce:transition-none"
                style={{ height: `${loadHeight}%` }}
              />}
              {period.battery != null && <div
                data-series="battery"
                className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-card shadow-sm transition-[bottom,background-color] duration-500 motion-reduce:transition-none ${batteryTone(period.battery)}`}
                style={{ bottom: `${Math.max(5, Math.min(82, period.battery))}%` }}
              />}
            </div>
            <span className="mt-2 block break-words text-xs font-medium leading-relaxed text-foreground">
              {period.label}
            </span>
            <div aria-hidden="true" className="mt-1 space-y-1 break-words text-xs leading-relaxed text-muted-foreground">
              <p>Batteri {period.battery == null ? "–" : `${period.battery} %`}</p>
              {period.battery == null && <p>Ej incheckat</p>}
              <p>Tid {formatMinutes(period.loadMinutes)}</p>
              <p>{period.loadCount} genomförda aktiviteter</p>
            </div>
          </div>
        );
      })}
      </div>
      </div>
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
      title="Batteri & faktisk tid"
      description="Din energi över tid, jämförd med den tid som faktiskt gått åt"
      className="min-w-0 rounded-3xl border border-border bg-card p-4 font-sans sm:p-5 [&>div:first-child>button]:min-h-11 [&>div:first-child>button]:min-w-0 [&>div:first-child>button>span]:break-words"
      headingClassName="font-semibold"
      data-testid="battery-load-trend"
    >
      <div className="mt-4 space-y-4">
        <div className="rounded-2xl bg-secondary/40 p-3 sm:flex sm:items-start sm:gap-3 sm:p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendIcon size={18} aria-hidden />
          </span>
          <div className="mt-2 min-w-0 sm:mt-0">
            <p className="font-medium text-ink">{trend.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upp till 12 månader · {formatMinutes(trend.loadMinutes)} på {trend.loadOccasions}{" "}
              genomförda tillfällen · {trend.energyLogs} incheckningar
            </p>
          </div>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as BatteryLoadRange)}>
          <TabsList className="flex h-auto w-full flex-wrap rounded-2xl">
            {(Object.keys(RANGE_LABELS) as BatteryLoadRange[]).map((value) => (
              <TabsTrigger key={value} value={value} className="min-h-11 min-w-fit flex-1 whitespace-normal rounded-full">
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
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Tid som gått åt
            </span>
          </div>
          <p className="mb-3 text-xs font-medium text-ink">{RANGE_DESCRIPTIONS[range]}</p>
          <BatteryLoadPeriods periods={periods} />
          {visibleEnergyPeriods === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Din karta börjar synas efter dina första batteriincheckningar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-secondary/30 p-3">
            <Clock size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{formatMinutes(trend.loadMinutes)}</p>
            <p className="text-xs text-muted-foreground">faktisk tid på aktiviteter</p>
          </div>
          <div className="rounded-2xl bg-secondary/30 p-3">
            <Activity size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{trend.pairedOccasions} tillfällen</p>
            <p className="text-xs text-muted-foreground">med mätning före och efter</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Punkten visar genomsnittligt batteri. Den mjuka stapeln visar faktisk tid som gått åt —
          sluttid minus starttid, eller uppskattat 30 minuter när tider saknas. Bara genomförda
          aktiviteter räknas; namn och privata anteckningar visas aldrig här.
        </p>
      </div>
    </CollapsibleSection>
  );
}

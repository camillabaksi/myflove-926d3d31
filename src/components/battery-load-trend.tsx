import { useEffect, useId, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, BatteryMedium, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SoftWaveChart from "@/components/soft-wave-chart";
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
    <div className="pace-insight-chart min-w-0 space-y-2">
      <div className="flex justify-end gap-2">
        <Button type="button" size="icon" variant="ghost" title="Tidigare perioder" aria-label="Tidigare perioder" aria-controls={timelineId} disabled={edges.start} onClick={() => move(-1)}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" variant="ghost" title="Senare perioder" aria-label="Senare perioder" aria-controls={timelineId} disabled={edges.end} onClick={() => move(1)}>
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div ref={viewport} id={timelineId} onScroll={updateEdges} role="region" aria-label="Tidslinje för batteri och aktivitetstid" tabIndex={0} className="@container min-w-0 overflow-x-auto snap-x snap-proximity rounded-lg pb-2 focus-visible:outline-2 focus-visible:outline-ring">
      <div className="w-max min-w-full">
      <div className="px-1 pt-1">
        <SoftWaveChart series={[
          { id: "battery", tone: "primary", values: periods.map((p) => p.battery) },
          { id: "time", tone: "accent", dashed: true, values: periods.map((p) => (p.loadMinutes === 0 ? null : Math.max(8, (p.loadMinutes / maxMinutes) * 100))) },
        ]} />
      </div>
      <div className="grid w-max min-w-full p-1" style={{ gridTemplateColumns: `repeat(${periods.length}, minmax(min(8rem,calc(100cqw-12px)), 1fr))` }} role="list" aria-label="Perioder" onKeyDown={(event) => {
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
        const description = `${period.accessibleLabel}: ${period.battery == null ? "ingen batteriincheckning" : `${period.battery} procent batteri`}, ${formatMinutes(period.loadMinutes)} på ${period.loadCount} genomförda aktiviteter, ${period.observedDays} dagar med incheckningar. Tiden kan vara uppskattad.`;
        return (
          <div
            key={period.key}
            role="listitem"
            tabIndex={0}
            aria-label={description}
            title={description}
            className="min-w-0 px-1 snap-start rounded-lg text-center focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <span className="mt-2 block break-words text-xs font-medium leading-relaxed text-foreground">
              {period.label}
            </span>
            <div aria-hidden="true" className="mt-1 space-y-1 break-words text-sm leading-relaxed text-foreground">
              <p>Batteri {period.battery == null ? "–" : `${period.battery} %`}</p>
              {period.battery == null && <p>Ej incheckat</p>}
              <p>Tid {formatMinutes(period.loadMinutes)}</p>
              <p>{period.loadCount} genomförda aktiviteter</p>
              <p className="text-xs text-muted-foreground">{period.observedDays} {period.observedDays === 1 ? "dag" : "dagar"} med incheckningar</p>
            </div>
          </div>
        );
      })}
      </div>
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
      title="Batteri & aktivitetstid"
      description="Dina batteriincheckningar och tiden för genomförda aktiviteter"
      className="pace-insight-chart @container min-w-0 rounded-3xl border border-border bg-card p-[12px] font-sans @[22rem]:p-[20px] [&>div:first-child>button]:min-h-11 [&>div:first-child>button]:min-w-0 [&>div:first-child>button>span]:break-words"
      headingClassName="font-semibold"
      data-testid="battery-load-trend"
    >
      <div className="mt-4 space-y-4">
        <div className="min-w-0 rounded-2xl bg-secondary/40 p-[12px] @[30rem]:flex @[30rem]:items-start @[30rem]:gap-[12px] sm:p-[16px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendIcon size={18} aria-hidden />
          </span>
          <div className="mt-2 min-w-0 @[30rem]:mt-0">
            <p className="font-medium text-ink">{trend.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Totalt upp till 12 månader · {formatMinutes(trend.loadMinutes)} på {trend.loadOccasions}{" "}
              genomförda tillfällen · {trend.energyLogs} incheckningar
            </p>
          </div>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as BatteryLoadRange)}>
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl @[22rem]:grid-cols-3">
            {(Object.keys(RANGE_LABELS) as BatteryLoadRange[]).map((value) => (
              <TabsTrigger key={value} value={value} className="min-h-11 min-w-0 whitespace-normal rounded-full px-[8px]">
                {RANGE_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background/60 p-[8px] sm:p-[12px]">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground" aria-label="Diagramförklaring">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="pace-insight-series-energy h-3 w-3 shrink-0 rounded-full" /> Batteri · punkt
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="pace-insight-series-striped h-3 w-3 shrink-0 rounded-sm" /> Aktivitetstid · randig stapel
            </span>
          </div>
          <p className="mb-3 text-sm font-medium text-ink">{RANGE_DESCRIPTIONS[range]}</p>
          <BatteryLoadPeriods periods={periods} />
          {visibleEnergyPeriods === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Batteripunkter visas när du checkar in.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm @[30rem]:grid-cols-2">
          <div className="min-w-0 rounded-2xl bg-secondary/30 p-[12px]">
            <Clock size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{formatMinutes(trend.loadMinutes)}</p>
            <p className="text-sm text-muted-foreground">registrerad eller uppskattad aktivitetstid</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-secondary/30 p-[12px]">
            <Activity size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{trend.pairedOccasions} tillfällen</p>
            <p className="text-sm text-muted-foreground">med incheckning före och efter</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Tiden kan vara uppskattad. Ett streck vid batteriet betyder att incheckningar saknas;
          noll betyder att du har checkat in på lägsta nivån.
        </p>
        <details className="text-sm leading-relaxed text-muted-foreground">
          <summary className="min-h-11 cursor-pointer rounded-lg py-3 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            Så läser du diagrammet
          </summary>
          <div className="space-y-2 pb-2">
            <p>
              Punkten visar genomsnitt av dina batteriincheckningar på skalan 0–100 %. Stapeln
              visar den sammanlagda aktivitetstiden och blir högre när mer tid har registrerats
              i den valda perioden.
            </p>
            <p>
              Tiden räknas som sluttid minus starttid, eller uppskattat 30 minuter när tider saknas.
              Stapelns höjd jämförs med den längsta tiden i den valda vyn; den har en annan skala
              än batteriet.
            </p>
            <p>
              Förändringstrenden använder de senaste 14 dagarna. Incheckningar före och efter
              aktiviteter kan ingå från hela underlaget. Antalet dagar med incheckningar visas
              under varje period.
            </p>
            <p>
              Mönstren visar vad som sammanfaller, men förklarar inte säkert varför. Namn och
              privata anteckningar visas inte i diagrammet.
            </p>
          </div>
        </details>
      </div>
    </CollapsibleSection>
  );
}

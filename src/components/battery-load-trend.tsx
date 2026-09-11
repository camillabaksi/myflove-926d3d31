import { Activity, BatteryMedium, TrendingDown, TrendingUp } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { useBatteryLoadTrend } from "@/hooks/use-battery-load-trend";

const WIDTH = 560;
const HEIGHT = 180;
const PAD_X = 18;
const PAD_Y = 18;

export default function BatteryLoadTrend() {
  const trend = useBatteryLoadTrend();
  const pointGap = (WIDTH - PAD_X * 2) / Math.max(1, trend.days.length - 1);
  const observed = trend.days
    .map((day, index) =>
      day.battery == null
        ? null
        : {
            x: PAD_X + index * pointGap,
            y: PAD_Y + ((100 - day.battery) / 100) * (HEIGHT - PAD_Y * 2 - 28),
          },
    )
    .filter((point): point is { x: number; y: number } => point !== null);
  const line = observed.map((point) => `${point.x},${point.y}`).join(" ");
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
              Senaste 14 dagarna · {trend.loadOccasions} genomförda tillfällen · {trend.energyLogs}{" "}
              incheckningar
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-background/60 p-3">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-primary" /> Batteri
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Genomförda aktiviteter
            </span>
          </div>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`Batteritrend för 14 dagar med ${trend.loadOccasions} genomförda aktiviteter`}
          >
            <line
              x1={PAD_X}
              y1="55"
              x2={WIDTH - PAD_X}
              y2="55"
              className="stroke-border"
              strokeDasharray="4 6"
            />
            <line
              x1={PAD_X}
              y1="111"
              x2={WIDTH - PAD_X}
              y2="111"
              className="stroke-border"
              strokeDasharray="4 6"
            />
            {trend.days.map((day, index) => {
              const x = PAD_X + index * pointGap;
              const barHeight = Math.min(34, day.loadCount * 8);
              return (
                <g key={day.day}>
                  {day.loadCount > 0 && (
                    <rect
                      x={x - 6}
                      y={HEIGHT - 30 - barHeight}
                      width="12"
                      height={barHeight}
                      rx="4"
                      className="fill-accent"
                    />
                  )}
                  {index % 2 === 0 && (
                    <text
                      x={x}
                      y={HEIGHT - 7}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {day.label}
                    </text>
                  )}
                </g>
              );
            })}
            {observed.length > 1 && (
              <polyline
                points={line}
                fill="none"
                className="stroke-primary"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {observed.map((point) => (
              <circle
                key={`${point.x}-${point.y}`}
                cx={point.x}
                cy={point.y}
                r="5"
                className="fill-card stroke-primary"
                strokeWidth="3"
              />
            ))}
          </svg>
          {trend.observedDays === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              Din trend börjar synas efter dina första batteriincheckningar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-secondary/30 p-3">
            <BatteryMedium size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{trend.observedDays} dagar</p>
            <p className="text-xs text-muted-foreground">med batteridata</p>
          </div>
          <div className="rounded-2xl bg-secondary/30 p-3">
            <Activity size={16} className="mb-1 text-primary" aria-hidden />
            <p className="font-medium text-ink">{trend.pairedOccasions} tillfällen</p>
            <p className="text-xs text-muted-foreground">med mätning före och efter</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Bara genomförda aktiviteter räknas som belastning. Planerade saker påverkar inte denna
          trend. Innehåll och privata anteckningar visas aldrig här.
        </p>
      </div>
    </CollapsibleSection>
  );
}

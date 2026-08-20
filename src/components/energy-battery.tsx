import { useState } from "react";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { minutesToTime } from "@/lib/energy-battery";

/**
 * Mitt batteri™ – lugn, levande energinivå.
 * Kompakt vid första anblicken; detaljer först när du vill ha dem.
 */
export default function EnergyBattery({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { reading, suggestions } = useEnergyBattery();
  const [open, setOpen] = useState(defaultOpen);

  const level = Math.round(reading.now);
  const tone =
    level >= 66
      ? "hsl(var(--primary))"
      : level >= 38
        ? "hsl(var(--gold, 40 80% 60%))"
        : "hsl(var(--destructive))";
  const arrow = reading.trend === "stiger" ? "↗" : reading.trend === "sjunker" ? "↘" : "→";

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
      aria-label="Mitt batteri"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        {/* Själva batteriet */}
        <span className="relative flex h-7 w-14 shrink-0 items-center">
          <span className="relative h-7 w-[52px] overflow-hidden rounded-[10px] border-2 border-border bg-secondary/50">
            <span
              className="absolute inset-y-0 left-0 rounded-[7px] motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
              style={{ width: `${Math.max(4, level)}%`, backgroundColor: tone, opacity: 0.85 }}
            />
            <span className="motion-safe:animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite] absolute inset-0" />
          </span>
          <span className="ml-0.5 h-3 w-1 rounded-r-sm bg-border" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">Mitt batteri</span>
            <span className="text-sm font-bold" style={{ color: tone }}>
              {level}%
            </span>
            <span aria-hidden className="text-xs text-muted-foreground">
              {arrow}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {reading.summary}
          </span>
        </span>

        <span className="shrink-0 text-xs text-muted-foreground">{open ? "Dölj" : "Visa"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
          <BatteryCurve reading={reading} />

          <div className="flex flex-wrap gap-2 text-xs">
            {reading.peak && (
              <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-foreground">
                🌤️ Starkast {reading.peak.label}
              </span>
            )}
            {reading.dip && (
              <span className="rounded-pill bg-secondary/70 px-2.5 py-1 text-foreground">
                🌙 Lägst {reading.dip.label}
              </span>
            )}
            {!reading.personal && (
              <span className="rounded-pill bg-secondary/50 px-2.5 py-1 text-muted-foreground">
                Preliminär kurva – blir din egen när du loggat energi några dagar
              </span>
            )}
          </div>

          {suggestions.length > 0 && (
            <ul className="space-y-1.5">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl bg-secondary/40 px-3 py-2 text-xs text-foreground"
                >
                  {s.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** Liten, lugn kurva över dagen med markering för var vi är nu. */
function BatteryCurve({ reading }: { reading: ReturnType<typeof useEnergyBattery>["reading"] }) {
  const slots = reading.slots;
  if (slots.length < 2) return null;
  const w = 100;
  const h = 34;
  const points = slots.map((s, i) => {
    const x = (i / (slots.length - 1)) * w;
    const y = h - (s.level / 100) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const nowIndex = Math.max(0, slots.findIndex((s) => !s.past) - 1);
  const nowX = (nowIndex / (slots.length - 1)) * w;

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-20 w-full"
        role="img"
        aria-label={`Energikurva över dagen. ${reading.summary}`}
      >
        <polygon
          points={`0,${h} ${points.join(" ")} ${w},${h}`}
          fill="hsl(var(--primary))"
          opacity={0.12}
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={nowX}
          x2={nowX}
          y1={0}
          y2={h}
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{slots[0].time}</span>
        <span>{minutesToTime(slots[Math.floor(slots.length / 2)].minutes)}</span>
        <span>{slots[slots.length - 1].time}</span>
      </div>
    </div>
  );
}

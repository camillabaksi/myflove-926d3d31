import { useState } from "react";
import { ArrowRight, BatteryCharging, ChevronDown, Gauge, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { minutesToTime } from "@/lib/energy-battery";
import { MyFloveBlock, MyFloveStat } from "@/components/myflove/block";

/** Mitt batteri – översikt över nu-läget och den befintliga energikurvan. */
export default function EnergyBattery({
  defaultOpen = false,
  href,
  onNavigate,
}: {
  defaultOpen?: boolean;
  href?: string;
  onNavigate?: () => void;
}) {
  const { reading, suggestions } = useEnergyBattery();
  const { moodValue } = useQuickCheckin();
  const [open, setOpen] = useState(defaultOpen);
  const level = Math.round(reading.now);
  const shownLevel = Math.round(useAnimatedNumber(level));
  const levelWord =
    level >= 75
      ? "Gott om energi"
      : level >= 55
        ? "Medelbra energi"
        : level >= 35
          ? "Energi på halvfart"
          : "Låg energi just nu";
  const trendWord =
    reading.trend === "stiger"
      ? "på väg upp"
      : reading.trend === "sjunker"
        ? "på väg ner"
        : "ganska jämn";
  const content = (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <MyFloveStat
          label="Energi"
          value={`${shownLevel}%`}
          hint={`${levelWord} · ${trendWord}`}
          icon={BatteryCharging}
          tone="sun"
        />
        <MyFloveStat
          label="Mående"
          value={moodValue != null ? `${Math.round(moodValue / 2)}/5` : "–"}
          hint={moodValue != null ? "Senaste registrerade värde" : "Logga ett mående när du vill"}
          icon={Gauge}
          tone="blush"
        />
      </div>
      <BatteryCurve reading={reading} compact={false} />
      {!reading.personal && (
        <p className="text-xs text-muted-foreground">
          Preliminär kurva – blir din egen när du loggat energi några dagar.
        </p>
      )}
      {open && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          <p className="text-sm text-ink">
            {reading.trend === "stiger"
              ? "Din energi ökar."
              : reading.trend === "sjunker"
                ? "Din energi minskar."
                : "Din energi är stabil."}
          </p>
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
    </>
  );

  const block = (
    <MyFloveBlock
      title="Just nu"
      subtitle="Din energi och ditt mående – det senaste du loggat"
      icon={BatteryCharging}
      tone="sun"
      surface="sun"
      action={
        !href && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Dölj detaljer" : "Visa detaljer"}
            className="press grid h-9 w-9 place-items-center rounded-pill bg-card/70 text-ink"
          >
            <ChevronDown size={17} className={open ? "rotate-180" : ""} aria-hidden="true" />
          </button>
        )
      }
      footer={
        href ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Logga energi &amp; mående <ArrowRight size={16} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles size={14} className="text-primary" /> Varje loggning blir en egen observation
          </span>
        )
      }
      collapsible={false}
    >
      {content}
    </MyFloveBlock>
  );

  return href ? (
    <Link href={href} onClick={onNavigate} data-testid="battery-card" className="block">
      {block}
    </Link>
  ) : (
    block
  );
}

/** Liten, lugn kurva över dagen med befintlig energiberäkning. */
function BatteryCurve({
  reading,
  compact = false,
}: {
  reading: ReturnType<typeof useEnergyBattery>["reading"];
  compact?: boolean;
}) {
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
        className={compact ? "h-10 w-full" : "h-24 w-full"}
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
      {!compact && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{slots[0].time}</span>
          <span>{minutesToTime(slots[Math.floor(slots.length / 2)].minutes)}</span>
          <span>{slots[slots.length - 1].time}</span>
        </div>
      )}
    </div>
  );
}

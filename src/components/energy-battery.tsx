import { useState } from "react";
import { ArrowRight, BatteryCharging, ChevronDown, Gauge, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import ImpactBatteryNudge from "@/components/impact-battery-nudge";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { minutesToTime } from "@/lib/energy-battery";
import { MyFloveBlock, MyFloveStat } from "@/components/myflove/block";
import { MyFloveIcon } from "@/components/myflove";
import { useLang } from "@/hooks/use-language";

/** Mitt batteri – översikt över nu-läget och den befintliga energikurvan. */
export default function EnergyBattery({
  defaultOpen = false,
  href,
  onNavigate,
  widget = false,
}: {
  defaultOpen?: boolean;
  href?: string;
  onNavigate?: () => void;
  /** Widget-läge på Hem: stor ikon + batterinivå, inget mer. */
  widget?: boolean;
}) {
  const { t } = useLang();
  const { reading, suggestions } = useEnergyBattery();
  const { moodValue } = useQuickCheckin();
  const [open, setOpen] = useState(defaultOpen);
  const level = Math.round(reading.now);
  const shownLevel = Math.round(useAnimatedNumber(level));
  const levelWord =
    level >= 75
      ? t("Gott om energi")
      : level >= 55
        ? t("Medelbra energi")
        : level >= 35
          ? t("Energi på halvfart")
          : t("Låg energi just nu");
  const trendWord =
    reading.trend === "stiger"
      ? t("på väg upp")
      : reading.trend === "sjunker"
        ? t("på väg ner")
        : t("ganska jämn");

  // Hem-läge: rubrik + kort underrubrik + aktuellt värde. Hela kortet är en länk.
  if (widget && href) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        data-testid="battery-card"
        data-area="halsa"
        aria-label={`${t("Mitt batteri")}, ${shownLevel} %. ${t("Öppna för att logga energi och mående.")}`}
        className="press relative flex min-h-[9rem] min-w-0 flex-col items-center gap-2.5 rounded-3xl border-2 border-[hsl(var(--area-aterhamtning)/0.45)] bg-sun/50 p-4 text-center shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
      >
        <MyFloveIcon icon={BatteryCharging} tone="sun" size="lg" className="rounded-full" />
        <span className="min-w-0">
          <span className="block font-display text-base font-bold leading-tight text-ink">
            {t("Mitt batteri")}
          </span>
          <span className="block text-xs text-muted-foreground">{t("Energi och mående")}</span>
        </span>
        <span className="w-full space-y-1 border-t border-border/50 pt-3">
          <span className="block font-display text-3xl font-bold leading-none text-ink">
            {shownLevel}%
          </span>
          <span className="block text-sm font-medium text-gold">{levelWord}</span>
        </span>
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-sun text-gold"
        >
          <ArrowRight size={15} />
        </span>
      </Link>
    );
  }

  const content = (
    <>
      <div className="grid grid-cols-1 gap-2 @min-[240px]:grid-cols-2 sm:gap-3">
        <MyFloveStat
          label={t("Energi")}
          value={`${shownLevel}%`}
          hint={`${levelWord} · ${trendWord}`}
          icon={BatteryCharging}
          tone="sun"
        />
        <MyFloveStat
          label={t("Mående")}
          value={moodValue != null ? `${Math.round(moodValue / 2)}/5` : "–"}
          hint={
            moodValue != null ? t("Senaste registrerade värde") : t("Logga ett mående när du vill")
          }
          icon={Gauge}
          tone="blush"
        />
      </div>
      <BatteryCurve reading={reading} compact={false} />
      <ImpactBatteryNudge />
      {!reading.personal && (
        <p className="text-xs text-muted-foreground">
          {t("Preliminär kurva – blir din egen när du loggat energi några dagar.")}
        </p>
      )}
      {open && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          <p className="text-sm text-ink">
            {reading.trend === "stiger"
              ? t("Din energi ökar.")
              : reading.trend === "sjunker"
                ? t("Din energi minskar.")
                : t("Din energi är stabil.")}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {reading.peak && (
              <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-foreground">
                🌤️ {t("Starkast")} {reading.peak.label}
              </span>
            )}
            {reading.dip && (
              <span className="rounded-pill bg-secondary/70 px-2.5 py-1 text-foreground">
                🌙 {t("Lägst")} {reading.dip.label}
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
      title={t("Just nu")}
      subtitle={t("Din energi och ditt mående – det senaste du loggat")}
      icon={BatteryCharging}
      tone="sun"
      surface="sun"
      area="halsa"
      action={
        !href && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("Dölj detaljer") : t("Visa detaljer")}
            className="press grid h-9 w-9 place-items-center rounded-pill bg-card/70 text-ink"
          >
            <ChevronDown size={17} className={open ? "rotate-180" : ""} aria-hidden="true" />
          </button>
        )
      }
      footer={
        href ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {t("Logga energi & mående")} <ArrowRight size={16} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles size={14} className="text-primary" />{" "}
            {t("Varje loggning blir en egen observation")}
          </span>
        )
      }
      collapsible
      collapseId="energy-battery-now"
      className="@container"
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
  const { t } = useLang();
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
        aria-label={`${t("Energikurva över dagen.")} ${reading.summary}`}
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

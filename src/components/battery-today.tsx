import { Clock, NotebookPen } from "lucide-react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { MyFloveBlock } from "@/components/myflove/block";
import { buildObservations } from "@/lib/battery-observations";
import { orkWord } from "@/lib/ork-word";
import { useLang } from "@/hooks/use-language";

const MOOD_EMOJI: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const timeOf = (ts: number | string) =>
  new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));

/** Morgon / Eftermiddag / Kväll – enkel orientering, inte en bedömning. */
function partOfDay(ts: number | string): { label: string; emoji: string; tone: string } {
  const h = new Date(ts).getHours();
  if (h < 12) return { label: "Morgon", emoji: "🌤️", tone: "bg-sun/60 text-ink" };
  if (h < 18) return { label: "Eftermiddag", emoji: "☀️", tone: "bg-blush/60 text-ink" };
  return { label: "Kväll", emoji: "🌙", tone: "bg-lavender/80 text-ink" };
}

/** Ring som visar energin – lugn, mjuk och läsbar utan färg som enda signal. */
function EnergyRing({ pct }: { pct: number }) {
  const { t } = useLang();
  const size = 72;
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={7}
          className="stroke-border/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          className="stroke-primary transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.max(0, Math.min(100, pct))) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display text-sm font-bold text-ink">{t(orkWord(pct).short)}</span>
        <span className="text-[10px] text-muted-foreground">{t("Energi")}</span>
      </span>
    </div>
  );
}

/**
 * "Dagens observationer" – dagens tidsstämplade energi och mående som tydliga
 * kort, äldst → nyast, så att det syns att måendet kan ändras under dagen.
 * Read-only: all loggning sker i formuläret på samma sida (Mitt batteri).
 */
export default function BatteryToday() {
  const { t } = useLang();
  const { todayEnergyEntries, todayMoods } = useQuickCheckin();
  const observations = buildObservations(todayEnergyEntries, todayMoods);

  return (
    <MyFloveBlock
      title={t("Dagens observationer")}
      subtitle={t("Dina loggningar i kronologisk ordning")}
      icon={Clock}
      tone="lavender"
      span
      collapsible
      collapseId="batteri::dagens-observationer"
      status={`${observations.length} ${observations.length === 1 ? t("observation") : t("observationer")} ${t("idag")}`}
      className="[&>div>div]:min-w-0"
    >
      <div data-testid="battery-today" aria-label={t("Dagens observationer")}>
        {observations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Inga observationer än idag. Din första loggning ovan börjar måla dagens bild. 💜")}
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
              <span>{t("Energi idag")}</span>
              <span>{t("Mående idag")}</span>
            </div>
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {observations.map((o) => {
                const part = partOfDay(o.ts);
                return (
                  <li
                    key={o.key}
                    className="reveal-soft flex flex-col gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Clock size={14} aria-hidden="true" className="text-muted-foreground" />
                        {timeOf(o.ts)}
                      </span>
                      <span
                        className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${part.tone}`}
                      >
                        {t(part.label)} <span aria-hidden>{part.emoji}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {o.energyPct != null && <EnergyRing pct={o.energyPct} />}
                      {o.mood != null && (
                        <div className="flex flex-col items-center leading-none">
                          <span aria-hidden className="text-3xl">
                            {MOOD_EMOJI[o.mood] ?? "😐"}
                          </span>
                          <span className="mt-1 font-display text-sm font-bold text-ink">
                            {o.mood}/5
                          </span>
                          <span className="text-[10px] text-muted-foreground">{t("Mående")}</span>
                        </div>
                      )}
                    </div>

                    {o.note && (
                      <p className="flex items-start gap-2 rounded-xl bg-card/80 p-2.5 text-sm text-ink">
                        <NotebookPen
                          size={14}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />
                        <span className="min-w-0">{o.note}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </MyFloveBlock>
  );
}

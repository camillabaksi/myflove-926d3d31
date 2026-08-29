import { Clock, NotebookPen } from "lucide-react";
import { useQuickCheckin, toScale10 } from "@/hooks/use-quick-checkin";
import type { MoodEntry } from "@/hooks/use-data";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { MyFloveBlock } from "@/components/myflove/block";

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

type Observation = {
  key: string;
  ts: number;
  energyPct?: number;
  mood?: number;
  note?: string;
};

/**
 * Slår ihop dagens energi- och måendeobservationer till kort per tidpunkt.
 * Poster inom samma minut hör ihop (samma sparning i formuläret ovanför).
 * Ingen ny datakälla – bara en presentation av befintliga observationer.
 */
export function buildObservations(
  energy: EnergyLogEntry[],
  moods: MoodEntry[],
  windowMs = 90_000,
): Observation[] {
  const out: Observation[] = [];
  const rest = [...moods];

  for (const e of energy) {
    const ts = new Date(e.logged_at).getTime();
    const i = rest.findIndex((m) => Math.abs(m.date - ts) <= windowMs);
    const paired = i >= 0 ? rest.splice(i, 1)[0] : undefined;
    out.push({
      key: e.id,
      ts,
      energyPct: Math.min(100, toScale10(e.level) * 10),
      ...(paired ? { mood: paired.score, ...(paired.note ? { note: paired.note } : {}) } : {}),
    });
  }
  for (const m of rest) {
    out.push({ key: m.id, ts: m.date, mood: m.score, ...(m.note ? { note: m.note } : {}) });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

/** Ring som visar energin – lugn, mjuk och läsbar utan färg som enda signal. */
function EnergyRing({ pct }: { pct: number }) {
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
        <span className="font-display text-base font-bold text-ink">{pct}%</span>
        <span className="text-[10px] text-muted-foreground">Energi</span>
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
  const { todayEnergyEntries, todayMoods } = useQuickCheckin();
  const observations = buildObservations(todayEnergyEntries, todayMoods);

  return (
    <MyFloveBlock
      title="Dagens observationer"
      subtitle="Dina loggningar i kronologisk ordning"
      icon={Clock}
      tone="lavender"
      span
      collapsible
      collapseId="batteri::dagens-observationer"
      status={`${observations.length} ${observations.length === 1 ? "observation" : "observationer"} idag`}
      className="[&>div>div]:min-w-0"
    >
      <div data-testid="battery-today" aria-label="Dagens observationer">
        {observations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga observationer än idag. Din första loggning ovan börjar måla dagens bild. 💜
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted-foreground">
              <span>Energi idag</span>
              <span>Mående idag</span>
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
                        {part.label} <span aria-hidden>{part.emoji}</span>
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
                          <span className="text-[10px] text-muted-foreground">Mående</span>
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

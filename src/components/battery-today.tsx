import { useQuickCheckin, toScale10 } from "@/hooks/use-quick-checkin";
import type { MoodEntry } from "@/hooks/use-data";

const MOOD_EMOJI: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const timeOf = (ts: number | string) =>
  new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));

/**
 * "Idag i Mitt batteri" – dagens tidsstämplade observationer av energi och
 * mående, äldst → nyast. Lugn översikt, inte en teknisk graf: chips med
 * klockslag visar hur dagen förändrats. Read-only – ny loggning sker i
 * formuläret ovanför (samma sida, samma kanoniska vy).
 */
export default function BatteryToday() {
  const { todayEnergyEntries, todayMoods } = useQuickCheckin();

  const hasAny = todayEnergyEntries.length > 0 || todayMoods.length > 0;

  return (
    <section
      aria-label="Dagens observationer"
      data-testid="battery-today"
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Idag i Mitt batteri
        </h2>
        <p className="text-xs text-muted-foreground">
          Varje gång du loggar blir det en egen observation – här ser du hur dagen förändrats.
        </p>
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground">
          Inga observationer än idag. Din första loggning ovan börjar måla dagens bild. 💜
        </p>
      ) : (
        <div className="space-y-4">
          {todayEnergyEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Energi idag</p>
              <ol className="flex flex-wrap items-center gap-1.5" aria-label="Energi över dagen">
                {todayEnergyEntries.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span aria-hidden className="text-muted-foreground/50">
                        ─
                      </span>
                    )}
                    <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-ink">
                      {timeOf(e.logged_at)} · {Math.min(100, toScale10(e.level) * 10)}%
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {todayMoods.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Mående idag</p>
              <ol className="space-y-1.5" aria-label="Mående över dagen">
                {todayMoods.map((m: MoodEntry) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span aria-hidden className="text-lg leading-none">
                      {MOOD_EMOJI[m.score] ?? "😐"}
                    </span>
                    <span className="min-w-0">
                      <span className="text-xs text-muted-foreground">{timeOf(m.date)}</span>
                      {m.note && <span className="block text-ink">{m.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";

export interface TimelineEntry {
  id: string;
  title: string;
  time: string; // HH:MM, tom sträng = ingen tid
  endTime?: string;
  color?: string;
  emoji?: string;
}

const START_HOUR = 6;
const END_HOUR = 22;

const toMinutes = (t: string) => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m ?? 0);
};

/**
 * Dagsvyns tidslinje – lugna pastellkort på en enkel timrad,
 * med en mjuk markering för var på dagen vi är just nu.
 */
export default function DayTimeline({
  entries,
  isToday,
}: {
  entries: TimelineEntry[];
  isToday: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timed = entries
    .filter((e) => /^\d{1,2}:\d{2}$/.test(e.time))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const untimed = entries.filter((e) => !/^\d{1,2}:\d{2}$/.test(e.time));

  if (entries.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="space-y-1">
        {hours.map((h) => {
          const inHour = timed.filter((e) => Math.floor(toMinutes(e.time) / 60) === h);
          const showNowLine =
            isToday && nowMinutes >= h * 60 && nowMinutes < (h + 1) * 60;
          if (inHour.length === 0 && !showNowLine) {
            return (
              <div key={h} className="flex items-center gap-3">
                <span className="w-11 shrink-0 text-right text-xs text-muted-foreground/60">
                  {String(h).padStart(2, "0")}:00
                </span>
                <span className="h-px flex-1 bg-border/40" />
              </div>
            );
          }
          return (
            <div key={h} className="flex gap-3">
              <span className="w-11 shrink-0 pt-2 text-right text-xs font-medium text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
              <div className="flex-1 space-y-1.5 py-1">
                {showNowLine && (
                  <div className="flex items-center gap-2" aria-label="Nu">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-px flex-1 bg-primary/50" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Nu</span>
                  </div>
                )}
                {inHour.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-border/50 px-3 py-2.5"
                    style={{
                      backgroundColor: e.color
                        ? `color-mix(in oklab, ${e.color} 14%, hsl(var(--card)))`
                        : "hsl(var(--lavender))",
                    }}
                  >
                    {e.emoji && <span aria-hidden className="text-lg leading-none">{e.emoji}</span>}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {e.time}
                      {e.endTime ? `–${e.endTime}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {untimed.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Utan klockslag
          </p>
          <div className="flex flex-wrap gap-2">
            {untimed.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-foreground"
              >
                {e.emoji && <span aria-hidden>{e.emoji}</span>}
                {e.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

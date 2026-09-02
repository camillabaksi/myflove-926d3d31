import { useEffect, useState } from "react";
import { FlowItemActions } from "@/components/flow-item-actions";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";

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
  editable = true,
  energyByHour,
}: {
  entries: TimelineEntry[];
  isToday: boolean;
  /** Visa ändra/ta bort direkt i tidslinjen. */
  editable?: boolean;
  /** Mitt batteri™: energinivå 0–100 per timme, ritas som mycket svag ton. */
  energyByHour?: Record<number, number>;
}) {
  const [now, setNow] = useState(() => new Date());
  const [showUntimed, setShowUntimed] = useCloudSyncedStorage<boolean>(
    "myflove-timeline-show-untimed",
    false,
  );

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
    <div className="rounded-3xl border-2 border-border/60 bg-card p-4 shadow-soft">
      <div className="space-y-1">
        {hours.map((h) => {
          const inHour = timed.filter((e) => Math.floor(toMinutes(e.time) / 60) === h);
          const showNowLine = isToday && nowMinutes >= h * 60 && nowMinutes < (h + 1) * 60;
          const energy = energyByHour?.[h];
          const tint =
            energy == null
              ? undefined
              : `color-mix(in oklab, hsl(var(--primary)) ${Math.round(energy / 12)}%, transparent)`;
          if (inHour.length === 0 && !showNowLine) {
            return (
              <div
                key={h}
                className="flex items-center gap-3 rounded-xl"
                style={{ backgroundColor: tint }}
              >
                <span className="w-11 shrink-0 text-right text-xs text-muted-foreground/60">
                  {String(h).padStart(2, "0")}:00
                </span>
                <span className="h-px flex-1 bg-border/40" />
              </div>
            );
          }
          return (
            <div key={h} className="flex gap-3 rounded-xl" style={{ backgroundColor: tint }}>
              <span className="w-11 shrink-0 pt-2 text-right text-xs font-medium text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
              <div className="min-w-0 flex-1 space-y-1.5 py-1">
                {showNowLine && (
                  <div className="flex items-center gap-2" aria-label="Nu">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="h-px flex-1 bg-primary/50" />
                    <span className="rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      Nu
                    </span>
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
                    {e.emoji && (
                      <span aria-hidden className="text-lg leading-none">
                        {e.emoji}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {e.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {e.time}
                      {e.endTime ? `–${e.endTime}` : ""}
                    </span>
                    {editable && <FlowItemActions itemId={e.id} size={14} />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {untimed.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <button
            type="button"
            onClick={() => setShowUntimed((v) => !v)}
            aria-expanded={showUntimed}
            className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Utan klockslag ({untimed.length})</span>
            <span className="normal-case tracking-normal opacity-70">
              {showUntimed ? "Dölj" : "Visa"}
            </span>
          </button>
          {showUntimed && (
            <div className="mt-2 flex flex-wrap gap-2">
              {untimed.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-foreground"
                >
                  {e.emoji && <span aria-hidden>{e.emoji}</span>}
                  {e.title}
                  {editable && <FlowItemActions itemId={e.id} size={13} />}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

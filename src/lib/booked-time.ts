// Hur mycket av dagen är redan bokad? Möten, lektioner och tider du satt
// själv är inte "ledig" fokustid – därför ska de dras bort från kapaciteten.

export interface BookedSlot {
  /** HH:MM */
  start: string;
  /** HH:MM */
  end: string;
  title: string;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Standardlängd när en tid saknar sluttid (ett möte "kl 11"). */
export const DEFAULT_SLOT_MINUTES = 60;

export interface BookedTime {
  /** Bokade minuter som ligger kvar av dagen. */
  minutesLeftBooked: number;
  /** Antal hållpunkter som ligger kvar idag. */
  upcoming: number;
  /** Nästa hållpunkt, om någon. */
  nextTitle?: string;
  nextStart?: string;
}

/**
 * Räknar bokad tid som ligger mellan "nu" och arbetsdagens slut.
 * Överlappande poster slås ihop så att inget dubbelräknas.
 */
export function bookedTimeLeft(
  slots: BookedSlot[],
  opts: { endHour: number; now?: Date },
): BookedTime {
  const now = opts.now ?? new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const endMin = opts.endHour * 60;

  const ranges = slots
    .map((s) => {
      const start = toMinutes(s.start);
      const end = s.end ? toMinutes(s.end) : start + DEFAULT_SLOT_MINUTES;
      return { start, end: Math.max(end, start + 15), title: s.title };
    })
    .filter((r) => r.end > nowMin && r.start < endMin)
    .sort((a, b) => a.start - b.start);

  let merged = 0;
  let cursor = nowMin;
  for (const r of ranges) {
    const start = Math.max(r.start, cursor);
    const end = Math.min(r.end, endMin);
    if (end > start) {
      merged += end - start;
      cursor = end;
    }
  }

  const next = ranges.find((r) => r.start >= nowMin) ?? ranges[0];
  return {
    minutesLeftBooked: Math.round(merged),
    upcoming: ranges.length,
    nextTitle: next?.title,
    nextStart: next ? `${String(Math.floor(next.start / 60)).padStart(2, "0")}:${String(next.start % 60).padStart(2, "0")}` : undefined,
  };
}

// Gemensam logik för återkommande saker (påminnelser, barnens aktiviteter).

export type RepeatMode = "none" | "daily" | "weekdays" | "weekly";

export const REPEAT_LABELS: Record<RepeatMode, string> = {
  none: "En gång",
  daily: "Varje dag",
  weekdays: "Vardagar",
  weekly: "Varje vecka",
};

function toDate(iso: string): Date | null {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}

/** Sker något som startar `startDate` med `repeat` även på dagen `dateStr`? */
export function occursOn(
  startDate: string | null | undefined,
  repeat: RepeatMode | null | undefined,
  dateStr: string,
): boolean {
  if (!startDate) return false;
  const mode = repeat ?? "none";
  if (mode === "none") return startDate === dateStr;

  const start = toDate(startDate);
  const day = toDate(dateStr);
  if (!start || !day) return startDate === dateStr;
  if (day.getTime() < start.getTime()) return false;

  if (mode === "daily") return true;
  if (mode === "weekdays") {
    const dow = day.getDay();
    return dow >= 1 && dow <= 5;
  }
  return day.getDay() === start.getDay();
}


/** Enkel tolkning av svenska upprepningsord i fritext. */
export function detectRepeat(text: string): RepeatMode {
  const lower = text.toLowerCase();
  if (/(varje dag|varje morgon|varje kväll|dagligen|dagliga|daglig|varje natt)/.test(lower))
    return "daily";
  if (/(vardagar|varje vardag|mån-fre|måndag till fredag)/.test(lower)) return "weekdays";
  if (
    /(varje vecka|veckovis|varannan vecka|varje måndag|varje tisdag|varje onsdag|varje torsdag|varje fredag|varje lördag|varje söndag)/.test(
      lower,
    )
  )
    return "weekly";
  return "none";
}

export interface Routine {
  id: string;
  title: string;
  time: string; // HH:MM
  enabled: boolean;
  createdAt: number;
  /** Hur ofta rutinen sker. Saknas = varje dag (gammal data). */
  repeat?: RepeatMode;
  /** Startdatum (YYYY-MM-DD). Krävs för engångsrutiner. */
  startDate?: string;
}

/** Sker rutinen den här dagen? */
export function routineOccursOn(routine: Routine, dateStr: string): boolean {
  const repeat = routine.repeat ?? "daily";
  if (repeat === "daily" && !routine.startDate) return true;
  return occursOn(routine.startDate ?? dateStr, repeat, dateStr);
}

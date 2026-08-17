/**
 * Lokal användningslogg – bara på den här enheten, bara vilken del som
 * öppnats och när. Används för lugna förslag om att dölja block som du
 * ändå inte tittar på. Ingen text eller innehåll sparas.
 */
const KEY = "myflove-local-usage";
const FIRST_KEY = "myflove-local-usage-start";

type Usage = Record<string, { last: number; count: number }>;

export function readUsage(): Usage {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Usage) : {};
  } catch {
    return {};
  }
}

export function recordUsage(section: string): void {
  if (typeof window === "undefined") return;
  try {
    const usage = readUsage();
    const prev = usage[section];
    usage[section] = { last: Date.now(), count: (prev?.count ?? 0) + 1 };
    window.localStorage.setItem(KEY, JSON.stringify(usage));
    if (!window.localStorage.getItem(FIRST_KEY)) {
      window.localStorage.setItem(FIRST_KEY, String(Date.now()));
    }
  } catch {
    /* ingen lagring – då blir det inga förslag, och det är okej */
  }
}

/** Hur många dagar appen har använts på den här enheten. */
export function daysSinceFirstUse(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(FIRST_KEY);
  if (!raw) return 0;
  return Math.floor((Date.now() - Number(raw)) / 86400000);
}

export function daysSinceUsed(section: string): number | null {
  const entry = readUsage()[section];
  if (!entry) return null;
  return Math.floor((Date.now() - entry.last) / 86400000);
}

/** Hemskärmens block → den del av appen de hör ihop med. */
export const SECTION_FOR_HOME_BLOCK: Record<string, string> = {
  week: "veckans-flow",
  streak: "belöningar",
  weather: "väder",
  quickflow: "quickflow",
  bills: "ekonomi",
  medication: "medicin",
  reset: "flow-reset",
  suggestions: "förslag",
  shortcuts: "genvägar",
};

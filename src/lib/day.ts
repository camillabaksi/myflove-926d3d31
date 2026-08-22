// Dagar i MyFlove – EN sanning för vad "en dag" betyder.
//
// Allt i appen som jämför datum ska använda de här funktionerna. Anledningen:
// `new Date().toISOString()` ger dagen i UTC, inte i användarens tidszon. I
// Sverige (UTC+1/+2) betyder det att appen sent på kvällen tror att det redan
// är imorgon – och då kan en händelse som hör till en annan dag dyka upp under
// "Idag". Samma sak åt andra hållet i tidszoner väster om UTC.
//
// Regler:
//  • En dag är ALLTID användarens lokala kalenderdag (YYYY-MM-DD).
//  • Ett datumfält (dueDate, date, occurredAt) styr vilken dag något hör till.
//    `createdAt` får aldrig användas som aktivitetsdatum.
//  • ISO-datum jämförs som strängar – det är säkert eftersom formatet är
//    fast bredd (YYYY-MM-DD) och alltid lokalt.

const pad = (n: number) => String(n).padStart(2, "0");

/** Lokalt kalenderdatum för ett Date-objekt. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Dagens lokala datum, YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Lokalt kalenderdatum för en tidsstämpel (epoch ms) eller ISO-tidsstämpel. */
export function dayOf(value: number | string | Date | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return toISODate(d);
}

/**
 * Tolkar YYYY-MM-DD som lokal middag. Middag (inte midnatt) gör att sommartid
 * och `new Date("2026-09-04")`-fällan (som blir UTC-midnatt = fel dag i
 * tidszoner väster om UTC) inte kan flytta datumet en dag.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

/** Datumet n dagar från ett ISO-datum. */
export function addDaysISO(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Hör tidsstämpeln till den lokala dagen `iso`? */
export function isSameISODay(value: number | string | undefined | null, iso: string): boolean {
  return dayOf(value) === iso;
}

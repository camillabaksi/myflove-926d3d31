// Schemaimport: gör klistrad text eller en .ics-fil till föreläsningar.
// Ren logik – ingen AI behövs för de vanligaste formaten.

import type { Lecture } from "@/lib/study-calendar";

export type ParsedLecture = Omit<Lecture, "id">;

const DAY_WORDS: Array<[RegExp, number]> = [
  [/\bm[åa]n(dag)?\b/i, 0],
  [/\btis(dag)?\b/i, 1],
  [/\bons(dag)?\b/i, 2],
  [/\btors(dag)?\b|\btor\b|\bths\b/i, 3],
  [/\bfre(dag)?\b/i, 4],
  [/\bl[öo]r(dag)?\b/i, 5],
  [/\bs[öo]n(dag)?\b/i, 6],
  [/\bmonday\b|\bmon\b/i, 0],
  [/\btuesday\b|\btue\b/i, 1],
  [/\bwednesday\b|\bwed\b/i, 2],
  [/\bthursday\b|\bthu\b/i, 3],
  [/\bfriday\b|\bfri\b/i, 4],
  [/\bsaturday\b|\bsat\b/i, 5],
  [/\bsunday\b|\bsun\b/i, 6],
];

function weekdayFrom(text: string): number | null {
  for (const [re, i] of DAY_WORDS) if (re.test(text)) return i;
  return null;
}

function normTime(h: string, m?: string) {
  return `${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  return `${String(hh).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Tolkar rader som:
 *  "Måndag 09:00-11:00 Statistik, sal B2"
 *  "tis 13-15 Programmering (D310)"
 */
export function parseScheduleText(text: string): ParsedLecture[] {
  const out: ParsedLecture[] = [];
  let currentDay: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const dayOnly = weekdayFrom(line);
    const timeMatch = line.match(
      /(\d{1,2})[.:](\d{2})\s*[-–—till]{1,4}\s*(\d{1,2})[.:](\d{2})|(\d{1,2})\s*[-–—]\s*(\d{1,2})(?!\d)/,
    );

    if (!timeMatch) {
      if (dayOnly !== null && line.length < 24) currentDay = dayOnly;
      continue;
    }

    const start = timeMatch[1]
      ? normTime(timeMatch[1], timeMatch[2])
      : normTime(timeMatch[5] as string);
    const end = timeMatch[3]
      ? normTime(timeMatch[3], timeMatch[4])
      : normTime(timeMatch[6] as string);

    const weekday = dayOnly ?? currentDay;
    if (weekday === null) continue;
    if (dayOnly !== null) currentDay = dayOnly;

    let rest = line
      .replace(timeMatch[0], " ")
      .replace(/\b(m[åa]n|tis|ons|tors?|fre|l[öo]r|s[öo]n)[a-zà-ö]*\b/gi, " ")
      .replace(/^[\s,;:|·\-–—]+|[\s,;:|·\-–—]+$/g, "")
      .trim();

    let location: string | undefined;
    const locMatch = rest.match(/[(,]\s*(sal\s*)?([A-Za-zÅÄÖåäö0-9 .:-]{1,24})\)?\s*$/i);
    if (locMatch && /\d|sal|rum|hus/i.test(locMatch[0])) {
      location = locMatch[2].trim();
      rest = rest.slice(0, locMatch.index).trim().replace(/[,(-]\s*$/, "").trim();
    }

    const title = rest || "Lektion";
    out.push({ title, weekday, start, end, location });
  }

  return dedupe(out);
}

function unfold(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function icsValue(line: string) {
  const idx = line.indexOf(":");
  return idx === -1
    ? ""
    : line
        .slice(idx + 1)
        .replace(/\\n/g, " ")
        .replace(/\\,/g, ",")
        .replace(/\\;/g, ";")
        .trim();
}

function parseIcsDate(line: string): Date | null {
  const v = icsValue(line);
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] ?? "0"),
    Number(m[5] ?? "0"),
  );
}

/** Läser en .ics-fil (t.ex. TimeEdit/Canvas-export) och gör om till veckoschema. */
export function parseScheduleIcs(text: string): ParsedLecture[] {
  const lines = unfold(text).split("\n");
  const out: ParsedLecture[] = [];
  let inEvent = false;
  let summary = "";
  let location = "";
  let start: Date | null = null;
  let end: Date | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      summary = "";
      location = "";
      start = null;
      end = null;
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("SUMMARY")) summary = icsValue(line);
    else if (line.startsWith("LOCATION")) location = icsValue(line);
    else if (line.startsWith("DTSTART")) start = parseIcsDate(line);
    else if (line.startsWith("DTEND")) end = parseIcsDate(line);
    else if (line.startsWith("END:VEVENT")) {
      inEvent = false;
      if (!start) continue;
      const hhmm = (d: Date) =>
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const startTime = hhmm(start);
      out.push({
        title: summary || "Lektion",
        weekday: (start.getDay() + 6) % 7,
        start: startTime,
        end: end ? hhmm(end) : addMinutes(startTime, 60),
        location: location || undefined,
      });
    }
  }

  return dedupe(out);
}

export function dedupe(items: ParsedLecture[]): ParsedLecture[] {
  const seen = new Set<string>();
  const out: ParsedLecture[] = [];
  for (const l of items) {
    const key = `${l.weekday}|${l.start}|${l.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out.sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
}

/** Nästa tillfälle för en föreläsning, räknat från "now". */
export function nextOccurrence(
  lecture: { weekday: number; start: string; end: string },
  now = new Date(),
): Date {
  const [h, m] = lecture.start.split(":").map(Number);
  const todayIdx = (now.getDay() + 6) % 7;
  let delta = (lecture.weekday - todayIdx + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(now.getDate() + delta);
  candidate.setHours(h, m, 0, 0);
  const [eh, em] = lecture.end.split(":").map(Number);
  const endDate = new Date(candidate);
  endDate.setHours(eh, em, 0, 0);
  if (endDate.getTime() <= now.getTime()) {
    delta += 7;
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

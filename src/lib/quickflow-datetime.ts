/**
 * Tolkar svensk vardagstext som "tvätta fredag 10-14" eller
 * "tandläkaren 12 oktober kl 14" till ett datum och en tid.
 * Hittar aldrig på något – utan tydligt datum eller veckodag
 * returneras null och texten behandlas som vanligt.
 */

export interface ParsedDateTime {
  /** Rensad titel utan datum-/tidsdelen. */
  title: string;
  /** ISO-datum, t.ex. "2026-10-09". */
  date: string;
  /** "HH:MM" eller null om inget klockslag nämndes. */
  startTime: string | null;
  /** "HH:MM" eller null. */
  endTime: string | null;
  /** Människovänlig beskrivning, t.ex. "fredag 9 oktober kl 10:00–14:00". */
  label: string;
}

const WEEKDAYS: Record<string, number> = {
  söndag: 0,
  måndag: 1,
  tisdag: 2,
  onsdag: 3,
  torsdag: 4,
  fredag: 5,
  lördag: 6,
};

const MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  mars: 2,
  april: 3,
  maj: 4,
  juni: 5,
  juli: 6,
  augusti: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11,
};

const MONTH_NAMES = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

const WEEKDAY_NAMES = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

const pad = (n: number) => String(n).padStart(2, "0");

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Nästa förekomst av veckodagen – idag räknas om det är samma dag. */
function nextWeekday(target: number, forceNextWeek: boolean, from: Date): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let diff = (target - d.getDay() + 7) % 7;
  if (forceNextWeek && diff === 0) diff = 7;
  if (forceNextWeek) diff += 0; // "nästa fredag" en fredag = om en vecka
  d.setDate(d.getDate() + diff);
  return d;
}

interface TimeMatch {
  start: string | null;
  end: string | null;
  /** Texten som matchade, för att kunna rensa titeln. */
  raw: string;
}

function parseTime(text: string): TimeMatch | null {
  // "kl 10-14", "10-14", "kl. 14:30", "kl 14", "14:00"
  const range = text.match(
    /(?:kl\.?\s*)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/i,
  );
  if (range) {
    const sh = Number(range[1]);
    const eh = Number(range[3]);
    if (sh >= 0 && sh <= 23 && eh >= 0 && eh <= 23) {
      return {
        start: `${pad(sh)}:${range[2] ?? "00"}`,
        end: `${pad(eh)}:${range[4] ?? "00"}`,
        raw: range[0],
      };
    }
  }
  const single = text.match(/(?:kl\.?\s*)(\d{1,2})(?::(\d{2}))?/i);
  if (single) {
    const h = Number(single[1]);
    if (h >= 0 && h <= 23) {
      return { start: `${pad(h)}:${single[2] ?? "00"}`, end: null, raw: single[0] };
    }
  }
  const colon = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (colon) {
    const h = Number(colon[1]);
    if (h >= 0 && h <= 23) {
      return { start: `${pad(h)}:${colon[2]}`, end: null, raw: colon[0] };
    }
  }
  return null;
}

export function parseQuickflowDateTime(
  input: string,
  now: Date = new Date(),
): ParsedDateTime | null {
  const text = input.trim();
  if (!text) return null;

  let date: Date | null = null;
  let dateRaw = "";

  // 1. Explicit datum: "12 oktober", "12 okt", "12/10", "12.10"
  const monthNames = Object.keys(MONTHS).join("|");
  const named = text.match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})(?:\\s+(\\d{4}))?\\b`, "i"));
  if (named) {
    const day = Number(named[1]);
    const month = MONTHS[named[2].toLowerCase()];
    const year = named[3] ? Number(named[3]) : now.getFullYear();
    const candidate = new Date(year, month, day);
    if (!named[3] && candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
    if (candidate.getDate() === day) {
      date = candidate;
      dateRaw = named[0];
    }
  }
  if (!date) {
    const numeric = text.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);
    if (numeric) {
      const day = Number(numeric[1]);
      const month = Number(numeric[2]) - 1;
      let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
      if (year < 100) year += 2000;
      const candidate = new Date(year, month, day);
      if (!numeric[3] && candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        candidate.setFullYear(candidate.getFullYear() + 1);
      }
      if (month >= 0 && month <= 11 && candidate.getDate() === day) {
        date = candidate;
        dateRaw = numeric[0];
      }
    }
  }

  // 2. Veckodag: "fredag", "nästa torsdag", "i fredags" räknas inte (förflutet).
  if (!date) {
    const weekday = text.match(
      new RegExp(`\\b(nästa\\s+)?(${Object.keys(WEEKDAYS).join("|")})\\b`, "i"),
    );
    if (weekday && !/i\s+(måndags|tisdags|onsdags|torsdags|fredags|lördags|söndags)/i.test(text)) {
      const target = WEEKDAYS[weekday[2].toLowerCase()];
      date = nextWeekday(target, Boolean(weekday[1]), now);
      dateRaw = weekday[0];
    }
  }

  // 3. "imorgon" / "i övermorgon"
  if (!date) {
    const rel = text.match(/\b(i\s+övermorgon|imorgon|idag)\b/i);
    if (rel) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (/övermorgon/i.test(rel[1])) d.setDate(d.getDate() + 2);
      else if (/imorgon/i.test(rel[1])) d.setDate(d.getDate() + 1);
      date = d;
      dateRaw = rel[0];
    }
  }

  if (!date) return null;

  const time = parseTime(text);

  // Rensa titeln: ta bort datum- och tidsdelen samt lösa "kl"-rester.
  let title = text;
  if (dateRaw) title = title.replace(dateRaw, " ");
  if (time) title = title.replace(time.raw, " ");
  title = title
    .replace(/\bkl\.?\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.–-]+|[\s,.–-]+$/g, "")
    .trim();
  if (!title) title = text.trim();

  const dateLabel = `${WEEKDAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
  const timeLabel = time?.start
    ? ` kl ${time.start}${time.end ? `–${time.end}` : ""}`
    : "";

  return {
    title,
    date: toISO(date),
    startTime: time?.start ?? null,
    endTime: time?.end ?? null,
    label: `${dateLabel}${timeLabel}`,
  };
}

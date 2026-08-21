// QuickFlow – "släpp det här hos mig, jag tar hand om strukturen".
//
// Här tolkas EN fritext till flera möjliga delar: en kalenderhändelse,
// en förberedelse-uppgift, en påminnelse. Tolkningen är alltid ett förslag –
// är den otydlig sparas texten hellre som en QuickFlow-post än gissas sönder.

import { guessArea, parseWhenFromText, shoppingTitleFrom, type ParsedWhen } from "./quickflow";
import type { LifeArea } from "./life-areas";

export type UnderstoodKind = "kalender" | "uppgift" | "inkop" | "paminnelse";

export interface UnderstoodPart {
  id: string;
  kind: UnderstoodKind;
  title: string;
  /** YYYY-MM-DD */
  date?: string;
  /** HH:MM */
  time?: string;
  place?: string;
  area: LifeArea;
  /** Kort förklaring: varför MyFlove tror det här. */
  why: string;
}

export interface Understanding {
  parts: UnderstoodPart[];
  /** Sant när tolkningen är osäker – då föreslår vi att bara spara texten. */
  uncertain: boolean;
  /** Frågan som gör tolkningen osäker, t.ex. "fredag den här veckan eller nästa?". */
  question?: string;
}

const PREP_PATTERNS: RegExp[] = [
  /\b(?:och\s+)?(?:jag\s+)?m[åa]ste\s+komma\s+ih[åa]g\s+(.+)$/i,
  /\bkom\s+ih[åa]g\s+(?:att\s+)?(.+)$/i,
  /\bgl[öo]m\s+inte\s+(?:att\s+)?(.+)$/i,
  /\b(?:och\s+)?ta\s+med\s+(?:mig\s+)?(.+)$/i,
  /\b(?:och\s+)?(?:jag\s+)?beh[öo]ver\s+ha\s+med\s+(?:mig\s+)?(.+)$/i,
];

const SHOPPING_WORDS = /\b(k[öo]p|k[öo]pa|handla|inhandla|inköp|skaffa)\b/i;

const TASK_WORDS =
  /\b(ring|ringa|boka|betala|maila|mejla|skicka|fixa|tv[äa]tta|st[äa]da|diska|sortera|packa|ans[öo]k|anm[äa]l|best[äa]ll|prata med|h[äa]mta|l[äa]mna)\b/i;

const LEAD_FILLERS =
  /^(?:\s*(?:s[åa]|och|men|jag)\s+)*(?:ska(?:ll)?|m[åa]ste|beh[öo]ver|vill)?\s*(?:jag\s+)?(?:ska(?:ll)?|m[åa]ste|beh[öo]ver)?\s*(?:iv[äa]g\s+)?(?:till|p[åa]|hos)?\s*/i;

const PLACE_RE = /\b(?:p[åa]|hos|vid)\s+([A-ZÅÄÖ][\wåäöÅÄÖ-]*(?:\s+[A-ZÅÄÖ][\wåäöÅÄÖ-]*)?)/;

const newId = () => Math.random().toString(36).slice(2, 9);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateStr(at: number) {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeStr(at: number) {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Rensar bort tidsuttryck, ledord och avslutande skiljetecken ur en titel. */
function cleanTitle(raw: string, when: ParsedWhen | null): string {
  let t = raw;
  if (when?.matched) t = t.replace(new RegExp(escapeRe(when.matched), "i"), " ");
  t = t
    .replace(/\b(?:kl\.?|klockan)\s*\d{1,2}(?:[.:]\d{2})?\b/gi, " ")
    .replace(/\b\d{1,2}[.:]\d{2}\b/g, " ")
    .replace(/\b(idag|i dag|ikv[äa]ll|i kv[äa]ll|imorgon|i morgon|i övermorgon|övermorgon)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEAD_FILLERS, "")
    .replace(/[,.;\s]+$/, "")
    .trim();
  return capitalize(t || raw.trim());
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Delar upp texten i "huvudsaken" och en eventuell förberedelse
 * ("...och måste komma ihåg högkostnadskortet").
 */
function splitPreparation(text: string): { main: string; prep?: string } {
  for (const re of PREP_PATTERNS) {
    const m = text.match(re);
    if (m?.index !== undefined && m[1]) {
      const main = text
        .slice(0, m.index)
        .replace(/[,\s]+$/, "")
        .trim();
      const prep = m[1].replace(/[.,;\s]+$/, "").trim();
      if (prep.length > 1 && main.length > 2) return { main, prep };
      if (prep.length > 1) return { main: prep, prep: undefined };
    }
  }
  return { main: text.trim() };
}

/**
 * Tolkar en fritext till noll eller flera delar.
 * Hittas inget tydligt returneras en tom lista – då sparas tanken som den är.
 */
export function understand(text: string, now = new Date()): Understanding {
  const raw = text.trim();
  if (!raw) return { parts: [], uncertain: true };

  const { main, prep } = splitPreparation(raw);
  const when = parseWhenFromText(main, now) ?? parseWhenFromText(raw, now);
  const placeMatch = main.match(PLACE_RE) ?? raw.match(PLACE_RE);
  const place = placeMatch?.[1]?.trim();
  const area = guessArea(raw);

  const parts: UnderstoodPart[] = [];

  // Datum/tid gäller oavsett vilken sorts sak det är – en uppgift kan ha klockslag.
  const whenFields = when
    ? {
        date: dateStr(when.at),
        ...(when.allDay ? {} : { time: timeStr(when.at) }),
      }
    : {};
  const whenWhy = when
    ? when.hasTime
      ? ` Du skrev "${when.matched}" och ett klockslag.`
      : ` Du skrev "${when.matched}" – ingen tid, så den ligger under dagen.`
    : "";

  if (SHOPPING_WORDS.test(main)) {
    parts.push({
      id: newId(),
      kind: "inkop",
      title: capitalize(shoppingTitleFrom(cleanTitle(main, when))),
      area,
      why: "Det låter som något du ska köpa.",
    });
  } else if (TASK_WORDS.test(main)) {
    parts.push({
      id: newId(),
      kind: "uppgift",
      title: cleanTitle(main, when),
      ...whenFields,
      ...(place ? { place } : {}),
      area,
      why: `Det låter som något du ska göra.${whenWhy}`,
    });
  } else if (when) {
    // Datum/tid i texten men inget tydligt görande → kalenderhändelse.
    parts.push({
      id: newId(),
      kind: "kalender",
      title: cleanTitle(main, when),
      ...whenFields,
      ...(place ? { place } : {}),
      area,
      why: when.hasTime
        ? `Du skrev "${when.matched}" och ett klockslag.`
        : `Du skrev "${when.matched}" – jag lägger den som heldag.`,
    });
  }


  if (prep) {
    parts.push({
      id: newId(),
      kind: SHOPPING_WORDS.test(prep) ? "inkop" : "uppgift",
      title: SHOPPING_WORDS.test(prep)
        ? capitalize(shoppingTitleFrom(prep))
        : capitalize(prep.replace(LEAD_FILLERS, "").trim() || prep),
      ...(when && !SHOPPING_WORDS.test(prep) ? { date: dateStr(when.at) } : {}),
      area,
      why: "Du nämnde något du måste komma ihåg.",
    });
  }

  return {
    parts,
    uncertain: parts.length === 0 || Boolean(when?.ambiguous),
    ...(when?.ambiguous ? { question: when.ambiguous } : {}),
  };
}

export const KIND_META: Record<UnderstoodKind, { emoji: string; label: string }> = {
  kalender: { emoji: "📅", label: "Kalender" },
  uppgift: { emoji: "✅", label: "Att göra" },
  inkop: { emoji: "🛒", label: "Inköpslista" },
  paminnelse: { emoji: "⏰", label: "Påminnelse" },
};

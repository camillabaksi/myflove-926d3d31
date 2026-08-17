// Quickflow™ – "få ut det ur huvudet".
// Snabbfångst av tankar som INTE får försvinna. Användaren behöver inte
// bestämma vad något är – bara skriva/prata in det. MyFlove håller det.

import type { LifeArea } from "./life-areas";

export type QuickflowLevel = "snabbt" | "viktigt" | "tanke";

export interface QuickflowItem {
  id: string;
  text: string;
  level: QuickflowLevel;
  createdAt: number;
  /** Tidpunkt (epoch ms) då påminnelsen ska ringa. Saknas för öppna tankar. */
  remindAt?: number;
  /** Platsbaserad påminnelse – id/namn från sparade platser. */
  placeId?: string;
  placeName?: string;
  /** Livsområde tanken hör hemma i – sätts i triagen. */
  area?: LifeArea;
  done?: boolean;
  doneAt?: number;
  /** Senast levererad lokal notis (epoch ms) – hindrar dubbletter. */
  notifiedAt?: number;
  /** Senaste gången MyFlove frågade "vill du fortfarande göra det?" */
  askedAt?: number;
  snoozeCount?: number;
  /** Antal gånger samma sak lagts in igen (Dump + Quickflow slås ihop). */
  mergedCount?: number;
  /** När den senast slogs ihop med en dubblett. */
  mergedAt?: number;
}

export const LEVEL_META: Record<
  QuickflowLevel,
  { emoji: string; label: string; hint: string; className: string }
> = {
  snabbt: {
    emoji: "⚡",
    label: "Snabbt",
    hint: "En enkel påminnelse. \"Kom ihåg att köpa mjölk.\"",
    className: "bg-gold/15 text-ink border-gold/40",
  },
  viktigt: {
    emoji: "📌",
    label: "Viktigt",
    hint: "Prioriteras och påminns tydligare. \"Jag måste ringa vårdcentralen.\"",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  tanke: {
    emoji: "💭",
    label: "Bara få ur huvudet",
    hint: "Sparas som en öppen tanke – jag frågar dig senare.",
    className: "bg-sage/30 text-ink border-sage",
  },
};

export interface WhenPreset {
  id: string;
  label: string;
  /** Returnerar epoch ms, eller null om användaren ska välja själv. */
  compute: (now?: Date) => number | null;
}

function atToday(hour: number, minute = 0, now = new Date()): number {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export const WHEN_PRESETS: WhenPreset[] = [
  { id: "30min", label: "Om 30 min", compute: (now = new Date()) => now.getTime() + 30 * 60_000 },
  {
    id: "tonight",
    label: "Ikväll",
    compute: (now = new Date()) => {
      const t = atToday(18, 0, now);
      return t > now.getTime() ? t : now.getTime() + 60 * 60_000;
    },
  },
  {
    id: "tomorrow",
    label: "Imorgon",
    compute: (now = new Date()) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    },
  },
];

const MONTHS: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, mars: 2,
  apr: 3, april: 3,
  maj: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  aug: 7, augusti: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const WEEKDAY_WORDS: Record<string, number> = {
  söndag: 0, sondag: 0,
  måndag: 1, mandag: 1,
  tisdag: 2,
  onsdag: 3,
  torsdag: 4,
  fredag: 5,
  lördag: 6, lordag: 6,
};

export type WhenOption = {
  label: string;
  at: number;
  allDay: boolean;
};

export type ParsedWhen = {
  /** Epoch ms för det datum/tid som stod i texten. */
  at: number;
  /** Den bit av texten som tolkades, t.ex. "25 augusti". */
  matched: string;
  /** Sant om ett klockslag också hittades. */
  hasTime: boolean;
  /** Inget klockslag angavs – då lägger vi in det som heldag. */
  allDay: boolean;
  /** Varför tolkningen är osäker – visas som en fråga till användaren. */
  ambiguous?: string;
  /** Alternativ att välja mellan när tolkningen är osäker. */
  options?: WhenOption[];
};


/**
 * Läser ut datum och tid ur en fritext ("läkartid med Cassie den 25 augusti kl 14").
 * Returnerar null när inget datum nämns – då gäller de vanliga förslagen.
 */
export function parseWhenFromText(text: string, now = new Date()): ParsedWhen | null {
  const t = text.toLowerCase();

  // Klockslag: "kl 14", "kl. 14:30", "14.30"
  let hour: number | null = null;
  let minute = 0;
  const timeMatch =
    t.match(/\b(?:kl\.?|klockan)\s*(\d{1,2})(?:[.:](\d{2}))?\b/) ??
    t.match(/\b(\d{1,2})[.:](\d{2})\b/);
  if (timeMatch) {
    const h = Number(timeMatch[1]);
    const m = Number(timeMatch[2] ?? "0");
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      hour = h;
      minute = m;
    }
  }

  const build = (d: Date, matched: string): ParsedWhen => {
    d.setHours(hour ?? 9, hour === null ? 0 : minute, 0, 0);
    return { at: d.getTime(), matched, hasTime: hour !== null };
  };

  // "25 augusti" / "den 25 aug" / "augusti 25"
  const monthNames = Object.keys(MONTHS).join("|");
  const dm =
    t.match(new RegExp(`\\b(?:den\\s+)?(\\d{1,2})(?:\\s*[:e]{0,2})?\\s+(${monthNames})\\b`)) ??
    t.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})\\b`));
  if (dm) {
    const isDayFirst = /\d/.test(dm[1] ?? "");
    const day = Number(isDayFirst ? dm[1] : dm[2]);
    const month = MONTHS[(isDayFirst ? dm[2] : dm[1]) as string];
    if (day >= 1 && day <= 31 && month !== undefined) {
      const d = new Date(now.getFullYear(), month, day);
      // Datum som redan passerat tolkas som nästa år.
      if (d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
        d.setFullYear(d.getFullYear() + 1);
      }
      const label = `${day} ${isDayFirst ? dm[2] : dm[1]}`;
      return build(d, label);
    }
  }

  // "25/8", "25/8-2026", "2026-08-25"
  const iso = t.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return build(d, iso[0]);
  }
  const slash = t.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*[-–]\s*(20\d{2}))?\b/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(slash[3] ? Number(slash[3]) : now.getFullYear(), month, day);
      if (
        !slash[3] &&
        d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      ) {
        d.setFullYear(d.getFullYear() + 1);
      }
      return build(d, slash[0]);
    }
  }

  // "imorgon", "i övermorgon"
  if (/\b(i\s*övermorgon|övermorgon)\b/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return build(d, "i övermorgon");
  }
  if (/\b(imorgon|i morgon)\b/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return build(d, "imorgon");
  }

  // "på fredag", "nästa tisdag"
  const wd = t.match(
    new RegExp(`\\b(nästa|på|i)?\\s*(${Object.keys(WEEKDAY_WORDS).join("|")})\\b`),
  );
  if (wd) {
    const target = WEEKDAY_WORDS[wd[2] as string]!;
    const d = new Date(now);
    let delta = (target - d.getDay() + 7) % 7;
    if (delta === 0) delta = 7;
    if (wd[1] === "nästa" && delta < 7) delta += 7;
    d.setDate(d.getDate() + delta);
    return build(d, `${wd[1] ? `${wd[1]} ` : ""}${wd[2]}`);
  }

  return null;
}

/** "Jag vet inte – hjälp mig": MyFlove föreslår en tid som brukar funka. */
export function suggestWhen(
  level: QuickflowLevel,
  text: string,
  now = new Date(),
): { at: number; why: string } {
  // Står ett datum i texten vinner det alltid över generella gissningar.
  const parsed = parseWhenFromText(text, now);
  if (parsed) {
    return {
      at: parsed.at,
      why: parsed.hasTime
        ? `Du skrev "${parsed.matched}" – jag använder det datumet och tiden.`
        : `Du skrev "${parsed.matched}" – jag lägger den då, kl 09. Ändra tiden om du vill.`,
    };
  }

  const lower = text.toLowerCase();
  const shoppingish = /(köp|handla|mjölk|mat|affär|ica|coop|willys|apotek)/.test(lower);
  const callish = /(ring|boka|maila|mejla|kontakta|vårdcentral|försäkring|bank|myndighet)/.test(lower);
  const hour = now.getHours();

  if (callish || level === "viktigt") {
    // Myndigheter och samtal: nästa vardagsförmiddag kl 09.
    const d = new Date(now);
    if (hour >= 9 && hour < 15 && d.getDay() >= 1 && d.getDay() <= 5) {
      return { at: now.getTime() + 60 * 60_000, why: "Om en timme – då är det fortfarande kontorstid." };
    }
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() === 0 || d.getDay() === 6);
    d.setHours(9, 0, 0, 0);
    return { at: d.getTime(), why: "Nästa vardag kl 09 – då är det oftast öppet." };
  }

  if (shoppingish) {
    const t = atToday(16, 30, now);
    if (t > now.getTime()) return { at: t, why: "Sen eftermiddag – lagom innan du åker hem." };
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(16, 30, 0, 0);
    return { at: d.getTime(), why: "Imorgon eftermiddag – innan affären stänger." };
  }

  if (hour < 20) {
    const t = atToday(Math.max(hour + 2, 12), 0, now);
    return { at: t, why: "Senare idag, när du hunnit landa." };
  }
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return { at: d.getTime(), why: "Imorgon förmiddag – kvällen får vara ledig." };
}

const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

/** "Idag 17:00", "Imorgon 09:00", "Fredag 12:00" */
export function formatWhen(at: number, now = new Date()): string {
  const d = new Date(at);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  if (diffDays === 0) return `Idag ${time}`;
  if (diffDays === 1) return `Imorgon ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${capitalize(WEEKDAYS[d.getDay()]!)} ${time}`;
  return `${d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} ${time}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Liten ikon-gissning så listan känns levande. */
export function guessEmoji(text: string, level: QuickflowLevel): string {
  const lower = text.toLowerCase();
  if (/(köp|handla|mjölk|affär|inköp)/.test(lower)) return "🛒";
  if (/(ring|samtal|telefon)/.test(lower)) return "📞";
  if (/(mail|mejl|maila|skicka)/.test(lower)) return "✉️";
  if (/(läkare|vårdcentral|tandläkare|medicin|apotek)/.test(lower)) return "🏥";
  if (/(betala|faktura|räkning|bank|pengar)/.test(lower)) return "💳";
  if (/(kolla|läs|undersök|stipendi)/.test(lower)) return "💡";
  if (/(barn|skola|förskola|träning|kläder)/.test(lower)) return "🧒";
  return LEVEL_META[level].emoji;
}

/** En öppen tanke som legat ett tag – dags att fråga snällt. */
export function shouldAskAboutThought(item: QuickflowItem, now = Date.now()): boolean {
  if (item.done || item.remindAt) return false;
  const since = item.askedAt ?? item.createdAt;
  return now - since > 2 * 24 * 60 * 60 * 1000;
}

/** Påminnelsen har passerat och inget hände – fråga om den fortfarande gäller. */
export function isOverdue(item: QuickflowItem, now = Date.now()): boolean {
  if (item.done || !item.remindAt) return false;
  return now - item.remindAt > 60 * 60 * 1000;
}

/** Normaliserar text så "Handla mjölk!" och "handla  mjölk" räknas som samma sak. */
export function normalizeQuickflowText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(att|en|ett|den|det|jag|ska|måste|kom|ihåg|komma)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hittar en befintlig, ej avklarad post som handlar om samma sak. */
export function findDuplicate(items: QuickflowItem[], text: string): QuickflowItem | undefined {
  const key = normalizeQuickflowText(text);
  if (!key) return undefined;
  return items.find((i) => !i.done && normalizeQuickflowText(i.text) === key);
}

const LEVEL_RANK: Record<QuickflowLevel, number> = { tanke: 0, snabbt: 1, viktigt: 2 };

/** Vid sammanfogning vinner den viktigaste nivån. */
export function strongerLevel(a: QuickflowLevel, b: QuickflowLevel): QuickflowLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}


/** Gissar livsområde ur texten. Alltid ändringsbart av användaren. */
export function guessArea(text: string): LifeArea {
  const t = text.toLowerCase();
  if (/(tenta|prov|plugg|kurs|föreläsning|inlämning|uppsats|skola|studie|seminarium)/.test(t))
    return "studier";
  if (/(jobb|möte|chef|kollega|kund|deadline|projekt|rapport|arbets|mejl till)/.test(t))
    return "jobb";
  if (/(barn|familj|förskola|läkare|tandläkare|bank|faktura|räkning|försäkring|present|semester|kompis|vän)/.test(t))
    return "privat";
  return "vardag";
}

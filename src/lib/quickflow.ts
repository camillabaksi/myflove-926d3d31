// Quickflow™ – "få ut det ur huvudet".
// Snabbfångst av tankar som INTE får försvinna. Användaren behöver inte
// bestämma vad något är – bara skriva/prata in det. MyFlove håller det.

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
  done?: boolean;
  doneAt?: number;
  /** Senast levererad lokal notis (epoch ms) – hindrar dubbletter. */
  notifiedAt?: number;
  /** Senaste gången MyFlove frågade "vill du fortfarande göra det?" */
  askedAt?: number;
  snoozeCount?: number;
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

/** "Jag vet inte – hjälp mig": MyFlove föreslår en tid som brukar funka. */
export function suggestWhen(
  level: QuickflowLevel,
  text: string,
  now = new Date(),
): { at: number; why: string } {
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

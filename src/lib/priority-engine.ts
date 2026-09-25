/**
 * Prioritetsmotorn – EN gemensam logik för "vad måste göras, vad kan vänta?".
 *
 * Kapacitetsläge (Fullt / Mellan / Lågt) och prioritet (P1–P4) är två olika
 * saker: prioriteten beskriver verkligheten, kapacitetsläget bestämmer bara
 * hur mycket som läggs på dagens plan. En P3 blir aldrig P1 för att dagen
 * är tung – den flyttas i stället.
 *
 * Ren logik utan lagring. Kan användas av Hem, FlowPlan, Flow, notiser och
 * kalendern så att alla ger samma svar.
 */

export type CapacityMode = "fullt" | "mellan" | "lagt";
export type PriorityLevel = 1 | 2 | 3 | 4;

export const CAPACITY_META: Record<
  CapacityMode,
  { label: string; dot: string; meaning: string }
> = {
  fullt: { label: "Fullt", dot: "🟢", meaning: "Relativt bra kapacitet idag." },
  mellan: { label: "Mellan", dot: "🟡", meaning: "Jag fungerar, men hushållar." },
  lagt: { label: "Lågt", dot: "🔴", meaning: "En sak i taget idag." },
};

export const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  1: "Måste idag",
  2: "Bör göras",
  3: "Kan vänta",
  4: "Extra",
};

export interface PlanInput {
  id: string;
  title: string;
  /** HH:MM om saken har en fast tid idag. */
  time?: string;
  /** YYYY-MM-DD deadline. */
  dueDate?: string;
  /** Kalenderhändelser/lektioner räknas som fasta tider. */
  fixed?: boolean;
  /** Går att flytta till ett annat datum (uppgifter, inte kalenderhändelser). */
  movable?: boolean;
}

export interface Prioritized<T extends PlanInput = PlanInput> {
  item: T;
  priority: PriorityLevel;
  /** Kort, skuldfri förklaring. */
  reason: string;
  /** Måste den ske just idag? Styr LÅGT-läget för P2. */
  needsToday: boolean;
}

const HEALTH = /medicin|tablett|läkar|doktor|vårdcentral|tandläkar|sjukhus|psykolog|vaccin|recept/i;
const CARE = /hämta\s+(barn|\w+\s+på)|lämna\s+(barn|på)|förskola|dagis|fritids|hämta\s+på\s+skola|hämtning|lämning/i;
const FIXED_WORDS = /bokad|möte|tid hos|besök|intervju|tenta|prov\b|jobb|arbete|skola|lektion|resa|flyg|tåg/i;
const MONEY = /betala|faktura|räkning|deklar|ansök|lämna in|inlämning|förfaller|deadline/i;
const TODAY_WORD = /\bidag\b|\bi dag\b|ikväll|i kväll/i;
const EXTRA = /organisera|rensa|garderob|bilder|foton|extra|projekt|om jag hinner|inred|pyssel|fixa i/i;
const SHOULD = /handla|inköp|laga|middag|frukost|lunch|matlåd|förbered|packa|väska|arbetskläder|läxa|imorgon|i morgon|tvätta\s+arbets/i;
const LAUNDRY_START = /starta\s+tvätt|sätt\s+på\s+tvätt|tvättmaskin/i;

function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(`${fromISO}T00:00:00Z`);
  const b = Date.parse(`${toISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Konsekvens och sammanhang väger tyngre än uppgiftstyp. */
export function classifyPriority<T extends PlanInput>(item: T, today: string): Prioritized<T> {
  const t = item.title;
  const due = item.dueDate ? daysBetween(today, item.dueDate) : null;
  const hasTime = Boolean(item.time);

  if (HEALTH.test(t)) return { item, priority: 1, reason: "Gäller din hälsa.", needsToday: true };
  if (CARE.test(t))
    return { item, priority: 1, reason: "Någon är beroende av dig.", needsToday: true };
  if (due != null && due < 0)
    return {
      item,
      priority: 1,
      reason: "Den blev inte klar tidigare. Vill du göra den idag eller välja ett nytt datum?",
      needsToday: true,
    };
  if (due === 0 || (MONEY.test(t) && TODAY_WORD.test(t)))
    return { item, priority: 1, reason: "Har deadline idag.", needsToday: true };
  if (item.fixed || (hasTime && FIXED_WORDS.test(t)))
    return { item, priority: 1, reason: "Har en fast tid idag.", needsToday: true };

  if (EXTRA.test(t)) return { item, priority: 4, reason: "Bra om du hinner.", needsToday: false };

  if (due != null && due <= 2)
    return { item, priority: 2, reason: "Deadline närmar sig.", needsToday: due <= 1 };
  if (hasTime || LAUNDRY_START.test(t))
    return { item, priority: 2, reason: "Har en planerad tid idag.", needsToday: hasTime };
  if (SHOULD.test(t))
    return {
      item,
      priority: 2,
      reason: "Gör morgondagen enklare.",
      needsToday: TODAY_WORD.test(t),
    };
  if (MONEY.test(t)) return { item, priority: 2, reason: "Bra att få gjort snart.", needsToday: false };

  return { item, priority: 3, reason: "Kan flyttas utan större konsekvens.", needsToday: false };
}

/* ── Beroenden ─────────────────────────────────────────────────── */

/** Kedjor där steg i måste ske före steg i+1. */
const CHAINS: RegExp[][] = [
  [/starta\s+tvätt|sätt\s+på\s+tvätt|tvätta\b/i, /häng|torktumla/i, /vik\b|vika|lägg\s+in\s+tvätt/i],
  [/packa.*väska|väska/i, /klä\s+på/i, /gå\s+hemifrån|åka|lämna/i],
  [/handla|inköp/i, /laga|middag/i],
];

function chainPos(title: string): { chain: number; step: number } | null {
  for (let c = 0; c < CHAINS.length; c++) {
    const chain = CHAINS[c];
    for (let s = chain.length - 1; s >= 0; s--) {
      if (chain[s].test(title)) return { chain: c, step: s };
    }
  }
  return null;
}

/** En uppgift som blockerar en P1 ärver P1. */
function applyDependencies<T extends PlanInput>(list: Prioritized<T>[]): Prioritized<T>[] {
  return list.map((p) => {
    const pos = chainPos(p.item.title);
    if (!pos) return p;
    const blocksHigher = list.some((o) => {
      const op = chainPos(o.item.title);
      return op && op.chain === pos.chain && op.step > pos.step && o.priority < p.priority;
    });
    if (!blocksHigher) return p;
    const top = Math.min(
      ...list
        .filter((o) => {
          const op = chainPos(o.item.title);
          return op && op.chain === pos.chain && op.step > pos.step;
        })
        .map((o) => o.priority),
    ) as PriorityLevel;
    return { ...p, priority: top, reason: "Behövs innan nästa steg.", needsToday: true };
  });
}

function toMin(time?: string): number {
  if (!time) return Number.POSITIVE_INFINITY;
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : Number.POSITIVE_INFINITY;
}

function compare<T extends PlanInput>(a: Prioritized<T>, b: Prioritized<T>): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const pa = chainPos(a.item.title);
  const pb = chainPos(b.item.title);
  if (pa && pb && pa.chain === pb.chain) return pa.step - pb.step;
  const ta = toMin(a.item.time);
  const tb = toMin(b.item.time);
  if (ta !== tb) return ta - tb;
  const da = a.item.dueDate ?? "9999";
  const db = b.item.dueDate ?? "9999";
  return da.localeCompare(db);
}

export function prioritize<T extends PlanInput>(items: T[], today: string): Prioritized<T>[] {
  return applyDependencies(items.map((i) => classifyPriority(i, today))).sort(compare);
}

/* ── Kapacitet + prioritet ─────────────────────────────────────── */

export interface CapacityPlan<T extends PlanInput = PlanInput> {
  mode: CapacityMode;
  /** Det som ligger på dagens plan, i föreslagen ordning. */
  planned: Prioritized<T>[];
  /** Frivilligt – visas bara i FULLT. */
  extras: Prioritized<T>[];
  /** Föreslås flyttas. Användaren bestämmer. */
  deferred: Prioritized<T>[];
  /** Kort meddelande anpassat efter läget. */
  message: string;
}

const LIMITS: Record<CapacityMode, { p2: number; p3: number }> = {
  fullt: { p2: Infinity, p3: 3 },
  mellan: { p2: 2, p3: 1 },
  lagt: { p2: Infinity, p3: 0 },
};

export function planForCapacity<T extends PlanInput>(
  items: T[],
  mode: CapacityMode,
  today: string,
): CapacityPlan<T> {
  const ranked = prioritize(items, today);
  const planned: Prioritized<T>[] = [];
  const extras: Prioritized<T>[] = [];
  const deferred: Prioritized<T>[] = [];
  const limit = LIMITS[mode];
  let p2 = 0;
  let p3 = 0;

  for (const p of ranked) {
    if (p.priority === 1) planned.push(p);
    else if (p.priority === 2) {
      const ok = mode === "lagt" ? p.needsToday : p2 < limit.p2;
      if (ok) {
        planned.push(p);
        p2++;
      } else deferred.push(p);
    } else if (p.priority === 3) {
      // MELLAN: bara om dagen i övrigt är lätt.
      const roomy = mode !== "mellan" || planned.length < 3;
      if (p3 < limit.p3 && roomy) {
        planned.push(p);
        p3++;
      } else deferred.push(p);
    } else if (mode === "fullt") extras.push(p);
    else deferred.push(p);
  }

  return { mode, planned, extras, deferred, message: capacityMessage(mode, planned) };
}

export function capacityMessage(mode: CapacityMode, planned: Prioritized[]): string {
  const first = planned[0]?.item.title;
  if (mode === "lagt") return first ? `Vi tar en sak i taget. Först: ${first}.` : "Vi tar en sak i taget.";
  if (mode === "mellan") return "Vi håller dagen enkel. Det viktigaste ligger först.";
  return planned.length > 1
    ? "Jag har lagt dagens saker i en ordning som minskar onödiga steg."
    : "Du har utrymme idag. Det finns inget som måste pressas in.";
}

/** Meddelande när läget sänks under dagen. */
export function recalcMessage(from: CapacityMode, to: CapacityMode): string | null {
  const order: CapacityMode[] = ["fullt", "mellan", "lagt"];
  return order.indexOf(to) > order.indexOf(from)
    ? "Jag har förenklat resten av dagen. Det viktigaste ligger kvar."
    : null;
}

/* ── Förenkla ──────────────────────────────────────────────────── */

const SIMPLER: Array<{ re: RegExp; mellan: string; lagt: string }> = [
  { re: /laga\s+(middag|mat|lunch)|middag/i, mellan: "Välj en enklare middag.", lagt: "Ät något enkelt som redan finns hemma." },
  { re: /städa\s+köket|köket/i, mellan: "Gör bara diskbänken och disken.", lagt: "Flytta bara undan det som behöver användas." },
  { re: /städa|dammsug/i, mellan: "Ta bara det rum som stör mest.", lagt: "Det kan vänta till en annan dag." },
  { re: /handla|inköp/i, mellan: "Handla bara det som behövs till imorgon.", lagt: "Beställ hem eller köp bara det nödvändigaste." },
  { re: /tvätt/i, mellan: "Tvätta bara det du behöver snart.", lagt: "Bara det du behöver imorgon." },
  { re: /träna|gym|löp/i, mellan: "Ett kortare pass räcker.", lagt: "En kort promenad eller stretch räcker." },
];

/** En enklare version när läget är Mellan eller Lågt. Null = ingen förenkling. */
export function simplifyTask(title: string, mode: CapacityMode): string | null {
  if (mode === "fullt") return null;
  const hit = SIMPLER.find((s) => s.re.test(title));
  return hit ? hit[mode] : null;
}

/* ── Parallellt ────────────────────────────────────────────────── */

const RUNS_ITSELF = /starta\s+tvätt|sätt\s+på\s+tvätt|tvättmaskin|diskmaskin|robotdammsug|ugn|deg\s+jäsa|bröd/i;
const HANDS_ON = /laga|middag|duscha|packa|förbered|plocka|lunch|frukost/i;

export interface ParallelTip {
  startId: string;
  whileId: string;
  text: string;
}

/**
 * Försiktiga förslag på saker som kan göras samtidigt. Max ett förslag –
 * målet är färre steg, inte maximal effektivitet.
 */
export function parallelTip(planned: Prioritized[]): ParallelTip | null {
  const start = planned.find((p) => RUNS_ITSELF.test(p.item.title));
  if (!start) return null;
  const during = planned.find((p) => p !== start && HANDS_ON.test(p.item.title));
  if (!during) return null;
  const s = start.item.title.replace(/\s*\d{1,2}[:.]\d{2}\s*/, " ").trim();
  return {
    startId: start.item.id,
    whileId: during.item.id,
    text: `${s} först. ${during.item.title} medan den går.`,
  };
}

/**
 * Plan i ord – t.ex. tvättscenariot:
 * "Starta tvätten först. Laga middag medan den går. Häng tvätten när maskinen är klar. Vik tvätten senare."
 */
export function planSteps(planned: Prioritized[]): string[] {
  const tip = parallelTip(planned);
  const steps: string[] = [];
  const used = new Set<string>();
  for (const p of planned) {
    if (used.has(p.item.id)) continue;
    if (tip && p.item.id === tip.startId) {
      const whileItem = planned.find((x) => x.item.id === tip.whileId);
      steps.push(`${stripTime(p.item.title)} först.`);
      if (whileItem) {
        steps.push(`${whileItem.item.title} medan den går.`);
        used.add(whileItem.item.id);
      }
    } else if (/häng/i.test(p.item.title) && tip) {
      steps.push(`${p.item.title} när maskinen är klar.`);
    } else if (/vik\b|vika/i.test(p.item.title)) {
      steps.push(`${p.item.title} senare.`);
    } else {
      steps.push(`${stripTime(p.item.title)}.`);
    }
    used.add(p.item.id);
  }
  return steps;
}

function stripTime(title: string): string {
  return title.replace(/\s*\d{1,2}[:.]\d{2}\s*$/, "").trim();
}

/* ── Stopp-principen ───────────────────────────────────────────── */

const FULL_DAY: Record<CapacityMode, number> = { fullt: 8, mellan: 5, lagt: 3 };

/** Mjuk varning – aldrig ett förbud. */
export function isDayFull(plannedCount: number, mode: CapacityMode): boolean {
  return plannedCount >= FULL_DAY[mode];
}

/* ── Kapacitetsläge från befintliga signaler ───────────────────── */

/** Samma trösklar som orken i ord (Låg < 40, Lagom < 70, God). */
export function capacityFromPercent(percent: number): CapacityMode {
  if (percent < 40) return "lagt";
  if (percent < 70) return "mellan";
  return "fullt";
}

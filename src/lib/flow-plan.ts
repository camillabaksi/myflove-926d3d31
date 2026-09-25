// FlowPlan – den ENDA motorn som svarar på "Vad gör jag nu?".
//
// FlowPlan skapar ingen egen prioritering och ingen energimodell. Den har
// exakt två inputs:
//   1. Prioritet P1–P4 från priority-engine (via planForCapacity)
//   2. Kapacitetsläget Fullt/Mellan/Lågt från useCapacityMode
// och lägger till det som behövs för att planen ska gå att GÖRA:
//   - fasta tider respekteras (det som snart börjar kommer först)
//   - beroenden respekteras (packa väskan före gå till bussen)
//   - saker som kan ske parallellt föreslås försiktigt (inte i Lågt)
//
// Batteri, FlowScore och Energiflöde är INTE inputs här. Samma uppgifter +
// samma prioritet + samma kapacitetsläge ger alltid samma plan.

import {
  chainPos,
  parallelTip,
  planForCapacity,
  type CapacityMode,
  type ParallelTip,
  type PlanInput,
  type Prioritized,
} from "@/lib/priority-engine";

export interface FlowPlanOptions {
  mode: CapacityMode;
  /** YYYY-MM-DD */
  today: string;
  /** Minuter sedan midnatt, lokal tid. */
  nowMinutes: number;
  /** Id:n användaren sagt "Inte nu" om – hamnar sist, aldrig som Nu. */
  skip?: string[];
}

export interface FlowPlan<T extends PlanInput = PlanInput> {
  mode: CapacityMode;
  /** Nästa konkreta handling. */
  now: Prioritized<T> | null;
  /** Det som kommer därefter. Alltid null i Lågt – färre beslut. */
  next: Prioritized<T> | null;
  /** Resten av dagens plan, i ordning (efter Nu och Sedan). */
  later: Prioritized<T>[];
  /** Hela dagens plan i genomförandeordning. */
  order: Prioritized<T>[];
  /** Kan vänta – föreslås flyttas, användaren bestämmer. */
  waiting: Prioritized<T>[];
  /** Frivilligt i Fullt. */
  extras: Prioritized<T>[];
  /** Max ett parallellförslag. Aldrig i Lågt. */
  parallel: ParallelTip | null;
  /** Kort meddelande anpassat efter läget. */
  message: string;
}

/** Hur nära i tid en fast tid ska vara för att gå före allt annat. */
const SOON_MIN = 30;
/** Hur länge en passerad fast tid fortfarande räknas som "pågår". */
const ONGOING_MIN = 60;

function toMin(time?: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
}

/** Flyttar tidigare kedjesteg före senare, utan att röra något annat. */
function enforceChains<T extends PlanInput>(list: Prioritized<T>[]): Prioritized<T>[] {
  const out = [...list];
  for (let guard = 0; guard < out.length * out.length; guard++) {
    let moved = false;
    outer: for (let i = 0; i < out.length; i++) {
      const pi = chainPos(out[i].item.title);
      if (!pi) continue;
      for (let j = i + 1; j < out.length; j++) {
        const pj = chainPos(out[j].item.title);
        if (pj && pj.chain === pi.chain && pj.step < pi.step) {
          const [x] = out.splice(j, 1);
          out.splice(i, 0, x);
          moved = true;
          break outer;
        }
      }
    }
    if (!moved) break;
  }
  return out;
}

/**
 * Genomförandeordning: fast tid som snart börjar/pågår → övrigt i
 * prioritetsordning → senare fasta tider i tidsordning → passerade fasta
 * tider sist. Beroendekedjor justeras till sist så de aldrig blir omvända.
 */
export function orderForNow<T extends PlanInput>(
  planned: Prioritized<T>[],
  nowMinutes: number,
): Prioritized<T>[] {
  const soon: Array<[number, Prioritized<T>]> = [];
  const laterTimed: Array<[number, Prioritized<T>]> = [];
  const past: Array<[number, Prioritized<T>]> = [];
  const untimed: Prioritized<T>[] = [];

  for (const p of planned) {
    const m = toMin(p.item.time);
    if (m == null) untimed.push(p);
    else if (m < nowMinutes - ONGOING_MIN) past.push([m, p]);
    else if (m <= nowMinutes + SOON_MIN) soon.push([m, p]);
    else laterTimed.push([m, p]);
  }
  const byTime = (a: [number, Prioritized<T>], b: [number, Prioritized<T>]) => a[0] - b[0];
  return enforceChains([
    ...soon.sort(byTime).map((x) => x[1]),
    ...untimed,
    ...laterTimed.sort(byTime).map((x) => x[1]),
    ...past.sort(byTime).map((x) => x[1]),
  ]);
}

function planMessage(mode: CapacityMode, now: Prioritized | null, count: number): string {
  if (!now) return "Det finns inget som väntar just nu.";
  if (mode === "lagt") return "Det räcker just nu.";
  if (mode === "mellan") return "Vi håller dagen enkel. Det viktigaste ligger först.";
  return count > 1
    ? "Jag har lagt dagens saker i en ordning som minskar onödiga steg."
    : "Du har utrymme idag. Det finns inget som måste pressas in.";
}

export function buildFlowPlan<T extends PlanInput>(
  items: T[],
  opts: FlowPlanOptions,
): FlowPlan<T> {
  const base = planForCapacity(items, opts.mode, opts.today);
  const skip = new Set(opts.skip ?? []);
  const ordered = orderForNow(base.planned, opts.nowMinutes);
  const active = ordered.filter((p) => !skip.has(p.item.id));
  const skipped = ordered.filter((p) => skip.has(p.item.id));
  const order = [...active, ...skipped];

  const now = active[0] ?? null;
  const next = opts.mode === "lagt" ? null : (active[1] ?? null);
  const later = order.filter((p) => p !== now && p !== next);

  return {
    mode: opts.mode,
    now,
    next,
    later,
    order,
    waiting: base.deferred,
    extras: base.extras,
    parallel: opts.mode === "lagt" ? null : parallelTip(active),
    message: planMessage(opts.mode, now, order.length),
  };
}

/**
 * FlowPlan i ord för Flow-chatten. Flow får formulera sig varmt, men själva
 * rekommendationen kommer härifrån.
 */
export function flowPlanContext(plan: FlowPlan): string {
  const label = { fullt: "Fullt", mellan: "Mellan", lagt: "Lågt" }[plan.mode];
  const lines = [`FlowPlan (enda källan för nästa steg). Kapacitetsläge: ${label}.`];
  if (!plan.now) {
    lines.push("Nu: inget planerat just nu.");
  } else {
    const t = (p: Prioritized) => `${p.item.time ? `${p.item.time} ` : ""}${p.item.title}`;
    lines.push(`Nu: ${t(plan.now)} (P${plan.now.priority})`);
    if (plan.next) lines.push(`Sedan: ${t(plan.next)} (P${plan.next.priority})`);
    if (plan.mode !== "lagt" && plan.later.length)
      lines.push(`Därefter: ${plan.later.slice(0, 4).map(t).join("; ")}`);
    if (plan.waiting.length)
      lines.push(`Kan vänta: ${plan.waiting.slice(0, 4).map((p) => p.item.title).join("; ")}`);
    if (plan.parallel) lines.push(`Parallellt: ${plan.parallel.text}`);
  }
  lines.push(
    "Regel: föreslå aldrig en annan nästa uppgift än FlowPlans Nu. Vid Lågt: bara Nu, mycket kort.",
  );
  return lines.join("\n");
}

// Egna sorteringsregler för QuickFlow.
// "Allt som börjar med köpa → Inköpslistan", "boka → Kalendern kl 09:00".
// Reglerna är alltid användarens egna och går före MyFloves gissning.

import type { LifeArea } from "./life-areas";
import { guessDestination, type QuickflowDestination } from "./quickflow";

export type RuleMatchType = "startsWith" | "contains" | "endsWith";

export interface QuickflowRule {
  id: string;
  /** Ordet eller frasen som ska kännas igen, t.ex. "köpa". */
  phrase: string;
  matchType: RuleMatchType;
  /** Vart texten ska hamna. */
  destination: QuickflowDestination;
  /** Valfritt livsområde, t.ex. privat. */
  area?: LifeArea;
  /** Valfritt klockslag "HH:MM" som används för kalender/påminnelse. */
  time?: string;
  /** Ta bort frasen ur titeln ("köpa schampo" → "schampo"). */
  stripPhrase?: boolean;
  enabled: boolean;
  createdAt: number;
}

export const MATCH_LABEL: Record<RuleMatchType, string> = {
  startsWith: "börjar med",
  contains: "innehåller",
  endsWith: "slutar med",
};

export const newRuleId = () => Math.random().toString(36).slice(2, 11);

/** Färdiga förslag så att man slipper börja från ett tomt blad. */
export const RULE_TEMPLATES: Array<Omit<QuickflowRule, "id" | "createdAt">> = [
  { phrase: "köpa", matchType: "startsWith", destination: "inkop", stripPhrase: true, enabled: true },
  { phrase: "handla", matchType: "startsWith", destination: "inkop", stripPhrase: true, enabled: true },
  { phrase: "boka", matchType: "startsWith", destination: "kalender", enabled: true },
  { phrase: "ring", matchType: "startsWith", destination: "uppgift", enabled: true },
  { phrase: "betala", matchType: "startsWith", destination: "uppgift", area: "privat", enabled: true },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Hittar första regeln som passar texten. Ordningen i listan bestämmer. */
export function matchRule(text: string, rules: QuickflowRule[]): QuickflowRule | undefined {
  const t = normalize(text);
  if (!t) return undefined;
  return rules.find((r) => {
    if (!r.enabled) return false;
    const p = normalize(r.phrase);
    if (!p) return false;
    if (r.matchType === "startsWith") return t.startsWith(p);
    if (r.matchType === "endsWith") return t.endsWith(p);
    return t.includes(p);
  });
}

/** Titeln efter att frasen plockats bort, om regeln säger så. */
export function titleForRule(text: string, rule: QuickflowRule): string {
  if (!rule.stripPhrase) return text.trim();
  const p = normalize(rule.phrase);
  const t = text.trim();
  const lower = normalize(t);
  let out = t;
  if (rule.matchType === "startsWith" && lower.startsWith(p)) out = t.slice(p.length);
  else if (rule.matchType === "endsWith" && lower.endsWith(p)) out = t.slice(0, t.length - p.length);
  else {
    const i = lower.indexOf(p);
    if (i >= 0) out = t.slice(0, i) + t.slice(i + p.length);
  }
  return out.replace(/\s+/g, " ").trim() || t;
}

export interface ResolvedDestination {
  destination: QuickflowDestination;
  rule?: QuickflowRule;
  area?: LifeArea;
  time?: string;
}

/** Egen regel först, MyFloves gissning som fallback. */
export function resolveDestination(
  item: { text: string; level?: Parameters<typeof guessDestination>[0]["level"]; remindAt?: number },
  rules: QuickflowRule[],
): ResolvedDestination {
  const rule = matchRule(item.text, rules);
  if (rule) {
    return {
      destination: rule.destination,
      rule,
      ...(rule.area ? { area: rule.area } : {}),
      ...(rule.time ? { time: rule.time } : {}),
    };
  }
  return { destination: guessDestination(item) };
}

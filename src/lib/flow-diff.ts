// Jämför två FlowScore-lägen och beskriver vad som ändrades i planen.

import type { FlowScore } from "@/lib/flowscore";

export interface FlowSnapshot {
  at: number;
  score: number;
  label: string;
  load: FlowScore["load"];
  capacityMinutes: number;
  maxFriction: number;
  suggestedTasks: number;
  energy: number | null;
  factors: { label: string; delta: number; source: string }[];
  plan: { id: string; title: string; minutes: number }[];
  tooHeavy: { id: string; title: string }[];
  plannedMinutes: number;
}

export interface FlowDiff {
  scoreDelta: number;
  from: FlowSnapshot;
  to: FlowSnapshot;
  /** Vilka signaler som ändrades och hur mycket de bidrog. */
  signalChanges: { label: string; source: string; from: number | null; to: number | null; delta: number }[];
  /** Planförändringar i klartext. */
  planChanges: string[];
  added: { id: string; title: string; minutes: number }[];
  removed: { id: string; title: string; minutes: number }[];
  newlyTooHeavy: { id: string; title: string }[];
  nowPossible: { id: string; title: string }[];
}

export function makeSnapshot(
  flow: FlowScore,
  energy: number | null,
  plan: { task: { id: string; title: string }; meta: { minutes: number } }[],
  tooHeavy: { task: { id: string; title: string } }[],
  plannedMinutes: number,
): FlowSnapshot {
  return {
    at: Date.now(),
    score: flow.score,
    label: flow.label,
    load: flow.load,
    capacityMinutes: flow.capacityMinutes,
    maxFriction: flow.maxFriction,
    suggestedTasks: flow.suggestedTasks,
    energy,
    factors: flow.factors.map((f) => ({ label: f.label, delta: f.delta, source: f.source })),
    plan: plan.map((p) => ({ id: p.task.id, title: p.task.title, minutes: p.meta.minutes })),
    tooHeavy: tooHeavy.map((t) => ({ id: t.task.id, title: t.task.title })),
    plannedMinutes,
  };
}

export function diffSnapshots(from: FlowSnapshot, to: FlowSnapshot): FlowDiff {
  const sources = new Set([...from.factors.map((f) => f.source), ...to.factors.map((f) => f.source)]);
  const signalChanges: FlowDiff["signalChanges"] = [];
  for (const source of sources) {
    const a = from.factors.find((f) => f.source === source);
    const b = to.factors.find((f) => f.source === source);
    const delta = (b?.delta ?? 0) - (a?.delta ?? 0);
    if (delta !== 0 || a?.label !== b?.label) {
      signalChanges.push({
        label: b?.label ?? a?.label ?? source,
        source,
        from: a?.delta ?? null,
        to: b?.delta ?? null,
        delta,
      });
    }
  }

  const fromIds = new Set(from.plan.map((p) => p.id));
  const toIds = new Set(to.plan.map((p) => p.id));
  const added = to.plan.filter((p) => !fromIds.has(p.id));
  const removed = from.plan.filter((p) => !toIds.has(p.id));

  const fromHeavy = new Set(from.tooHeavy.map((t) => t.id));
  const toHeavy = new Set(to.tooHeavy.map((t) => t.id));
  const newlyTooHeavy = to.tooHeavy.filter((t) => !fromHeavy.has(t.id));
  const nowPossible = from.tooHeavy.filter((t) => !toHeavy.has(t.id));

  const planChanges: string[] = [];
  if (to.capacityMinutes !== from.capacityMinutes) {
    const d = to.capacityMinutes - from.capacityMinutes;
    planChanges.push(`Fokustid ${d > 0 ? "+" : ""}${d} min (${from.capacityMinutes} → ${to.capacityMinutes} min)`);
  }
  if (to.maxFriction !== from.maxFriction) {
    planChanges.push(
      `Friktionsgräns ${from.maxFriction} → ${to.maxFriction}/10 – ${
        to.maxFriction > from.maxFriction ? "tyngre saker får plats nu" : "tyngre saker sparas till senare"
      }`,
    );
  }
  if (to.suggestedTasks !== from.suggestedTasks) {
    planChanges.push(`Antal saker att sikta på ${from.suggestedTasks} → ${to.suggestedTasks}`);
  }
  if (to.load !== from.load) planChanges.push(`Belastning ${from.load} → ${to.load}`);
  if (to.plannedMinutes !== from.plannedMinutes) {
    planChanges.push(`Planerad tid ${from.plannedMinutes} → ${to.plannedMinutes} min`);
  }
  if (!planChanges.length && !added.length && !removed.length) {
    planChanges.push("Planen står sig – inget behövde ändras.");
  }

  return {
    scoreDelta: to.score - from.score,
    from,
    to,
    signalChanges,
    planChanges,
    added,
    removed,
    newlyTooHeavy,
    nowPossible,
  };
}

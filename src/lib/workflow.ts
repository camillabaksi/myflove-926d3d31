// WorkFlow™ – MyFlove på jobbet.
// Hjälper med "vad ska jag göra NU?" istället för att visa 27 uppgifter.

import type { Task } from "@/hooks/use-data";

export type WorkPriority = "nu" | "idag" | "sen";

export interface WorkMeta {
  /** Uppskattad tidsåtgång i minuter. */
  minutes: number;
  /** Hur tungt det känns att börja, 1–10. */
  friction: number;
  priority: WorkPriority;
}

export const DEFAULT_META: WorkMeta = { minutes: 15, friction: 4, priority: "idag" };

export const MINUTE_CHOICES = [5, 10, 15, 30, 45, 60, 90];

export const PRIORITY_META: Record<WorkPriority, { label: string; dot: string; weight: number }> = {
  nu: { label: "Nu", dot: "🔵", weight: 30 },
  idag: { label: "Idag", dot: "🟠", weight: 15 },
  sen: { label: "Sen", dot: "⚪", weight: 0 },
};

export function metaFor(map: Record<string, Partial<WorkMeta>>, id: string): WorkMeta {
  return { ...DEFAULT_META, ...(map[id] ?? {}) };
}

function daysUntil(dueDate?: string): number | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dueDate + "T00:00:00").getTime() - today.getTime()) / 86400000);
}

/**
 * Poängsätter en uppgift utifrån deadline, prioritet, tidsåtgång,
 * friktion, tillgänglig tid och energinivå.
 */
export function scoreTask(
  task: Task,
  meta: WorkMeta,
  ctx: { availableMinutes?: number; energy?: number | null },
): number {
  let score = PRIORITY_META[meta.priority].weight;

  const d = daysUntil(task.dueDate);
  if (d !== null) {
    if (d < 0) score += 40;
    else if (d === 0) score += 28;
    else if (d === 1) score += 18;
    else if (d <= 3) score += 10;
    else if (d <= 7) score += 4;
  }

  // Kort uppgift = lättare att komma igång.
  if (meta.minutes <= 10) score += 6;
  else if (meta.minutes >= 60) score -= 4;

  // Friktion drar ner – särskilt när energin är låg.
  const energy = ctx.energy ?? 3;
  score -= (meta.friction - 5) * (energy <= 2 ? 2.5 : energy >= 4 ? 0.8 : 1.5);

  // Ryms den i tiden jag faktiskt har?
  if (ctx.availableMinutes) {
    if (meta.minutes <= ctx.availableMinutes) score += 8;
    else score -= 12;
  }

  return score;
}

export function rankTasks(
  tasks: Task[],
  metaMap: Record<string, Partial<WorkMeta>>,
  ctx: { availableMinutes?: number; energy?: number | null } = {},
): { task: Task; meta: WorkMeta; score: number }[] {
  return tasks
    .filter((t) => !t.completed)
    .map((task) => {
      const meta = metaFor(metaMap, task.id);
      return { task, meta, score: scoreTask(task, meta, ctx) };
    })
    .sort((a, b) => b.score - a.score);
}

/** "Jag har 20 minuter" – bästa användningen av tiden. */
export function pickForMinutes(
  tasks: Task[],
  metaMap: Record<string, Partial<WorkMeta>>,
  minutes: number,
  energy?: number | null,
): {
  picks: { task: Task; meta: WorkMeta }[];
  usedMinutes: number;
  stretch?: { task: Task; meta: WorkMeta };
} {
  const ranked = rankTasks(tasks, metaMap, { availableMinutes: minutes, energy });
  const picks: { task: Task; meta: WorkMeta }[] = [];
  let used = 0;
  for (const r of ranked) {
    if (r.meta.minutes <= minutes - used) {
      picks.push({ task: r.task, meta: r.meta });
      used += r.meta.minutes;
    }
    if (minutes - used < 5) break;
  }
  const stretch = picks.length ? undefined : ranked.find((r) => r.meta.minutes > minutes);
  return {
    picks,
    usedMinutes: used,
    stretch: stretch ? { task: stretch.task, meta: stretch.meta } : undefined,
  };
}

/** Övergångshjälp: vad gör jag med luckan som blev? */
export function transitionPlan(gapMinutes: number): string[] {
  if (gapMinutes <= 5)
    return ["🧠 Andas ut i 2 minuter", "📝 Skriv ner det du inte får glömma i Fånga"];
  if (gapMinutes <= 15)
    return ["📌 Dokumentera det som precis hände", "📧 Svara på ett viktigt mejl", "🧠 5 min paus"];
  return [
    "📌 Dokumentera det som precis hände",
    "📧 Svara på viktiga mejl",
    "🎯 Ta en sak från Nu-listan",
    "🧠 5 min paus innan nästa",
  ];
}

export const END_OF_DAY_CHECK = [
  "Dokumentation klar",
  "Morgondagens viktigaste uppgift vald",
  "Arbetsplatsen återställd",
  "Saker du behöver komma ihåg → Fånga",
];

/** Fallback-steg när AI inte är tillgänglig – bara att komma över tröskeln. */
export function fallbackSteps(title: string): string[] {
  return [
    `Öppna det du behöver för "${title}"`,
    "Läs igenom anteckningar i 2 minuter",
    "Skriv rubriker / punktlista",
    "Gör första lilla biten",
    "Bestäm när du fortsätter",
  ];
}

/** "Min dag gick åt helvete" – bygg om resten av dagen realistiskt. */
export function rebuildDay(
  tasks: Task[],
  metaMap: Record<string, Partial<WorkMeta>>,
  minutesLeft: number,
  energy?: number | null,
): { keep: { task: Task; meta: WorkMeta }[]; moveOn: { task: Task; meta: WorkMeta }[] } {
  const usable = Math.max(0, Math.round(minutesLeft * 0.7)); // lämna luft
  const ranked = rankTasks(tasks, metaMap, { energy });
  const keep: { task: Task; meta: WorkMeta }[] = [];
  const moveOn: { task: Task; meta: WorkMeta }[] = [];
  let used = 0;
  for (const r of ranked) {
    if (used + r.meta.minutes <= usable) {
      keep.push({ task: r.task, meta: r.meta });
      used += r.meta.minutes;
    } else {
      moveOn.push({ task: r.task, meta: r.meta });
    }
  }
  return { keep, moveOn };
}

export function minutesLeftOfWorkday(endHour = 17, now = new Date()): number {
  const end = new Date(now);
  end.setHours(endHour, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
}

export function todayKey(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Dynamisk plan utifrån FlowScore: bara det som ryms i dagens kapacitet
 * och som inte är tyngre än vad som är rimligt just nu.
 */
export function planWithinCapacity(
  tasks: Task[],
  metaMap: Record<string, Partial<WorkMeta>>,
  opts: {
    capacityMinutes: number;
    maxFriction: number;
    suggestedTasks: number;
    energy?: number | null;
  },
): {
  plan: { task: Task; meta: WorkMeta }[];
  tooHeavy: { task: Task; meta: WorkMeta }[];
  laterToday: { task: Task; meta: WorkMeta }[];
  plannedMinutes: number;
} {
  const ranked = rankTasks(tasks, metaMap, { energy: opts.energy });
  const plan: { task: Task; meta: WorkMeta }[] = [];
  const tooHeavy: { task: Task; meta: WorkMeta }[] = [];
  const laterToday: { task: Task; meta: WorkMeta }[] = [];
  let used = 0;

  for (const r of ranked) {
    const entry = { task: r.task, meta: r.meta };
    if (r.meta.friction > opts.maxFriction) {
      tooHeavy.push(entry);
      continue;
    }
    if (plan.length < opts.suggestedTasks && used + r.meta.minutes <= opts.capacityMinutes) {
      plan.push(entry);
      used += r.meta.minutes;
    } else {
      laterToday.push(entry);
    }
  }

  return { plan, tooHeavy, laterToday, plannedMinutes: used };
}

// Daily Flow – MyFloves dagliga loop:
// FÅNGA → FÖRSTÅ → PRIORITERA → GÖRA → REFLEKTERA → LÄRA SIG → NÄSTA DAG
//
// Inga streaks, ingen skuld. Bara: "vad är rimligt just nu?"

import type { Task } from "@/hooks/use-data";

export type TimeAvailability = "lite" | "normal" | "mycket";

export interface DailyCheckin {
  /** YYYY-MM-DD */
  date: string;
  /** 1–5 */
  energy: number;
  /** 1–5, mental belastning (högre = tyngre) */
  load: number;
  time: TimeAvailability;
  at: number;
}

export const TIME_META: Record<TimeAvailability, { label: string; minutes: number }> = {
  lite: { label: "Lite", minutes: 25 },
  normal: { label: "Normal", minutes: 75 },
  mycket: { label: "Mycket", minutes: 180 },
};

export type Priority = "hög" | "medel" | "låg";

export interface ScoredTask {
  task: Task;
  minutes: number;
  friction: number; // 1–10
  priority: Priority;
  score: number; // 0–100, högre = passar bättre just nu
  why: string;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Grov tidsuppskattning ur uppgiftens text – går alltid att ändra manuellt. */
export function estimateMinutes(task: Task): number {
  const t = task.title.toLowerCase();
  if (/(ring|maila|mejla|sms|boka|svara)/.test(t)) return 10;
  if (/(betala|faktura|räkning|överför)/.test(t)) return 5;
  if (/(skriv|rapport|ansök|uppsats|deklar)/.test(t)) return 45;
  if (/(städa|tvätt|disk|damm|sortera)/.test(t)) return 30;
  if (/(handla|inköp|affär|apotek)/.test(t)) return 40;
  if (/(plugga|läs|repet|öva)/.test(t)) return 35;
  if (/(förbered|packa|planera)/.test(t)) return 15;
  const steps = task.steps?.length ?? 0;
  if (steps > 0) return Math.min(90, 10 + steps * 10);
  if (task.kind === "projekt") return 60;
  return 20;
}

/** Friktion 1–10: hur trögt känns det att komma igång? */
export function estimateFriction(task: Task): number {
  const t = task.title.toLowerCase();
  let f = 4;
  if (/(ring|myndighet|försäkringskassa|vårdcentral|bank|kontakta)/.test(t)) f = 7;
  if (/(skriv|rapport|ansök|deklar|uppsats)/.test(t)) f = 8;
  if (/(betala|faktura|skicka|maila|mejla)/.test(t)) f = 2;
  if (/(städa|tvätt|disk)/.test(t)) f = 5;
  if (/(handla|hämta|packa)/.test(t)) f = 3;
  if (task.kind === "projekt") f += 2;
  // Något som legat länge känns oftast tyngre – inte användarens fel.
  const days = Math.floor((Date.now() - task.createdAt) / 86_400_000);
  if (days > 7) f += 1;
  return Math.max(1, Math.min(10, f));
}

export function priorityOf(task: Task, today = todayISO()): Priority {
  if (task.dueDate && task.dueDate < today) return "hög";
  if (task.dueDate === today && task.time) return "hög";
  if (task.dueDate === today) return "medel";
  if (task.kind === "arende") return "medel";
  return "låg";
}

export interface FlowContext {
  /** 1–5 */
  energy: number;
  /** 1–5 mental belastning */
  load: number;
  /** Minuter du realistiskt har */
  availableMinutes: number;
  /** Tak för friktion just nu (från FlowScore) */
  maxFriction?: number;
  today?: string;
}

/**
 * FlowScore per uppgift: prioritet väger tyngst, men friktion och tidsåtgång
 * vägs mot dagens energi. Låg energi ⇒ små, lätta saker först.
 */
export function scoreTask(task: Task, ctx: FlowContext): ScoredTask {
  const today = ctx.today ?? todayISO();
  const minutes = estimateMinutes(task);
  const friction = estimateFriction(task);
  const priority = priorityOf(task, today);

  let score = 50;
  score += priority === "hög" ? 26 : priority === "medel" ? 12 : 0;

  // Deadline som passerat får en varsam knuff uppåt.
  if (task.dueDate && task.dueDate < today) score += 8;

  // Energi vs friktion: låg energi ⇒ hög friktion straffas hårdare.
  const energyRoom = ctx.energy * 2; // 2–10
  score -= Math.max(0, friction - energyRoom) * 5;
  if (friction <= 3) score += 6;

  // Mental belastning: när huvudet är fullt vinner korta saker.
  if (ctx.load >= 4 && minutes <= 15) score += 8;
  if (ctx.load >= 4 && minutes >= 45) score -= 10;

  // Får den plats i tiden du faktiskt har?
  if (minutes > ctx.availableMinutes) score -= 18;
  else if (minutes <= ctx.availableMinutes / 2) score += 6;

  if (ctx.maxFriction != null && friction > ctx.maxFriction) score -= 8;

  score = Math.max(1, Math.min(100, Math.round(score)));

  const why =
    minutes > ctx.availableMinutes
      ? "Den tar längre tid än du har just nu – den kan vänta."
      : friction <= 3 && ctx.energy <= 2
        ? "Låg friktion – går att göra även en trög dag."
        : priority === "hög"
          ? "Den har en tid eller deadline som närmar sig."
          : ctx.load >= 4 && minutes <= 15
            ? "Kort och avgränsad – bra när huvudet är fullt."
            : "Passar din energi just nu.";

  return { task, minutes, friction, priority, score, why };
}

/** Rankar uppgifter efter vad som ger mest nytta just nu. */
export function recommendTasks(tasks: Task[], ctx: FlowContext, limit = 3): ScoredTask[] {
  return tasks
    .map((t) => scoreTask(t, ctx))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Hur många saker är rimligt att sikta på idag? Hellre för få än för många. */
export function suggestedTaskCount(ctx: {
  energy: number;
  load: number;
  time: TimeAvailability;
}): number {
  if (ctx.time === "lite" || ctx.energy <= 2 || ctx.load >= 5) return 1;
  if (ctx.energy >= 4 && ctx.load <= 3 && ctx.time === "mycket") return 3;
  return 2;
}

export function checkinSummary(c: DailyCheckin): string {
  if (c.energy <= 2 || c.load >= 4) {
    return "Det låter som en dag att ta lugnt. Jag föreslår färre och lättare saker.";
  }
  if (c.energy >= 4 && c.load <= 2) {
    return "Du verkar ha en del att ge idag. Jag lägger in något lite tyngre också.";
  }
  return "Lagom dag. Jag håller planen realistisk.";
}

export const FRICTION_LABEL = (f: number) =>
  f <= 3 ? "låg friktion" : f <= 6 ? "medel friktion" : "hög friktion";

export const PRIORITY_DOT: Record<Priority, string> = {
  hög: "◯",
  medel: "🟠",
  låg: "🟢",
};

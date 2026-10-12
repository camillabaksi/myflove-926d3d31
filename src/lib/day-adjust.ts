// Steg 3 – "Behöver du planera om?"
//
// Ren logik för de tre förslag Flow kan ge på dagens saker:
// flytta (den får ta imorgon), förenkla (gör en mindre version) och
// dela (dela upp i två små steg). Inget här rör lagring – komponenten
// i src/components/journey/day-adjust.tsx utför det användaren godkänner.

export type AdjustKind = "flytta" | "forenkla" | "dela";

export interface AdjustTask {
  id: string;
  title: string;
  /** HH:MM om saken har en fast tid idag. */
  time?: string;
  dueDate?: string;
  /** Dagar kvar till deadline. Negativt = passerad. */
  daysUntil?: number;
  friction?: "small" | "medium" | "large";
  energyImpact?: "drains" | "gives" | "both" | "neutral" | "unknown";
  kind?: "uppgift" | "arende" | "projekt";
  /** Antal delsteg som redan finns. */
  steps?: number;
}

export interface AdjustSuggestion {
  taskId: string;
  title: string;
  kind: AdjustKind;
  /** Kort mening om vad förslaget gör. */
  what: string;
  /** Varför Flow föreslår det – i vardagsspråk. */
  why: string;
  /** Texten på godkännandeknappen. */
  cta: string;
  /** Delstegen som skapas när "dela" godkänns. */
  steps?: string[];
}

export const ADJUST_META: Record<AdjustKind, { emoji: string; label: string }> = {
  flytta: { emoji: "📅", label: "Flytta" },
  forenkla: { emoji: "🌤️", label: "Förenkla" },
  dela: { emoji: "🧩", label: "Dela upp" },
};

/** Har saken en deadline som gör att den inte bör flyttas? */
function isUrgent(t: AdjustTask): boolean {
  return typeof t.daysUntil === "number" && t.daysUntil <= 1;
}

function heavy(t: AdjustTask): boolean {
  return t.friction === "large" || t.kind === "projekt" || t.title.length > 45;
}

function splitSteps(title: string): string[] {
  const short = title.length > 32 ? `${title.slice(0, 32).trimEnd()}…` : title;
  return [`Börja med ${short} i 10 minuter`, `Gör klart resten av ${short}`];
}

export interface AdjustContext {
  /** Hur många saker som rimligen får plats idag (från FlowScore/kapacitet). */
  capacity: number;
  /**
   * Uppgifter FlowPlan lagt under "Kan vänta". När den finns avgör FlowPlan
   * vad som föreslås flyttas – inte listans position.
   */
  deferIds?: Set<string>;
}

/**
 * Föreslår justeringar för dagens saker. Fasta hållpunkter och sådant med
 * deadline inom ett dygn rörs aldrig – de kan bara förenklas.
 */
export function suggestAdjustments(tasks: AdjustTask[], ctx: AdjustContext): AdjustSuggestion[] {
  const capacity = Math.max(1, ctx.capacity);
  const out: AdjustSuggestion[] = [];

  // Fasta tider först – de bestämmer dagens ram och kan inte flyttas.
  const ordered = [...tasks].sort((a, b) => {
    if (!!a.time !== !!b.time) return a.time ? -1 : 1;
    return (a.daysUntil ?? 99) - (b.daysUntil ?? 99);
  });

  ordered.forEach((t, index) => {
    const overflow = ctx.deferIds ? ctx.deferIds.has(t.id) : index >= capacity;
    const fixed = Boolean(t.time);

    if (heavy(t) && (t.steps ?? 0) === 0) {
      out.push({
        taskId: t.id,
        title: t.title,
        kind: "dela",
        what: "Dela upp i två små steg",
        why: "Den känns stor – två steg är lättare att börja på.",
        cta: "Ja, dela upp den",
        steps: splitSteps(t.title),
      });
      return;
    }

    if (overflow && !fixed && !isUrgent(t)) {
      out.push({
        taskId: t.id,
        title: t.title,
        kind: "flytta",
        what: "Låt den ta imorgon i stället",
        why: "Dagen är redan full – den här kan vänta utan att något går sönder.",
        cta: "Ja, flytta till imorgon",
      });
      return;
    }

    if (t.energyImpact === "drains" || t.friction === "medium") {
      out.push({
        taskId: t.id,
        title: t.title,
        kind: "forenkla",
        what: "Gör en mindre version idag",
        why: "Den tar energi – en mindre version räknas lika mycket.",
        cta: "Ja, gör den mindre",
      });
    }
  });

  return out.slice(0, 5);
}

/** Sammanfattning efter att förslag godkänts. */
export function adjustSummary(counts: Record<AdjustKind, number>): string {
  const parts: string[] = [];
  if (counts.flytta) parts.push(`${counts.flytta} flyttad${counts.flytta === 1 ? "" : "e"}`);
  if (counts.forenkla)
    parts.push(`${counts.forenkla} förenklad${counts.forenkla === 1 ? "" : "e"}`);
  if (counts.dela) parts.push(`${counts.dela} uppdelad${counts.dela === 1 ? "" : "e"}`);
  if (!parts.length) return "Dagen ser bra ut som den är.";
  return `${parts.join(", ")}. Resten ligger kvar precis som du hade den.`;
}

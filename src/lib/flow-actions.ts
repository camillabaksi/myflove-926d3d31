// Flow-förslag som går att godkänna direkt i chatten.
//
// Flow får aldrig ändra något själv. Den föreslår – användaren trycker på
// knappen. Först då flyttas, förenklas eller delas en uppgift.

export type FlowActionKind =
  | "flytta"
  | "forenkla"
  | "dela"
  | "klar"
  | "ny"
  | "andra"
  | "ta-bort"
  | "handla";

const KINDS: FlowActionKind[] = ["flytta", "forenkla", "dela", "klar", "ny", "andra", "ta-bort", "handla"];

export interface FlowAction {
  kind: FlowActionKind;
  /** Uppgiftens id om Flow fick med sig det. */
  taskId?: string;
  /** Titeln Flow syftade på – används när id saknas. */
  taskTitle?: string;
  /** YYYY-MM-DD för "flytta". */
  date?: string;
  /** Små delsteg för "dela". */
  steps?: string[];
  /** Ny titel ("ny" och "andra"). */
  title?: string;
  /** HH:MM ("ny" och "andra"). */
  time?: string;
  /** Kort beskrivning som visas på knappkortet. */
  label?: string;
}

export interface ParsedFlowReply {
  /** Svaret utan de tekniska blocken. */
  text: string;
  actions: FlowAction[];
}

const BLOCK = /```flow-action\s*([\s\S]*?)```/gi;

const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

function toAction(raw: unknown): FlowAction | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = asString(o.kind)?.toLowerCase() as FlowActionKind | undefined;
  if (!kind || !KINDS.includes(kind)) return null;
  const time = asString(o.time);
  const title = asString(o.title)?.slice(0, 240);
  if ((kind === "ny" || kind === "handla") && !title) return null;
  const steps = Array.isArray(o.steps)
    ? o.steps.map((s) => asString(s)).filter((s): s is string => !!s)
    : undefined;
  const date = asString(o.date);
  return {
    kind,
    taskId: asString(o.taskId),
    taskTitle: asString(o.taskTitle),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    steps: steps?.length ? steps.slice(0, 5) : undefined,
    label: asString(o.label),
    title,
    time: time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : undefined,
  };
}

/** Plockar ut Flows förslag ur svaret och lämnar kvar den mänskliga texten. */
export function parseFlowReply(content: string): ParsedFlowReply {
  const actions: FlowAction[] = [];
  const text = content
    .replace(BLOCK, (_m, body: string) => {
      try {
        const parsed: unknown = JSON.parse(body.trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach((item) => {
          const a = toAction(item);
          if (a) actions.push(a);
        });
      } catch {
        // Ogiltigt block ignoreras – texten är det viktiga.
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, actions };
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/** Hittar uppgiften Flow menade – helst på id, annars på titel. */
export function matchTask<T extends { id: string; title: string }>(
  action: FlowAction,
  tasks: T[],
): T | undefined {
  if (action.taskId) {
    const byId = tasks.find((t) => t.id === action.taskId);
    if (byId) return byId;
  }
  if (!action.taskTitle) return undefined;
  const wanted = normalize(action.taskTitle);
  if (!wanted) return undefined;
  return (
    tasks.find((t) => normalize(t.title) === wanted) ??
    tasks.find((t) => {
      const n = normalize(t.title);
      return n.includes(wanted) || wanted.includes(n);
    })
  );
}

export const ACTION_LABEL: Record<FlowActionKind, string> = {
  flytta: "Flytta uppgiften",
  forenkla: "Gör den mindre",
  dela: "Dela upp i små steg",
  klar: "Markera som klar",
  ny: "Lägg till uppgift",
  andra: "Ändra uppgiften",
  "ta-bort": "Ta bort uppgiften",
  handla: "Lägg på inköpslistan",
};

export const ACTION_EMOJI: Record<FlowActionKind, string> = {
  flytta: "📆",
  forenkla: "🌱",
  dela: "🪄",
  klar: "✅",
  ny: "➕",
  andra: "✏️",
  "ta-bort": "🗑️",
  handla: "🛒",
};

export function actionCta(action: FlowAction): string {
  switch (action.kind) {
    case "flytta":
      return "Ja, flytta den";
    case "forenkla":
      return "Ja, gör den mindre";
    case "dela":
      return "Ja, dela upp den";
    case "klar":
      return "Ja, den är klar";
    case "ny":
      return "Ja, lägg till";
    case "andra":
      return "Ja, ändra";
    case "ta-bort":
      return "Ja, ta bort";
    case "handla":
      return "Ja, lägg till";
  }
}

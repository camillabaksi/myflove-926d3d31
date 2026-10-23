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
  /** ISO-datum YYYY-MM-DD (även "ny" och "andra"). */
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

/** Avoid saving impossible dates from an AI reply to the user's real calendar. */
export function validFlowDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(`${value}T12:00:00`);
  return !Number.isNaN(day.getTime()) &&
    `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}` === value;
}

/** A move must have an explicit valid date, never a guessed fallback. */
export function allowedFlowMoveDate(date: string | undefined, today: string): string | undefined {
  return validFlowDate(date) && date >= today ? date : undefined;
}

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
    date: validFlowDate(date) ? date : undefined,
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

/**
 * Activity identity is shared with Idag and Kalender. If Pace doesn't carry
 * a valid ID, a title is safe only when exactly one open task matches it.
 * Never silently edit/delete the first of two independently saved activities.
 */
export function matchTask<T extends { id: string; title: string }>(
  action: FlowAction,
  tasks: T[],
): T | undefined {
  if (action.taskId) {
    const byId = tasks.find(task => task.id === action.taskId);
    // A stale or hallucinated ID must never fall through to another title.
    if (!byId || (action.taskTitle && normalize(byId.title) !== normalize(action.taskTitle)))
      return undefined;
    return byId;
  }
  if (!action.taskTitle) return undefined;
  const wanted = normalize(action.taskTitle);
  if (!wanted) return undefined;
  const exact = tasks.filter(task => normalize(task.title) === wanted);
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  // Keep a unique partial match for older chat suggestions, but no guessing
  // when several tasks contain the same wording.
  if (wanted.length < 3) return undefined;
  const partial = tasks.filter(task => {
    const title = normalize(task.title);
    return title.includes(wanted) || wanted.includes(title);
  });
  return partial.length === 1 ? partial[0] : undefined;
}

/** Change only the fields Pace explicitly suggested. In particular, a time
 * edit must not erase the user's already chosen reminder lead time. */
export function flowEditTaskPatch(
  action: FlowAction,
  task: { title: string; dueDate?: string; time?: string },
): { title?: string; dueDate?: string; time?: string } {
  if (action.kind !== "andra") return {};
  const patch: { title?: string; dueDate?: string; time?: string } = {};
  if (action.title && action.title !== task.title) patch.title = action.title;
  if (validFlowDate(action.date) && action.date !== task.dueDate) patch.dueDate = action.date;
  if (action.time && action.time !== task.time) patch.time = action.time;
  return patch;
}

/**
 * A saved assistant message has a database UUID. Pair it with the action index
 * so the approved task keeps the same ID after reloading an old conversation.
 * Never derive an activity from an unsaved/temporary message.
 */
export function paceActionTaskId(actionKey: string): string | undefined {
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(0|[1-9]\d*)$/i.exec(actionKey);
  if (!match || !Number.isSafeInteger(Number(match[2]))) return undefined;
  return `pace-action-${match[1].toLowerCase()}-${match[2]}`;
}

/**
 * Each item in a saved Pace action gets its own stable source identity. The
 * shopping receipt stores IDs only (never titles or household information).
 */
export function paceActionItemId(actionKey: string, index: number): string | undefined {
  const sourceId = paceActionTaskId(actionKey);
  return sourceId && Number.isSafeInteger(index) && index >= 0
    ? `${sourceId}-item-${index}`
    : undefined;
}

/** Steps belong to both the approved suggestion and its intended task. */
export function paceActionStepId(actionKey: string, taskId: string, index: number): string | undefined {
  const sourceId = paceActionItemId(actionKey, index);
  return sourceId && taskId ? `${sourceId}-step-${taskId}` : undefined;
}

export type PaceShoppingReceipt = { id: string };

export function recordPaceShoppingReceipt(
  receipts: PaceShoppingReceipt[],
  id: string,
): PaceShoppingReceipt[] {
  return receipts.some((receipt) => receipt.id === id) ? receipts : [...receipts, { id }];
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

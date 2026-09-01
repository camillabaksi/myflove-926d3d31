/**
 * MyFloves centrala event-schema för appstatistik.
 *
 * Regler (integritet först):
 * - Vi mäter ANVÄNDNING, aldrig innehåll. Inget humörvärde, ingen medicin,
 *   inga belopp och ingen fritext får någonsin skickas som payload.
 * - Alla event har ett fast namn ur listan nedan. Nya event läggs till här,
 *   inte ad hoc ute i komponenterna.
 * - Payload är liten, valfri och saneras innan den lämnar klienten.
 * - En framtida analytics-leverantör kopplas på via `setAnalyticsSink`
 *   utan att någon komponent behöver skrivas om.
 */

import { sanitizeCount, sanitizeLabel } from "@/lib/analytics-sanitize";

export const ANALYTICS_EVENTS = [
  "app_opened",
  "signup_started",
  "signup_completed",
  "login",
  "onboarding_started",

  "onboarding_completed",
  "onboarding_skipped",
  "home_viewed",
  "health_viewed",
  "today_viewed",
  "day_hub_viewed",
  "planning_viewed",
  "flow_viewed",
  "flow_opened",
  "flow_interaction",
  "flow_learning_opened",
  "quickflow_opened",
  "quickflow_created",
  "quickflow_planned",
  "quickflow_completed",
  "battery_opened",
  "battery_checkin_started",
  "battery_checkin_completed",
  "battery_checked",
  "battery_logged",
  "mood_checkin_started",
  "mood_checkin_completed",
  "mood_logged",
  /** Hälsoobservation registrerad (sömn, stress, kropp …). Aldrig ett värde – bara att det hände. */
  "health_factor_logged",
  "my_day_viewed",
  "task_created",
  "task_started",
  "task_completed",
  "task_postponed",
  "task_reopened",
  "focus_started",
  "focus_completed",
  "flow_suggestion_shown",
  "flow_suggestion_accepted",
  "flow_suggestion_rejected",
  "flow_task_completion_reaction",
  "flow_missed_task_shown",
  "flow_missed_task_action",
  "day_replanned",
  "insight_action_taken",
  "plan_created",
  "plan_updated",
  "shopping_item_completed",
  "transaction_added",
  "budget_set",
  "medication_taken",
  "note_created",
  "reminder_created",
  "reminder_completed",
  "settings_opened",
  "insight_viewed",
  "insight_demo_opened",
  "flow_conversation_created",
  "flow_conversation_opened",
  "flow_conversation_deleted",
  "flow_conversation_renamed",
  "install_prompt_shown",
  "install_started",
  "install_completed",
  "logout",
  "account_deletion_started",
  "account_deletion_cancelled",
  "account_deleted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * Tillåtna payload-nycklar. Allt annat filtreras bort.
 * - `source`: var i appen händelsen startade (t.ex. "hem", "ma-bra").
 * - `method`: hur den gjordes (t.ex. "slider", "knapp").
 * - `result`: "completed" | "cancelled" | "error".
 * - `count`: ett litet antal (t.ex. antal steg) – aldrig ett mätvärde om användaren.
 */
export const ALLOWED_PAYLOAD_KEYS = ["source", "method", "result", "count"] as const;
export type AnalyticsPayloadKey = (typeof ALLOWED_PAYLOAD_KEYS)[number];

export interface AnalyticsPayload {
  source?: string;
  method?: string;
  result?: "completed" | "cancelled" | "error";
  count?: number;
}

/** Vilken del av appen ett event hör till (används i statistikvyerna). */
const EVENT_SECTION: Record<AnalyticsEventName, string> = {
  app_opened: "app",
  signup_started: "konto",
  signup_completed: "konto",
  login: "konto",
  onboarding_started: "onboarding",

  onboarding_completed: "onboarding",
  onboarding_skipped: "onboarding",
  home_viewed: "hem",
  health_viewed: "halsa",
  today_viewed: "idag",
  day_hub_viewed: "idag",
  planning_viewed: "flowplan",
  flow_viewed: "flow",
  flow_opened: "flow",
  flow_interaction: "flow",
  flow_learning_opened: "flow",
  quickflow_opened: "quickflow",
  quickflow_created: "quickflow",
  quickflow_planned: "quickflow",
  quickflow_completed: "quickflow",
  battery_opened: "batteri",
  battery_checkin_started: "batteri",
  battery_checkin_completed: "batteri",
  battery_checked: "batteri",
  battery_logged: "batteri",
  mood_checkin_started: "mood",
  mood_checkin_completed: "mood",
  mood_logged: "mood",
  health_factor_logged: "halsa",
  my_day_viewed: "min-dag",
  task_created: "tasks",
  task_started: "tasks",
  task_completed: "tasks",
  task_postponed: "tasks",
  task_reopened: "tasks",
  focus_started: "fokus",
  focus_completed: "fokus",
  flow_suggestion_shown: "flow",
  flow_suggestion_accepted: "flow",
  flow_suggestion_rejected: "flow",
  flow_task_completion_reaction: "flow",
  flow_missed_task_shown: "flow",
  flow_missed_task_action: "flow",
  day_replanned: "flowplan",
  insight_action_taken: "insight",
  plan_created: "flowplan",
  plan_updated: "flowplan",
  shopping_item_completed: "shopping",
  transaction_added: "finances",
  budget_set: "finances",
  medication_taken: "medicin",
  note_created: "dump",
  reminder_created: "paminnelser",
  reminder_completed: "paminnelser",
  settings_opened: "installningar",
  insight_viewed: "insight",
  insight_demo_opened: "insight",
  flow_conversation_created: "flow",
  flow_conversation_opened: "flow",
  flow_conversation_deleted: "flow",
  flow_conversation_renamed: "flow",
  install_prompt_shown: "install",
  install_started: "install",
  install_completed: "install",
  logout: "konto",
  account_deletion_started: "konto",
  account_deletion_cancelled: "konto",
  account_deleted: "konto",
};

export function eventSection(name: AnalyticsEventName): string {
  return EVENT_SECTION[name];
}

/**
 * Sanerar payload: bara tillåtna nycklar, bara korta strängar/små tal.
 * Detta är den enda vägen ut för payload-data, så känsliga värden kan inte
 * smita med av misstag.
 */
export function sanitizePayload(payload?: AnalyticsPayload): AnalyticsPayload {
  const clean: AnalyticsPayload = {};
  if (!payload) return clean;
  for (const key of ALLOWED_PAYLOAD_KEYS) {
    const value = (payload as Record<string, unknown>)[key];
    if (value == null) continue;
    if (key === "count") {
      const n = sanitizeCount(value);
      if (n != null) clean.count = n;
      continue;
    }
    const label = sanitizeLabel(value);
    if (!label) continue;
    if (key === "result") {
      if (label === "completed" || label === "cancelled" || label === "error") clean.result = label;
      continue;
    }
    clean[key as "source" | "method"] = label;
  }
  return clean;
}

export interface AnalyticsSinkEvent {
  name: AnalyticsEventName;
  section: string;
  payload: AnalyticsPayload;
}

export type AnalyticsSink = (event: AnalyticsSinkEvent) => void;

let sink: AnalyticsSink | null = null;

/** Kopplar på en framtida analytics-leverantör (dashboard, produktstatistik). */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function getAnalyticsSink(): AnalyticsSink | null {
  return sink;
}

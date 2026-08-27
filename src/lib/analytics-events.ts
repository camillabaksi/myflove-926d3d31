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

export const ANALYTICS_EVENTS = [
  "app_opened",
  "signup_started",
  "signup_completed",
  "login",
  "onboarding_started",

  "onboarding_completed",
  "onboarding_skipped",
  "home_viewed",
  "flow_opened",
  "flow_interaction",
  "quickflow_opened",
  "quickflow_created",
  "quickflow_completed",
  "battery_opened",
  "battery_checkin_started",
  "battery_checkin_completed",
  "mood_checkin_started",
  "mood_checkin_completed",
  "my_day_viewed",
  "task_created",
  "task_completed",
  "task_reopened",
  "plan_created",
  "plan_updated",
  "reminder_created",
  "reminder_completed",
  "settings_opened",
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
  onboarding_started: "onboarding",
  onboarding_completed: "onboarding",
  onboarding_skipped: "onboarding",
  home_viewed: "hem",
  flow_opened: "flow",
  flow_interaction: "flow",
  quickflow_opened: "quickflow",
  quickflow_created: "quickflow",
  quickflow_completed: "quickflow",
  battery_opened: "batteri",
  battery_checkin_started: "batteri",
  battery_checkin_completed: "batteri",
  mood_checkin_started: "mood",
  mood_checkin_completed: "mood",
  my_day_viewed: "min-dag",
  task_created: "tasks",
  task_completed: "tasks",
  task_reopened: "tasks",
  plan_created: "flowplan",
  plan_updated: "flowplan",
  reminder_created: "paminnelser",
  reminder_completed: "paminnelser",
  settings_opened: "installningar",
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
      const n = Number(value);
      if (Number.isFinite(n)) clean.count = Math.max(0, Math.min(999, Math.round(n)));
      continue;
    }
    if (typeof value !== "string") continue;
    const short = value.trim().slice(0, 32);
    if (!short) continue;
    if (key === "result") {
      if (short === "completed" || short === "cancelled" || short === "error") clean.result = short;
      continue;
    }
    clean[key as "source" | "method"] = short;
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

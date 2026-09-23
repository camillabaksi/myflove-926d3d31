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
  /** Allra första gången appen öppnas på en enhet. */
  "first_open",
  /** En ny aktiv dag på enheten (räknas högst en gång per dygn). */
  "active_day",
  "return_d1",
  "return_d7",
  "return_d30",
  /** "Lägg till" öppnad från Hem. */
  "add_opened",
  /** Något sparades via "Lägg till". */
  "add_created",
  "signup_started",
  "signup_completed",
  "login",
  "onboarding_started",

  "onboarding_completed",
  "onboarding_skipped",
  "home_viewed",
  /** Tryck på en av Hems fyra primära widgets (kalender, quickflow, batteri, logga). */
  "home_widget_opened",
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
  /** Påverkan registrerad i Mitt batteri. Aldrig ett värde – bara att det hände. */
  "impact_logged",
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
  /** Historiksidan öppnad (aktivitetshistorik och energipåverkan). */
  "history_viewed",
  /** Söndagens veckoöversikt visad. */
  "week_review_viewed",
  "workout_builder_opened",
  "workout_generated",
  "workout_completed",
  /** Energipåverkan besvarad efter en genomförd aktivitet. */
  "activity_energy_logged",
  /** "Jag gjorde något" – spontan registrering som påverkar batteriet. */
  "did_this_logged",
  /** Steg 01 "Hur mår du?" öppnat från Hem. */
  "step1_opened",
  /** Steg 02 "Vad händer?" öppnat från Hem. */
  "step2_opened",
  /** Steg 03 "Behöver du planera om?" öppnat från Hem. */
  "step3_opened",
  /** "Nästa rimliga steg" visades på Hem. */
  "next_step_shown",
  /** Användaren valde att göra "Nästa rimliga steg". */
  "next_step_accepted",
  /** Kvällschecken "Hur blev dagen?" besvarad. */
  "evening_check_completed",
  /** Återhämtningssidan visad. */
  "recovery_viewed",
  /** Mikropaus startad från Återhämtning. */
  "recovery_micro_opened",
  /** Akut Lugn startat från Återhämtning. */
  "recovery_acute_opened",
  /** Ljusboost startad från Återhämtning. */
  "recovery_lightboost_opened",
  /** Stopp-knappen öppnad. */
  "recovery_stop_opened",
  /** Paus startad med vald längd. */
  "recovery_pause_started",
  /** Frivillig energikoll efter en återhämtning. */
  "recovery_energy_checkin",
  /** Förslag om återhämtning i en lucka visades. */
  "recovery_gap_shown",
  /** Användaren tackade ja till en återhämtningslucka. */
  "recovery_gap_accepted",
  /** Användaren tackade nej till förslaget. */
  "recovery_gap_dismissed",
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
  first_open: "app",
  active_day: "app",
  return_d1: "app",
  return_d7: "app",
  return_d30: "app",
  add_opened: "lagg-till",
  add_created: "lagg-till",
  signup_started: "konto",
  signup_completed: "konto",
  login: "konto",
  onboarding_started: "onboarding",

  onboarding_completed: "onboarding",
  onboarding_skipped: "onboarding",
  home_viewed: "hem",
  home_widget_opened: "hem",
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
  impact_logged: "batteri",
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
  history_viewed: "historik",
  week_review_viewed: "veckooversikt",
  workout_builder_opened: "traning",
  workout_generated: "traning",
  workout_completed: "traning",
  activity_energy_logged: "energi",
  did_this_logged: "energi",
  step1_opened: "dagsresa",
  step2_opened: "dagsresa",
  step3_opened: "dagsresa",
  next_step_shown: "dagsresa",
  next_step_accepted: "dagsresa",
  evening_check_completed: "dagsresa",
  recovery_viewed: "aterhamtning",
  recovery_micro_opened: "aterhamtning",
  recovery_acute_opened: "aterhamtning",
  recovery_lightboost_opened: "aterhamtning",
  recovery_stop_opened: "aterhamtning",
  recovery_pause_started: "aterhamtning",
  recovery_energy_checkin: "aterhamtning",
  recovery_gap_shown: "aterhamtning",
  recovery_gap_accepted: "aterhamtning",
  recovery_gap_dismissed: "aterhamtning",
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

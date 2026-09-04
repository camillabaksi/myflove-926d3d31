/**
 * Läsbara svenska etiketter för appstatistiken.
 *
 * Statistiken lagrar tekniska slugar (t.ex. "quickflow_created", "mitt-batteri").
 * Här översätts de till begriplig text i adminvyerna. Okända värden får en
 * automatisk uppsnyggning i stället för att visas råa.
 */

/** Vilken del av appen händelsen hör till. */
export const SECTION_LABELS: Record<string, string> = {
  app: "Appen",
  admin: "Admin",
  anpassa: "Anpassa",
  "anpassa-hem": "Anpassa hem",
  assistant: "Flow-assistent",
  barn: "Barn",
  batteri: "Mitt batteri",
  beloningar: "Belöningar",
  calendar: "Kalender",
  "daglig-rutin": "Daglig rutin",
  dump: "Hjärndump",
  energi: "Energipåverkan",
  energifloede: "Energiflöde",
  energikarta: "Energikarta",
  familj: "Familj",
  finances: "Ekonomi",
  flow: "Flow",
  flowplan: "Flowplan",
  flowscore: "Flowscore",
  fokus: "Fokus",
  friktionsindex: "Friktionsindex",
  halsa: "Hälsa",
  hem: "Hem",
  historik: "Historik",
  idag: "Idag",
  insight: "Insikter",
  install: "Installation (PWA)",
  installningar: "Inställningar",
  jobb: "Jobb",
  kalender: "Kalender",
  konto: "Konto",
  "ma-bra": "Må bra",
  matlista: "Matlista",
  medicin: "Medicin",
  "min-dag": "Min dag",
  "mitt-batteri": "Mitt batteri",
  mood: "Mående",
  onboarding: "Onboarding",
  page: "Sidvisning",
  paminnelser: "Påminnelser",
  pomodoro: "Timer",
  quickflow: "Quickflow",
  relationer: "Relationer",
  rutiner: "Rutiner",
  shopping: "Inköp",
  stadning: "Städning",
  statistik: "Statistik",
  studybuddy: "Studybuddy",
  studyflow: "Studyflow",
  tasks: "Att göra",
  traning: "Träning",
  travel: "Resor",
  "veckans-flow": "Veckans flow",
  veckooversikt: "Veckoöversikt",
  workflow: "Arbetsflöde",
};

/** Konkreta handlingar – både nya eventnamn och äldre, korta actionnamn. */
export const ACTION_LABELS: Record<string, string> = {
  // Generellt
  view: "Besök",
  app_opened: "Appen öppnad",
  home_viewed: "Hem visad",
  home_widget_opened: "Widget öppnad på hem",

  // Konto & onboarding
  signup_started: "Registrering påbörjad",
  signup_completed: "Registrering klar",
  login: "Inloggning",
  logout: "Utloggning",
  account_deletion_started: "Kontoradering påbörjad",
  account_deletion_cancelled: "Kontoradering avbruten",
  account_deleted: "Konto raderat",
  onboarding_started: "Onboarding påbörjad",
  onboarding_completed: "Onboarding klar",
  onboarding_skipped: "Onboarding hoppad",

  // Quickflow
  quickflow_opened: "Quickflow öppnad",
  quickflow_created: "Tanke fångad",
  quickflow_planned: "Tanke planerad",
  quickflow_completed: "Tanke avklarad",

  // Batteri & mående
  battery_opened: "Batteriet öppnat",
  battery_checkin_started: "Orkkoll påbörjad",
  battery_checkin_completed: "Orkkoll klar",
  battery_checked: "Ork kollad",
  battery_logged: "Ork loggad",
  mood_checkin_started: "Måendekoll påbörjad",
  mood_checkin_completed: "Måendekoll klar",
  mood_logged: "Mående loggat",
  health_factor_logged: "Hälsofaktor loggad",
  did_this_logged: "Jag gjorde något",
  activity_energy_logged: "Energipåverkan besvarad",

  // Dag & aktiviteter
  today_viewed: "Idag visad",
  day_hub_viewed: "Dagsvy visad",
  my_day_viewed: "Min dag visad",
  planning_viewed: "Planering visad",
  task_created: "Uppgift skapad",
  task_started: "Uppgift startad",
  task_completed: "Uppgift klar",
  task_postponed: "Uppgift flyttad",
  task_reopened: "Uppgift återöppnad",
  focus_started: "Fokus startat",
  focus_completed: "Fokus klart",
  day_replanned: "Dagen omplanerad",
  plan_created: "Plan skapad",
  plan_updated: "Plan uppdaterad",
  history_viewed: "Historik visad",
  week_review_viewed: "Veckoöversikt visad",

  // Flow
  flow_viewed: "Flow visad",
  flow_opened: "Flow öppnad",
  flow_interaction: "Flow-interaktion",
  flow_learning_opened: "Flow lär sig öppnad",
  flow_suggestion_shown: "Förslag visat",
  flow_suggestion_accepted: "Förslag accepterat",
  flow_suggestion_rejected: "Förslag avvisat",
  flow_task_completion_reaction: "Reaktion efter klar uppgift",
  flow_missed_task_shown: "Missad uppgift visad",
  flow_missed_task_action: "Missad uppgift hanterad",
  flow_conversation_created: "Flow-samtal skapat",
  flow_conversation_opened: "Flow-samtal öppnat",
  flow_conversation_deleted: "Flow-samtal raderat",
  flow_conversation_renamed: "Flow-samtal omdöpt",

  // Övrigt
  insight_viewed: "Insikt visad",
  insight_demo_opened: "Insiktsdemo öppnad",
  insight_action_taken: "Insikt använd",
  note_created: "Anteckning skapad",
  reminder_created: "Påminnelse skapad",
  reminder_added: "Påminnelse tillagd",
  reminder_completed: "Påminnelse klar",
  shopping_item_completed: "Vara köpt",
  item_bought: "Vara köpt",
  transaction_added: "Transaktion tillagd",
  budget_set: "Budget satt",
  medication_taken: "Dos tagen",
  dose_taken: "Dos tagen",
  idea_saved: "Idé sparad",
  session_completed: "Pass klart",
  settings_opened: "Inställningar öppnade",
  install_prompt_shown: "Installationsfråga visad",
  install_started: "Installation påbörjad",
  install_completed: "Installation klar",
};

/** Snyggar till en okänd slug: "flow_conversation" → "Flow conversation". */
function prettify(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").trim();
  if (!text) return slug;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? prettify(section);
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? prettify(action);
}

/** Sidvisningar loggas som action = sidans slug. */
export function pageLabel(slug: string): string {
  return SECTION_LABELS[slug] ?? (slug === "start" ? "Startsida" : prettify(slug));
}

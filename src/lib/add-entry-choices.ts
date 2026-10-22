/**
 * One vocabulary for adding things from Today and the calendar.
 * Both entrypoints continue to use their existing task/reminder stores.
 */
export const PRIMARY_ADD_CHOICES = [
  { id: "task", label: "Att göra", hint: "Något du vill göra" },
  { id: "event", label: "Händelse", hint: "Något som händer en viss tid" },
  { id: "reminder", label: "Påminnelse", hint: "Kom ihåg något" },
] as const;

export type PrimaryAddChoice = (typeof PRIMARY_ADD_CHOICES)[number]["id"];

export const TODAY_ADD_KIND = {
  task: "aktivitet",
  event: "handelse",
  reminder: "paminnelse",
} as const satisfies Record<PrimaryAddChoice, string>;

export const CALENDAR_ADD_KIND = {
  task: "task",
  event: "activity",
  reminder: "reminder",
} as const satisfies Record<PrimaryAddChoice, string>;

// Min livsprofil – EN samlad profil som ersätter de gamla separata jobb- och
// studieprofilerna. Livssituationerna bor kvar i situation.ts (samma data som
// tidigare), livsprofilen lägger till styrkor, svårigheter, stödbehov,
// energikällor och hur Flow ska hjälpa till.
//
// Allt är frivilligt. Profilen är kontext till Flow – aldrig regler, aldrig
// diagnoser.

import { EMPTY_STUDY_PROFILE, type StudyProfile } from "./study-profile";
import type { WorkProfile } from "./work-profile";
import { SITUATION_META, activeSituations, type SituationState } from "./situation";

export interface LifeFollowups {
  // Arbete
  role: string;
  workplace: string;
  workHours: string;
  workFlex: string;
  commute: string;
  workLoad: string;
  // Studier
  studyLevel: string;
  studyProgram: string;
  studySubjects: string[];
  studyHours: string;
  studyDeadlines: string;
  studyPace: string;
  // Övriga situationer
  familyLogistics: string;
  jobSearch: string;
  selfEmployed: string;
  sickLeaveHelp: string;
  internship: string;
}

export const EMPTY_FOLLOWUPS: LifeFollowups = {
  role: "",
  workplace: "",
  workHours: "",
  workFlex: "",
  commute: "",
  workLoad: "",
  studyLevel: "",
  studyProgram: "",
  studySubjects: [],
  studyHours: "",
  studyDeadlines: "",
  studyPace: "",
  familyLogistics: "",
  jobSearch: "",
  selfEmployed: "",
  sickLeaveHelp: "",
  internship: "",
};

export interface LifeProfile {
  followups: LifeFollowups;
  strengths: string[];
  difficulties: string[];
  helpWith: string[];
  energyGives: string[];
  energyTakes: string[];
  flowPreferences: string[];
  /** Fritext: något Flow bör veta. */
  note: string;
  /** Av/på – går att pausa utan att radera. */
  enabled: boolean;
  /** Sätts när gamla jobb-/studieprofiler migrerats hit. */
  migratedAt?: string;
}

export const EMPTY_LIFE_PROFILE: LifeProfile = {
  followups: { ...EMPTY_FOLLOWUPS },
  strengths: [],
  difficulties: [],
  helpWith: [],
  energyGives: [],
  energyTakes: [],
  flowPreferences: [],
  note: "",
  enabled: true,
};

export type ListField =
  | "strengths"
  | "difficulties"
  | "helpWith"
  | "energyGives"
  | "energyTakes"
  | "flowPreferences";

export const STRENGTH_OPTIONS = [
  "Kreativ",
  "Problemlösare",
  "Bra på att hjälpa andra",
  "Idérik",
  "Social",
  "Noggrann",
  "Bra på att improvisera",
  "Uthållig",
];

export const DIFFICULTY_OPTIONS = [
  "Komma igång",
  "Prioritera",
  "Hålla tider",
  "Komma ihåg saker",
  "Växla mellan aktiviteter",
  "Planera lagom mycket",
  "Hantera stress",
  "Undvika att ta på mig för mycket",
  "Komma ihåg pauser",
  "Bryta ner stora uppgifter",
  "Avsluta uppgifter",
];

export const HELP_OPTIONS = [
  "Hjälp att komma igång",
  "Hjälp att prioritera",
  "Hjälp att bryta ner uppgifter",
  "Hjälp att planera realistiskt",
  "Hjälp att komma ihåg pauser",
  "Hjälp att se när jag gjort för mycket",
  "Hjälp att upptäcka energitjuvar",
  "Hjälp att få in återhämtning",
  "Hjälp att växla mellan aktiviteter",
  "Hjälp att hålla fokus",
];

export const ENERGY_GIVES_OPTIONS = [
  "Promenad",
  "Musik",
  "Vara ute",
  "Träna",
  "Träffa någon jag tycker om",
  "Vara ensam en stund",
  "Skapa något",
  "Husdjur",
  "Bra sömn",
  "Städat runt mig",
];

export const ENERGY_TAKES_OPTIONS = [
  "Många möten",
  "Oväntade ändringar",
  "Ljud och stök",
  "Långa samtal",
  "Skärmtid",
  "Tidspress",
  "Konflikter",
  "Väntan",
  "Krav utifrån",
  "Dålig sömn",
];

export const FLOW_PREFERENCE_OPTIONS = [
  "Påminn mig tydligt",
  "Ge mig ett litet nästa steg",
  "Hjälp mig prioritera",
  "Var försiktig när min energi är låg",
  "Säg till när min plan verkar orimlig",
  "Påminn mig om återhämtning",
  "Fråga innan du lägger till eller ändrar något",
  "Håll det kort och konkret",
];

export function hasLifeProfile(p: LifeProfile | null | undefined): boolean {
  if (!p) return false;
  const f = { ...EMPTY_FOLLOWUPS, ...p.followups };
  const anyFollowup = Object.values(f).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(String(v).trim()),
  );
  return Boolean(
    anyFollowup ||
    p.strengths.length ||
    p.difficulties.length ||
    p.helpWith.length ||
    p.energyGives.length ||
    p.energyTakes.length ||
    p.flowPreferences.length ||
    p.note.trim(),
  );
}

/** Enkel "profil klar X %" – aldrig ett krav, bara en visning. */
export function lifeProfileCompletion(p: LifeProfile, situation: SituationState): number {
  const checks = [
    activeSituations(situation).length > 0,
    Object.values({ ...EMPTY_FOLLOWUPS, ...p.followups }).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(String(v).trim()),
    ),
    p.strengths.length > 0,
    p.difficulties.length > 0,
    p.helpWith.length > 0,
    p.energyGives.length > 0 || p.energyTakes.length > 0,
    p.flowPreferences.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function lifeProfileSummary(p: LifeProfile, situation: SituationState): string {
  const act = activeSituations(situation)
    .map((id) => `${SITUATION_META[id].emoji} ${SITUATION_META[id].label}`)
    .join(" · ");
  const bits = [act, p.helpWith.slice(0, 2).join(", ")].filter(Boolean);
  return bits.length ? bits.join(" – ") : "Berätta lite om din vardag";
}

/** Kontexttext till Flow. Kontext, inte regler. */
export function lifeProfileContext(p: LifeProfile): string {
  if (!p.enabled || !hasLifeProfile(p)) return "";
  const f = { ...EMPTY_FOLLOWUPS, ...p.followups };
  const lines: string[] = ["Användarens livsprofil (frivillig kontext, inte regler):"];
  const add = (label: string, value: string) => {
    if (value.trim()) lines.push(`- ${label}: ${value.trim()}`);
  };
  add("Yrkesroll", f.role);
  add("Arbetsplats", f.workplace);
  add("Arbetstider", f.workHours);
  add("Flexibilitet i jobbet", f.workFlex);
  add("Resväg", f.commute);
  add("Arbetsbelastning", f.workLoad);
  add("Utbildningsnivå", f.studyLevel);
  add("Program eller inriktning", f.studyProgram);
  if (f.studySubjects.length) lines.push(`- Kurser och ämnen: ${f.studySubjects.join(", ")}`);
  add("Studietider och schema", f.studyHours);
  add("Deadlines", f.studyDeadlines);
  add("Studietakt", f.studyPace);
  add("Vardagslogistik och återkommande ansvar", f.familyLogistics);
  add("Jobbsökande", f.jobSearch);
  add("Eget företag och administration", f.selfEmployed);
  add("Vill ha hjälp med under sjukskrivningen", f.sickLeaveHelp);
  add("Praktik eller arbetsträning", f.internship);
  if (p.strengths.length) lines.push(`- Styrkor: ${p.strengths.join(", ")}`);
  if (p.difficulties.length) lines.push(`- Svårigheter just nu: ${p.difficulties.join(", ")}`);
  if (p.helpWith.length) lines.push(`- Vill främst ha hjälp med: ${p.helpWith.join(", ")}`);
  if (p.energyGives.length) lines.push(`- Ger energi: ${p.energyGives.join(", ")}`);
  if (p.energyTakes.length) lines.push(`- Tar energi: ${p.energyTakes.join(", ")}`);
  if (p.flowPreferences.length)
    lines.push(`- Så vill användaren att Pace hjälper till: ${p.flowPreferences.join(", ")}`);
  if (p.note.trim()) lines.push(`- Övrigt: ${p.note.trim()}`);
  lines.push(
    "Använd detta som personlig kontext. Gör inga medicinska antaganden, döm aldrig, och väg alltid krav mot användarens energi och övriga livspussel.",
  );
  return lines.join("\n");
}

/**
 * Adapter så att befintlig studielogik (studiematerial, quiz, flashcards)
 * kan fortsätta fungera utan en egen lagrad studieprofil.
 */
export function toStudyProfile(p: LifeProfile): StudyProfile {
  const f = { ...EMPTY_FOLLOWUPS, ...p.followups };
  return {
    ...EMPTY_STUDY_PROFILE,
    grade: f.studyLevel,
    program: f.studyProgram,
    subjects: f.studySubjects,
    helpWith: p.helpWith,
    preferences: p.flowPreferences,
    note: [f.studyHours, f.studyDeadlines, f.studyPace, p.note].filter(Boolean).join(" · "),
    enabled: p.enabled,
  };
}

/** Migrering: gammal jobbprofil + studieprofil → en livsprofil. */
export function migrateLegacyProfiles(
  current: LifeProfile,
  work: WorkProfile | null | undefined,
  study: StudyProfile | null | undefined,
): LifeProfile | null {
  if (current.migratedAt) return null;
  const merge = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
  const pick = (a: string, b: string) => (a.trim() ? a : b || "");

  const next: LifeProfile = {
    ...EMPTY_LIFE_PROFILE,
    ...current,
    followups: { ...EMPTY_FOLLOWUPS, ...current.followups },
    migratedAt: new Date().toISOString(),
  };

  let touched = false;

  if (work) {
    const f = next.followups;
    f.role = pick(f.role, [work.role, work.industry].filter(Boolean).join(" · "));
    f.workplace = pick(f.workplace, work.workplace ?? "");
    f.workHours = pick(f.workHours, work.hoursNote ?? "");
    f.workFlex = pick(f.workFlex, work.pace ?? "");
    f.workLoad = pick(f.workLoad, (work.responsibilities ?? []).join(", "));
    next.helpWith = merge(next.helpWith, work.helpWith ?? []);
    if (work.note?.trim()) next.note = [next.note, work.note.trim()].filter(Boolean).join("\n");
    touched = true;
  }

  if (study) {
    const f = next.followups;
    f.studyLevel = pick(f.studyLevel, [study.level, study.grade].filter(Boolean).join(" · "));
    f.studyProgram = pick(f.studyProgram, study.program ?? "");
    f.studySubjects = merge(f.studySubjects, study.subjects ?? []);
    f.studyPace = pick(f.studyPace, [study.pace, study.mode].filter(Boolean).join(" · "));
    next.helpWith = merge(next.helpWith, study.helpWith ?? []);
    next.flowPreferences = merge(next.flowPreferences, study.preferences ?? []);
    if (study.note?.trim()) next.note = [next.note, study.note.trim()].filter(Boolean).join("\n");
    touched = true;
  }

  return touched ? next : { ...next };
}

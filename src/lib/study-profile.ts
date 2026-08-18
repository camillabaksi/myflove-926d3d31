// Min studieprofil – frivillig personlig kontext så Flow kan anpassa StudyFlow,
// StudyBuddy, quiz, flashcards, planering och förslag efter just den här personen.
// Aldrig fasta antaganden: två personer på samma program pluggar sällan likadant.

export type StudyLevel =
  | "grundskola"
  | "gymnasium"
  | "vuxenutbildning"
  | "yrkeshogskola"
  | "hogskola"
  | "folkhogskola"
  | "sfi"
  | "annat";

export type StudyPace = "heltid" | "deltid" | "enstaka-kurser" | "eget-tempo";
export type StudyMode = "pa-plats" | "distans" | "blandat";

export interface StudyProfile {
  /** Ålder – hjälper Flow att välja språk och exempel. */
  age: string;
  level: StudyLevel | "";
  /** Klass/årskurs om det är relevant, t.ex. "åk 2". */
  grade: string;
  /** Program/linje/inriktning, t.ex. "Naturbruksprogrammet, djurvård". */
  program: string;
  /** Kurser och ämnen (förvalda + egna). */
  subjects: string[];
  pace: StudyPace | "";
  mode: StudyMode | "";
  /** Vad användaren främst vill ha hjälp med. */
  helpWith: string[];
  /** Hur användaren upplever att hen lär sig bäst. */
  preferences: string[];
  /** Fritext: något Flow bör veta. */
  note: string;
  /** Av/på – går att pausa utan att radera. */
  enabled: boolean;
}

export const EMPTY_STUDY_PROFILE: StudyProfile = {
  age: "",
  level: "",
  grade: "",
  program: "",
  subjects: [],
  pace: "",
  mode: "",
  helpWith: [],
  preferences: [],
  note: "",
  enabled: true,
};

export const LEVEL_META: Record<StudyLevel, string> = {
  grundskola: "Grundskola",
  gymnasium: "Gymnasium",
  vuxenutbildning: "Vuxenutbildning / Komvux",
  yrkeshogskola: "Yrkeshögskola",
  hogskola: "Högskola / universitet",
  folkhogskola: "Folkhögskola",
  sfi: "SFI",
  annat: "Annat",
};

export const ALL_LEVELS = Object.keys(LEVEL_META) as StudyLevel[];

export const PACE_META: Record<StudyPace, string> = {
  heltid: "Heltid",
  deltid: "Deltid",
  "enstaka-kurser": "Enstaka kurser",
  "eget-tempo": "Eget tempo",
};

export const ALL_STUDY_PACES = Object.keys(PACE_META) as StudyPace[];

export const MODE_META: Record<StudyMode, string> = {
  "pa-plats": "På plats",
  distans: "Distans",
  blandat: "Blandat",
};

export const ALL_STUDY_MODES = Object.keys(MODE_META) as StudyMode[];

export const SUBJECT_SUGGESTIONS = [
  "Svenska",
  "Matematik",
  "Engelska",
  "Samhällskunskap",
  "Naturkunskap",
  "Historia",
  "Biologi",
  "Kemi",
  "Fysik",
  "Psykologi",
  "Vård och omsorg",
  "Djurvård",
  "Ekonomi",
  "Idrott och hälsa",
  "Yrkeskurser",
];

export const STUDY_HELP_SUGGESTIONS = [
  "Komma igång",
  "Bryta ner stora uppgifter",
  "Hålla deadlines",
  "Planera inför prov",
  "Repetition",
  "Förstå instruktioner",
  "Komma ihåg uppgifter",
];

export const STUDY_PREFERENCE_SUGGESTIONS = [
  "Korta studiepass",
  "Många pauser",
  "Tydliga instruktioner",
  "Visuellt stöd",
  "Quiz",
  "Flashcards",
  "Frågor och svar",
  "Annat",
];

export function hasStudyProfile(p: StudyProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.age.trim() ||
      p.level ||
      p.grade.trim() ||
      p.program.trim() ||
      p.subjects.length ||
      p.pace ||
      p.mode ||
      p.helpWith.length ||
      p.preferences.length ||
      p.note.trim(),
  );
}

/** Kort sammanfattning att visa i UI. */
export function studyProfileSummary(p: StudyProfile): string {
  const head = [
    p.age.trim() ? `${p.age.trim()} år` : "",
    p.level ? LEVEL_META[p.level as StudyLevel] : "",
    p.grade.trim(),
    p.program.trim(),
  ]
    .filter(Boolean)
    .join(" · ");
  const rest = p.subjects.slice(0, 3).join(", ");
  const base = head || "Studieprofil";
  return rest ? `${base} – ${rest}` : base;
}

/**
 * Kontexttext till Flow. Formuleras uttryckligen som kontext så att modellen
 * anpassar språk, exempel och upplägg utan att göra fasta antaganden.
 */
export function studyProfileContext(p: StudyProfile): string {
  if (!p.enabled || !hasStudyProfile(p)) return "";
  const lines: string[] = ["Användarens studieprofil (frivillig kontext, inte regler):"];
  if (p.age.trim()) lines.push(`- Ålder: ${p.age.trim()}`);
  if (p.level) lines.push(`- Utbildningsnivå: ${LEVEL_META[p.level as StudyLevel]}`);
  if (p.grade.trim()) lines.push(`- Klass/årskurs: ${p.grade.trim()}`);
  if (p.program.trim()) lines.push(`- Program/inriktning: ${p.program.trim()}`);
  if (p.subjects.length) lines.push(`- Kurser och ämnen: ${p.subjects.join(", ")}`);
  if (p.pace) lines.push(`- Studietakt: ${PACE_META[p.pace as StudyPace]}`);
  if (p.mode) lines.push(`- Studieform: ${MODE_META[p.mode as StudyMode]}`);
  if (p.helpWith.length) lines.push(`- Vill främst ha hjälp med: ${p.helpWith.join(", ")}`);
  if (p.preferences.length) lines.push(`- Lär sig bäst med: ${p.preferences.join(", ")}`);
  if (p.note.trim()) lines.push(`- Övrigt: ${p.note.trim()}`);
  lines.push(
    "Anpassa språk, svårighetsnivå, exempel och studieupplägg efter detta. Anta inte att alla på samma program lär sig likadant, och väg alltid studiernas krav mot användarens energi och övriga livspussel.",
  );
  return lines.join("\n");
}

export interface StudyDayItem {
  title: string;
  /** ISO-datum, saknas = ingen dag satt. */
  date?: string;
  time?: string;
}

export interface StudySuggestion {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
}

const EXAM_WORDS = ["prov", "tenta", "examination", "förhör", "test", "salsskrivning"];
const BIG_WORDS = ["inlämning", "uppsats", "rapport", "projekt", "arbete", "presentation", "redovisning"];

const has = (title: string, words: string[]) => {
  const t = title.toLowerCase();
  return words.some((w) => t.includes(w));
};

export function isExam(title: string): boolean {
  return has(title, EXAM_WORDS);
}

export function isBigAssignment(title: string): boolean {
  return has(title, BIG_WORDS);
}

function dayLabel(date?: string): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("sv-SE", { weekday: "long" });
}

/** Föreslagen passlängd utifrån preferenser och dagens kapacitet. */
export function studySessionMinutes(p: StudyProfile, capacityMinutes: number): number {
  const wantsShort = p.preferences.includes("Korta studiepass") || p.preferences.includes("Många pauser");
  const base = wantsShort ? 20 : 35;
  if (capacityMinutes <= 0) return base;
  return Math.max(10, Math.min(base, Math.round(capacityMinutes / 2)));
}

/**
 * Personliga studieförslag: bygger på profilen men utgår från vad som faktiskt
 * ligger i kalendern/uppgifterna och hur mycket ork som finns kvar idag.
 */
export function studySuggestions(
  p: StudyProfile,
  ctx: {
    /** Studieuppgifter inom närmaste veckan, med datum. */
    upcoming: StudyDayItem[];
    energy: number | null;
    flowScore: number;
    capacityMinutes: number;
  },
): StudySuggestion[] {
  if (!p.enabled) return [];
  const out: StudySuggestion[] = [];
  const wants = (s: string) => p.helpWith.includes(s);
  const prefers = (s: string) => p.preferences.includes(s);
  const session = studySessionMinutes(p, ctx.capacityMinutes);

  const exams = ctx.upcoming.filter((i) => isExam(i.title));
  const bigOnes = ctx.upcoming.filter((i) => isBigAssignment(i.title));
  const lowFlow = ctx.flowScore <= 45 || (ctx.energy != null && ctx.energy <= 2);

  if (exams.length && bigOnes.length && lowFlow) {
    out.push({
      title: "Två tunga saker samma vecka",
      body: `Du har ${exams[0].title}${dayLabel(exams[0].date) ? ` på ${dayLabel(exams[0].date)}` : ""} och ${bigOnes[0].title}${dayLabel(bigOnes[0].date) ? ` på ${dayLabel(bigOnes[0].date)}` : ""}.${wants("Bryta ner stora uppgifter") ? " Du har markerat att stora uppgifter är svåra att komma igång med." : ""} Din kapacitet är låg idag – ska vi dela upp pluggandet i pass om ${session} minuter?`,
      href: "/studyflow",
      hrefLabel: `Dela upp i ${session}-minuterspass`,
    });
  } else if (exams.length) {
    const how = prefers("Quiz")
      ? "ett quiz"
      : prefers("Flashcards")
        ? "flashcards"
        : prefers("Frågor och svar")
          ? "frågor och svar"
          : "en kort sammanfattning";
    out.push({
      title: `Prov på gång: ${exams[0].title}`,
      body: `${dayLabel(exams[0].date) ? `Det ligger på ${dayLabel(exams[0].date)}. ` : ""}Ladda upp materialet så gör jag ${how} av det – och lägger repetitionen i pass om ${session} minuter.`,
      href: "/studybuddy",
      hrefLabel: "Förbered provet",
    });
  }

  if (bigOnes.length && wants("Bryta ner stora uppgifter") && out.length < 3) {
    out.push({
      title: "Stor uppgift som väntar",
      body: `"${bigOnes[0].title}" är en av de där som är svåra att börja på. Vi tar bara första biten – ${Math.min(15, session)} minuter räcker för att komma igång.`,
      href: "/studyflow",
      hrefLabel: "Dela upp uppgiften",
    });
  }

  if (lowFlow && !out.length) {
    out.push({
      title: "Låg kapacitet idag",
      body: `Energin är ${ctx.energy ?? "låg"} och FlowScore ${ctx.flowScore}. Ett pass på ${session} minuter räcker gott idag – resten kan vänta.`,
      href: "/min-dag",
      hrefLabel: "Se dagen",
    });
  }

  if (!out.length && wants("Repetition")) {
    out.push({
      title: "Liten repetition",
      body: `Du har markerat repetition som något du vill ha hjälp med. ${session} minuter med ${prefers("Flashcards") ? "flashcards" : "gamla frågor"} håller kunskapen vid liv utan att ta hela kvällen.`,
      href: "/studybuddy",
      hrefLabel: "Repetera lite",
    });
  }

  return out.slice(0, 3);
}

export type StudyDemand = "lätt" | "normal" | "krävande";

/** Hur krävande studieveckan ser ut – används för att inte fylla resten av livet. */
export function studyDemand(ctx: { exams: number; assignments: number }): StudyDemand {
  const weight = ctx.exams * 3 + ctx.assignments;
  if (weight >= 6) return "krävande";
  if (weight >= 3) return "normal";
  return "lätt";
}

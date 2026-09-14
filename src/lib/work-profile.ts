// Min jobbprofil – frivillig personlig kontext så Flow kan ge bättre förslag
// inom Jobb. Aldrig regler, alltid kontext: två personer med samma yrkesroll
// jobbar sällan likadant.

export type WorkPace = "fasta-tider" | "flextid" | "skift" | "distans" | "hybrid" | "oregelbundet";

export interface WorkProfile {
  /** Yrkesroll, t.ex. "socialpedagog". */
  role: string;
  /** Bransch/verksamhet, t.ex. "kommunal skola". */
  industry: string;
  /** Arbetsplats, t.ex. "Björkskolan". */
  workplace: string;
  /** Huvudsakliga ansvarsområden (förvalda + egna). */
  responsibilities: string[];
  /** Arbetstider/arbetssätt. */
  pace: WorkPace | "";
  /** Fritext om hur arbetsdagen ser ut. */
  hoursNote: string;
  /** Vad användaren främst vill ha hjälp med. */
  helpWith: string[];
  /** Fritext: något Flow bör veta. */
  note: string;
  /** Av/på – går att pausa utan att radera. */
  enabled: boolean;
}

export const EMPTY_WORK_PROFILE: WorkProfile = {
  role: "",
  industry: "",
  workplace: "",
  responsibilities: [],
  pace: "",
  hoursNote: "",
  helpWith: [],
  note: "",
  enabled: true,
};

export const RESPONSIBILITY_SUGGESTIONS = [
  "Möten",
  "Dokumentation",
  "Planering",
  "Kundkontakt",
  "Klient-/elevkontakt",
  "Handledning",
  "Personalansvar",
  "Mejl och samtal",
  "Rapporter",
  "Utveckling/projekt",
  "Undervisning",
  "Schemaläggning",
  "Ekonomi/budget",
  "Praktiskt arbete",
];

export const HELP_SUGGESTIONS = [
  "Komma igång",
  "Prioritera",
  "Dokumentation",
  "Mötesförberedelse",
  "Efterarbete efter möten",
  "Dela upp stora uppgifter",
  "Hålla tider",
  "Avsluta arbetsdagen",
  "Pauser och återhämtning",
  "Säga nej / avgränsa",
];

export const PACE_META: Record<WorkPace, { label: string; hint: string }> = {
  "fasta-tider": { label: "Fasta tider", hint: "Samma tider varje dag" },
  flextid: { label: "Flextid", hint: "Du styr själv när" },
  skift: { label: "Skift", hint: "Varierar mellan dagar" },
  distans: { label: "Distans", hint: "Jobbar hemifrån" },
  hybrid: { label: "Hybrid", hint: "Både hemma och på plats" },
  oregelbundet: { label: "Oregelbundet", hint: "Ser olika ut hela tiden" },
};

export const ALL_PACES = Object.keys(PACE_META) as WorkPace[];

export function hasWorkProfile(p: WorkProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.role.trim() ||
    p.industry.trim() ||
    p.workplace?.trim() ||
    p.responsibilities.length ||
    p.pace ||
    p.hoursNote.trim() ||
    p.helpWith.length ||
    p.note.trim(),
  );
}

/** Kort sammanfattning att visa i UI. */
export function workProfileSummary(p: WorkProfile): string {
  const bits = [p.role.trim(), p.industry.trim()].filter(Boolean);
  const head = bits.length ? bits.join(" · ") : "Jobbprofil";
  const rest = p.responsibilities.slice(0, 3).join(", ");
  return rest ? `${head} – ${rest}` : head;
}

/**
 * Kontexttext till Flow. Formuleras uttryckligen som kontext,
 * så modellen inte gör antaganden om hela yrkeskåren.
 */
export function workProfileContext(p: WorkProfile): string {
  if (!p.enabled || !hasWorkProfile(p)) return "";
  const lines: string[] = ["Användarens jobbprofil (frivillig kontext, inte regler):"];
  if (p.role.trim()) lines.push(`- Yrkesroll: ${p.role.trim()}`);
  if (p.industry.trim()) lines.push(`- Bransch/verksamhet: ${p.industry.trim()}`);
  if (p.workplace?.trim()) lines.push(`- Arbetsplats: ${p.workplace.trim()}`);
  if (p.responsibilities.length) lines.push(`- Ansvarsområden: ${p.responsibilities.join(", ")}`);
  if (p.pace) lines.push(`- Arbetssätt: ${PACE_META[p.pace as WorkPace].label}`);
  if (p.hoursNote.trim()) lines.push(`- Arbetstider: ${p.hoursNote.trim()}`);
  if (p.helpWith.length) lines.push(`- Vill främst ha hjälp med: ${p.helpWith.join(", ")}`);
  if (p.note.trim()) lines.push(`- Övrigt: ${p.note.trim()}`);
  lines.push(
    "Använd detta som personlig kontext för förslag inom Jobb. Anta inte att alla i samma yrkesroll jobbar likadant, och väg alltid jobbets krav mot användarens energi och övriga livspussel.",
  );
  return lines.join("\n");
}

export interface WorkDayItem {
  title: string;
  /** ISO-datum, saknas = ingen dag satt. */
  date?: string;
  time?: string;
}

export interface WorkSuggestion {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
}

const MEETING_WORDS = ["möte", "mote", "träff", "avstämning", "handledning", "samtal", "konferens"];
const DOC_WORDS = ["dokument", "journal", "rapport", "anteckn", "protokoll", "underlag"];

const has = (title: string, words: string[]) => {
  const t = title.toLowerCase();
  return words.some((w) => t.includes(w));
};

export function isMeeting(title: string): boolean {
  return has(title, MEETING_WORDS);
}

export function isDocumentation(title: string): boolean {
  return has(title, DOC_WORDS);
}

/**
 * Personliga jobbförslag: bygger på profilen men utgår från vad som
 * faktiskt ligger i dagen och hur mycket ork som finns kvar.
 */
export function workSuggestions(
  p: WorkProfile,
  ctx: {
    today: WorkDayItem[];
    tomorrow: WorkDayItem[];
    energy: number | null;
    capacityMinutes: number;
  },
): WorkSuggestion[] {
  if (!p.enabled) return [];
  const out: WorkSuggestion[] = [];
  const wants = (s: string) => p.helpWith.includes(s);
  const does = (s: string) => p.responsibilities.includes(s);

  const meetingsToday = ctx.today.filter((i) => isMeeting(i.title));
  const meetingsTomorrow = ctx.tomorrow.filter((i) => isMeeting(i.title));
  const docToday = ctx.today.filter((i) => isDocumentation(i.title));

  if (meetingsTomorrow.length) {
    const first = meetingsTomorrow[0];
    out.push({
      title: "Möte imorgon",
      body: `Du har "${first.title}"${first.time ? ` kl ${first.time}` : ""} imorgon. Vill du lägga in 15 minuter för förberedelse?`,
      href: "/kalender",
      hrefLabel: "Lägg in förberedelse",
    });
  }

  if (meetingsToday.length >= 2 && docToday.length) {
    out.push({
      title: "Flera möten och dokumentation samma dag",
      body: `${meetingsToday.length} möten ligger idag och ${docToday.length} dokumentationsuppgift(er) väntar. Vill du att jag hjälper dig hitta en realistisk tid för dokumentationen?`,
      href: "/jobb",
      hrefLabel: "Hitta en tid",
    });
  } else if (
    meetingsToday.length >= 2 &&
    (does("Dokumentation") || wants("Efterarbete efter möten"))
  ) {
    out.push({
      title: "Efterarbetet behöver plats",
      body: `Med ${meetingsToday.length} möten idag brukar efterarbetet bli kvar. Boka 10 minuter direkt efter varje möte istället för allt på slutet.`,
      href: "/jobb",
      hrefLabel: "Planera efterarbetet",
    });
  }

  if (ctx.energy != null && ctx.energy <= 2 && ctx.today.length > 2) {
    out.push({
      title: "Krävande dag, låg energi",
      body: `Du har ${ctx.today.length} jobbhållpunkter idag och energin är ${ctx.energy}/5. Ta det som måste bli klart och låt resten vänta – kvällen behöver också vara rimlig.`,
      href: "/flow",
      hrefLabel: "En sak i taget",
    });
  }

  if (!out.length && wants("Komma igång") && ctx.capacityMinutes > 0) {
    out.push({
      title: "Kom igång i det lilla",
      body: `Ungefär ${ctx.capacityMinutes} minuters fokus finns kvar. Välj en sak som tar högst 15 minuter så är dagen igång.`,
      href: "/jobb",
      hrefLabel: "Vad tar jag härnäst?",
    });
  }

  return out.slice(0, 3);
}

export type WorkDemand = "lätt" | "normal" | "krävande";

/** Hur krävande arbetsdagen ser ut – används för att inte fylla kvällen. */
export function workDemand(ctx: { meetings: number; jobItems: number }): WorkDemand {
  const weight = ctx.meetings * 2 + ctx.jobItems;
  if (weight >= 6) return "krävande";
  if (weight >= 3) return "normal";
  return "lätt";
}

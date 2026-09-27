/**
 * "Hjälp mig med en situation" – strukturerat problemlösningsstöd för föräldern.
 *
 * Vad händer? → Vem? → några korta följdfrågor → sammanfattning →
 * flera vägar att prova → konkreta steg + "Säg så här" → andra vägar om
 * det inte fungerar → kort feedback.
 *
 * Ren logik utan lagring. Inga diagnoser: formuleringarna säger "kan vara",
 * "vill du prova" – aldrig "barnet gör så här för att".
 */

export type SituationCategoryId =
  | "komma-ivag"
  | "overgang"
  | "kanslor"
  | "fastnar"
  | "samarbete"
  | "kvall"
  | "mat"
  | "hygien"
  | "skola"
  | "maste-ivag"
  | "konflikt"
  | "annat";

export interface SituationCategory {
  id: SituationCategoryId;
  emoji: string;
  label: string;
}

export const SITUATION_CATEGORIES: SituationCategory[] = [
  { id: "komma-ivag", emoji: "🕐", label: "Svårt att komma iväg" },
  { id: "overgang", emoji: "🔄", label: "Svårt med förändring/övergång" },
  { id: "kanslor", emoji: "😣", label: "Starka känslor" },
  { id: "fastnar", emoji: "🧠", label: "Barnet fastnar" },
  { id: "samarbete", emoji: "🗣️", label: "Svårt att få barnet att samarbeta" },
  { id: "kvall", emoji: "😴", label: "Trötthet/kväll" },
  { id: "mat", emoji: "🍽️", label: "Mat" },
  { id: "hygien", emoji: "🛁", label: "Hygien/rutin" },
  { id: "skola", emoji: "🏫", label: "Förskola/skola" },
  { id: "maste-ivag", emoji: "🚗", label: "Vi måste iväg" },
  { id: "konflikt", emoji: "👥", label: "Konflikt mellan barn" },
  { id: "annat", emoji: "✏️", label: "Annat" },
];

/** Gissar kategori från fritext när inget snabbval gjorts. */
export function detectCategory(text: string): SituationCategoryId | null {
  const t = text.toLowerCase();
  const rules: [SituationCategoryId, RegExp][] = [
    ["konflikt", /bråk|syskon|slåss|konflikt|båda barnen|varandra/],
    ["mat", /äta|mat\b|middag|frukost|lunch|bordet/],
    ["hygien", /tänder|borsta|dusch|bada|tvätta|toalett|blöja/],
    ["kvall", /kväll|läggdags|sova|natt|trött/],
    ["kanslor", /arg|ledsen|gråt|skrik|utbrott|känslor|rädd/],
    ["skola", /skola|förskola|dagis|fritids|lämning/],
    ["maste-ivag", /måste (gå|åka|iväg)|bilen|bussen/],
    ["komma-ivag", /klä på|kläder|skor|jacka|iväg|gå om|minuter/],
    ["overgang", /sluta|byta|övergång|förändring|skärm|ipad|spel/],
    ["fastnar", /fastnar|fast i|vägrar/],
  ];
  for (const [id, re] of rules) if (re.test(t)) return id;
  return null;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface SituationQuestion {
  id: "tid" | "svarast" | "forvarnat" | "behov" | "mal" | "matproblem" | "innan";
  question: string;
  options: QuestionOption[];
}

const Q: Record<SituationQuestion["id"], SituationQuestion> = {
  tid: {
    id: "tid",
    question: "När behöver ni vara klara?",
    options: [
      { id: "5", label: "Om 5 min" },
      { id: "15", label: "Om 15 min" },
      { id: "30", label: "Om 30 min" },
      { id: "ingen", label: "Ingen tidspress" },
    ],
  },
  svarast: {
    id: "svarast",
    question: "Vad är svårast just nu?",
    options: [
      { id: "sluta", label: "Sluta med det hen gör" },
      { id: "kla", label: "Klä på sig" },
      { id: "vagrar", label: "Säger nej till allt" },
      { id: "vetinte", label: "Jag vet inte" },
    ],
  },
  forvarnat: {
    id: "forvarnat",
    question: "Har barnet fått veta i förväg?",
    options: [
      { id: "ja", label: "Ja" },
      { id: "nej", label: "Nej" },
      { id: "vetinte", label: "Vet inte" },
    ],
  },
  behov: {
    id: "behov",
    question: "Vad verkar behövas just nu?",
    options: [
      { id: "lugn", label: "Lugn och närhet" },
      { id: "utrymme", label: "Lite utrymme" },
      { id: "tydlighet", label: "Tydlighet" },
      { id: "vetinte", label: "Jag vet inte" },
    ],
  },
  mal: {
    id: "mal",
    question: "Vad är viktigast just nu?",
    options: [
      { id: "lugna", label: "Lugna situationen" },
      { id: "vidare", label: "Komma vidare ändå" },
      { id: "bada", label: "Båda" },
    ],
  },
  matproblem: {
    id: "matproblem",
    question: "Vad är det som är svårt?",
    options: [
      { id: "vill-inte", label: "Vill inte äta" },
      { id: "konsistens", label: "Konsistens/smak" },
      { id: "bordet", label: "Komma till bordet" },
      { id: "annat", label: "Något annat" },
    ],
  },
  innan: {
    id: "innan",
    question: "Vad hände precis innan?",
    options: [
      { id: "nej", label: "Hen fick ett nej" },
      { id: "byte", label: "Vi skulle byta aktivitet" },
      { id: "trott", label: "Trött eller hungrig" },
      { id: "vetinte", label: "Jag vet inte" },
    ],
  },
};

/** 1–3 relevanta följdfrågor för kategorin – aldrig allt på en gång. */
export function questionsFor(category: SituationCategoryId, text = ""): SituationQuestion[] {
  const hasTime = detectMinutes(text) != null;
  const withTime = (qs: SituationQuestion[]) => (hasTime ? qs.filter((q) => q.id !== "tid") : qs);
  switch (category) {
    case "komma-ivag":
    case "maste-ivag":
      return withTime([Q.tid, Q.svarast, Q.forvarnat]);
    case "overgang":
    case "fastnar":
      return withTime([Q.forvarnat, Q.tid, Q.mal]).slice(0, 3);
    case "kanslor":
      return [Q.innan, Q.behov, Q.mal];
    case "mat":
      return [Q.matproblem, Q.mal];
    case "konflikt":
      return [Q.innan, Q.mal];
    case "kvall":
    case "hygien":
      return withTime([Q.svarast, Q.tid]).slice(0, 2);
    case "skola":
      return withTime([Q.tid, Q.forvarnat, Q.mal]);
    case "samarbete":
      return withTime([Q.svarast, Q.tid, Q.mal]);
    default:
      return withTime([Q.mal, Q.tid]);
  }
}

export function detectMinutes(text: string): number | null {
  const t = text.toLowerCase();
  if (/om\s+en\s+halvtimme/.test(t)) return 30;
  const m = t.match(/om\s+(\d{1,3})\s*(min|minut|minuter)\b/);
  if (m) {
    const n = Number(m[1]);
    if (n > 0 && n <= 600) return n;
  }
  return null;
}

export type SituationAnswers = Partial<Record<SituationQuestion["id"], string>>;

export interface SituationSummary {
  sentence: string;
  time: string;
  who: string;
  situation: string;
  goal: string;
  minutes: number | null;
}

export function summarize(opts: {
  text: string;
  category: SituationCategoryId;
  who: string;
  answers: SituationAnswers;
  multiple?: boolean;
}): SituationSummary {
  const cat = SITUATION_CATEGORIES.find((c) => c.id === opts.category)!;
  const fromText = detectMinutes(opts.text);
  const ans = opts.answers.tid;
  const minutes = fromText ?? (ans && ans !== "ingen" ? Number(ans) : null);
  const time = minutes != null ? `Om ${minutes} minuter` : "Ingen tydlig tidspress";
  const goal =
    opts.answers.mal === "lugna"
      ? "Lugna situationen"
      : opts.answers.mal === "vidare"
        ? "Komma vidare utan att det eskalerar"
        : opts.answers.mal === "bada"
          ? "Lugna och komma vidare"
          : minutes != null
            ? "Komma vidare i tid"
            : "Att det blir lite lättare";
  const situation =
    opts.answers.svarast === "sluta"
      ? "Svårt att sluta med det hen gör"
      : opts.answers.svarast === "kla"
        ? "Påklädningen tar stopp"
        : opts.answers.matproblem === "konsistens"
          ? "Svårt med konsistens eller smak"
          : opts.answers.matproblem === "bordet"
            ? "Svårt att komma till bordet"
            : cat.label;

  const parts: string[] = [];
  if (minutes != null) parts.push(`Ni behöver vara klara om ${minutes} minuter.`);
  const subj = opts.who === "Du" ? "Du" : opts.who;
  parts.push(`${situation} – det gäller ${subj === "Du" ? "dig" : subj}.`);
  if (opts.answers.forvarnat === "nej") parts.push("Det kan vara så att förvarningen saknades.");
  parts.push(`Det viktigaste just nu verkar vara: ${goal.toLowerCase()}.`);

  return { sentence: parts.join(" "), time, who: opts.who, situation, goal, minutes };
}

export type StrategyId =
  | "mjukare"
  | "tva-val"
  | "mindre"
  | "forsta-steget"
  | "nod"
  | "lugn"
  | "visuellt"
  | "paus"
  | "ordning";

export interface Strategy {
  id: StrategyId;
  dot: string;
  title: string;
  steps: string[];
  say: string;
  /** Visuella steg som passar pictogram, om relevant. */
  visual?: string[];
}

const STRATEGIES: Record<StrategyId, Strategy> = {
  mjukare: {
    id: "mjukare",
    dot: "🟣",
    title: "Gör övergången mjukare",
    steps: [
      "Gå nära och se vad barnet gör.",
      "Säg vad som händer snart.",
      "Ge en kort nedräkning.",
      "Låt barnet avsluta något litet.",
    ],
    say: "Om två minuter ska vi gå. Vill du bygga klart tornet först?",
  },
  "tva-val": {
    id: "tva-val",
    dot: "🟢",
    title: "Ge två tydliga val",
    steps: [
      "Gå nära barnet.",
      "Säg kort vad som ska hända.",
      "Ge två val, inte en öppen fråga.",
      "Vänta.",
      "Hjälp med första steget om det behövs.",
    ],
    say: "Nu ska vi gå. Vill du ta på tröjan själv eller vill du att jag hjälper dig?",
  },
  mindre: {
    id: "mindre",
    dot: "🟡",
    title: "Gör uppgiften mindre",
    steps: [
      "Välj bara det som måste hända.",
      "Be om en sak i taget.",
      "Resten får vänta eller göras enklare.",
    ],
    say: "Vi börjar bara med skorna. Resten tar vi sen.",
  },
  "forsta-steget": {
    id: "forsta-steget",
    dot: "🔵",
    title: "Hjälp barnet genom första steget",
    steps: [
      "Gör första steget tillsammans.",
      "Säg vad ni gör medan ni gör det.",
      "Släpp taget lite när det rullar.",
    ],
    say: "Vi gör första tillsammans. Arm i ärmen – där!",
  },
  nod: {
    id: "nod",
    dot: "🟠",
    title: "Jag behöver en snabb nödlösning",
    steps: [
      "Sänk kraven till det allra minsta.",
      "Ta med det som saknas i en påse.",
      "Prata lugnt och kort.",
      "Det räcker att ni kommer vidare.",
    ],
    say: "Vi tar med jackan. Du kan ta på den sen.",
  },
  lugn: {
    id: "lugn",
    dot: "🟣",
    title: "Lugna först",
    steps: [
      "Sänk rösten och tempot.",
      "Stanna nära, utan krav.",
      "Sätt ord på det du ser.",
      "Vänta tills det lugnat sig lite.",
    ],
    say: "Jag ser att det är jobbigt. Jag är här.",
  },
  visuellt: {
    id: "visuellt",
    dot: "🔵",
    title: "Använd visuellt stöd",
    steps: [
      "Visa stegen som bilder.",
      "Peka på steget ni är på.",
      "Bocka av när det är klart.",
    ],
    say: "Titta, först skorna, sen jackan, sen bilen.",
    visual: ["Klä på sig", "Ta på skor", "Gå till bilen"],
  },
  paus: {
    id: "paus",
    dot: "🟢",
    title: "Ta en kort paus",
    steps: ["Stanna upp en stund.", "Andas lugnt – båda två.", "Försök igen med ett litet steg."],
    say: "Vi tar en liten paus. Sen försöker vi igen.",
  },
  ordning: {
    id: "ordning",
    dot: "🟡",
    title: "Byt ordning",
    steps: [
      "Börja med det som känns lättast.",
      "Spara det svåra till sist.",
      "Beröm när något blir klart.",
    ],
    say: "Vi tar skorna först i dag, och tröjan sen.",
  },
};

const VISUAL_BY_CATEGORY: Partial<Record<SituationCategoryId, string[]>> = {
  "komma-ivag": ["Klä på sig", "Ta på skor", "Packa väskan", "Gå till bilen"],
  "maste-ivag": ["Klä på sig", "Ta på skor", "Gå till bilen"],
  hygien: ["Borsta tänder", "Tvätta händerna", "Pyjamas"],
  kvall: ["Pyjamas", "Borsta tänder", "Läsa saga", "Sova"],
  mat: ["Tvätta händerna", "Sätta sig vid bordet", "Smaka en tugga"],
  skola: ["Klä på sig", "Packa väskan", "Ta på skor", "Gå till skolan"],
};

export function strategy(id: StrategyId, category?: SituationCategoryId): Strategy {
  const s = STRATEGIES[id];
  const visual = (category && VISUAL_BY_CATEGORY[category]) ?? s.visual;
  return { ...s, visual };
}

/** 3–5 vägar att prova, valda utifrån kategori och svar. */
export function strategiesFor(
  category: SituationCategoryId,
  answers: SituationAnswers = {},
): Strategy[] {
  let ids: StrategyId[];
  switch (category) {
    case "kanslor":
      ids = answers.mal === "vidare" ? ["lugn", "mindre", "tva-val", "nod"] : ["lugn", "paus", "mindre", "nod"];
      break;
    case "konflikt":
      ids = ["lugn", "paus", "tva-val", "nod"];
      break;
    case "mat":
      ids = ["mindre", "tva-val", "ordning", "paus"];
      break;
    case "kvall":
    case "hygien":
      ids = ["visuellt", "tva-val", "mindre", "forsta-steget", "nod"];
      break;
    default:
      ids = ["mjukare", "tva-val", "mindre", "forsta-steget", "nod"];
  }
  if (answers.forvarnat === "nej" && !ids.includes("mjukare")) ids = (["mjukare", ...ids] as StrategyId[]).slice(0, 5);
  return ids.map((id) => strategy(id, category));
}

/** Andra vägar när något inte fungerade – aldrig ett misslyckande. */
export function alternativesAfter(
  tried: StrategyId[],
  category: SituationCategoryId,
): Strategy[] {
  const pool: StrategyId[] = ["mindre", "mjukare", "forsta-steget", "visuellt", "paus", "ordning", "nod"];
  return pool.filter((id) => !tried.includes(id)).slice(0, 4).map((id) => strategy(id, category));
}

/** Förenklat läge när förälderns ork är låg. */
export const LOW_CAPACITY_PROMPTS = ["Vad måste hända?", "Vad kan vänta?", "Vad kan göras enklare?"];

export const HELPED_OPTIONS = [
  "Förberedelse",
  "Två val",
  "Visuellt stöd",
  "Mindre krav",
  "Jag hjälpte",
  "Paus",
  "Annat",
  "Jag vet inte",
] as const;

/** Feedback → befintlig barnobservation ("brukar hjälpa"), om det finns en match. */
export const HELPED_TO_CHILD_HELP: Record<string, string> = {
  Förberedelse: "Förvarna vid förändringar",
  "Mindre krav": "Dela upp saker i små steg",
  "Två val": "Tydliga instruktioner",
  Paus: "Möjlighet att pausa",
};

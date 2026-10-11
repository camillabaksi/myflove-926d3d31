// Min situation – ett övergripande lager ovanför livsområdena.
// Svarar på frågan "hur ser mitt liv ut just nu?" och aktiverar rätt delar
// av appen. Ersätter inte livsområdena Jobb och Studier – den slår på dem.
// Inaktiverade situationer raderas aldrig, de vilar bara.

import type { LifeArea } from "./life-areas";

export type SituationId =
  | "jobb"
  | "studier"
  | "foraldraledig"
  | "sjukskriven"
  | "arbetssokande"
  | "mellan-arbeten"
  | "frilans"
  | "hemma"
  | "praktik"
  | "annat";

export interface SituationMeta {
  id: SituationId;
  emoji: string;
  label: string;
  blurb: string;
  /** Livsområde som slås på när situationen aktiveras. */
  area?: LifeArea;
  /** Vad Flow bör tänka på i den här situationen. */
  flowHint: string;
}

export const SITUATION_META: Record<SituationId, SituationMeta> = {
  jobb: {
    id: "jobb",
    emoji: "💼",
    label: "Arbetar",
    blurb: "Du arbetar – heltid, deltid eller extra",
    area: "jobb",
    flowHint:
      "Väg arbetsdagens krav mot kvällen. Föreslå inte många krävande saker samma dag som en tung arbetsdag.",
  },
  studier: {
    id: "studier",
    emoji: "🎓",
    label: "Studerar",
    blurb: "Du pluggar – kurser, program eller enstaka ämnen",
    area: "studier",
    flowHint:
      "Planera plugg i mindre pass och tidigare i veckan när prov eller inlämningar närmar sig.",
  },
  foraldraledig: {
    id: "foraldraledig",
    emoji: "🏡",
    label: "Föräldraledig",
    blurb: "Dagarna styrs mycket av barnet",
    flowHint:
      "Dagen kan brytas när som helst. Föreslå korta steg, sömn och återhämtning framför långa block.",
  },
  sjukskriven: {
    id: "sjukskriven",
    emoji: "🌿",
    label: "Sjukskriven",
    blurb: "Du är sjukskriven, helt eller delvis",
    flowHint:
      "Återhämtning går först. Håll listan mycket kort, sänk kraven och påminn aldrig med skuld.",
  },
  arbetssokande: {
    id: "arbetssokande",
    emoji: "🔎",
    label: "Söker jobb / mellan jobb",
    blurb: "Du söker jobb eller är mellan uppdrag",
    flowHint:
      "Hjälp med struktur kring ansökningar, kontakter och rutiner – och att dagen har något mer än jobbsök.",
  },
  "mellan-arbeten": {
    id: "mellan-arbeten",
    emoji: "🔄",
    label: "Mellan arbeten",
    blurb: "En period mellan två jobb eller uppdrag",
    flowHint:
      "Perioden är tillfällig. Håll rutiner igång och föreslå en lugn balans mellan vila och förberedelse.",
  },
  frilans: {
    id: "frilans",
    emoji: "🧑‍💻",
    label: "Frilansar / egenföretagare",
    blurb: "Du styr mycket av arbetsdagen själv",
    area: "jobb",
    flowHint:
      "Friheten är stor men gränserna otydliga. Hjälp till att avgränsa arbetsdagen och få plats för administration.",
  },
  hemma: {
    id: "hemma",
    emoji: "🏠",
    label: "Hemma / hushåll och familj",
    blurb: "Vardagen kretsar kring hem och familj",
    flowHint:
      "Mycket är återkommande och osynligt arbete. Lyft fram rutiner och glöm inte återhämtning mellan turerna.",
  },
  praktik: {
    id: "praktik",
    emoji: "🎓",
    label: "Praktik / arbetsträning",
    blurb: "Du är på praktik eller arbetstränar",
    area: "jobb",
    flowHint:
      "Upptrappning tar energi. Håll dagarna rimliga, planera resväg och vila efter passen.",
  },
  annat: {
    id: "annat",
    emoji: "🧭",
    label: "Annat",
    blurb: "Något annat – du beskriver själv",
    flowHint: "Utgå från användarens egen beskrivning av situationen.",
  },
};

export const ALL_SITUATIONS: SituationId[] = [
  "jobb",
  "studier",
  "foraldraledig",
  "sjukskriven",
  "arbetssokande",
  "frilans",
  "hemma",
  "praktik",
  "annat",
];

/** Äldre situationer som inte visas i väljaren men fortfarande kan vara aktiva. */
const LEGACY_SITUATIONS: SituationId[] = ["mellan-arbeten"];

export interface SituationEntry {
  /** Aktiv just nu? Inaktiv = vilar, informationen finns kvar. */
  active: boolean;
  /** Egen beskrivning – frivillig kontext till Flow. */
  note: string;
  /** ISO-datum när den senast aktiverades. */
  since?: string;
  /** ISO-datum när den senast pausades. */
  pausedAt?: string;
}

export interface SituationState {
  entries: Partial<Record<SituationId, SituationEntry>>;
  /** Har användaren gjort ett aktivt val någon gång? */
  answered: boolean;
}

export const EMPTY_SITUATION: SituationState = { entries: {}, answered: false };

export function isActive(state: SituationState, id: SituationId): boolean {
  return Boolean(state.entries[id]?.active);
}

export function activeSituations(state: SituationState): SituationId[] {
  return [...ALL_SITUATIONS, ...LEGACY_SITUATIONS].filter((id) => isActive(state, id));
}

/** Livsområden som situationen vill slå på. */
export function areasForSituations(state: SituationState): LifeArea[] {
  return activeSituations(state)
    .map((id) => SITUATION_META[id].area)
    .filter((a): a is LifeArea => Boolean(a));
}

/** Kort sammanfattning att visa i UI. */
export function situationSummary(state: SituationState): string {
  const act = activeSituations(state);
  if (!act.length) return "Ingen situation vald än";
  return act.map((id) => `${SITUATION_META[id].emoji} ${SITUATION_META[id].label}`).join(" · ");
}

/**
 * Kontexttext till Flow. Formuleras som kontext, inte regler – två personer
 * i samma situation har sällan samma vardag.
 */
export function situationContext(state: SituationState): string {
  const act = activeSituations(state);
  if (!act.length) return "";
  const lines: string[] = ["Användarens nuvarande livssituation (frivillig kontext, inte regler):"];
  for (const id of act) {
    const meta = SITUATION_META[id];
    const note = state.entries[id]?.note?.trim();
    lines.push(`- ${meta.emoji} ${meta.label}${note ? `: ${note}` : ""}`);
    lines.push(`  Pace: ${meta.flowHint}`);
  }
  if (act.length > 1) {
    lines.push(
      "Flera situationer pågår samtidigt – summan av dem avgör hur mycket som ryms, inte varje del för sig.",
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Situationen påverkar förslagen direkt – både Flow och QuickFlow.
// Inget låses: vi lyfter fram det som passar och tonar ner det som vilar.
// ---------------------------------------------------------------------------

/** Vad situationen vill lyfta fram respektive tona ner i QuickFlow. */
export interface SituationFocus {
  /** Destinationer som visas först. */
  boosted: string[];
  /** Destinationer som hamnar sist – de vilar just nu. */
  muted: string[];
  /** Kort förklaring till användaren, tom när ingen situation är vald. */
  note: string;
}

export function situationFocus(state: SituationState): SituationFocus {
  const act = activeSituations(state);
  if (!act.length) return { boosted: [], muted: [], note: "" };

  const boosted = new Set<string>();
  const muted = new Set<string>();

  for (const id of act) {
    if (id === "jobb") boosted.add("jobb");
    if (id === "studier") boosted.add("studier");
    if (id === "foraldraledig") {
      boosted.add("barn");
      boosted.add("hemma");
      boosted.add("relationer");
    }
    if (id === "sjukskriven") {
      boosted.add("halsa");
      boosted.add("behall");
    }
    if (id === "arbetssokande") {
      boosted.add("uppgift");
      boosted.add("jobb");
    }
    if (id === "frilans") {
      boosted.add("jobb");
      boosted.add("uppgift");
    }
    if (id === "hemma") {
      boosted.add("hemma");
      boosted.add("barn");
      boosted.add("relationer");
    }
    if (id === "praktik") {
      boosted.add("jobb");
      boosted.add("halsa");
    }
    if (id === "mellan-arbeten") {
      boosted.add("uppgift");
      boosted.add("halsa");
    }
  }

  // Det som inte pågår just nu ska inte föreslås först.
  const worksSomehow = ["jobb", "arbetssokande", "frilans", "praktik"].some((id) =>
    act.includes(id as SituationId),
  );
  if (!worksSomehow) muted.add("jobb");
  if (!act.includes("studier")) muted.add("studier");

  const labels = act
    .map((id) => `${SITUATION_META[id].emoji} ${SITUATION_META[id].label}`)
    .join(" · ");
  return {
    boosted: [...boosted].filter((d) => !muted.has(d)),
    muted: [...muted],
    note: `Förslagen är anpassade efter din situation: ${labels}.`,
  };
}

/** Korta Flow-förslag som följer situationen – uppdateras direkt vid byte. */
export function situationSuggestions(
  state: SituationState,
): { id: string; title: string; body: string }[] {
  return activeSituations(state).map((id) => {
    const meta = SITUATION_META[id];
    const note = state.entries[id]?.note?.trim();
    return {
      id: `situation-${id}`,
      title: `${meta.emoji} ${meta.label} just nu`,
      body: note ? `${meta.flowHint} (Du skrev: ${note})` : meta.flowHint,
    };
  });
}

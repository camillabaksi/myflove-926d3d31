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
    label: "Jobb",
    blurb: "Du arbetar – heltid, deltid eller extra",
    area: "jobb",
    flowHint:
      "Väg arbetsdagens krav mot kvällen. Föreslå inte många krävande saker samma dag som en tung arbetsdag.",
  },
  studier: {
    id: "studier",
    emoji: "🎓",
    label: "Studier",
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
    label: "Arbetssökande",
    blurb: "Du söker jobb just nu",
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
  "mellan-arbeten",
  "annat",
];

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
  return ALL_SITUATIONS.filter((id) => isActive(state, id));
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
    lines.push(`  Flow: ${meta.flowHint}`);
  }
  if (act.length > 1) {
    lines.push(
      "Flera situationer pågår samtidigt – summan av dem avgör hur mycket som ryms, inte varje del för sig.",
    );
  }
  return lines.join("\n");
}

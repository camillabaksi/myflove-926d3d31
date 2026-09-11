/**
 * Flow på startsidan – "vad behöver du just nu?".
 *
 * Ren logik utan React: väljer EN sak i taget att lyfta fram, baserat på
 * data som redan finns i appen (ork, Quickflow, genomförda aktiviteter,
 * veckodag). Flow skapar ingen egen datamodell och gör inga antaganden om
 * diagnos, familj eller livssituation.
 *
 * Prioritering (en sak i taget):
 *  1. En aktivitet är genomförd men energipåverkan är inte besvarad.
 *  2. Något i Quickflow har blivit liggande.
 *  3. Låg ork – då erbjuder Flow färre val, inte fler.
 *  4. Söndag – veckan som varit ligger nära till hands.
 *  5. Annars: en lugn hälsning utan en öppen fråga.
 */

export type FlowHomeChoiceId = "quickflow" | "kalender" | "batteri" | "valj" | "vecka";

export type FlowHomeMode = "energi" | "liggande" | "lag-ork" | "vecka" | "halsning";

export interface FlowHomeInput {
  /** Timme 0–23, används bara för hälsningens ton. */
  hour: number;
  isSunday: boolean;
  /** Dagens ork på befintlig 1–10-skala, null när inget loggats. */
  ork10: number | null;
  hasStale: boolean;
  hasPendingEnergy: boolean;
  /** Adaptiv ordning på de tre grundfunktionerna. */
  order: Exclude<FlowHomeChoiceId, "valj" | "vecka">[];
}

export interface FlowHomePrompt {
  mode: FlowHomeMode;
  message: string;
  /** Maskotens lugna tillstånd. */
  mood: "calm" | "think" | "wave";
  choices: FlowHomeChoiceId[];
}

export const CHOICE_LABELS: Record<FlowHomeChoiceId, string> = {
  quickflow: "Få ur mig något",
  kalender: "Kolla min dag",
  batteri: "Kolla min ork",
  valj: "Hjälp mig välja",
  vecka: "Veckan som varit",
};

/** Ork 1–10 där dagen bör bäras lättare – samma tröskel som Flows puffar. */
export const LOW_ORK_MAX = 4;

export function flowHomePrompt(input: FlowHomeInput): FlowHomePrompt {
  const { hour, isSunday, ork10, hasStale, hasPendingEnergy, order } = input;

  if (hasPendingEnergy) {
    return {
      mode: "energi",
      message: "En sak blev gjord. Hur påverkade den din ork?",
      mood: "calm",
      choices: [],
    };
  }

  if (hasStale) {
    return {
      mode: "liggande",
      message: "Det här verkar ha blivit liggande. Vill du göra något med det?",
      mood: "think",
      choices: [],
    };
  }

  if (ork10 != null && ork10 <= LOW_ORK_MAX) {
    return {
      mode: "lag-ork",
      message: "Vi behöver inte göra allt idag 💜",
      mood: "calm",
      // Färre val när orken är låg: en väg framåt och en hand att hålla i.
      choices: [order[0] ?? "quickflow", "valj"],
    };
  }

  if (isSunday) {
    return {
      mode: "vecka",
      message: "Söndag. Vill du titta på veckan som varit?",
      mood: "calm",
      choices: ["vecka", ...order.slice(0, 2)],
    };
  }

  return {
    mode: "halsning",
    message:
      hour < 11
        ? "God morgon 💜 Vi börjar lugnt."
        : hour >= 20
          ? "Kväll 💜 Det som inte ryms kan vänta."
          : "Hej 💜 Vi tar en sak i taget.",
    mood: hour < 11 ? "wave" : "calm",
    choices: [order[0] ?? "quickflow", "valj"],
  };
}

import type { NpfSettings } from "@/lib/npf-mode";

/**
 * Insight ger strategier som text. Här kopplas de till inställningar som
 * faktiskt finns i appen, så att ett förslag går att slå på direkt.
 */
export interface StrategySetting {
  /** Kort beskrivning av vad som slås på. */
  label: string;
  /** Ändringar i NPF-läget. */
  npf?: Partial<NpfSettings>;
  /** Slå på förenklad vy (färre saker på skärmen). */
  simpleView?: boolean;
}

export const STRATEGY_SETTINGS: Record<string, StrategySetting> = {
  "visual-countdown": {
    label: "Visa symboler som stöd och lugna rörelser",
    npf: { pictograms: true, stillness: false },
  },
  "time-visible": {
    label: "Visa symboler som stöd i tid- och timervyer",
    npf: { pictograms: true },
  },
  "one-instruction": {
    label: "Färre saker på skärmen samtidigt",
    npf: { less: true },
    simpleView: true,
  },
  "short-instructions": {
    label: "Enkla ord istället för appnamn, och färre saker på skärmen",
    npf: { plainWords: true, less: true },
    simpleView: true,
  },
  "one-priority": {
    label: "Färre saker på skärmen – en sak i taget",
    npf: { less: true },
    simpleView: true,
  },
  "sensory-break": {
    label: "Dämpade färger och ingen rörelse",
    npf: { calm: true, stillness: true },
  },
  "sensory-kit": {
    label: "Dämpade färger och mer luft mellan sakerna",
    npf: { calm: true, roomy: true },
  },
  "predictable-day": {
    label: "Symbolstöd så dagens ordning syns tydligt",
    npf: { pictograms: true },
  },
  "written-backup": {
    label: "Större text så det skrivna är lätt att läsa",
    npf: { largeText: true },
  },
  "recovery-after": {
    label: "Lugnare intryck: dämpade färger utan rörelse",
    npf: { calm: true, stillness: true },
  },
  "recovery-slot": {
    label: "Lugnare intryck: dämpade färger utan rörelse",
    npf: { calm: true, stillness: true },
  },
};

export function settingForStrategy(strategyId: string): StrategySetting | undefined {
  return STRATEGY_SETTINGS[strategyId];
}

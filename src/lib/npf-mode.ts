import { useCallback, useEffect } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";


/**
 * NPF-läge – globala tillgänglighetsval som gäller hela appen.
 * Valen sparas lokalt och ligger kvar tills användaren ändrar dem.
 */
export type NpfSettings = {
  /** Dämpade färger, mindre kontrastskrik och lugnare ytor */
  calm: boolean;
  /** Stäng av rörelse och animationer */
  stillness: boolean;
  /** Större text */
  largeText: boolean;
  /** Mer luft mellan saker och större knappar */
  roomy: boolean;
  /** Färre saker på skärmen samtidigt */
  less: boolean;
  /** Enkla svenska ord istället för appnamn som FlowPlan */
  plainWords: boolean;
  /** Visa symboler/emoji som stöd till text */
  pictograms: boolean;
};

export const NPF_DEFAULTS: NpfSettings = {
  calm: true,
  stillness: false,
  largeText: false,
  roomy: true,
  less: true,
  plainWords: true,
  pictograms: false,
};

const KEY = "myflove-npf-mode";

/** Läser bara standardvärdet utanför React; den riktiga inställningen synkas per konto. */
export function readNpfSettings(): NpfSettings {
  return NPF_DEFAULTS;
}

/** Sätter data-attribut på <html> så CSS kan styra hela appen. */
export function applyToDocument(s: NpfSettings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dataset["npfCalm"] = String(s.calm);
  el.dataset["npfStill"] = String(s.stillness);
  el.dataset["npfText"] = s.largeText ? "large" : "normal";
  el.dataset["npfSpace"] = s.roomy ? "roomy" : "normal";
  el.dataset["npfLess"] = String(s.less);
}

/** Enkla svenska ord istället för produktnamn. */
const PLAIN_WORDS: Record<string, string> = {
  FlowPlan: "Ordning på dagen",
  FlowScore: "Hur mycket du orkar",
  "Veckans Flow": "Veckan som gick",
  Quickflow: "Skriv av dig",
  StudyFlow: "Plugg",
  StudyBuddy: "Plugghjälp",
  WorkFlow: "Jobbfokus",
  "MyFlove Insight": "Tips för dig",
  Pomodoro: "Timer",
  Feedback: "Tyck till",
};

export function plainLabel(label: string, enabled: boolean): string {
  if (!enabled) return label;
  return PLAIN_WORDS[label] ?? label;
}

export function useNpfSettings() {
  const [settings, setSettings] = useCloudSyncedStorage<NpfSettings>(KEY, NPF_DEFAULTS);

  useEffect(() => {
    applyToDocument(settings);
  }, [settings]);

  const update = useCallback(
    (patch: Partial<NpfSettings>) => setSettings((current) => ({ ...current, ...patch })),
    [setSettings],
  );

  const reset = useCallback(() => setSettings(NPF_DEFAULTS), [setSettings]);

  return { settings, update, reset };
}

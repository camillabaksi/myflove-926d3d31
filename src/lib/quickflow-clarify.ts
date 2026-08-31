/**
 * QuickFlow – "Förtydliga uppgiften".
 *
 * Ren logik + lugn fallback när AI inte är tillgänglig. Samma språk som
 * energi och mående: kort varför, energiuppskattning och ett första litet steg.
 */

export type ClarifyEnergyLevel = "liten" | "medel" | "stor";

export interface TaskClarification {
  why: string;
  energyLevel: ClarifyEnergyLevel;
  energyNote: string;
  firstStep: string;
}

export const ENERGY_LEVEL_META: Record<ClarifyEnergyLevel, { label: string; dot: string }> = {
  liten: { label: "Liten energi", dot: "bg-mint" },
  medel: { label: "Medel energi", dot: "bg-sun" },
  stor: { label: "Mycket energi", dot: "bg-destructive" },
};

const HEAVY = ["städa", "storstäd", "flytta", "deklaration", "renovera", "packa", "förbered"];
const LIGHT = ["diska", "tvätta", "vattna", "posta", "hämta", "sortera", "svara"];

export function guessEnergyLevel(title: string): ClarifyEnergyLevel {
  const t = title.toLowerCase();
  if (LIGHT.some((w) => t.includes(w))) return "liten";
  if (HEAVY.some((w) => t.includes(w))) return "stor";
  return "medel";
}

/** Fallback-förtydligande utan AI – aldrig krav, aldrig påhittade deadlines. */
export function heuristicClarify(title: string, energyPercent?: number): TaskClarification {
  const level = guessEnergyLevel(title);
  const low = typeof energyPercent === "number" && energyPercent < 40;

  const energyNote =
    level === "liten"
      ? "Brukar gå ganska snabbt, även när energin är låg."
      : level === "stor"
        ? low
          ? "Den här tar en del. Den får gärna vänta till du har mer."
          : "Den här tar en del – bra att ta när du har lite energi kvar."
        : low
          ? "Lagom stor. Dela gärna upp den om orken är låg."
          : "Lagom stor – går att göra i en sittning.";

  return {
    why: "Den ligger och tar plats i huvudet – klar känns lättare.",
    energyLevel: level,
    energyNote,
    firstStep: `Börja med en liten del av "${title.toLowerCase()}" i två minuter.`,
  };
}

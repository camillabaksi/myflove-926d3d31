/**
 * Kanonisk översättning av batteriprocent → ordnivå.
 * Samma trösklar och formuleringar över hela MyFlove (Hem, Mitt batteri,
 * QuickFlow, Familj, Träning). Procent visas bara på begäran.
 */
export interface OrkWord {
  /** Kort nivå: "Låg" | "Lagom" | "God" */
  short: string;
  /** Full etikett: "Låg ork" | "Lagom ork" | "God ork" */
  label: string;
  /** Lugn förklaring till nivån. */
  text: string;
}

export function orkWord(percent: number): OrkWord {
  if (percent < 40)
    return {
      short: "Låg",
      label: "Låg ork",
      text: "Ta det lugnt. Gör bara det viktigaste idag.",
    };
  if (percent < 70)
    return {
      short: "Lagom",
      label: "Lagom ork",
      text: "Du orkar det vanliga. Lägg in en paus.",
    };
  return {
    short: "God",
    label: "God ork",
    text: "Bra läge att ta itu med något som kräver lite mer.",
  };
}

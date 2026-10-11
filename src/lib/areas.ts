/**
 * Områdesfärger – EN central plats för MyFloves visuella röda tråd.
 *
 * Varje huvudområde har en egen mjuk färgidentitet som följer med genom
 * hela appen: sidhuvud, ikoner, badges, highlights och block. Färgvärdena
 * bor som design tokens i src/styles.css (`--area-*`). Här ligger bara
 * kopplingen id → etikett, så att en färg kan bytas på ett ställe.
 *
 * Användning: sätt `data-area={areaId}` på en wrapper och använd sedan
 * utilities som `area-text`, `area-bg-soft`, `area-border`, `area-hero`.
 * Färg är aldrig enda informationsbäraren – rubrik och ikon finns alltid.
 */

export type AreaId = "halsa" | "flow" | "idag" | "planera" | "hem" | "aterhamtning" | "kalender";

export interface AreaMeta {
  id: AreaId;
  /** Namn i appens språk. */
  label: string;
  /** Kort beskrivning av färgidentiteten (för dokumentation/QA). */
  hue: string;
}

export const AREAS: Record<AreaId, AreaMeta> = {
  halsa: { id: "halsa", label: "Hälsa", hue: "mjuk teal/salvia" },
  flow: { id: "flow", label: "Pace", hue: "mjuk lila" },
  idag: { id: "idag", label: "Idag", hue: "mjuk blå" },
  planera: { id: "planera", label: "Planera", hue: "blå/lila" },
  hem: { id: "hem", label: "Hem", hue: "varm persika" },
  aterhamtning: { id: "aterhamtning", label: "Återhämtning", hue: "mjuk gul" },
  kalender: { id: "kalender", label: "Kalender", hue: "mjuk rosa/lila" },
};

/** Props-hjälpare: `<section {...areaProps("halsa")}>` sätter färgkontexten. */
export function areaProps(area?: AreaId) {
  return area ? { "data-area": area } : {};
}

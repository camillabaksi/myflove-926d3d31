// Vädret som kontext i resten av appen – träning, promenader och vägen
// till nästa lektion. Aldrig pekpinnar, bara en liten justering.

import type { WeatherSnapshot } from "@/hooks/use-weather";

export type WeatherMood = "fint" | "kyligt" | "blött" | "snö" | "hårt";

export interface WeatherAdvice {
  mood: WeatherMood;
  /** Passar det att vara ute just nu? */
  outdoorOk: boolean;
  /** Kort mening om utomhusaktivitet. */
  outdoor: string;
  /** Extra marginal i minuter för att ta sig någonstans. */
  extraTravelMinutes: number;
  /** Kort mening om vägen dit. */
  travel: string | null;
  emoji: string;
}

/** Open-Meteo WMO-koder grupperade till något användbart. */
function moodFor(snap: WeatherSnapshot): WeatherMood {
  const c = snap.code;
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "snö";
  if ([95, 96, 99, 65, 82].includes(c)) return "hårt";
  if ([51, 53, 55, 56, 57, 61, 63, 66, 67, 80, 81].includes(c)) return "blött";
  if (snap.apparent <= 0) return "kyligt";
  return "fint";
}

export function weatherAdvice(snap: WeatherSnapshot | null): WeatherAdvice | null {
  if (!snap) return null;
  const mood = moodFor(snap);
  const temp = Math.round(snap.apparent);

  switch (mood) {
    case "hårt":
      return {
        mood,
        outdoorOk: false,
        outdoor: "Hårt väder ute just nu – ta passet inomhus idag, det räknas lika mycket.",
        extraTravelMinutes: 15,
        travel: "Räkna med extra tid – vädret kan sinka både buss och promenad.",
        emoji: "⛈️",
      };
    case "snö":
      return {
        mood,
        outdoorOk: true,
        outdoor: `Snö och ${temp}° känns – kortare runda i bra skor funkar fint.`,
        extraTravelMinutes: 10,
        travel: "Gå ut 10 minuter tidigare, det är halare än det ser ut.",
        emoji: "❄️",
      };
    case "blött":
      return {
        mood,
        outdoorOk: true,
        outdoor: "Det regnar. Regnjacka och en kort runda, eller något inne – båda duger.",
        extraTravelMinutes: 5,
        travel: "Ta med regnkläder och lägg på 5 minuter på vägen.",
        emoji: "🌧️",
      };
    case "kyligt":
      return {
        mood,
        outdoorOk: true,
        outdoor: `${temp}° känns – klä dig varmt, sen är ute helt okej.`,
        extraTravelMinutes: 5,
        travel: "Klä på dig innan du går, så slipper du vända.",
        emoji: "🧣",
      };
    default:
      return {
        mood,
        outdoorOk: true,
        outdoor: `${temp}° och hyfsat väder – bra läge att vara ute.`,
        extraTravelMinutes: 0,
        travel: null,
        emoji: "☀️",
      };
  }
}

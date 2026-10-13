import type { LifeArea } from "@/lib/life-areas";
import type { FlowItemSource } from "@/lib/flow-items";

export type PlaceContext = "hemma" | "jobb" | "skola" | "annat";
export type SavedPlaceContext = Exclude<PlaceContext, "annat">;

export const PLACE_CONTEXTS: Array<{ id: PlaceContext; label: string; emoji: string }> = [
  { id: "hemma", label: "Hemma", emoji: "⌂" },
  { id: "jobb", label: "Jobb", emoji: "▤" },
  { id: "skola", label: "Skola", emoji: "▧" },
  { id: "annat", label: "Annat", emoji: "◌" },
];

const PLACE_AREAS: Record<PlaceContext, LifeArea[]> = {
  hemma: ["vardag"],
  jobb: ["jobb"],
  skola: ["studier"],
  annat: [],
};
const KNOWN_PLACE_AREAS: LifeArea[] = ["vardag", "jobb", "studier"];

/** Plats filtrerar bara valbara förslag. Fasta hållpunkter visas alltid. */
export function isAvailableAtPlace(item: {
  area?: LifeArea;
  source?: FlowItemSource;
  time?: string;
}, place: PlaceContext | null): boolean {
  if (!place) return true;
  if (item.time || item.source === "kalender" || item.source === "lektion" || item.source === "barn") {
    return true;
  }
  const area = item.area;
  if (!area || !KNOWN_PLACE_AREAS.includes(area)) return true;
  if (place === "annat") return !KNOWN_PLACE_AREAS.includes(area);
  return PLACE_AREAS[place].includes(area) || !KNOWN_PLACE_AREAS.includes(area);
}

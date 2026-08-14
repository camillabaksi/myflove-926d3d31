// Server-only helpers for walk route suggestions.
export const WALK_KMH = 4.6;

export type WalkRoute = {
  id: string;
  name: string;
  kind: string;
  distanceKm: number;
  minutes: number;
  bearing: string;
  mapsUrl: string;
};

export type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function bearingLabel(aLat: number, aLon: number, bLat: number, bLon: number): string {
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((bLat * Math.PI) / 180);
  const x =
    Math.cos((aLat * Math.PI) / 180) * Math.sin((bLat * Math.PI) / 180) -
    Math.sin((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.cos(dLon);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ["norrut", "nordost", "österut", "sydost", "söderut", "sydväst", "västerut", "nordväst"];
  return dirs[Math.round(deg / 45) % 8];
}

export function kindLabel(tags: Record<string, string>): string {
  if (tags.leisure === "park") return "Park";
  if (tags.leisure === "garden") return "Trädgård";
  if (tags.leisure === "nature_reserve") return "Naturreservat";
  if (tags.leisure === "pitch" || tags.leisure === "track") return "Motionsspår";
  if (tags.natural === "water") return "Vatten";
  if (tags.natural === "beach") return "Strand";
  if (tags.natural === "wood" || tags.landuse === "forest") return "Skog";
  if (tags.tourism === "viewpoint") return "Utsikt";
  if (tags.route === "hiking" || tags.highway === "path") return "Stig";
  return "Grönt stråk";
}


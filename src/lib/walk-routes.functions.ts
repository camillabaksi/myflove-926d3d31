import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  minutes: z.number().int().min(10).max(240).optional(),
  km: z.number().min(0.5).max(30).optional(),
});

const WALK_KMH = 4.6;

export type WalkRoute = {
  id: string;
  name: string;
  kind: string;
  distanceKm: number;
  minutes: number;
  bearing: string;
  mapsUrl: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function bearingLabel(aLat: number, aLon: number, bLat: number, bLon: number): string {
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((bLat * Math.PI) / 180);
  const x =
    Math.cos((aLat * Math.PI) / 180) * Math.sin((bLat * Math.PI) / 180) -
    Math.sin((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.cos(dLon);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ["norrut", "nordost", "österut", "sydost", "söderut", "sydväst", "västerut", "nordväst"];
  return dirs[Math.round(deg / 45) % 8];
}

function kindLabel(tags: Record<string, string>): string {
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

export const suggestWalkRoutes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ targetKm: number; targetMinutes: number; routes: WalkRoute[] }> => {
    const targetKm = data.km ?? ((data.minutes ?? 30) / 60) * WALK_KMH;
    const targetMinutes = Math.round((targetKm / WALK_KMH) * 60);

    // Loop: out and back with some detour factor -> turnaround point about 40% of total.
    const idealLegKm = Math.max(0.3, targetKm * 0.4);
    const radiusM = Math.round(Math.min(idealLegKm * 1.8, 12) * 1000);

    const query = `[out:json][timeout:25];
(
  nwr["leisure"~"^(park|garden|nature_reserve|track)$"]["name"](around:${radiusM},${data.lat},${data.lon});
  nwr["natural"~"^(water|beach|wood)$"]["name"](around:${radiusM},${data.lat},${data.lon});
  nwr["landuse"="forest"]["name"](around:${radiusM},${data.lat},${data.lon});
  node["tourism"="viewpoint"]["name"](around:${radiusM},${data.lat},${data.lon});
);
out center 80;`;

    let elements: OverpassElement[] = [];
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.ok) {
        const json = (await res.json()) as { elements?: OverpassElement[] };
        elements = json.elements ?? [];
      }
    } catch {
      elements = [];
    }

    const seen = new Set<string>();
    const candidates = elements
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const name = el.tags?.name;
        if (lat === undefined || lon === undefined || !name) return null;
        const legKm = haversineKm(data.lat, data.lon, lat, lon);
        if (legKm < 0.1) return null;
        const distanceKm = Math.round(legKm * 2 * 1.15 * 10) / 10;
        return {
          id: `${el.type}-${el.id}`,
          name,
          kind: kindLabel(el.tags ?? {}),
          distanceKm,
          minutes: Math.round((distanceKm / WALK_KMH) * 60),
          bearing: bearingLabel(data.lat, data.lon, lat, lon),
          mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${data.lat},${data.lon}&destination=${data.lat},${data.lon}&waypoints=${lat},${lon}&travelmode=walking`,
          diff: Math.abs(distanceKm - targetKm),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => {
        const key = r.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 5)
      .map(({ diff: _diff, ...rest }) => rest);

    return { targetKm: Math.round(targetKm * 10) / 10, targetMinutes, routes: candidates };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  minutes: z.number().int().min(10).max(240).optional(),
  km: z.number().min(0.5).max(30).optional(),
});

export const suggestWalkRoutes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ targetKm: number; targetMinutes: number; routes: WalkRoute[] }> => {
    const { WALK_KMH, haversineKm, bearingLabel, kindLabel } = await import("./walk-routes.server");
    type OverpassElement = import("./walk-routes.server").OverpassElement;
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

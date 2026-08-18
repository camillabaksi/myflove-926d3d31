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
  lat: number;
  lon: number;
  startLat: number;
  startLon: number;
  elevationGain: number | null;
};

export type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  nodes?: number[];
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

export function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((bLat * Math.PI) / 180);
  const x =
    Math.cos((aLat * Math.PI) / 180) * Math.sin((bLat * Math.PI) / 180) -
    Math.sin((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingLabel(aLat: number, aLon: number, bLat: number, bLon: number): string {
  const deg = bearingDeg(aLat, aLon, bLat, bLon);
  const dirs = [
    "norrut",
    "nordost",
    "österut",
    "sydost",
    "söderut",
    "sydväst",
    "västerut",
    "nordväst",
  ];
  return dirs[Math.round(deg / 45) % 8];
}

export function kindLabel(tags: Record<string, string>): string {
  const h = tags.highway ?? "";
  if (h === "footway") return "Gångväg";
  if (h === "path") return "Stig";
  if (h === "pedestrian") return "Gångstråk";
  if (h === "cycleway") return "Cykelväg";
  if (h === "track") return "Grusväg";
  if (h === "residential" || h === "living_street") return "Lugn gata";
  if (h === "unclassified" || h === "service") return "Väg";
  if (tags.route === "hiking") return "Vandringsled";
  const leisure = tags.leisure ?? "";
  if (leisure === "park") return "Park";
  if (leisure === "nature_reserve") return "Naturreservat";
  if (leisure === "track") return "Motionsspår";
  const natural = tags.natural ?? "";
  if (natural === "water") return "Vatten";
  if (natural === "beach") return "Strand";
  if (natural === "wood") return "Skog";
  if (tags.tourism === "viewpoint") return "Utsikt";
  return "Väg";
}

export async function buildWalkRoutes(input: {
  lat: number;
  lon: number;
  minutes?: number;
  km?: number;
}): Promise<{ targetKm: number; targetMinutes: number; routes: WalkRoute[] }> {
  const targetKm = input.km ?? ((input.minutes ?? 30) / 60) * WALK_KMH;
  const targetMinutes = Math.round((targetKm / WALK_KMH) * 60);

  // Out-and-back with a small detour factor -> turnaround point is about 40% of total distance.
  const idealLegKm = Math.max(0.3, targetKm * 0.4);
  const radiusM = Math.round(Math.min(idealLegKm * 1.8, 12) * 1000);

  // Look for actual walkable ways (footways, paths, quiet streets, etc.) in the area.
  const query = `[out:json][timeout:25];
way["highway"~"footway|path|pedestrian|cycleway|track|residential|living_street|unclassified|service"](around:${radiusM},${input.lat},${input.lon});
out center 50;`;

  let elements: OverpassElement[] = [];
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        "User-Agent": "MyFlove/1.0",
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) {
      const json = (await res.json()) as { elements?: OverpassElement[] };
      elements = json.elements ?? [];
    }
  } catch {
    elements = [];
  }

  const seenPos = new Set<string>();
  const raw: {
    id: string;
    name: string;
    kind: string;
    distanceKm: number;
    minutes: number;
    bearing: string;
    mapsUrl: string;
    lat: number;
    lon: number;
    startLat: number;
    startLon: number;
    elevationGain: number | null;
    legKm: number;
    bearingDeg: number;
  }[] = [];

  for (const el of elements) {
    if (el.type !== "way") continue;
    const lat = el.center?.lat;
    const lon = el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const legKm = haversineKm(input.lat, input.lon, lat, lon);
    if (legKm < 0.15 || legKm > idealLegKm * 1.6) continue;

    const posKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (seenPos.has(posKey)) continue;
    seenPos.add(posKey);

    const bearing = bearingLabel(input.lat, input.lon, lat, lon);
    const distanceKm = Math.round(legKm * 2 * 1.15 * 10) / 10;
    const minutes = Math.round((distanceKm / WALK_KMH) * 60);

    raw.push({
      id: `way-${el.id}`,
      name: `${bearing.charAt(0).toUpperCase()}${bearing.slice(1)}`,
      kind: kindLabel(el.tags ?? {}),
      distanceKm,
      minutes,
      bearing,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${input.lat},${input.lon}&destination=${input.lat},${input.lon}&waypoints=${lat},${lon}&travelmode=walking`,
      lat,
      lon,
      startLat: input.lat,
      startLon: input.lon,
      elevationGain: null,
      legKm,
      bearingDeg: bearingDeg(input.lat, input.lon, lat, lon),
    });
  }

  // Pick one good candidate per compass direction, closest to the ideal one-way distance.
  const buckets = new Map<number, (typeof raw)[0][]>();
  for (const r of raw) {
    const idx = Math.round(r.bearingDeg / 45) % 8;
    if (!buckets.has(idx)) buckets.set(idx, []);
    buckets.get(idx)!.push(r);
  }

  const selected: (typeof raw)[0][] = [];
  for (let i = 0; i < 8; i++) {
    const list = buckets.get(i);
    if (!list || list.length === 0) continue;
    list.sort((a, b) => Math.abs(a.legKm - idealLegKm) - Math.abs(b.legKm - idealLegKm));
    selected.push(list[0]);
  }
  selected.sort((a, b) => a.bearingDeg - b.bearingDeg);

  const candidates: WalkRoute[] = selected.map(
    ({ legKm: _legKm, bearingDeg: _bearingDeg, ...rest }) => rest,
  );

  // Optional elevation data via Open-Meteo.
  if (candidates.length > 0) {
    try {
      const lats = [input.lat, ...candidates.map((c) => c.lat)].join(",");
      const lons = [input.lon, ...candidates.map((c) => c.lon)].join(",");
      const elevRes = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`,
      );
      if (elevRes.ok) {
        const json = (await elevRes.json()) as { elevation?: number[] };
        const elev = json.elevation ?? [];
        const base = elev[0];
        if (typeof base === "number") {
          candidates.forEach((c, i) => {
            const e = elev[i + 1];
            if (typeof e === "number") c.elevationGain = Math.round(Math.abs(e - base));
          });
        }
      }
    } catch {
      // elevation is optional
    }
  }

  return { targetKm: Math.round(targetKm * 10) / 10, targetMinutes, routes: candidates };
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BASE = "https://api.resrobot.se/v2.1";

const TripInput = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const NearbyInput = z.object({
  lat: z.number(),
  lon: z.number(),
});

type ResRobotStopLocation = {
  id?: string;
  extId?: string;
  name?: string;
  lat?: number;
  lon?: number;
};
type ResRobotStopResponse = {
  stopLocationOrCoordLocation?: Array<{ StopLocation?: ResRobotStopLocation }>;
};

type ResRobotLeg = {
  name?: string;
  type?: string; // JNY (journey), WALK
  Origin?: { name?: string; time?: string; date?: string };
  Destination?: { name?: string; time?: string; date?: string };
  Product?: Array<{ name?: string; catOutL?: string; catOut?: string }>;
};

type ResRobotTrip = {
  LegList?: { Leg?: ResRobotLeg[] };
  duration?: string; // e.g. "PT00H23M00S"
};

type ResRobotTripResponse = {
  Trip?: ResRobotTrip[];
  errorCode?: string;
  errorText?: string;
};

function requireKey(): string {
  const key = process.env.TRAFIKLAB_API_KEY;
  if (!key) throw new Error("TRAFIKLAB_API_KEY saknas");
  return key;
}

function hhmm(time?: string): string {
  if (!time) return "";
  // ResRobot returns "HH:MM:SS"
  return time.slice(0, 5);
}

function parseDuration(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  return h * 60 + min;
}

async function lookupStopId(name: string, key: string): Promise<string> {
  const url = `${BASE}/location.name?input=${encodeURIComponent(name)}&format=json&accessId=${key}&maxNo=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Response(`Kunde inte hitta hållplats: ${name}`, { status: 502 });
  const data = (await res.json()) as ResRobotStopResponse;
  const stop = data.stopLocationOrCoordLocation?.[0]?.StopLocation;
  const id = stop?.extId ?? stop?.id;
  if (!id) throw new Response(`Hittade ingen hållplats för "${name}"`, { status: 404 });
  return id;
}

export const getSlTripFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TripInput.parse(data))
  .handler(async ({ data }) => {
    const key = requireKey();
    const [originId, destId] = await Promise.all([
      lookupStopId(data.from, key),
      lookupStopId(data.to, key),
    ]);

    const url = `${BASE}/trip?originExtId=${originId}&destExtId=${destId}&format=json&accessId=${key}&numF=1`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Response(`Trafikdata otillgänglig (${res.status})`, { status: 502 });
    }
    const json = (await res.json()) as ResRobotTripResponse;
    if (json.errorCode) {
      throw new Response(json.errorText ?? "Kunde inte hämta resa", { status: 404 });
    }
    const trip = json.Trip?.[0];
    const rawLegs = trip?.LegList?.Leg ?? [];
    if (rawLegs.length === 0) {
      throw new Response("Ingen resa hittades", { status: 404 });
    }

    const legs = rawLegs.map((l) => ({
      lineName: l.Product?.[0]?.name ?? l.name ?? (l.type === "WALK" ? "Gång" : "Resa"),
      fromName: l.Origin?.name ?? "",
      toName: l.Destination?.name ?? "",
      departureTime: hhmm(l.Origin?.time),
      arrivalTime: hhmm(l.Destination?.time),
    }));

    const transportLegs = rawLegs.filter((l) => l.type !== "WALK");
    const first = rawLegs[0];
    const last = rawLegs[rawLegs.length - 1];
    const primary = transportLegs[0] ?? first;

    return {
      departureTime: hhmm(first.Origin?.time),
      arrivalTime: hhmm(last.Destination?.time),
      durationMinutes: parseDuration(trip?.duration),
      lineName: primary.Product?.[0]?.name ?? primary.name ?? "Resa",
      type: primary.Product?.[0]?.catOutL ?? primary.Product?.[0]?.catOut ?? "Kollektivtrafik",
      changes: Math.max(0, transportLegs.length - 1),
      legs,
    };
  });

export const getSlNearbyStopFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => NearbyInput.parse(data))
  .handler(async ({ data }) => {
    const key = requireKey();
    const url = `${BASE}/location.nearbystops?originCoordLat=${data.lat}&originCoordLong=${data.lon}&format=json&accessId=${key}&maxNo=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Response("Kunde inte hitta hållplats nära dig", { status: 502 });
    const json = (await res.json()) as ResRobotStopResponse;
    const stop = json.stopLocationOrCoordLocation?.[0]?.StopLocation;
    if (!stop?.name) throw new Response("Ingen hållplats hittades i närheten", { status: 404 });
    return { name: stop.name };
  });

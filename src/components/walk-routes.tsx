import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation, Route as RouteIcon, ExternalLink, ChevronDown } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { suggestWalkRoutes, type WalkRoute } from "@/lib/walk-routes.functions";
import { useToast } from "@/hooks/use-toast";

const MINUTES = [15, 30, 45, 60, 90];
const KM = [2, 3, 5, 8];

export default function WalkRoutesSection() {
  const run = useServerFn(suggestWalkRoutes);
  const { toast } = useToast();

  const [mode, setMode] = useState<"tid" | "avstånd">("tid");
  const [minutes, setMinutes] = useState(30);
  const [km, setKm] = useState(3);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<WalkRoute[] | null>(null);
  const [target, setTarget] = useState<{ km: number; minutes: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function findRoutes() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast({ title: "Platsen är inte tillgänglig", description: "Din enhet delar ingen position." });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await run({
            data: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              ...(mode === "tid" ? { minutes } : { km }),
            },
          });
          setRoutes(res.routes);
          setExpanded(res.routes[0]?.id ?? null);
          setTarget({ km: res.targetKm, minutes: res.targetMinutes });
          if (res.routes.length === 0) {
            toast({
              title: "Inga förslag just här",
              description: "Prova en längre promenad så letar Flow i ett större område.",
            });
          }
        } catch {
          toast({ title: "Kunde inte hämta förslag", description: "Prova igen om en liten stund." });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast({
          title: "Ingen plats",
          description: "Tillåt platsdelning i webbläsaren så kan Flow föreslå vägar nära dig.",
        });
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }

  return (
    <CollapsibleSection
      className="surface-card p-5"
      headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
      title={<><RouteIcon size={18} className="text-primary" /> Promenadvägar nära dig</>}
      description="Säg hur länge eller hur långt du vill gå – Flow föreslår rundor och öppnar dem i kartan."
      help="Flow använder din plats för att hitta parker, skog och vatten i närheten. Förslagen är rundor tur och retur, öppna dem i Google Maps för vägbeskrivning."
    >
      <div className="flex flex-wrap gap-2">
        {(["tid", "avstånd"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition ${
              mode === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-ink"
            }`}
          >
            {m === "tid" ? "Efter tid" : "Efter avstånd"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {mode === "tid"
          ? MINUTES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMinutes(v)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  minutes === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-ink"
                }`}
              >
                {v} min
              </button>
            ))
          : KM.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setKm(v)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  km === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-ink"
                }`}
              >
                {v} km
              </button>
            ))}
      </div>

      <Button onClick={findRoutes} disabled={loading} className="rounded-xl gap-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
        {loading ? "Letar vägar…" : "Hitta promenadvägar"}
      </Button>

      {target && (
        <p className="text-sm text-muted-foreground">
          Mål: ungefär {target.km} km / {target.minutes} min i lugn takt.
        </p>
      )}

      {routes && routes.length > 0 && (
        <ul className="space-y-3">
          {routes.map((r) => {
            const open = expanded === r.id;
            const d = 0.012 + r.distanceKm * 0.0035;
            const minLat = Math.min(r.startLat, r.lat) - d;
            const maxLat = Math.max(r.startLat, r.lat) + d;
            const minLon = Math.min(r.startLon, r.lon) - d * 2;
            const maxLon = Math.max(r.startLon, r.lon) + d * 2;
            const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${r.lat}%2C${r.lon}`;
            return (
              <li key={r.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.kind} · {r.bearing}
                    </p>
                  </div>
                  <MapPin size={16} className="shrink-0 text-primary" />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/40 p-2">
                    <p className="text-[11px] text-muted-foreground">Längd</p>
                    <p className="text-sm font-semibold text-ink">{r.distanceKm} km</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2">
                    <p className="text-[11px] text-muted-foreground">Tid</p>
                    <p className="text-sm font-semibold text-ink">ca {r.minutes} min</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2">
                    <p className="text-[11px] text-muted-foreground">Höjdskillnad</p>
                    <p className="text-sm font-semibold text-ink">
                      {r.elevationGain === null ? "–" : `${r.elevationGain} m`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline"
                >
                  {open ? "Dölj kartan" : "Visa karta"}
                  <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
                </button>

                {open && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
                    <iframe
                      title={`Karta för ${r.name}`}
                      src={mapSrc}
                      loading="lazy"
                      className="h-44 w-full border-0"
                    />
                  </div>
                )}

                <a
                  href={r.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Öppna i Google Maps <ExternalLink size={14} />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {routes && routes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Flow hittade inget grönt stråk i den radien. Prova en längre promenad.
        </p>
      )}
    </CollapsibleSection>
  );
}

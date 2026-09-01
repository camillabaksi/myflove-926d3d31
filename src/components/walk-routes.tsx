import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { MyFlovePath } from "@/components/myflove/motion";
import {
  Loader2,
  MapPin,
  Navigation,
  Route as RouteIcon,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { suggestWalkRoutes, type WalkRoute } from "@/lib/walk-routes.functions";
import { useToast } from "@/hooks/use-toast";
import { useWeather } from "@/hooks/use-weather";
import { weatherAdvice } from "@/lib/weather-advice";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";
import { useEnergyBattery } from "@/hooks/use-energy-battery";

const MINUTES = [15, 30, 45, 60, 90];
const KM = [2, 3, 5, 8];

/** Förhandsvisning i MyFlove innan användaren lämnar appen. */
function embedMapSrc(r: WalkRoute): string {
  const d = 0.012 + r.distanceKm * 0.0035;
  const minLat = Math.min(r.startLat, r.lat) - d;
  const maxLat = Math.max(r.startLat, r.lat) + d;
  const minLon = Math.min(r.startLon, r.lon) - d * 2;
  const maxLon = Math.max(r.startLon, r.lon) + d * 2;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${r.lat}%2C${r.lon}`;
}

/** Flows förslag på promenadlängd utifrån batterinivån just nu. */
function suggestedMinutes(battery: number): number {
  if (battery < 25) return 15;
  if (battery < 45) return 25;
  if (battery < 70) return 40;
  return 60;
}

export default function WalkRoutesSection() {
  const run = useServerFn(suggestWalkRoutes);
  const { explain } = useFlowExplainer();
  const walkExplainer = explain("promenad");
  const { toast } = useToast();
  const advice = weatherAdvice(useWeather());
  const { reading } = useEnergyBattery();
  const battery = Math.round(reading.now);
  const flowMinutes = suggestedMinutes(battery);

  const [mode, setMode] = useState<"tid" | "avstånd">("tid");
  const [minutes, setMinutes] = useState(30);
  const [km, setKm] = useState(3);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<WalkRoute[] | null>(null);
  const [target, setTarget] = useState<{ km: number; minutes: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const selectedRoute = routes?.find((r) => r.id === selected) ?? null;
  const optsRef = useRef({ mode, minutes, km });
  optsRef.current = { mode, minutes, km };

  const findRoutes = useCallback(
    async (opts?: { fresh?: boolean; silent?: boolean }) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        if (!opts?.silent)
          toast({
            title: "Platsen är inte tillgänglig",
            description: "Din enhet delar ingen position.",
          });
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { mode: m, minutes: mi, km: k } = optsRef.current;
          try {
            const res = await run({
              data: {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                ...(m === "tid" ? { minutes: mi } : { km: k }),
              },
            });
            setRoutes(res.routes);
            setExpanded(res.routes[0]?.id ?? null);
            setSelected(null);
            setTarget({ km: res.targetKm, minutes: res.targetMinutes });
            setUpdatedAt(new Date());
            if (res.routes.length === 0 && !opts?.silent) {
              toast({
                title: "Inga förslag just här",
                description: "Prova en längre promenad så letar Flow i ett större område.",
              });
            }
          } catch {
            if (!opts?.silent)
              toast({
                title: "Kunde inte hämta förslag",
                description: "Prova igen om en liten stund.",
              });
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
          if (!opts?.silent) {
            toast({
              title: "Ingen plats",
              description: "Tillåt platsdelning i webbläsaren så kan Flow föreslå vägar nära dig.",
            });
          }
        },
        {
          enableHighAccuracy: opts?.fresh === true,
          timeout: 12000,
          maximumAge: opts?.fresh ? 0 : 300000,
        },
      );
    },
    [run, toast],
  );

  // Uppdatera automatiskt utifrån var du är just nu, om du redan gett tillåtelse.
  useEffect(() => {
    let cancelled = false;
    const perms = typeof navigator !== "undefined" ? navigator.permissions : undefined;
    if (!perms?.query) return;
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted") void findRoutes({ silent: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [findRoutes]);

  return (
    <CollapsibleSection
      className="surface-card p-5"
      headingClassName="text-lg font-semibold text-ink flex items-center gap-2"
      title={
        <>
          <RouteIcon size={18} className="text-primary" /> Promenadvägar nära dig
        </>
      }
      description={walkExplainer ?? undefined}
      help="Flow använder din plats för att hitta gångvägar, stigar och lugna gator åt olika håll. Förslagen är rundor tur och retur, öppna dem i Google Maps för vägbeskrivning."
    >
      {advice && (
        <p
          className={`rounded-2xl px-3 py-2 text-sm ${
            advice.outdoorOk ? "bg-muted/50 text-muted-foreground" : "bg-destructive/10 text-ink"
          }`}
        >
          {advice.emoji} {advice.outdoor}
        </p>
      )}

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-sm font-medium text-ink">💡 Flow föreslår</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Du har {battery} % batteri idag. En lugn promenad på ungefär {flowMinutes} minuter nära
          dig kan passa bra – men du väljer själv.
        </p>
        <Button
          variant="outline"
          className="mt-2 rounded-xl"
          disabled={loading}
          onClick={() => {
            setMode("tid");
            setMinutes(flowMinutes);
            optsRef.current = { mode: "tid", minutes: flowMinutes, km };
            void findRoutes();
          }}
        >
          Visa promenaden
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["tid", "avstånd"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition ${
              mode === m
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-ink"
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
                  minutes === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-ink"
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
                  km === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-ink"
                }`}
              >
                {v} km
              </button>
            ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void findRoutes()} disabled={loading} className="rounded-xl gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {loading ? "Letar vägar…" : "Hitta promenadvägar"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void findRoutes({ fresh: true })}
          disabled={loading}
          className="rounded-xl gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Uppdatera min plats
        </Button>
      </div>

      {loading && (
        <MyFlovePath
          className="my-2"
          steps={[
            { emoji: "📍", label: "Din plats" },
            { emoji: "🌳", label: "Vägar" },
            { emoji: "🚶", label: "Förslag" },
          ]}
          current={1}
        />
      )}

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Uppdaterat {updatedAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}{" "}
          utifrån din plats.
        </p>
      )}

      {target && (
        <p className="text-sm text-muted-foreground">
          Mål: ungefär {target.km} km / {target.minutes} min i lugn takt.
        </p>
      )}

      {routes && routes.length > 0 && selectedRoute && (
        <div className="rounded-2xl border border-border/70 p-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="px-0 text-ink hover:underline"
          >
            <ArrowLeft size={14} /> Tillbaka till förslagen
          </Button>

          <p className="mt-3 font-medium text-ink">{selectedRoute.name}</p>
          <p className="text-sm text-muted-foreground">
            {selectedRoute.distanceKm} km · ca {selectedRoute.minutes} min · {selectedRoute.kind}
          </p>

          <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
            <iframe
              title={`Karta för ${selectedRoute.name}`}
              src={embedMapSrc(selectedRoute)}
              loading="lazy"
              className="h-56 w-full border-0"
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Rundtur: du startar och slutar på samma plats. Vändpunkten ligger{" "}
            {selectedRoute.bearing} – Google Maps visar vägen dit och tillbaka.
          </p>

          <Button asChild className="mt-3 w-full rounded-xl gap-2">
            <a href={selectedRoute.mapsUrl} target="_blank" rel="noopener noreferrer">
              Öppna i Google Maps <ExternalLink size={16} />
            </a>
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Öppnas i Google Maps-appen om du har den, annars i webbläsaren.
          </p>
        </div>
      )}

      {routes && routes.length > 0 && !selectedRoute && (
        <ul className="space-y-3">
          {routes.map((r) => {
            const open = expanded === r.id;
            return (
              <li key={r.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.kind}</p>
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
                  <ChevronDown
                    size={14}
                    className={open ? "rotate-180 transition" : "transition"}
                  />
                </button>

                {open && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
                    <iframe
                      title={`Karta för ${r.name}`}
                      src={embedMapSrc(r)}
                      loading="lazy"
                      className="h-44 w-full border-0"
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setSelected(r.id)}
                  className="mt-3 w-full rounded-xl"
                >
                  Välj den här promenaden
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {routes && routes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Flow hittade inga gångbara vägar i den radien. Prova en längre promenad.
        </p>
      )}
    </CollapsibleSection>
  );
}

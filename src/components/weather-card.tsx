import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Sun,
  CloudSun,
  MapPin,
  Loader2,
} from "lucide-react";
import { setWeatherSnapshot } from "@/hooks/use-weather";

type WeatherState = {
  temperature: number;
  apparent: number;
  code: number;
  city: string;
  fetchedAt?: number;
  latitude?: number;
  longitude?: number;
};

// Vädret räknas som färskt i 20 minuter, sedan hämtas det om automatiskt.
const MAX_AGE_MS = 20 * 60 * 1000;


type GeoPermissionState = PermissionState | "unknown" | "unsupported";

interface WMOInfo {
  label: string;
  Icon: typeof Cloud;
  hint: string;
}

function describe(code: number, temp: number): WMOInfo {
  if ([0].includes(code)) return { label: "Klart", Icon: Sun, hint: temp < 5 ? "Klart och kyligt – ta en extra lager." : "Sol – ta gärna en paus ute." };
  if ([1, 2].includes(code)) return { label: "Mest klart", Icon: CloudSun, hint: "Fint väder att röra på sig i." };
  if ([3].includes(code)) return { label: "Mulet", Icon: Cloud, hint: "Grått ute – lampor på inne hjälper humöret." };
  if ([45, 48].includes(code)) return { label: "Dimma", Icon: CloudFog, hint: "Kör försiktigt om du är ute." };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Duggregn", Icon: CloudRain, hint: "Ta med jackan." };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Regn", Icon: CloudRain, hint: "Regn idag – ta det lugnt om du ska ut." };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snö", Icon: CloudSnow, hint: "Snö – halkigt kan det bli." };
  if ([95, 96, 99].includes(code)) return { label: "Åska", Icon: CloudLightning, hint: "Åska i luften – bra dag att vara inne." };
  return { label: "Vad som helst", Icon: Cloud, hint: "" };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=sv&count=1`,
    );
    if (!res.ok) return "Din plats";
    const json = (await res.json()) as { results?: Array<{ name?: string; admin1?: string }> };
    const r = json.results?.[0];
    return r?.name ?? "Din plats";
  } catch {
    return "Din plats";
  }
}

async function lookupCity(query: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&language=sv&count=1`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string }>;
    };
    const result = json.results?.[0];
    if (!result) return null;
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.admin1 ? `${result.name}, ${result.admin1}` : result.name,
    };
  } catch {
    return null;
  }
}

async function getGeolocationPermission(): Promise<GeoPermissionState> {
  if (!("permissions" in navigator)) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}

export default function WeatherCard() {
  const [state, setState] = useState<WeatherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("flow.weather.snapshot");
      if (raw) setState(JSON.parse(raw) as WeatherState);
    } catch {
      /* ignore */
    }
  }, []);

  const loadWeather = async (latitude: number, longitude: number, cityFallback?: string) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
      const [wx, city] = await Promise.all([
        fetch(url).then((r) => r.json() as Promise<{
          current?: { temperature_2m: number; apparent_temperature: number; weather_code: number };
        }>),
        cityFallback ? Promise.resolve(cityFallback) : reverseGeocode(latitude, longitude),
      ]);
      if (!wx.current) {
        setError("Kunde inte hämta vädret just nu.");
      } else {
        const snap = {
          temperature: Math.round(wx.current.temperature_2m),
          apparent: Math.round(wx.current.apparent_temperature),
          code: wx.current.weather_code,
          city,
          fetchedAt: Date.now(),
        };
        setState(snap);
        setWeatherSnapshot(snap);
      }
    } catch {
      setError("Kunde inte hämta vädret just nu.");
    } finally {
      setLoading(false);
    }
  };

  const load = () => {
    setHasAsked(true);
    setError(null);
    setLoading(true);
    if (!("geolocation" in navigator)) {
      setError("Din enhet stöder inte platsdelning.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        void loadWeather(latitude, longitude);
      },
      async (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          const permission = await getGeolocationPermission();
          setError(
            permission === "denied"
              ? "Platsåtkomst är nekad i webbläsaren."
              : "Platsfrågan kunde inte öppnas just nu. Skriv en stad nedan eller försök igen.",
          );
        } else if (err.code === err.TIMEOUT) {
          setError("Det tog för lång tid att hitta din plats. Tryck för att försöka igen.");
        } else {
          setError("Kunde inte hitta din plats. Tryck för att försöka igen.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15 * 60 * 1000 },
    );
  };

  const loadCity = async () => {
    const query = cityQuery.trim();
    if (!query) return;
    setHasAsked(true);
    setError(null);
    setLoading(true);
    const city = await lookupCity(query);
    if (!city) {
      setError("Jag hittade inte staden. Testa att skriva till exempel Stockholm.");
      setLoading(false);
      return;
    }
    await loadWeather(city.latitude, city.longitude, city.name);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={16} />
        Hämtar vädret där du är…
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="w-full rounded-2xl bg-card border border-border p-4 flex items-start gap-3 text-sm">
        <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 space-y-1.5">
          <p className="text-foreground font-medium">
            {error ?? "Tryck här för att godkänna plats och visa vädret."}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            {hasAsked
              ? "Om plats ändå inte fungerar kan webbläsaren eller telefonens platstjänster stoppa frågan. Du kan skriva stad istället."
              : "Webbläsarens platsfråga visas först efter att du trycker på kortet."}
          </p>
          <div className="pt-2 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground active:scale-[0.99] transition"
            >
              Använd min plats
            </button>
            <form
              className="flex min-w-0 flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void loadCity();
              }}
            >
              <input
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder="Skriv stad"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={!cityQuery.trim()}
                className="rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition disabled:opacity-50"
              >
                Visa
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const info = describe(state.code, state.temperature);
  const Icon = info.Icon;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-border p-4 flex items-center gap-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Icon size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold leading-none">{state.temperature}°</span>
          <span className="text-sm text-muted-foreground truncate">{info.label}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin size={11} />
          <span className="truncate">{state.city}</span>
          <span aria-hidden>·</span>
          <span>känns som {state.apparent}°</span>
        </div>
        {info.hint && <p className="text-xs text-foreground/80 mt-1.5 leading-snug">{info.hint}</p>}
      </div>
    </div>
  );
}

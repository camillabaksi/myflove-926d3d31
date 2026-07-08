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

type WeatherState = {
  temperature: number;
  apparent: number;
  code: number;
  city: string;
};

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

export default function WeatherCard() {
  const [state, setState] = useState<WeatherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setError(null);
    setLoading(true);
    if (!("geolocation" in navigator)) {
      setError("Din enhet stöder inte platsdelning.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
          const [wx, city] = await Promise.all([
            fetch(url).then((r) => r.json() as Promise<{
              current?: { temperature_2m: number; apparent_temperature: number; weather_code: number };
            }>),
            reverseGeocode(latitude, longitude),
          ]);
          if (!wx.current) {
            setError("Kunde inte hämta vädret just nu.");
          } else {
            setState({
              temperature: Math.round(wx.current.temperature_2m),
              apparent: Math.round(wx.current.apparent_temperature),
              code: wx.current.weather_code,
              city,
            });
          }
        } catch {
          setError("Kunde inte hämta vädret just nu.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Platsåtkomst är blockerad. Tillåt plats i webbläsarens inställningar och tryck här igen.");
        } else {
          setError("Kunde inte hitta din plats. Tryck för att försöka igen.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15 * 60 * 1000 },
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <button
        type="button"
        onClick={load}
        className="w-full text-left rounded-2xl bg-card border border-border p-4 flex items-start gap-3 text-sm hover:bg-secondary/60 active:scale-[0.99] transition"
      >
        <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 space-y-1.5">
          <p className="text-foreground font-medium">
            {error ?? "Tryck för att visa vädret där du är."}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Händer inget? Öppna webbläsarens meny (⋮ i Chrome) → Inställningar →
            Webbplatsinställningar → Plats, och tillåt för <b>lovable.app</b>. Ladda sedan om sidan.
          </p>
        </div>
      </button>
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

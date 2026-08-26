import { useEffect, useState } from "react";
import { useWeather } from "@/hooks/use-weather";
import { todayISO } from "@/lib/day";

/**
 * Timprognos för idag – används av Flow för att kunna säga
 * "det regnar när du ska ut" istället för bara "det regnar nu".
 *
 * Samma källa (Open-Meteo) och samma position som väderkortet redan använder.
 * Hämtas max en gång i timmen och cachas lokalt.
 */

export interface HourForecast {
  /** Timme 0–23 lokal tid. */
  hour: number;
  code: number;
  /** Sannolikhet för nederbörd i procent. */
  rainChance: number;
}

interface ForecastCache {
  day: string;
  fetchedAt: number;
  lat: number;
  lon: number;
  hours: HourForecast[];
}

const KEY = "flow.weather.hourly";
const MAX_AGE = 1000 * 60 * 60;

const WET_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
]);

/** Är timmen blöt nog att nämna? */
export function isWetHour(h: HourForecast | undefined): boolean {
  if (!h) return false;
  return WET_CODES.has(h.code) || h.rainChance >= 50;
}

function readCache(): ForecastCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ForecastCache) : null;
  } catch {
    return null;
  }
}

export function useWeatherForecast(): HourForecast[] {
  const weather = useWeather();
  const lat = weather?.latitude;
  const lon = weather?.longitude;
  const [hours, setHours] = useState<HourForecast[]>(() => {
    const c = readCache();
    return c && c.day === todayISO() ? c.hours : [];
  });

  useEffect(() => {
    if (lat == null || lon == null) return;
    const today = todayISO();
    const cached = readCache();
    const fresh =
      cached &&
      cached.day === today &&
      Date.now() - cached.fetchedAt < MAX_AGE &&
      Math.abs(cached.lat - lat) < 0.2 &&
      Math.abs(cached.lon - lon) < 0.2;
    if (fresh) {
      setHours(cached.hours);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=weather_code,precipitation_probability&forecast_days=1&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = (await res.json()) as {
          hourly?: {
            time?: string[];
            weather_code?: number[];
            precipitation_probability?: number[];
          };
        };
        const times = json.hourly?.time ?? [];
        const next: HourForecast[] = times.map((t, i) => ({
          hour: Number(t.slice(11, 13)),
          code: json.hourly?.weather_code?.[i] ?? 0,
          rainChance: json.hourly?.precipitation_probability?.[i] ?? 0,
        }));
        if (cancelled || next.length === 0) return;
        setHours(next);
        try {
          window.localStorage.setItem(
            KEY,
            JSON.stringify({ day: today, fetchedAt: Date.now(), lat, lon, hours: next }),
          );
        } catch {
          /* ignore */
        }
      } catch {
        /* väder är extra – Flow klarar sig utan */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return hours;
}

/** Prognosen för en viss timme idag. */
export function forecastAt(hours: HourForecast[], hour: number): HourForecast | undefined {
  return hours.find((h) => h.hour === hour);
}

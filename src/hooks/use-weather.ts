import { useEffect, useSyncExternalStore } from "react";

export type WeatherSnapshot = {
  temperature: number;
  apparent: number;
  code: number;
  city: string;
  fetchedAt: number;
  latitude?: number;
  longitude?: number;
};


const STORAGE_KEY = "flow.weather.snapshot";
const listeners = new Set<() => void>();

function readSnapshot(): WeatherSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherSnapshot;
  } catch {
    return null;
  }
}

let cache: WeatherSnapshot | null = readSnapshot();

function emit() {
  for (const l of listeners) l();
}

export function setWeatherSnapshot(snap: WeatherSnapshot) {
  cache = snap;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = readSnapshot();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWeather(): WeatherSnapshot | null {
  const snap = useSyncExternalStore(
    subscribe,
    () => cache,
    () => null,
  );
  // Ensure we hydrate cache on first mount if it was written before this module loaded.
  useEffect(() => {
    if (!cache) {
      const fresh = readSnapshot();
      if (fresh) {
        cache = fresh;
        emit();
      }
    }
  }, []);
  return snap;
}

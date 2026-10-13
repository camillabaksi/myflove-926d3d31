import { useCallback, useEffect, useState } from "react";
import { todayISO } from "@/lib/day";
import { PLACE_CONTEXTS, type PlaceContext, type SavedPlaceContext } from "@/lib/place-context";

type Coordinates = { latitude: number; longitude: number };
type PlaceState = {
  selected: PlaceContext | null;
  autoEnabled: boolean;
  savedPlaces: Partial<Record<SavedPlaceContext, Coordinates>>;
  manualOverrideDate?: string;
};
type PlaceStatus = "idle" | "checking" | "matched" | "no-match" | "error";

const STORAGE_KEY = "myflove-place-context";
const CHANGE_EVENT = "myflove:place-context-change";
const MATCH_RADIUS_METERS = 350;
const EMPTY: PlaceState = { selected: null, autoEnabled: false, savedPlaces: {} };

function readState(): PlaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PlaceState>;
    const validPlace = PLACE_CONTEXTS.some((item) => item.id === parsed.selected)
      ? parsed.selected ?? null
      : null;
    const savedPlaces = parsed.savedPlaces && typeof parsed.savedPlaces === "object"
      ? parsed.savedPlaces
      : {};
    return {
      selected: validPlace,
      autoEnabled: parsed.autoEnabled === true,
      savedPlaces,
      manualOverrideDate: typeof parsed.manualOverrideDate === "string" ? parsed.manualOverrideDate : undefined,
    };
  } catch {
    return EMPTY;
  }
}

function writeState(next: PlaceState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Platsläget fungerar även om lagring är avstängd, men då bara tillfälligt.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function distanceMeters(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Platsstöd saknas i den här webbläsaren."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error("Kunde inte läsa platsen. Kontrollera platsbehörigheten.")),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

export function usePlaceContext(autoDetect = false) {
  const [state, setState] = useState<PlaceState>(() => readState());
  const [status, setStatus] = useState<PlaceStatus>("idle");

  useEffect(() => {
    const sync = () => setState(readState());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<PlaceState>) => {
    const next = { ...readState(), ...patch };
    writeState(next);
    setState(next);
  }, []);

  const setPlace = useCallback((place: PlaceContext) => {
    update({ selected: place, manualOverrideDate: todayISO() });
  }, [update]);

  const setAutoEnabled = useCallback((autoEnabled: boolean) => {
    update({ autoEnabled });
  }, [update]);

  const locate = useCallback(async (saveAs?: SavedPlaceContext) => {
    setStatus("checking");
    try {
      const current = await getCurrentPosition();
      if (saveAs) {
        const savedPlaces = { ...readState().savedPlaces, [saveAs]: current };
        update({
          selected: saveAs,
          savedPlaces,
          autoEnabled: true,
          manualOverrideDate: undefined,
        });
        setStatus("matched");
        return;
      }

      const saved = readState().savedPlaces;
      const match = (Object.entries(saved) as Array<[SavedPlaceContext, Coordinates]>)
        .map(([place, point]) => ({ place, distance: distanceMeters(current, point) }))
        .filter((candidate) => candidate.distance <= MATCH_RADIUS_METERS)
        .sort((a, b) => a.distance - b.distance)[0];
      if (!match) {
        setStatus("no-match");
        return;
      }
      update({ selected: match.place, manualOverrideDate: undefined });
      setStatus("matched");
    } catch {
      setStatus("error");
    }
  }, [update]);

  useEffect(() => {
    const hasSavedPlaces = Object.keys(state.savedPlaces).length > 0;
    if (!autoDetect || !state.autoEnabled || !hasSavedPlaces || state.manualOverrideDate === todayISO()) return;
    void locate();
  }, [autoDetect, state.autoEnabled, state.savedPlaces, state.manualOverrideDate, locate]);

  const selectedLabel = PLACE_CONTEXTS.find((item) => item.id === state.selected)?.label ?? null;
  return {
    place: state.selected,
    placeLabel: selectedLabel,
    autoEnabled: state.autoEnabled,
    savedPlaces: state.savedPlaces,
    status,
    setPlace,
    setAutoEnabled,
    saveCurrentPlace: (place: SavedPlaceContext) => locate(place),
    refreshPlace: () => locate(),
  };
}

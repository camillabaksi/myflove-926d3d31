import { useEffect, useRef, useState } from "react";
import { useSavedStores } from "./use-data";
import { useSharedShoppingList } from "./use-shared-shopping-list";
import { sendPushNotification } from "@/lib/push-notifications";

export interface ProximityAlert {
  storeId: string;
  storeName: string;
  distanceMeters: number;
}

const CHECK_INTERVAL_MS = 3 * 60 * 1000;
const NEARBY_THRESHOLD_METERS = 300;
const EARTH_RADIUS_M = 6371000;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

// Approximates geofencing using the browser Geolocation API: periodically
// checks the user's position against saved store locations and fires a
// notification when they're nearby with items still left on the list.
export function useShoppingProximityAlerts() {
  const { savedStores } = useSavedStores();
  const { activeItems } = useSharedShoppingList();
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());

  const activeStores = savedStores.filter((s) => s.alertEnabled);
  const storesKey = activeStores.map((s) => `${s.id}:${s.lat}:${s.lon}`).join("|");
  const hasItemsLeft = activeItems.length > 0;

  useEffect(() => {
    if (!isGeolocationSupported() || activeStores.length === 0 || !hasItemsLeft) {
      setAlerts([]);
      return;
    }

    let cancelled = false;

    const check = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          const { latitude, longitude } = position.coords;
          const nearby: ProximityAlert[] = [];
          const todayStr = new Date().toDateString();

          activeStores.forEach((store) => {
            const distance = distanceMeters(latitude, longitude, store.lat, store.lon);
            if (distance <= NEARBY_THRESHOLD_METERS) {
              const dedupeKey = `${store.id}:${todayStr}`;
              if (!dismissedRef.current.has(dedupeKey)) {
                if (!notifiedRef.current.has(dedupeKey)) {
                  notifiedRef.current.add(dedupeKey);
                  sendPushNotification(`Du är nära ${store.name}`, {
                    body: `Du har ${activeItems.length} vara${activeItems.length === 1 ? "" : "r"} kvar på inköpslistan.`,
                    tag: dedupeKey,
                  });
                }
                nearby.push({ storeId: store.id, storeName: store.name, distanceMeters: Math.round(distance) });
              }
            }
          });

          setAlerts(nearby);
        },
        () => {
          // Ignore geolocation errors (denied permission, unavailable, etc.)
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
      );
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storesKey, hasItemsLeft, activeItems.length]);

  const dismissAlert = (alert: ProximityAlert) => {
    dismissedRef.current.add(`${alert.storeId}:${new Date().toDateString()}`);
    setAlerts((prev) => prev.filter((a) => a.storeId !== alert.storeId));
  };

  return { alerts, dismissAlert };
}

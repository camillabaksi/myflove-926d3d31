import { useEffect, useRef, useState } from "react";
import { getSlTrip } from "@workspace/api-client-react";
import { useSavedTrips, type SavedTrip } from "./use-data";
import { sendPushNotification } from "@/lib/push-notifications";

export interface CommuteAlert {
  tripId: string;
  label: string;
  departureTime: string;
  minutesUntilDeparture: number;
  lineName: string;
}

const POLL_INTERVAL_MS = 60 * 1000;

function minutesUntil(departureTime: string): number | null {
  const match = departureTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, hh, mm] = match;
  const now = new Date();
  const departure = new Date();
  departure.setHours(Number(hh), Number(mm), 0, 0);
  let diffMs = departure.getTime() - now.getTime();
  if (diffMs < -30 * 60 * 1000) {
    // Assume it's for tomorrow if it's already well in the past today
    diffMs += 24 * 60 * 60 * 1000;
  }
  return Math.round(diffMs / 60000);
}

export function useCommuteAlerts() {
  const { savedTrips } = useSavedTrips();
  const [alerts, setAlerts] = useState<CommuteAlert[]>([]);
  const dismissedRef = useRef<Set<string>>(new Set());
  const notifiedRef = useRef<Set<string>>(new Set());

  const activeTrips = savedTrips.filter((t) => t.alertEnabled);
  const activeTripsKey = activeTrips.map((t) => `${t.id}:${t.from}:${t.to}:${t.alertMinutesBefore}`).join("|");

  useEffect(() => {
    if (activeTrips.length === 0) {
      setAlerts([]);
      return;
    }

    let cancelled = false;

    const checkTrips = async () => {
      const results = await Promise.all(
        activeTrips.map(async (trip: SavedTrip) => {
          try {
            const suggestion = await getSlTrip({ from: trip.from, to: trip.to });
            const minutesLeft = minutesUntil(suggestion.departureTime);
            if (minutesLeft === null) return null;
            const threshold = trip.alertMinutesBefore ?? 15;
            const dedupeKey = `${trip.id}:${suggestion.departureTime}:${new Date().toDateString()}`;
            if (minutesLeft >= 0 && minutesLeft <= threshold && !dismissedRef.current.has(dedupeKey)) {
              if (!notifiedRef.current.has(dedupeKey)) {
                notifiedRef.current.add(dedupeKey);
                sendPushNotification(`Dags att gå: ${trip.label}`, {
                  body: `${suggestion.lineName} avgår ${minutesLeft <= 0 ? "nu" : `om ${minutesLeft} min`} (${suggestion.departureTime})`,
                  tag: dedupeKey,
                });
              }
              return {
                tripId: trip.id,
                label: trip.label,
                departureTime: suggestion.departureTime,
                minutesUntilDeparture: minutesLeft,
                lineName: suggestion.lineName,
              } satisfies CommuteAlert;
            }
            return null;
          } catch {
            return null;
          }
        }),
      );

      if (!cancelled) {
        setAlerts(results.filter((a): a is CommuteAlert => a !== null));
      }
    };

    checkTrips();
    const interval = setInterval(checkTrips, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripsKey]);

  const dismissAlert = (alert: CommuteAlert) => {
    const dedupeKey = `${alert.tripId}:${alert.departureTime}:${new Date().toDateString()}`;
    dismissedRef.current.add(dedupeKey);
    setAlerts((prev) => prev.filter((a) => a.tripId !== alert.tripId));
  };

  return { alerts, dismissAlert };
}

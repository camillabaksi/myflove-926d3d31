import { useEffect, useRef, useState } from "react";
import { useMedications } from "./use-data";
import { sendPushNotification } from "@/lib/push-notifications";

export interface MedicationAlert {
  key: string;
  medId: string;
  name: string;
  dosage?: string;
  time: string;
}

const POLL_INTERVAL_MS = 60 * 1000;

export function useMedicationAlerts() {
  const { medications, isTaken } = useMedications();
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());

  const medsKey = medications.map((m) => `${m.id}:${m.times.join(",")}`).join("|");

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayStr = now.toISOString().split("T")[0] as string;

      const due: MedicationAlert[] = [];
      medications.forEach((med) => {
        med.times.forEach((time) => {
          if (time <= nowStr && !isTaken(med.id, time, todayStr)) {
            const key = `${med.id}:${time}:${todayStr}`;
            if (dismissedRef.current.has(key)) return;
            if (!notifiedRef.current.has(key)) {
              notifiedRef.current.add(key);
              sendPushNotification("Dags att ta medicin", {
                body: `${med.name}${med.dosage ? ` (${med.dosage})` : ""} – ${time}`,
                tag: key,
              });
            }
            due.push({ key, medId: med.id, name: med.name, dosage: med.dosage, time });
          }
        });
      });
      setAlerts(due);
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medsKey]);

  const dismissAlert = (alert: MedicationAlert) => {
    dismissedRef.current.add(alert.key);
    setAlerts((prev) => prev.filter((a) => a.key !== alert.key));
  };

  return { alerts, dismissAlert };
}

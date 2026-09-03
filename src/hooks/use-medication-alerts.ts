import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMedications } from "./use-data";
import { medicationOccursOn } from "@/lib/medications";
import { sendPushNotification } from "@/lib/push-notifications";
import { syncReminder } from "@/lib/push.functions";
import { todayISO } from "@/lib/day";

export interface MedicationAlert {
  key: string;
  medId: string;
  name: string;
  dosage?: string;
  time: string;
}

const POLL_INTERVAL_MS = 60 * 1000;
const SNOOZE_MINUTES = 10;

export function useMedicationAlerts() {
  const { medications, isTaken, toggleTaken } = useMedications();
  const [alerts, setAlerts] = useState<MedicationAlert[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  // Nyckel -> tidsstämpel då larmet ska dyka upp igen efter "skjut upp".
  const snoozedRef = useRef<Map<string, number>>(new Map());

  const medsKey = medications
    .map((m) => `${m.id}:${m.times.join(",")}:${m.repeat ?? "daily"}:${m.startDate ?? ""}`)
    .join("|");

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayStr = todayISO(now);

      const due: MedicationAlert[] = [];
      medications.forEach((med) => {
        if (!medicationOccursOn(med, todayStr)) return;
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

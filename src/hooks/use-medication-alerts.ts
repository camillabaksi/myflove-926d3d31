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
  const { medications, isTaken, toggleTaken, log } = useMedications();
  // Tagna doser måste trigga ny kontroll, annars ligger larmet kvar.
  const logKey = log.map((l) => `${l.medId}:${l.time}:${l.date}`).join("|");
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
            const snoozedUntil = snoozedRef.current.get(key);
            if (snoozedUntil && Date.now() < snoozedUntil) return;
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
  }, [medsKey, logKey]);

  const dismissAlert = (alert: MedicationAlert) => {
    dismissedRef.current.add(alert.key);
    setAlerts((prev) => prev.filter((a) => a.key !== alert.key));
  };

  /** "Tagen" direkt i larmet: bocka av dosen och stäng larmet. */
  const takeAlert = (alert: MedicationAlert) => {
    if (!isTaken(alert.medId, alert.time)) toggleTaken(alert.medId, alert.time);
    dismissAlert(alert);
    toast.success("Tagen ✓", {
      description: `${alert.name}${alert.dosage ? ` (${alert.dosage})` : ""} – ${alert.time}`,
    });
  };

  /** "Skjut upp": dölj larmet i 10 min + schemalägg en push om appen stängs. */
  const snoozeAlert = (alert: MedicationAlert) => {
    snoozedRef.current.set(alert.key, Date.now() + SNOOZE_MINUTES * 60_000);
    setAlerts((prev) => prev.filter((a) => a.key !== alert.key));
    const deliverAt = new Date(Date.now() + SNOOZE_MINUTES * 60_000).toISOString();
    syncReminder({
      data: {
        // Börjar med `med:` så att även den snoozade pushnotisen får
        // snabbvalsknapparna (Tagit / 10 min / Hoppa över).
        clientKey: `med:${alert.medId}:snooze:${alert.time}:${Date.now()}`,
        kind: "medication",
        title: "💊 Dags att ta medicin",
        body: `${alert.name}${alert.dosage ? ` (${alert.dosage})` : ""} – ${alert.time}`,
        deliverAt,
        url: "/daglig-rutin",
      },
    }).catch(() => {});
    toast(`Påminnelse om ${SNOOZE_MINUTES} min`, { description: alert.name });
  };

  return { alerts, dismissAlert, takeAlert, snoozeAlert };
}

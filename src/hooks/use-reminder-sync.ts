import { isNativeShell } from "@/lib/native-caps";
import {
  nativeRemindersSupported,
  lockedNativeReminderPrefixes,
  reconcileNativeReminders,
  nativeReminderPreferences,
  NATIVE_REMINDERS_EVENT,
} from "@/lib/native-reminders";
import { subscribeQuietMode } from "@/lib/quiet-mode";
import { subscribeAlarmPref } from "@/lib/push-notifications";
import { PERSONALIZATION_EVENT } from "@/lib/personalization";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTasks, useMedications, useReminders } from "@/hooks/use-data";
import { syncReminder, cancelReminder, reconcileReminders } from "@/lib/push.functions";
import {
  MEDICATION_REMINDER_PREFIX,
  medicationReminderKey,
  medicationOccursOn,
} from "@/lib/medications";
import {
  getCurrentSubscription,
  refreshPushSubscription,
  PUSH_SUBSCRIPTION_EVENT,
} from "@/lib/push-client";
import { ACCOUNT_BOUND_EVENT, getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { reminderOccurrencesForDay } from "@/lib/reminder-occurrences";
import { isActiveOwner } from "@/lib/account-scope";
import { todayISO } from "@/lib/day";
import { routineOccursOn, type Routine } from "@/lib/recurrence";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildren } from "@/hooks/use-children";
import { useChildReminderSettings } from "@/lib/child-reminders";
import { useAdaptiveLead, applyAdaptiveLead } from "@/lib/adaptive-lead";
import type { ChildScheduleEntry } from "@/components/child-schedule";

// One source of desired reminders: web cron or the native OS queue, depending on this device.

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayISO(d);
}

function combineDateTime(date: string, time: string): Date | null {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, (mo ?? 1) - 1, d, h, m, 0, 0);
}

export function useReminderSync() {
  const { tasks } = useTasks();
  const { medications, isTaken, log: medicationLog, ready: medsReady } = useMedications();
  const { reminders } = useReminders();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { openItems: quickflowItems } = useQuickflow();
  const { lectures, settings: studySettings } = useStudySchedule();
  const {
    children,
    items: childItems,
    loading: childrenLoading,
    error: childrenError,
  } = useChildren();
  const [childSchedules] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(
    "myflove-child-schedules",
    {},
  );
  const { settings: childReminders } = useChildReminderSettings();
  const { state: adaptiveLead } = useAdaptiveLead();
  const syncFn = useServerFn(syncReminder);
  const cancelFn = useServerFn(cancelReminder);
  const reconcileFn = useServerFn(reconcileReminders);
  const lastKeys = useRef<Set<string>>(new Set());
  const inFlight = useRef<Promise<void> | undefined>(undefined);

  // Regelbunden omsynk: annars ligger bara det som schemalades vid senaste
  // ändringen kvar, och notiser kan sluta komma efter midnatt eller när
  // webbläsaren bytt push-prenumeration medan appen varit stängd.
  const [resyncTick, setResyncTick] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setResyncTick((n) => n + 1);
    const id = window.setInterval(bump, 15 * 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PUSH_SUBSCRIPTION_EVENT, bump);
    window.addEventListener("online", bump);
    window.addEventListener(ACCOUNT_BOUND_EVENT, bump);
    window.addEventListener(NATIVE_REMINDERS_EVENT, bump);
    window.addEventListener(PERSONALIZATION_EVENT, bump);
    const stopQuiet = subscribeQuietMode(bump);
    const stopAlarm = subscribeAlarmPref(bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PUSH_SUBSCRIPTION_EVENT, bump);
      window.removeEventListener("online", bump);
      window.removeEventListener(ACCOUNT_BOUND_EVENT, bump);
      window.removeEventListener(NATIVE_REMINDERS_EVENT, bump);
      window.removeEventListener(PERSONALIZATION_EVENT, bump);
      stopQuiet();
      stopAlarm();
    };
  }, []);

  // Signatur över allt som ska trigga en ny synk (uppgifter, medicin,
  // påminnelser, rutiner, quickflow, lektioner och barnschema).
  const syncSignature = JSON.stringify([
    tasks.map((t) => [
      t.id,
      t.title,
      t.completed,
      t.time,
      t.dueDate,
      t.reminderMinutesBefore,
      (t.deadlineLeadDays ?? []).join(","),
      t.deadlineReminderTime,
    ]),
    medsReady,
    medicationLog,
    medications.map((m) => [m.id, m.name, m.dosage, m.times.join(","), m.repeat, m.startDate]),
    reminders.map((r) => [
      r.id,
      r.completed,
      r.canceled,
      r.date,
      r.time,
      r.repeat,
      r.remindMinutesBefore,
      r.occurrenceOverrides,
      r.title,
      r.note,
    ]),
    routines.map((r) => [r.id, r.title, r.time, r.enabled, r.repeat, r.startDate]),
    quickflowItems.map((q) => [q.id, q.text, q.remindAt, q.done]),
    lectures.map((l) => [l.id, l.title, l.weekday, l.start, l.location]),
    studySettings.lectureReminderMinutes,
    childSchedules ?? {},
    childItems.map((i) => [
      i.id,
      i.child_id,
      i.title,
      i.date,
      i.time,
      i.completed,
      i.owner_id,
      i.shareNotify,
    ]),
    children.map((c) => [c.id, c.name, c.owner_id]),
    childrenLoading,
    childrenError,
    childReminders,
    adaptiveLead,
  ]);

  useEffect(() => {
    let alive = true;
    let retryTimer: number | undefined;
    const previous = inFlight.current;
    const run = (async () => {
      // En gammal tidsändring får inte skriva efter den nya vid långsamt nät.
      await previous;
      if (!alive) return;
      // Only sync when signed in AND actually subscribed to push
      const user = await getSyncUser();
      if (!alive || !user) return;
      const isCurrent = () => alive && isActiveOwner(user.id);
      if (!isCurrent()) return;
      // Har användaren gett tillstånd men tappat prenumerationen (t.ex. efter
      // en webbläsaruppdatering) återskapas den, annars kommer inga notiser
      // när appen är stängd.
      const native = isNativeShell();
      if (native && !nativeRemindersSupported()) return;
      if (!native) {
        let sub = await getCurrentSubscription();
        if (!sub && typeof Notification !== "undefined" && Notification.permission === "granted") {
          sub = await refreshPushSubscription();
        }
        if (!isCurrent() || !sub) return;
      }

      const now = Date.now();
      // Uppgifter, medicin och påminnelser schemaläggs 14 dagar framåt så att
      // notiser kommer även om appen inte öppnas på flera dagar.
      const taskDates: string[] = [];
      for (let i = -1; i < 14; i++) taskDates.push(todayIso(i));
      const medDates: string[] = [];
      for (let i = -1; i < 14; i++) medDates.push(todayIso(i));
      const desired = new Map<
        string,
        {
          clientKey: string;
          kind: "task" | "medication" | "custom";
          title: string;
          body: string;
          deliverAt: string;
          url: string;
        }
      >();

      // Timed tasks
      for (const t of tasks) {
        if (t.completed || !t.time || !t.dueDate) continue;
        // Bara aktiviteter där användaren själv valt påminnelse ger notis.
        if (t.reminderMinutesBefore == null) continue;
        if (!taskDates.includes(t.dueDate)) continue;
        const when = combineDateTime(t.dueDate, t.time);
        if (!when) continue;
        const minsBefore = applyAdaptiveLead(t.reminderMinutesBefore ?? 0, adaptiveLead, "uppgift");
        const deliver = new Date(when.getTime() - minsBefore * 60_000);
        const key = `task:${t.id}`;
        desired.set(key, {
          clientKey: key,
          kind: "task",
          title: minsBefore > 0 ? `Om ${minsBefore} min: ${t.title}` : t.title,
          body: `Kl ${t.time}${minsBefore > 0 ? ` – kommer snart` : ""}`,
          deliverAt: deliver.toISOString(),
          url: "/idag",
        });
      }

      // Smarta deadline-påminnelser (Studier m.fl.): X dagar innan förfallodatum.
      const horizon = todayIso(14);
      for (const t of tasks) {
        if (t.completed || !t.dueDate) continue;
        const leads = t.deadlineLeadDays ?? [];
        if (leads.length === 0) continue;
        const at = t.deadlineReminderTime ?? "09:00";
        for (const lead of leads) {
          const due = new Date(t.dueDate + "T00:00:00");
          due.setDate(due.getDate() - lead);
          const date = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
          if (date > horizon) continue;
          const when = combineDateTime(date, at);
          if (!when) continue;
          if (when.getTime() < now - 24 * 60 * 60_000) continue;
          const key = `deadline:${t.id}:${lead}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title:
              lead === 0
                ? `📅 Deadline idag: ${t.title}`
                : `📅 ${lead} dag${lead === 1 ? "" : "ar"} kvar: ${t.title}`,
            body:
              lead === 0
                ? "Sista dagen – ett litet steg räcker."
                : `Deadline ${t.dueDate}. Vill du ta ett steg idag?`,
            deliverAt: when.toISOString(),
            url: t.area === "studier" ? "/studyflow" : "/tasks",
          });
        }
      }

      // Medications: daily for the next 14 days so notiser fortsätter komma
      for (const med of medications) {
        for (const time of med.times) {
          for (const date of medDates) {
            if (!medicationOccursOn(med, date)) continue;
            const when = combineDateTime(date, time);
            if (!when) continue;
            if (isTaken(med.id, time, date)) continue;
            const key = medicationReminderKey(med.id, date, time);
            desired.set(key, {
              clientKey: key,
              kind: "medication",
              title: `💊 ${med.name}`,
              body: med.dosage ? `${med.dosage} – kl ${time}` : `Dags kl ${time}`,
              deliverAt: when.toISOString(),
              url: "/daglig-rutin",
            });
          }
        }
      }
      // Schedule the REAL occurrences, including moved originals outside the
      // visible horizon. Keep client keys tied to the original day so edits
      // cancel/replace the correct OS or web push without touching the series.
      const horizonDates: string[] = [];
      for (let i = -1; i < 14; i++) horizonDates.push(todayIso(i));
      for (const r of reminders) {
        if (r.completed || r.canceled) continue;
        const repeat = r.repeat ?? "none";
        const leadMins = applyAdaptiveLead(r.remindMinutesBefore ?? 0, adaptiveLead, "kalender");
        for (const day of horizonDates) for (const occurrence of reminderOccurrencesForDay(r, day)) {
          if (!occurrence.time) continue;
          const when = combineDateTime(day, occurrence.time);
          if (!when) continue;
          const deliverAt = new Date(when.getTime() - leadMins * 60_000);
          const key = repeat === "none" ? `rem:${r.id}` : `rem:${r.id}:${occurrence.occurrenceDate}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title: leadMins > 0 ? `🔔 Om ${leadMins} min: ${r.title}` : `🔔 ${r.title}`,
            body: `Påminnelse kl ${occurrence.time}`,
            deliverAt: deliverAt.toISOString(),
            url: "/kalender",
          });
        }
      }

      // Dagliga rutiner: schemalägg 14 dagar framåt
      for (const routine of routines) {
        if (!routine.enabled || !routine.time) continue;
        for (const date of horizonDates) {
          if (!routineOccursOn(routine, date)) continue;
          const when = combineDateTime(date, routine.time);
          if (!when) continue;
          const key = `routine:${routine.id}:${date}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title: `🔁 ${routine.title}`,
            body: `Dags kl ${routine.time}`,
            deliverAt: when.toISOString(),
            url: "/daglig-rutin",
          });
        }
      }

      // Lektioner från det importerade schemat: påminnelse X min innan, 14 dagar framåt.
      const lead = applyAdaptiveLead(
        studySettings.lectureReminderMinutes ?? 0,
        adaptiveLead,
        "lektion",
      );
      if (lead > 0) {
        for (const lecture of lectures) {
          for (const date of horizonDates) {
            const d = new Date(date + "T00:00:00");
            if ((d.getDay() + 6) % 7 !== lecture.weekday) continue;
            const when = combineDateTime(date, lecture.start);
            if (!when) continue;
            const deliver = new Date(when.getTime() - lead * 60_000);
            const key = `lecture:${lecture.id}:${date}`;
            desired.set(key, {
              clientKey: key,
              kind: "custom",
              title: `🎓 Om ${lead} min: ${lecture.title}`,
              body: lecture.location
                ? `Kl ${lecture.start} i ${lecture.location}`
                : `Kl ${lecture.start}`,
              deliverAt: deliver.toISOString(),
              url: "/studyflow",
            });
          }
        }
      }

      // Barnens hållpunkter: skolschema + inlagda aktiviteter, 14 dagar framåt.
      if (childReminders.enabled) {
        // Egna barn/aktiviteter, plus delat från familjemedlemmar man själv valt.
        const myId = user.id;
        const allowedOwners = new Set<string>([myId, ...(childReminders.familyFrom ?? [])]);
        const nameOf = new Map(
          children.filter((c) => allowedOwners.has(c.owner_id)).map((c) => [c.id, c.name]),
        );
        const childLead = applyAdaptiveLead(
          Math.max(0, childReminders.minutesBefore ?? 0),
          adaptiveLead,
          "barn",
        );
        // date -> lista med hållpunkter (för morgonöversikten)
        const byDate = new Map<string, { time: string; title: string; who: string }[]>();

        const addToDay = (date: string, time: string, title: string, who: string) => {
          const list = byDate.get(date) ?? [];
          list.push({ time, title, who });
          byDate.set(date, list);
        };

        for (const [childId, entries] of Object.entries(childSchedules ?? {})) {
          const who = nameOf.get(childId);
          if (!who) continue;
          for (const e of entries ?? []) {
            for (const date of horizonDates) {
              const d = new Date(date + "T00:00:00");
              if ((d.getDay() + 6) % 7 !== e.weekday) continue;
              addToDay(date, e.start, e.title, who);
              const when = combineDateTime(date, e.start);
              if (!when) continue;
              const deliver = new Date(when.getTime() - childLead * 60_000);
              const key = `child-schedule:${childId}:${e.id}:${date}`;
              desired.set(key, {
                clientKey: key,
                kind: "custom",
                title: childLead > 0 ? `🎒 Om ${childLead} min: ${e.title}` : `🎒 ${e.title}`,
                body: e.location
                  ? `${who} – kl ${e.start} i ${e.location}`
                  : `${who} – kl ${e.start}`,
                deliverAt: deliver.toISOString(),
                url: "/barn",
              });
            }
          }
        }

        for (const i of childItems) {
          if (i.completed || !i.time || !i.date) continue;
          if (!allowedOwners.has(i.owner_id)) continue;
          // Delat från någon annan: ägaren måste ha slagit på notiser till mig,
          // utöver att jag själv valt att ta emot från den personen.
          if (i.owner_id !== myId && i.shareNotify?.[myId] !== true) continue;
          if (!horizonDates.includes(i.date)) continue;
          const who = nameOf.get(i.child_id);
          if (!who) continue;
          const time = i.time.slice(0, 5);
          addToDay(i.date, time, i.title, who);
          const when = combineDateTime(i.date, time);
          if (!when) continue;
          const deliver = new Date(when.getTime() - childLead * 60_000);
          const key = `child-item:${i.id}`;
          desired.set(key, {
            clientKey: key,
            kind: "custom",
            title: childLead > 0 ? `👦 Om ${childLead} min: ${i.title}` : `👦 ${i.title}`,
            body: `${who} – kl ${time}`,
            deliverAt: deliver.toISOString(),
            url: "/barn",
          });
        }

        // Morgonöversikt: hela barnens dag i en lugn notis.
        if (childReminders.morningSummary) {
          for (const [date, list] of byDate) {
            if (list.length === 0) continue;
            const when = combineDateTime(date, childReminders.morningTime || "07:00");
            if (!when) continue;
            const sorted = [...list].sort((a, b) => a.time.localeCompare(b.time));
            const key = `child-day:${date}`;
            desired.set(key, {
              clientKey: key,
              kind: "custom",
              title: "🌤️ Barnens dag idag",
              body: sorted
                .slice(0, 4)
                .map((e) => `${e.time} ${e.title} (${e.who})`)
                .join(" · "),
              deliverAt: when.toISOString(),
              url: "/barn",
            });
          }
        }
      }

      // Quickflow – "du bad mig komma ihåg". Får aldrig försvinna.
      for (const item of quickflowItems) {
        if (!item.remindAt || item.done) continue;
        if (item.remindAt < now - 24 * 60 * 60_000) continue;
        const key = `quickflow:${item.id}`;
        desired.set(key, {
          clientKey: key,
          kind: "custom",
          title: "🔔 Paceable: Du bad mig komma ihåg detta.",
          body: item.text,
          deliverAt: new Date(item.remindAt).toISOString(),
          url: "/idag",
        });
      }

      if (native) {
        // Wait for decrypted medication data before reconciling the complete device queue.
        if (!medsReady || !isCurrent()) return;
        await reconcileNativeReminders(
          user.id,
          [...desired.values()],
          nativeReminderPreferences(),
          isCurrent,
          [
            ...lockedNativeReminderPrefixes(),
            ...(childrenLoading || childrenError
              ? ["child-schedule:", "child-item:", "child-day:"]
              : []),
          ],
        );
        return;
      }

      // Behåll aktiva förfallna nycklar så att en paus eller ett tillfälligt
      // utskicksfel inte avbokas bara för att klockslaget passerat.
      // Återskapa däremot aldrig gamla notiser vid öppning/omsynk.
      let failed = false;
      for (const r of desired.values()) {
        if (!isCurrent()) return;
        if (new Date(r.deliverAt).getTime() < now) continue;
        try {
          await syncFn({ data: r });
        } catch (err) {
          failed = true;
          console.error("[reminder-sync] sync", r.clientKey, err);
        }
      }

      // Cancel ones we previously scheduled but no longer want
      for (const oldKey of lastKeys.current) {
        if (!isCurrent()) return;
        if (!desired.has(oldKey)) {
          try {
            await cancelFn({ data: { clientKey: oldKey } });
          } catch (err) {
            failed = true;
            console.error("[reminder-sync] cancel", oldKey, err);
          }
        }
      }

      if (!isCurrent()) return;
      // Misslyckade avbokningar måste finnas kvar för nästa försök.
      lastKeys.current = failed
        ? new Set([...lastKeys.current, ...desired.keys()])
        : new Set(desired.keys());

      // Medicin: städa bort köade notiser som inte längre motsvarar en aktiv
      // medicin. Detta gäller även rader som schemalades i en tidigare session
      // eller innan medicinen togs bort – annars kan notiser fortsätta komma
      // fast listan är tom. Görs bara när medicindatan är inläst/migrerad.
      if (medsReady) {
        const medKeys = [...desired.keys()].filter((k) => k.startsWith(MEDICATION_REMINDER_PREFIX));
        try {
          await reconcileFn({
            data: { prefix: MEDICATION_REMINDER_PREFIX, keepKeys: medKeys },
          });
        } catch (err) {
          failed = true;
          console.error("[reminder-sync] reconcile medication", err);
        }
      }
      if (failed && isCurrent()) {
        retryTimer = window.setTimeout(() => setResyncTick((n) => n + 1), 5_000);
      }
    })().catch((error) => {
      console.error("[reminder-sync] retry after failure", error);
      if (alive) retryTimer = window.setTimeout(() => setResyncTick((n) => n + 1), 5_000);
    });
    inFlight.current = run;
    return () => {
      alive = false;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncSignature, resyncTick]);
}

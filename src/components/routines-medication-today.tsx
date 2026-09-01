import { useMemo } from "react";
import { Link } from "wouter";
import { Check, ArrowRight, Undo2, Repeat, Pill } from "lucide-react";
import { useMedications, useReminders } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useDoneLog } from "@/hooks/use-done-log";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import { routineOccursOn, type Routine } from "@/lib/recurrence";
import { medicationOccursOn } from "@/lib/medications";

/**
 * 🔁💊 Rutiner & medicin – ett gemensamt, ihopfällbart block längst ner på Hem.
 * Samma data som i "Rutiner & medicin": inga dubbletter, en bock här är en bock där.
 */
interface Item {
  key: string;
  kind: "rutin" | "medicin";
  title: string;
  meta?: string;
  time: string;
  minutes: number;
  done: boolean;
  toggle: () => void;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
}

export default function RoutinesMedicationToday() {
  const { medications, isTaken, toggleTaken } = useMedications();
  const { reminders, toggleReminder } = useReminders();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  // Rutiner bockas av i den gemensamma genomförandeloggen – samma status
  // som i Idag, Flow och "Nästa" på Hem.
  const { isDone, toggleDone } = useDoneLog();

  const { toast } = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];

    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      if (!routineOccursOn(r, todayIso)) continue;
      const match = reminders.find(
        (rem) => rem.date === todayIso && rem.time === r.time && rem.title === r.title,
      );
      const routineKey = `routine-${r.id}`;
      const done = isDone(routineKey) || (match ? !!match.completed : false);
      list.push({
        key: routineKey,
        kind: "rutin",
        title: r.title,
        time: r.time,
        minutes: minutesOf(r.time),
        done,
        toggle: () => {
          toggleDone(routineKey);
          if (match) toggleReminder(match.id);
          if (!done) toast({ description: `🔁 ${r.title} – klart. ${getRandomEncouragement()}` });
        },
      });
    }

    for (const med of medications) {
      if (!medicationOccursOn(med, todayIso)) continue;
      for (const time of med.times) {
        const taken = isTaken(med.id, time);
        list.push({
          key: `med-${med.id}-${time}`,
          kind: "medicin",
          title: med.name,
          meta: med.dosage,
          time,
          minutes: minutesOf(time),
          done: taken,
          toggle: () => {
            toggleTaken(med.id, time);
            if (!taken)
              toast({ description: `💊 ${med.name} ${time} – tagen. ${getRandomEncouragement()}` });
          },
        });
      }
    }

    return list.sort((a, b) => a.minutes - b.minutes);
  }, [
    routines,
    reminders,
    medications,
    isTaken,
    toggleTaken,
    toggleReminder,
    isDone,
    toggleDone,
    toast,
    todayIso,
  ]);

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Inga rutiner eller mediciner tillagda än. Lägg till dem när det passar.
        </p>
        <Link
          href="/daglig-rutin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Öppna Rutiner &amp; medicin <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.length === 0 ? (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Allt avbockat för idag ✨
        </p>
      ) : (
        <ul className="space-y-2">
          {pending.map((item) => {
            const late = item.minutes <= nowMin;
            return (
              <li key={item.key}>
                <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3">
                  {item.kind === "rutin" ? (
                    <Repeat size={18} className="shrink-0 text-primary" aria-hidden />
                  ) : (
                    <Pill size={18} className="shrink-0 text-primary" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-sm font-medium text-ink">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      kl {item.time}
                      {item.meta ? ` · ${item.meta}` : ""}
                      {late ? " · dags nu" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={item.toggle}
                    aria-label={`Markera ${item.title} ${item.time} som klar`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Check size={14} /> Klar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <ul className="space-y-1.5">
          {done.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 rounded-2xl bg-secondary/20 px-3 py-2 text-xs text-muted-foreground"
            >
              <Check size={14} className="text-primary" />
              <span className="min-w-0 flex-1 truncate">
                {item.title} · {item.time}
              </span>
              <button
                type="button"
                onClick={item.toggle}
                aria-label={`Ångra – ${item.title} ${item.time} är inte klar`}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Undo2 size={13} /> Ångra
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/daglig-rutin"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Alla rutiner &amp; mediciner <ArrowRight size={12} />
      </Link>
    </div>
  );
}

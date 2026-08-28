import { useMemo } from "react";
import { Link } from "wouter";
import { Check, ArrowRight, Undo2 } from "lucide-react";
import { useMedications } from "@/hooks/use-data";
import { medicationOccursOn } from "@/lib/medications";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";

/**
 * 💊 Dagens medicin – kompakt vy av dagens doser.
 *
 * Samma data och samma avbockning som i Rutiner & medicin (useMedications).
 * Ingen egen medicinmodell, inga dubbletter: en bock här är samma bock där.
 */
interface Dose {
  key: string;
  medId: string;
  name: string;
  dosage?: string;
  time: string;
  taken: boolean;
  minutes: number;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
}

export default function MedicationToday({ limit = 3 }: { limit?: number }) {
  const { medications, isTaken, toggleTaken } = useMedications();
  const { toast } = useToast();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { pending, done } = useMemo(() => {
    const all: Dose[] = [];
    for (const med of medications) {
      if (!medicationOccursOn(med, todayIso)) continue;
      for (const time of med.times) {
        all.push({
          key: `${med.id}:${time}`,
          medId: med.id,
          name: med.name,
          dosage: med.dosage,
          time,
          taken: isTaken(med.id, time),
          minutes: minutesOf(time),
        });
      }
    }
    all.sort((a, b) => a.minutes - b.minutes);
    return {
      pending: all.filter((d) => !d.taken),
      done: all.filter((d) => d.taken),
    };
    // isTaken läser samma logg som toggleTaken uppdaterar
  }, [medications, isTaken, todayIso]);

  // Visa bara det som är relevant nu: försenade doser först, sedan närmast kommande.
  const relevant = useMemo(() => {
    const due = pending.filter((d) => d.minutes <= nowMin);
    const upcoming = pending.filter((d) => d.minutes > nowMin);
    return [...due, ...upcoming.slice(0, Math.max(1, limit - due.length))].slice(0, limit);
  }, [pending, nowMin, limit]);

  const handleTake = (dose: Dose) => {
    toggleTaken(dose.medId, dose.time);
    toast({ description: `💊 ${dose.name} ${dose.time} – tagen. ${getRandomEncouragement()}` });
  };

  if (medications.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Inga mediciner tillagda än. Lägg till dem när det passar.
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
      {relevant.length === 0 ? (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Allt taget för idag ✨
        </p>
      ) : (
        <ul className="space-y-2">
          {relevant.map((dose) => {
            const late = dose.minutes <= nowMin;
            return (
              <li key={dose.key}>
                <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3">
                  <span aria-hidden className="text-xl">
                    💊
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{dose.name}</p>
                    <p className="text-xs text-muted-foreground">
                      kl {dose.time}
                      {dose.dosage ? ` · ${dose.dosage}` : ""}
                      {late ? " · dags nu" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTake(dose)}
                    aria-label={`Markera ${dose.name} ${dose.time} som tagen`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Check size={14} /> Tagen
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <ul className="space-y-1.5">
          {done.map((dose) => (
            <li
              key={dose.key}
              className="flex items-center gap-2 rounded-2xl bg-secondary/20 px-3 py-2 text-xs text-muted-foreground"
            >
              <Check size={14} className="text-primary" />
              <span className="min-w-0 flex-1 truncate">
                {dose.name} · {dose.time} – tagen
              </span>
              <button
                type="button"
                onClick={() => toggleTaken(dose.medId, dose.time)}
                aria-label={`Ångra – ${dose.name} ${dose.time} är inte tagen`}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Undo2 size={13} /> Ej tagen
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/daglig-rutin"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Alla mediciner <ArrowRight size={12} />
      </Link>
    </div>
  );
}

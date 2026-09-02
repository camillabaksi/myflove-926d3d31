import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sunrise, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPushPreferences } from "@/lib/push.functions";
import { acknowledgeWake } from "@/lib/push.functions";
import { playGentleWake, type GentleWakeHandle } from "@/lib/gentle-wake-sound";
import { DEFAULT_WAKE_STEPS, hhmmToMinutes, localDateKey, localMinutesOfDay } from "@/lib/wake-up";

type Prefs = {
  wake_enabled?: boolean | null;
  wake_time?: string | null;
  wake_interval_min?: number | null;
  wake_max_followups?: number | null;
  wake_ack_on?: string | null;
};

/**
 * Morgonstart: syns bara under morgonfönstret innan man kvitterat att man är
 * vaken. Ett litet kryss räcker – då slutar Flow puffa för dagen.
 */
export function WakeUpCard({ always = false }: { always?: boolean }) {
  const loadFn = useServerFn(getPushPreferences);
  const ackFn = useServerFn(acknowledgeWake);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const dateKey = useMemo(() => localDateKey(), []);
  const [wakeState, setWakeState] = useCloudSyncedStorage<{ date: string; done: string[] }>(
    "myflove-wake-steps",
    { date: dateKey, done: [] },
  );
  const done = wakeState.date === dateKey ? wakeState.done : [];
  const [acked, setAcked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await loadFn()) as Prefs;
        if (!alive) return;
        setPrefs(data);
        setAcked(data?.wake_ack_on === dateKey);
      } catch {
        if (alive) setPrefs({});
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const soundRef = useRef<GentleWakeHandle | null>(null);
  const [playing, setPlaying] = useState(false);

  const stopSound = () => {
    soundRef.current?.stop();
    soundRef.current = null;
    setPlaying(false);
  };

  const startSound = () => {
    soundRef.current?.stop();
    soundRef.current = playGentleWake();
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 9500);
  };

  // Öppnar man sidan från notisen får man en mjuk klang i stället för tystnad.
  useEffect(() => {
    if (!prefs || acked) return;
    startSound();
    return () => stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);

  const ack = async () => {
    setAcked(true);
    stopSound();
    try {
      await ackFn();
    } catch {
      // Nästa puff är inte hela världen.
    }
  };

  const toggleStep = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setWakeState({ date: dateKey, done: next });
    if (!acked && next.length > 0) void ack();
  };

  if (!prefs) return null;
  if (!prefs.wake_enabled && !always) return null;

  const target = hhmmToMinutes(prefs.wake_time ?? "07:00");
  const windowEnd =
    target + (prefs.wake_interval_min ?? 8) * ((prefs.wake_max_followups ?? 4) + 1) + 60;
  const nowMin = localMinutesOfDay();
  const inWindow = nowMin >= target && nowMin <= windowEnd;
  if (!always && (!inWindow || acked)) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
          <Sunrise className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-medium text-foreground">Morgonstart</p>
          <p className="text-sm text-muted-foreground">
            {acked
              ? "Du är igång. Jag puffar inte mer idag 🌿"
              : "God morgon. Ingen stress – lyssna klart, sträck på dig och kryssa en sak när du orkar."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (playing ? stopSound() : startSound())}
          aria-label={playing ? "Stäng av den mjuka klangen" : "Spela mjuk väckning"}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted"
        >
          {playing ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      <ul className="space-y-2">
        {DEFAULT_WAKE_STEPS.map((step) => {
          const isDone = done.includes(step.id);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    isDone ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {isDone && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={isDone ? "text-muted-foreground line-through" : "text-foreground"}>
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!acked && (
        <Button onClick={ack} className="w-full">
          Jag är vaken
        </Button>
      )}
    </div>
  );
}

export default WakeUpCard;

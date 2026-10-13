import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getPushPreferences, savePushPreferences } from "@/lib/push.functions";

type Wake = {
  wake_enabled: boolean;
  wake_time: string;
  wake_interval_min: number;
  wake_max_followups: number;
};

const DEFAULTS: Wake = {
  wake_enabled: false,
  wake_time: "07:00",
  wake_interval_min: 8,
  wake_max_followups: 4,
};

const isTime = (v: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(v);

/** Inställningar för Morgonstart – envis men mjuk uppföljning på morgonen. */
export function WakeUpSettings() {
  const loadFn = useServerFn(getPushPreferences);
  const saveFn = useServerFn(savePushPreferences);
  const [wake, setWake] = useState<Wake | null>(null);
  const [notifOk, setNotifOk] = useState(true);
  const [intervalDraft, setIntervalDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const latestWake = useRef<Wake>(DEFAULTS);
  const saveQueue = useRef(Promise.resolve());
  const saveVersion = useRef(0);
  const numbersDirty = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotifOk("Notification" in window && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await loadFn()) as Partial<Wake>;
        if (!alive) return;
        const loaded = {
          wake_enabled: data.wake_enabled ?? DEFAULTS.wake_enabled,
          wake_time: (data.wake_time ?? DEFAULTS.wake_time).slice(0, 5),
          wake_interval_min: data.wake_interval_min ?? DEFAULTS.wake_interval_min,
          wake_max_followups: data.wake_max_followups ?? DEFAULTS.wake_max_followups,
        };
        latestWake.current = loaded;
        setWake(loaded);
        setIntervalDraft(String(loaded.wake_interval_min));
        setMaxDraft(String(loaded.wake_max_followups));
      } catch {
        if (alive) {
          latestWake.current = DEFAULTS;
          setWake(DEFAULTS);
          setIntervalDraft(String(DEFAULTS.wake_interval_min));
          setMaxDraft(String(DEFAULTS.wake_max_followups));
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<Wake>) => {
    const next = { ...latestWake.current, ...patch };
    latestWake.current = next;
    setWake(next);
    if (!isTime(next.wake_time)) return;
    const version = ++saveVersion.current;
    setStatus("Sparar…");
    saveQueue.current = saveQueue.current.then(async () => {
      if (!mounted.current) return;
      try {
        await saveFn({
          data: {
            wake_enabled: next.wake_enabled,
            wake_time: next.wake_time.slice(0, 5),
            wake_interval_min: next.wake_interval_min,
            wake_max_followups: next.wake_max_followups,
          },
        });
        if (mounted.current && version === saveVersion.current) setStatus(numbersDirty.current ? "Osparade ändringar" : "Sparat");
      } catch {
        if (mounted.current && version === saveVersion.current) {
          setStatus("Kunde inte spara. Dina val finns kvar – tryck Spara för att försöka igen.");
          toast({ title: "Kunde inte spara", description: "Dina val finns kvar. Försök igen." });
        }
      }
    });
  };

  const commitNumbers = (interval = intervalDraft, max = maxDraft) => {
    const minutes = Number(interval);
    const followups = Number(max);
    if (
      !Number.isInteger(minutes) ||
      minutes < 3 ||
      minutes > 30 ||
      !Number.isInteger(followups) ||
      followups < 1 ||
      followups > 6
    ) {
      setError("Välj 3–30 minuter och 1–6 uppföljningar.");
      return;
    }
    setError("");
    numbersDirty.current = false;
    update({ wake_interval_min: minutes, wake_max_followups: followups });
  };

  if (!wake) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Morgonstart</p>
          <p className="text-sm text-muted-foreground">
            För dig som snoozar bort alarmet. Pace puffar mjukt igen tills du säger att du är vaken
            – sen är det tyst resten av dagen.
          </p>
        </div>
        <Switch
          id="wake-enabled"
          checked={wake.wake_enabled}
          onCheckedChange={(v) => update({ wake_enabled: v })}
          aria-label="Aktivera Morgonstart"
        />
      </div>

      {wake.wake_enabled && !notifOk && (
        <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          För att få påminnelser från Paceable behöver notiser vara aktiverade. Slå på dem i rutan
          ovan, annars syns Morgonstart bara när appen är öppen.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="wake-time" className="font-normal">
          Starta kl
        </Label>
        <Input
          id="wake-time"
          type="time"
          value={wake.wake_time}
          onChange={(e) => update({ wake_time: e.target.value })}
          className="h-9 w-28"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="wake-interval" className="font-normal">
          Puff igen efter (min)
        </Label>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 p-0"
            aria-label="Färre minuter mellan puffarna"
            disabled={!Number.isInteger(Number(intervalDraft)) || Number(intervalDraft) <= 3}
            onClick={() => {
              const value = String(Number(intervalDraft) - 1);
              setIntervalDraft(value);
              commitNumbers(value);
            }}
          >
            −
          </Button>
          <Input
            id="wake-interval"
            type="number"
            min={3}
            max={30}
            step={1}
            inputMode="numeric"
            value={intervalDraft}
            onChange={(e) => {
              setIntervalDraft(e.target.value);
              numbersDirty.current = true;
              setError("");
              setStatus("Osparade ändringar");
            }}
            onBlur={() => commitNumbers()}
            className="h-11 w-20 text-center"
            aria-describedby="wake-number-help"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 p-0"
            aria-label="Fler minuter mellan puffarna"
            disabled={!Number.isInteger(Number(intervalDraft)) || Number(intervalDraft) >= 30}
            onClick={() => {
              const value = String(Number(intervalDraft) + 1);
              setIntervalDraft(value);
              commitNumbers(value);
            }}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="wake-max" className="font-normal">
          Max antal uppföljningar
        </Label>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 p-0"
            aria-label="Färre uppföljningar"
            disabled={!Number.isInteger(Number(maxDraft)) || Number(maxDraft) <= 1}
            onClick={() => {
              const value = String(Number(maxDraft) - 1);
              setMaxDraft(value);
              commitNumbers(intervalDraft, value);
            }}
          >
            −
          </Button>
          <Input
            id="wake-max"
            type="number"
            min={1}
            max={6}
            step={1}
            inputMode="numeric"
            value={maxDraft}
            onChange={(e) => {
              setMaxDraft(e.target.value);
              numbersDirty.current = true;
              setError("");
              setStatus("Osparade ändringar");
            }}
            onBlur={() => commitNumbers()}
            className="h-11 w-20 text-center"
            aria-describedby="wake-number-help"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-11 p-0"
            aria-label="Fler uppföljningar"
            disabled={!Number.isInteger(Number(maxDraft)) || Number(maxDraft) >= 6}
            onClick={() => {
              const value = String(Number(maxDraft) + 1);
              setMaxDraft(value);
              commitNumbers(intervalDraft, value);
            }}
          >
            +
          </Button>
        </div>
      </div>
      <p id="wake-number-help" className="text-sm text-muted-foreground">
        Välj 3–30 minuter mellan puffarna och 1–6 uppföljningar efter den första puffen. Du kan
        ställa in valen även när Morgonstart är avstängd.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="button" variant="outline" onClick={() => commitNumbers()}>
        Spara
      </Button>
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
    </div>
  );
}

export default WakeUpSettings;

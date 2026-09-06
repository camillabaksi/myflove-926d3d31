import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
        setWake({
          wake_enabled: data.wake_enabled ?? DEFAULTS.wake_enabled,
          wake_time: (data.wake_time ?? DEFAULTS.wake_time).slice(0, 5),
          wake_interval_min: data.wake_interval_min ?? DEFAULTS.wake_interval_min,
          wake_max_followups: data.wake_max_followups ?? DEFAULTS.wake_max_followups,
        });
      } catch {
        if (alive) setWake(DEFAULTS);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (patch: Partial<Wake>) => {
    const next = { ...(wake ?? DEFAULTS), ...patch };
    setWake(next);
    if (!isTime(next.wake_time)) return;
    try {
      await saveFn({
        data: {
          wake_enabled: next.wake_enabled,
          wake_time: next.wake_time.slice(0, 5),
          wake_interval_min: next.wake_interval_min,
          wake_max_followups: next.wake_max_followups,
        },
      });
    } catch {
      toast({ title: "Kunde inte spara", description: "Försök igen om en stund." });
    }
  };

  if (!wake) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Morgonstart</p>
          <p className="text-sm text-muted-foreground">
            För dig som snoozar bort alarmet. Flow puffar mjukt igen tills du säger att du är vaken
            – sen är det tyst resten av dagen.
          </p>
        </div>
        <Switch
          id="wake-enabled"
          checked={wake.wake_enabled}
          onCheckedChange={(v) => update({ wake_enabled: v })}
        />
      </div>

      {wake.wake_enabled && !notifOk && (
        <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          För att få påminnelser från MyFlove behöver notiser vara aktiverade. Slå på dem i rutan
          ovan, annars syns Morgonstart bara när appen är öppen.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="wake-time" className="font-normal">
          Starta kl
        </Label>
        <Input
          id="wake-time"
          type="time"
          value={wake.wake_time}
          onChange={(e) => update({ wake_time: e.target.value })}
          className="h-9 w-28"
          disabled={!wake.wake_enabled}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="wake-interval" className="font-normal">
          Puff igen efter (min)
        </Label>
        <Input
          id="wake-interval"
          type="number"
          min={3}
          max={30}
          value={wake.wake_interval_min}
          onChange={(e) => update({ wake_interval_min: Number(e.target.value) || 8 })}
          className="h-9 w-24"
          disabled={!wake.wake_enabled}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="wake-max" className="font-normal">
          Max antal uppföljningar
        </Label>
        <Input
          id="wake-max"
          type="number"
          min={1}
          max={6}
          value={wake.wake_max_followups}
          onChange={(e) => update({ wake_max_followups: Number(e.target.value) || 4 })}
          className="h-9 w-24"
          disabled={!wake.wake_enabled}
        />
      </div>
    </div>
  );
}

export default WakeUpSettings;

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getPushPreferences, savePushPreferences } from "@/lib/push.functions";
import { MyFloveListening } from "@/components/myflove/motion";

type Prefs = {
  personal_enabled: boolean;
  personal_time: string;
  personal_evening_enabled: boolean;
  personal_evening_time: string;
};

const DEFAULTS: Prefs = {
  personal_enabled: false,
  personal_time: "08:00",
  personal_evening_enabled: false,
  personal_evening_time: "20:30",
};

const isTime = (v: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(v);
const hhmm = (v: string) => (isTime(v) ? v.slice(0, 5) : v);
const normalize = (p: Prefs): Prefs => ({
  ...p,
  personal_time: hhmm(p.personal_time ?? DEFAULTS.personal_time),
  personal_evening_time: hhmm(p.personal_evening_time ?? DEFAULTS.personal_evening_time),
});

/** Inställningar för Flows personliga puffar som skickas som push. */
export function PersonalPushSettings() {
  const loadFn = useServerFn(getPushPreferences);
  const saveFn = useServerFn(savePushPreferences);
  const { name } = useUserProfile();
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await loadFn()) as Partial<Prefs>;
        if (!alive) return;
        setPrefs(
          normalize({
            personal_enabled: data.personal_enabled ?? DEFAULTS.personal_enabled,
            personal_time: data.personal_time ?? DEFAULTS.personal_time,
            personal_evening_enabled:
              data.personal_evening_enabled ?? DEFAULTS.personal_evening_enabled,
            personal_evening_time: data.personal_evening_time ?? DEFAULTS.personal_evening_time,
          }),
        );
      } catch {
        if (alive) setPrefs(DEFAULTS);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (patch: Partial<Prefs>) => {
    const next = { ...(prefs ?? DEFAULTS), ...patch };
    setPrefs(next);
    // Spara bara när båda tiderna är kompletta (HH:MM) – annars sparar vi
    // halvskrivna värden medan man ändrar i tidsväljaren.
    if (!isTime(next.personal_time) || !isTime(next.personal_evening_time)) return;
    const clean = normalize(next);
    try {
      await saveFn({
        data: {
          personal_enabled: clean.personal_enabled,
          personal_time: clean.personal_time,
          personal_evening_enabled: clean.personal_evening_enabled,
          personal_evening_time: clean.personal_evening_time,
          ...(name ? { personal_name: name } : {}),
        },
      });
    } catch {
      toast({ title: "Kunde inte spara tiden", description: "Försök igen om en stund." });
    }
  };

  if (!prefs) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4">
      <div>
        <p className="font-medium text-foreground">Personliga meddelanden</p>
        <p className="text-sm text-muted-foreground">
          Flow skickar en varm rad som notis – även när appen är stängd.
        </p>
        <MyFloveListening
          active={prefs.personal_enabled || prefs.personal_evening_enabled}
          label={
            prefs.personal_enabled || prefs.personal_evening_enabled
              ? "Jag håller koll åt dig"
              : "Puffarna är avstängda"
          }
          className="mt-2"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="personal-morning" className="font-normal">
          Morgonpuff
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="personal-morning-time"
            aria-label="Tid för morgonpuff"
            type="time"
            value={prefs.personal_time}
            onChange={(e) => update({ personal_time: e.target.value })}
            className="h-9 w-28"
            disabled={!prefs.personal_enabled}
          />
          <Switch
            id="personal-morning"
            checked={prefs.personal_enabled}
            onCheckedChange={(v) => update({ personal_enabled: v })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="personal-evening" className="font-normal">
          Kvällspuff
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="personal-evening-time"
            aria-label="Tid för kvällspuff"
            type="time"
            value={prefs.personal_evening_time}
            onChange={(e) => update({ personal_evening_time: e.target.value })}
            className="h-9 w-28"
            disabled={!prefs.personal_evening_enabled}
          />
          <Switch
            id="personal-evening"
            checked={prefs.personal_evening_enabled}
            onCheckedChange={(v) => update({ personal_evening_enabled: v })}
          />
        </div>
      </div>
    </div>
  );
}

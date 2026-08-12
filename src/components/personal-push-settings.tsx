import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getPushPreferences, savePushPreferences } from "@/lib/push.functions";

type Prefs = {
  personal_enabled: boolean;
  personal_time: string;
  personal_evening_enabled: boolean;
  personal_evening_time: string;
};

const DEFAULTS: Prefs = {
  personal_enabled: true,
  personal_time: "08:00",
  personal_evening_enabled: false,
  personal_evening_time: "20:30",
};

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
        setPrefs({ ...DEFAULTS, ...data });
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
    try {
      await saveFn({ data: { ...next, ...(name ? { personal_name: name } : {}) } });
    } catch (err) {
      toast({ title: "Kunde inte spara", description: String((err as Error).message ?? err) });
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

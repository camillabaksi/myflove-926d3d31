import { useState } from "react";
import { BellOff, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { DEFAULT_QUIET_STATE, QUIET_PAUSE_OPTIONS, type QuietModeState, isQuietNow } from "@/lib/quiet-mode";

function formatRemaining(until: number): string {
  const minutes = Math.max(0, Math.ceil((until - Date.now()) / 60000));
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${minutes} min`;
}

/** Tyst läge – pausa alla påminnelser en stund eller varje natt. */
export function QuietModeSettings() {
  const [state, setState] = useCloudSyncedStorage<QuietModeState>(
    "myflove-quiet-mode",
    DEFAULT_QUIET_STATE,
  );
  const [, setTick] = useState(0);

  const update = (patch: Partial<QuietModeState>) => setState((current) => ({ ...current, ...patch }));
  const paused = state.pausedUntil > Date.now();
  const quiet = isQuietNow(state);

  const handlePause = (minutes: number) => {
    update({ pausedUntil: Date.now() + minutes * 60 * 1000 });
    toast({
      description: `Tyst läge på i ${minutes >= 60 ? `${minutes / 60} h` : `${minutes} min`}. Inga påminnelser stör dig.`,
    });
  };

  const handleResume = () => {
    update({ pausedUntil: 0 });
    toast({ description: "Tyst läge av – påminnelserna är igång igen." });
  };

  return (
    <div className="surface-card p-4 space-y-4">
      <div className="flex items-start gap-3">
        {quiet ? (
          <BellOff size={20} className="text-primary mt-0.5" />
        ) : (
          <Bell size={20} className="text-muted-foreground mt-0.5" />
        )}
        <div>
          <p className="font-semibold text-ink">Tyst läge</p>
          <p className="text-sm text-muted-foreground">
            {paused
              ? `Påminnelser är pausade i ${formatRemaining(state.pausedUntil)}.`
              : quiet
                ? "Tyst just nu enligt ditt schema."
                : "Pausa påminnelser en stund när du inte vill bli störd."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUIET_PAUSE_OPTIONS.map((option) => (
          <Button
            key={option.minutes}
            type="button"
            variant="outline"
            className="rounded-full h-10"
            onClick={() => handlePause(option.minutes)}
          >
            {option.label}
          </Button>
        ))}
        {paused && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full h-10"
            onClick={handleResume}
          >
            Slå på igen
          </Button>
        )}
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="quiet-schedule" className="text-sm font-medium">
            Tyst varje natt
          </Label>
          <Switch
            id="quiet-schedule"
            checked={state.scheduleEnabled}
            onCheckedChange={(checked) => update({ scheduleEnabled: checked })}
          />
        </div>
        {state.scheduleEnabled && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                Från
              </Label>
              <Input
                id="quiet-start"
                type="time"
                value={state.scheduleStart}
                onChange={(e) => update({ scheduleStart: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                Till
              </Label>
              <Input
                id="quiet-end"
                type="time"
                value={state.scheduleEnd}
                onChange={(e) => update({ scheduleEnd: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

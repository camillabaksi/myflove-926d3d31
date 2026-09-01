/**
 * "Din MyFlove" – färgtema, alarmsignal och alarmformat på ett ställe.
 * Kompakt och mobil först: små färgcirklar och täta valrader.
 */
import { Check, Play, Palette, Bell, BellRing } from "lucide-react";
import { MyFloveBlock } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playAlarmPreview } from "@/lib/push-notifications";
import { haptic } from "@/lib/haptics";
import {
  ALARM_FORMATS,
  ALARM_SOUNDS,
  THEMES,
  usePersonalization,
  type AlarmFormat,
  type AlarmSoundId,
  type ThemeId,
} from "@/lib/personalization";

export function PersonalizationSettings() {
  const { personalization, update } = usePersonalization();

  const chooseTheme = (id: ThemeId) => {
    update({ theme: id });
    haptic("soft");
  };

  const chooseSound = (id: AlarmSoundId) => {
    update({ alarmSound: id });
    haptic("soft");
  };

  const chooseFormat = (id: AlarmFormat) => {
    update({ alarmFormat: id });
    if (id === "vibration" || id === "bada") haptic("success");
  };

  const activeTheme = THEMES.find((t) => t.id === personalization.theme);
  const activeSound = ALARM_SOUNDS.find((s) => s.id === personalization.alarmSound);
  const activeFormat = ALARM_FORMATS.find((f) => f.id === personalization.alarmFormat);

  return (
    <>
      <MyFloveBlock
        title="Färgtema"
        subtitle="Välj hur MyFlove ska kännas."
        eyebrow="Din MyFlove"
        icon={Palette}
        tone="lavender"
        surface="lavender"
        collapsible
        defaultCollapsed
        collapseId="anpassa::tema"
        status={activeTheme ? `Valt: ${activeTheme.label}` : undefined}
        data-testid="personalization-theme"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((theme) => {
            const active = personalization.theme === theme.id;
            return (
              <Button
                key={theme.id}
                type="button"
                variant="ghost"
                onClick={() => chooseTheme(theme.id)}
                aria-pressed={active}
                aria-label={`Tema ${theme.label}`}
                title={theme.label}
                className={cn(
                  "h-auto min-h-[5.5rem] flex-col items-start gap-2 rounded-2xl border-2 bg-card/80 p-3 text-sm transition hover:bg-card",
                  active ? "border-primary" : "border-border/60 hover:border-border",
                )}
              >
                <span
                  className="grid size-6 place-items-center rounded-full"
                  style={{ backgroundColor: theme.swatch }}
                >
                  {active ? <Check size={13} className="text-white" /> : null}
                </span>
                <span className="font-medium leading-tight text-ink">{theme.label}</span>
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Energi- och varningsfärger ser likadana ut i alla teman.
        </p>
      </MyFloveBlock>

      <MyFloveBlock
        title="Alarmsignal"
        subtitle="Välj ljudet som påminner dig."
        icon={Bell}
        tone="mint"
        surface="mint"
        collapsible
        defaultCollapsed
        collapseId="anpassa::alarmsignal"
        status={activeSound ? `Valt: ${activeSound.label}` : undefined}
        data-testid="personalization-sound"
      >
        <div className="space-y-2">
          {ALARM_SOUNDS.map((sound) => {
            const active = personalization.alarmSound === sound.id;
            return (
              <div
                key={sound.id}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 bg-card/70 p-2 pl-3",
                  active ? "border-primary" : "border-border/50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{sound.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{sound.hint}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 rounded-full"
                  onClick={() => playAlarmPreview(sound.id)}
                  aria-label={`Lyssna på ${sound.label}`}
                >
                  <Play size={15} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="shrink-0 rounded-full"
                  onClick={() => chooseSound(sound.id)}
                  aria-pressed={active}
                >
                  {active ? "Vald" : "Välj"}
                </Button>
              </div>
            );
          })}
        </div>
      </MyFloveBlock>

      <MyFloveBlock
        title="Alarm"
        subtitle="Välj ljud, vibration eller båda."
        icon={BellRing}
        tone="sun"
        surface="sun"
        collapsible
        defaultCollapsed
        collapseId="anpassa::alarmformat"
        status={activeFormat ? `Valt: ${activeFormat.label}` : undefined}
        data-testid="personalization-format"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
          {ALARM_FORMATS.map((format) => {
            const active = personalization.alarmFormat === format.id;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => chooseFormat(format.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 bg-card/70 p-3 text-left text-sm font-medium text-ink transition",
                  active ? "border-primary" : "border-border/50 hover:border-border",
                )}
              >
                <span aria-hidden>{format.icon}</span>
                <span className="min-w-0 truncate">{format.label}</span>
              </button>
            );
          })}
        </div>
      </MyFloveBlock>
    </>
  );
}

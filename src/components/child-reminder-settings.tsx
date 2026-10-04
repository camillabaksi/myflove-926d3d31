import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import { useChildReminderSettings } from "@/lib/child-reminders";
import { useChildren } from "@/hooks/use-children";

const LEADS = [0, 10, 15, 30, 60];

export default function ChildReminderSettings() {
  const { settings, update } = useChildReminderSettings();
  const { members } = useChildren();
  const toggleFrom = (id: string, on: boolean) => {
    const rest = settings.familyFrom.filter((x) => x !== id);
    update({ familyFrom: on ? [...rest, id] : rest });
  };

  return (
    <section className="surface-card p-5">
      <CollapsibleSection
        title="Notiser för barnens dag"
        headingClassName="text-lg font-semibold"
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Bell size={16} className="mt-0.5 shrink-0" />
          Du får en puff innan varje hållpunkt i skolschemat och inlagda aktiviteter.
          <HelpHint label="notiser för barnens dag">
            Notiserna bygger på schemat du lagt in för barnet och aktiviteter med klockslag. Tyst
            läge pausar dem.
          </HelpHint>
        </p>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Påminn om barnens hållpunkter</span>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
            aria-label="Påminn om barnens hållpunkter"
          />
        </label>

        {settings.enabled && (
          <>
            <div className="space-y-2">
              <p className="text-sm">Hur långt innan?</p>
              <div className="flex gap-2 flex-wrap">
                {LEADS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update({ minutesBefore: m })}
                    aria-pressed={settings.minutesBefore === m}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-colors ${
                      settings.minutesBefore === m
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    {m === 0 ? "På slaget" : `${m} min innan`}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Morgonöversikt över barnens dag</span>
              <Switch
                checked={settings.morningSummary}
                onCheckedChange={(v) => update({ morningSummary: v })}
                aria-label="Morgonöversikt över barnens dag"
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm">Notiser om det familjen delar</p>
              <p className="text-xs text-muted-foreground">
                Du får bara notiser om dina egna barn och aktiviteter. Välj vems delade saker du
                också vill bli påmind om. Det du väljer gäller bara din telefon.
              </p>
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ingen i familjen ännu.</p>
              ) : (
                members.map((m) => (
                  <label key={m.user_id} className="flex items-center justify-between gap-3">
                    <span className="text-sm flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.display_name}
                    </span>
                    <Switch
                      checked={settings.familyFrom.includes(m.user_id)}
                      onCheckedChange={(v) => toggleFrom(m.user_id, v)}
                      aria-label={`Notiser om det ${m.display_name} delar`}
                    />
                  </label>
                ))
              )}
            </div>

            {settings.morningSummary && (
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Skicka översikten kl</span>
                <Input
                  type="time"
                  value={settings.morningTime}
                  onChange={(e) => update({ morningTime: e.target.value })}
                  className="h-11 rounded-2xl w-32"
                  aria-label="Tid för morgonöversikt"
                />
              </label>
            )}
          </>
        )}
      </CollapsibleSection>
    </section>
  );
}

import { Timer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import {
  HOLDPOINT_LABELS,
  describeAdjustment,
  useAdaptiveLead,
  type HoldpointType,
  type Outcome,
} from "@/lib/adaptive-lead";

const TYPES = Object.keys(HOLDPOINT_LABELS) as HoldpointType[];

const CHOICES: { value: Outcome; label: string }[] = [
  { value: "sen", label: "Brukar bli sen" },
  { value: "lagom", label: "Lagom" },
  { value: "tidig", label: "Brukar vara tidig" },
];

export function AdaptiveLeadSettings() {
  const { state, setEnabled, record, reset, adjustment } = useAdaptiveLead();

  return (
    <section className="surface-card p-5">
      <CollapsibleSection
        title="Smart framförhållning"
        headingClassName="text-lg font-semibold"
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Timer size={16} className="mt-0.5 shrink-0" />
          Paceable flyttar påminnelsen lite tidigare om du ofta blir sen – och lite senare om du
          brukar vara tidig.
          <HelpHint label="smart framförhållning">
            Efter varje hållpunkt kan du säga hur det gick. Efter ett par svar justeras notisen
            automatiskt, max 30 min tidigare eller 15 min senare.
          </HelpHint>
        </p>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Justera påminnelsetid åt mig</span>
          <Switch
            checked={state.enabled}
            onCheckedChange={setEnabled}
            aria-label="Justera påminnelsetid automatiskt"
          />
        </label>

        {state.enabled && (
          <div className="space-y-4">
            {TYPES.map((type) => {
              const samples = state.samples[type] ?? [];
              const adj = adjustment(type);
              return (
                <div key={type} className="rounded-2xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{HOLDPOINT_LABELS[type]}</span>
                    <span className="text-xs text-muted-foreground">
                      {samples.length < 2 ? "Behöver fler svar" : describeAdjustment(adj)}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {CHOICES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => record(type, c.value)}
                        className="px-3 py-2 rounded-2xl border border-border bg-background text-sm transition-colors hover:border-primary"
                      >
                        {c.label}
                      </button>
                    ))}
                    {samples.length > 0 && (
                      <button
                        type="button"
                        onClick={() => reset(type)}
                        className="px-3 py-2 rounded-2xl text-sm text-muted-foreground underline"
                      >
                        Nollställ
                      </button>
                    )}
                  </div>
                  {samples.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {samples.length} svar sparade – senaste: {samples[samples.length - 1]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    </section>
  );
}

export default AdaptiveLeadSettings;

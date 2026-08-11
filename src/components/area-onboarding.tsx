import { useState } from "react";
import { ALL_AREAS, AREA_META, useEnabledAreas, type LifeArea } from "@/lib/life-areas";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

/**
 * Visas en gång: användaren väljer vilka livsområden hen vill ha hjälp med.
 * Den som inte pluggar ska slippa studiegrejer i ansiktet.
 */
export function AreaOnboarding() {
  const { enabled, onboarded, setAreas, completeOnboarding } = useEnabledAreas();
  const [picked, setPicked] = useState<LifeArea[]>(enabled);

  if (onboarded) return null;

  const toggle = (a: LifeArea) => {
    if (AREA_META[a].core) return;
    setPicked((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const save = () => {
    setAreas(picked);
    completeOnboarding();
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Vilka delar av livet vill du ha hjälp med?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Du får egna rum för olika delar av livet – men Flow ser fortfarande helheten.
          Du kan ändra det här när du vill.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {ALL_AREAS.map((a) => {
          const meta = AREA_META[a];
          const isOn = meta.core || picked.includes(a);
          return (
            <li key={a}>
              <button
                type="button"
                onClick={() => toggle(a)}
                aria-pressed={isOn}
                disabled={meta.core}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  isOn ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                } ${meta.core ? "opacity-90 cursor-default" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span className="font-medium">{meta.label}</span>
                  {isOn && <Check size={14} className="text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{meta.blurb}</p>
                {meta.core && (
                  <p className="text-xs text-muted-foreground mt-1">Alltid med</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Button onClick={save} className="rounded-xl h-11 w-full sm:w-auto">
        Så här vill jag ha det
      </Button>
    </section>
  );
}

export default AreaOnboarding;

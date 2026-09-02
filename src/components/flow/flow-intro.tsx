import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Flow presenterar sig. Första gången i 2–3 korta steg,
 * därefter bara en liten hälsning utan animation.
 */

const STEPS = [
  {
    title: "Hej! Jag är Flow 💜",
    body: "Jag hjälper dig att hitta en bra väg genom dagen.",
  },
  {
    title: "Jag tittar på helheten",
    body: "Din energi, dagens saker och hur mycket du redan har gjort – och hjälper dig hitta vad som kan passa bäst just nu.",
  },
  {
    title: "Du behöver inte göra allt",
    body: "Vi tar en sak i taget, tillsammans.",
  },
];

export function FlowGreeting({ children }: { children?: React.ReactNode }) {
  const [seen, setSeen] = useCloudSyncedStorage<boolean>("myflove-flow-intro-seen", false);
  const [step, setStep] = useState(0);

  if (!seen) {
    const s = STEPS[step]!;
    return (
      <section className="surface-card space-y-5 p-6 text-center" aria-label="Flow presenterar sig">
        <div className="flex justify-center">
          <FlowMascot size="lg" glow className="flow-entry" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink">{s.title}</h2>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-muted-foreground">
            {s.body}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-5 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            className="rounded-2xl px-6"
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : setSeen(true))}
          >
            {step < STEPS.length - 1 ? "Fortsätt" : "✨ Visa mig"}
          </Button>
          <button
            type="button"
            onClick={() => setSeen(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Hoppa över
          </button>
        </div>
      </section>
    );
  }

  // Efter första gången presenterar Flow sig i slide 1 i carousellen –
  // inget extra kort ovanför, så sidan aldrig blir lång.
  return <>{children}</>;
}

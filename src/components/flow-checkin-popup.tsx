import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";
import SimpleCheckin from "@/components/simple-checkin";
import WhyHint from "@/components/why-hint";
import { useFlowCheckin, type CheckinSlot } from "@/hooks/use-flow-checkin";

const COPY: Record<
  CheckinSlot,
  {
    title: string;
    lines: string[];
    cta: string;
    emoji: string;
    source: string;
    presetFactors?: string[];
  }
> = {
  morgon: {
    title: "God morgon! 💜",
    lines: ["Hur mår du idag?", "Hur var natten?"],
    cta: "Logga hur jag mår",
    emoji: "🌅",
    source: "flow-checkin-morgon",
    // Morgonens sömnfråga blir en påverkansfaktor på observationen.
    presetFactors: ["somn"],
  },
  dag: {
    title: "Hej igen! 💜",
    lines: ["Hur går dagen än så länge?"],
    cta: "Checka in",
    emoji: "☀️",
    source: "flow-checkin-dag",
  },
  kvall: {
    title: "God kväll! 💜",
    lines: ["Bra jobbat idag.", "Vad har du för känsla efter den här dagen?"],
    cta: "Checka in",
    emoji: "🌙",
    source: "flow-checkin-kvall",
  },
};

/**
 * Flows mjuka incheckning tre gånger om dagen. Popupen är en inbjudan –
 * all loggning sker i den befintliga centrala energi- & måendeloggningen.
 */
export default function FlowCheckinPopup() {
  const { slot, open, dismiss } = useFlowCheckin();
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!open) setLogging(false);
  }, [open]);

  if (!slot) return null;
  const copy = COPY[slot];

  const close = () => {
    setLogging(false);
    dismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent
        data-testid="flow-checkin-popup"
        onOpenAutoFocus={(e) => {
          // Fokusera dialogen själv, inte första "Varför?", så ingen fokusram syns permanent.
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        className={
          logging
            ? "pace-ds h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] max-h-[42rem] w-[calc(100%-1rem)] max-w-md grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-0 pb-0 shadow-lifted sm:p-0 sm:pb-0 [&>button]:right-3 [&>button]:top-[calc(0.5rem+env(safe-area-inset-top))] [&>button]:z-10 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-xl"
            : "w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-2 border-border/60 bg-card p-5 shadow-lifted sm:p-6"
        }
      >
        {logging ? (
          <>
            <DialogTitle className="sr-only">Logga energi och mående</DialogTitle>
            <DialogDescription className="sr-only">
              Din incheckning sparas som en vanlig energi- och måendeobservation.
            </DialogDescription>
            <SimpleCheckin
              source={copy.source}
              presetFactors={copy.presetFactors}
              onSaved={close}
              onCancel={close}
              presentation="dialog"
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <FlowMascot size="md" />
            <div className="space-y-1">
              <DialogTitle className="font-display text-xl font-bold text-ink">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {copy.lines.join(" ")}
              </DialogDescription>
            </div>
            <Button
              type="button"
              onClick={() => setLogging(true)}
              className="min-h-12 w-full rounded-2xl px-4 text-base font-semibold shadow-soft"
            >
              <span aria-hidden>{copy.emoji}</span>
              {copy.cta}
            </Button>
            <WhyHint label="Pace frågar vid olika tider">
              Vi frågar vid olika tider för att se hur din energi och ditt mående förändras under
              dagen. Med tiden kan Pace hjälpa dig att upptäcka vad som brukar påverka dig.
            </WhyHint>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Hoppa över
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

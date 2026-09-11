import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, X } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import { pauseRemindersFor, resumeReminders, subscribeQuietMode } from "@/lib/quiet-mode";

type CalmModeKind = "acute" | "micro";

function remainingSeconds(until: number) {
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export default function CalmMode({
  kind = "acute",
  open,
  onOpenChange,
}: {
  kind?: CalmModeKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const minutes = kind === "acute" ? 15 : 2;
  const [pausedUntil, setPausedUntil] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => subscribeQuietMode((state) => setPausedUntil(state.pausedUntil)), []);

  useEffect(() => {
    if (!open) return;
    const state = pauseRemindersFor(minutes);
    setPausedUntil(state.pausedUntil);
    setSeconds(remainingSeconds(state.pausedUntil));
    haptic("soft");
  }, [kind, minutes, open]);

  useEffect(() => {
    if (!open || !pausedUntil) return;
    const timer = window.setInterval(() => {
      const next = remainingSeconds(pausedUntil);
      setSeconds(next);
      if (next === 0) onOpenChange(false);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onOpenChange, open, pausedUntil]);

  if (!open || typeof document === "undefined") return null;

  const end = () => {
    resumeReminders();
    onOpenChange(false);
  };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Portal till <body> – annars fastnar den fasta ytan inne i sidans
  // animerade/transformerade lager på mobilen och innehållet hamnar utanför.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calm-mode-title"
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-foreground px-5 py-10 text-background"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={end}
        aria-label="Avsluta lugn paus"
        className="absolute right-4 top-4 rounded-full text-background hover:bg-background/10 hover:text-background"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <X aria-hidden />
      </Button>

      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="calm-breathing-halo relative grid size-40 place-items-center rounded-full bg-background/10 sm:size-52">
          <FlowMascot
            size="lg"
            mood="calm"
            glow
            alive
            alt="Flow vilar tillsammans med dig"
            className="sm:scale-125"
          />
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-background/70 sm:mt-8">
          <Moon className="size-4" aria-hidden /> {kind === "acute" ? "Akut Lugn" : "Mikropaus"}
        </p>
        <h2 id="calm-mode-title" className="mt-3 text-xl font-bold text-background sm:text-2xl">
          {kind === "acute"
            ? "Du behöver inte göra någonting alls just nu."
            : "Vi pausar en stund."}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-background/80">
          {kind === "acute"
            ? "Världen väntar på dig. Jag håller koll på tiden, blunda en stund."
            : "Låt axlarna sjunka. Det finns inget du behöver hinna under de här två minuterna."}
        </p>
        <p className="mt-6 font-display text-3xl font-bold tabular-nums sm:mt-7" aria-live="polite">
          {mm}:{ss}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={end}
          className="mt-7 rounded-full border border-background/20 text-background hover:bg-background/10 hover:text-background sm:mt-8"
        >
          Jag är redo att fortsätta
        </Button>
      </div>
    </div>,
    document.body,
  );
}

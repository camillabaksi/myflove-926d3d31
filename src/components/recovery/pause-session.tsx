import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, X } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import { pauseRemindersFor, resumeReminders } from "@/lib/quiet-mode";

/**
 * EN paus. Användaren väljer själv hur länge – inga separata pauslägen.
 * Återanvänder befintlig tyst-läge-logik (pauseRemindersFor/resumeReminders),
 * samma lugna helskärmsyta som tidigare pausvy.
 */
export default function PauseSession({
  minutes,
  open,
  onClose,
}: {
  minutes: number;
  open: boolean;
  /** done = true när pausen avslutades (klar eller avbruten av användaren). */
  onClose: (done: boolean) => void;
}) {
  const [endsAt, setEndsAt] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open) return;
    const state = pauseRemindersFor(minutes);
    setEndsAt(state.pausedUntil);
    setSeconds(Math.max(0, Math.ceil((state.pausedUntil - Date.now()) / 1000)));
    haptic("soft");
  }, [minutes, open]);

  useEffect(() => {
    if (!open || !endsAt) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSeconds(next);
      if (next === 0) {
        window.clearInterval(timer);
        onClose(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const end = () => {
    resumeReminders();
    onClose(true);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-session-title"
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
        aria-label="Avsluta pausen"
        className="absolute right-4 top-4 rounded-full text-background hover:bg-background/10 hover:text-background"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <X aria-hidden />
      </Button>

      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="calm-breathing-halo relative grid size-40 place-items-center rounded-full bg-background/10 sm:size-52">
          <FlowMascot size="lg" mood="calm" glow alive alt="Flow vilar tillsammans med dig" />
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-background/70">
          <Moon className="size-4" aria-hidden /> Paus · {minutes} min
        </p>
        <h2 id="pause-session-title" className="mt-3 text-xl font-bold text-background sm:text-2xl">
          Du behöver inte göra någonting nu.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-background/80">
          Jag håller koll på tiden. Påminnelser är tysta så länge pausen pågår.
        </p>
        <p className="mt-6 font-display text-3xl font-bold tabular-nums" aria-live="polite">
          {mm}:{ss}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={end}
          className="mt-7 rounded-full border border-background/20 text-background hover:bg-background/10 hover:text-background"
        >
          Jag är redo att fortsätta
        </Button>
      </div>
    </div>,
    document.body,
  );
}

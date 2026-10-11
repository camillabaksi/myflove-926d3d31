import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Check, Coffee, ArrowRight, Home } from "lucide-react";
import type { ScoredTask } from "@/lib/daily-flow";
import { MyFloveSuccess, MyFloveCelebration, useReducedMotion } from "@/components/myflove/motion";

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Fokusläge – en sak i taget, minimalt visuellt brus.
 * Ingen press: timern är ett stöd, inte ett krav.
 */
export default function FocusMode({
  item,
  open,
  onOpenChange,
  onDone,
  onNext,
}: {
  item: ScoredTask | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (item: ScoredTask) => void;
  onNext?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setElapsed(0);
      setFinished(false);
      startedRef.current = false;
    }
  }, [open, item?.task.id]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!item) return null;

  const total = Math.max(1, item.minutes) * 60;
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Fokusläge</DialogTitle>
        </DialogHeader>

        {finished ? (
          <div className="space-y-6 py-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <MyFloveSuccess size={56} />
              <p className="text-2xl font-semibold text-ink">Bra. Den är klar.</p>
              <MyFloveCelebration level={2} message="En sak mindre i huvudet." />
            </div>
            <div className="space-y-2">
              {onNext && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onNext();
                  }}
                  className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowRight size={18} /> Nästa rekommenderade
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-2xl border border-border py-3.5 font-medium flex items-center justify-center gap-2"
              >
                <Coffee size={18} /> Jag tar paus
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2"
              >
                <Home size={16} /> Tillbaka till Pace
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-7 py-6 text-center">
            <div className="space-y-1">
              <p className="font-display text-2xl font-bold leading-snug text-ink">
                {item.task.title}
              </p>
              <p className="text-sm text-muted-foreground">{item.minutes} minuter</p>
            </div>

            {/* Ringtimer – en sak, en cirkel, inget mer */}
            <div className="relative mx-auto h-56 w-56">
              {running && !reduced && (
                <span
                  aria-hidden
                  className="absolute inset-6 rounded-full bg-primary/10 breathe"
                  style={{ animationDuration: "6s" }}
                />
              )}
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  className="stroke-secondary"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-primary transition-[stroke-dashoffset] duration-500"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - (CIRC * pct) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-semibold tabular-nums text-ink">
                  {mm}:{ss}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    startedRef.current = true;
                    setRunning((r) => !r);
                  }}
                  aria-label={running ? "Pausa" : "Starta"}
                  className="press mt-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lifted"
                >
                  {running ? <Pause size={22} /> : <Play size={22} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRunning(false)}
                className="press flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3.5 font-medium text-ink"
              >
                <Coffee size={18} /> Ta paus
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setFinished(true);
                  onDone(item);
                }}
                className="press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground"
              >
                Klar <Check size={18} />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

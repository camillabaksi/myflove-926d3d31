import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Check, Coffee, ArrowRight, Home } from "lucide-react";
import type { ScoredTask } from "@/lib/daily-flow";

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
            <p className="text-2xl font-semibold text-ink">Bra. Den är klar. 🎉</p>
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
                <Home size={16} /> Tillbaka till Flow
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 py-6 text-center">
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-ink leading-snug">{item.task.title}</p>
              <p className="text-muted-foreground">Beräknad tid: {item.minutes} min</p>
            </div>

            {startedRef.current ? (
              <div className="space-y-4">
                <p className="font-mono text-5xl tabular-nums text-ink">
                  {mm}:{ss}
                </p>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium"
                >
                  {running ? <Pause size={16} /> : <Play size={16} />}
                  {running ? "Pausa" : "Fortsätt"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  startedRef.current = true;
                  setRunning(true);
                }}
                className="w-full rounded-2xl bg-primary text-primary-foreground py-4 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <Play size={20} /> Börja
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setFinished(true);
                onDone(item);
              }}
              className="w-full rounded-2xl border border-primary/40 bg-primary/5 py-3.5 font-medium text-ink flex items-center justify-center gap-2"
            >
              <Check size={18} /> Markera som klar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

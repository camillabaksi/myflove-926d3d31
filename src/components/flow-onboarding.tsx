import { BrandLogo } from "@/components/paceable/brand-logo";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FLOW_GOALS, useFlowPrefs, type FlowGoalId } from "@/hooks/use-daily-flow";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";

/**
 * Frågan "vad vill du att Paceable hjälper dig med?".
 * Visas först vid ett senare besök – första gången ska appen bara ge nytta.
 */
export default function FlowOnboarding() {
  const { done, complete } = useFlowPrefs();
  const [selected, setSelected] = useState<FlowGoalId[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [dismissed, setDismissed] = useState(false);

  const [visited, setVisited] = useCloudSyncedStorage<boolean>("myflove-home-visited", false);
  // Bara ett onboardinglager åt gången: introt först, den här frågan sen.
  const [introSeen] = useCloudSyncedStorage<boolean>("myflove-intro-seen", false);
  // Läget vid montering avgör – annars skulle flaggan slå till i samma session.
  const wasVisited = useRef<boolean | null>(null);
  if (wasVisited.current === null) wasVisited.current = visited;

  useEffect(() => {
    if (!visited) setVisited(true);
  }, [visited, setVisited]);

  const open = Boolean(wasVisited.current) && introSeen && !done && !dismissed;

  const toggle = (id: FlowGoalId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setDismissed(true)}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <BrandLogo compact className="mx-auto w-40" />
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Vad vill du att Paceable främst ska hjälpa dig med?"
              : "Vad vill du börja med?"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {FLOW_GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-pressed={selected.includes(g.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left font-medium transition-colors ${
                    selected.includes(g.id)
                      ? "bg-primary/10 border-primary text-ink"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  {selected.includes(g.id) ? "☑" : "☐"} {g.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                complete(selected);
                setStep(2);
              }}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold"
            >
              Fortsätt
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/quickflow"
              onClick={() => setDismissed(true)}
              className="block rounded-2xl border border-border px-4 py-4 font-medium hover:border-primary/50"
            >
              ⚡ QuickFlow
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="w-full rounded-2xl border border-border px-4 py-4 text-left font-medium hover:border-primary/50"
            >
              🎯 Min första dag i Flow
            </button>
            <Link
              href="/kalender"
              onClick={() => setDismissed(true)}
              className="block rounded-2xl border border-border px-4 py-4 font-medium hover:border-primary/50"
            >
              📅 Lägg in min kalender
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

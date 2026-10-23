import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFocus, useMoods, useTasks } from "@/hooks/use-data";
import { generateFlowInsights } from "@/lib/flow-insights";
import { Sparkles } from "lucide-react";

interface FlowInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FlowInsightsModal({ open, onOpenChange }: FlowInsightsModalProps) {
  const { moods } = useMoods();
  const { tasks } = useTasks();
  const { currentFocus } = useFocus();

  const insights = useMemo(
    () => generateFlowInsights(moods, tasks, currentFocus),
    [moods, tasks, currentFocus],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Se mina mönster
          </DialogTitle>
          <DialogDescription>
            Bara sådant som syns i din egen data. Finns inget underlag säger jag hellre inget.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {insights.length === 0 ? (
            <div className="p-4 bg-secondary/40 border border-border rounded-2xl">
              <p className="text-foreground leading-relaxed">
                Jag har inte tillräckligt underlag ännu för att säga något om dina mönster.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Några incheckningar av mående eller avklarade uppgifter räcker – sedan börjar jag se
                sammanhangen.
              </p>
            </div>
          ) : (
            insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-secondary/40 border border-border rounded-2xl animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-2xl shrink-0">{insight.emoji}</span>
                <div>
                  <p className="text-foreground leading-relaxed">{insight.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bygger på {insight.basis}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full h-12 rounded-2xl mt-2">
          Skönt att veta
        </Button>
      </DialogContent>
    </Dialog>
  );
}

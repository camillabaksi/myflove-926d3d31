import { useMemo } from "react";
import { ArrowRight, Wind } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";

export default function CalmChoices({ onPause }: { onPause: () => void }) {
  const { activeTasks } = useTasks();
  const { flow } = useFlowScore();
  const easiest = useMemo(
    () =>
      [...activeTasks]
        .filter((task) => !task.dueDate || task.dueDate <= new Date().toISOString().slice(0, 10))
        .sort((a, b) => {
          const weight = { small: 0, medium: 1, large: 2 } as const;
          return (weight[a.friction ?? "medium"] ?? 1) - (weight[b.friction ?? "medium"] ?? 1);
        })[0],
    [activeTasks],
  );

  return (
    <section aria-labelledby="calm-choices-title" className="space-y-3">
      <div className="px-1">
        <h2 id="calm-choices-title" className="text-lg font-bold text-ink">
          Två lugna val
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          FlowScore {flow.score} föreslår bara det som känns rimligt nu.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="min-h-14 justify-between rounded-2xl px-5">
          <Link href={easiest ? "/idag" : "/quickflow"}>
            <span className="min-w-0 text-left">
              <span className="block">{easiest ? "Gör den enklaste saken" : "Fånga en sak"}</span>
              <span className="block text-xs font-normal opacity-80">Cirka 5 minuter</span>
            </span>
            <ArrowRight className="shrink-0" aria-hidden />
          </Link>
        </Button>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={onPause}
          className="min-h-14 justify-between rounded-2xl px-5"
        >
          <span className="min-w-0 text-left">
            <span className="block">Ta en mikropaus</span>
            <span className="block text-xs font-normal text-muted-foreground">2 minuter</span>
          </span>
          <Wind className="shrink-0" aria-hidden />
        </Button>
      </div>
    </section>
  );
}

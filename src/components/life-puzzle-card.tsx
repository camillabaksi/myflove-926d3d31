import { Link } from "wouter";
import { ArrowRight, Puzzle } from "lucide-react";
import { useLifePuzzle } from "@/hooks/use-life-puzzle";
import { AREA_META } from "@/lib/life-areas";
import { useTasks } from "@/hooks/use-data";
import { MyFloveCard } from "@/components/myflove";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Livspusslet – visar hur dagens delar hänger ihop istället för att lista dem.
 * Aldrig ett betyg: låg kapacitet leder till färre krav, inte fler.
 */
export default function LifePuzzleCard() {
  const { puzzle, input } = useLifePuzzle();
  const { activeTasks, snoozeTask } = useTasks();

  const moveRestToTomorrow = () => {
    const today = new Date().toISOString().slice(0, 10);
    const keep = new Set(
      activeTasks
        .filter((t) => t.dueDate && t.dueDate <= today)
        .slice(0, input.suggestedTasks)
        .map((t) => t.id),
    );
    const moved = activeTasks.filter((t) => !keep.has(t.id) && (!t.dueDate || t.dueDate <= today));
    moved.forEach((t) => snoozeTask(t.id, 1));
    toast.success(
      moved.length
        ? `Flyttade ${moved.length} sak(er) till imorgon. Det du behöver idag ligger kvar.`
        : "Inget behövde flyttas – dagen är redan lagom.",
    );
  };

  return (
    <MyFloveCard className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Puzzle size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold leading-tight">{puzzle.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{puzzle.intro}</p>
        </div>
      </div>

      {puzzle.busiest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {puzzle.busiest.map((a) => (
            <span
              key={a.area}
              className="rounded-full bg-secondary/70 px-3 py-1 text-xs text-foreground"
            >
              {AREA_META[a.area].emoji} {AREA_META[a.area].label} · {a.today + a.overdue + a.soon}
            </span>
          ))}
        </div>
      )}

      {puzzle.connections.length > 0 && (
        <ul className="space-y-3">
          {puzzle.connections.slice(0, 3).map((c) => (
            <li key={c.title} className="rounded-2xl bg-secondary/40 p-3 space-y-1">
              <p className="text-sm font-medium">{c.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              {c.suggestion && <p className="text-sm text-primary">{c.suggestion}</p>}
              {c.href && c.hrefLabel && (
                <Link
                  href={c.href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {c.hrefLabel} <ArrowRight size={13} aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/assistant"
          className="press inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground text-balance"
        >
          Prata med Flow om helheten
        </Link>
        {puzzle.offerRelief && (
          <Button
            type="button"
            variant="outline"
            onClick={moveRestToTomorrow}
            className="flex-1 rounded-2xl h-auto py-2.5 text-sm text-balance"
          >
            Flytta resten till imorgon
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Du behöver inte göra allt. Planen får ändras när livet gör det.
      </p>
    </MyFloveCard>
  );
}

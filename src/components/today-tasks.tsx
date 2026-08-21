import { Link } from "wouter";
import { ListChecks, ArrowRight } from "lucide-react";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { MyFloveTransition } from "@/components/myflove/motion";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useTasks } from "@/hooks/use-data";
import type { FlowItem } from "@/lib/flow-items";

/**
 * Dagens uppgifter direkt på hemskärmen – samma kort och samma
 * avbockningslogik som i Min dag, så att status alltid är densamma
 * i hela appen (inklusive Att göra).
 *
 * Kalenderhändelser, lektioner och rutiner visas inte här: de bockas
 * inte av i MyFlove och hör hemma i tidslinjen istället.
 */
export function TodayTasks({ limit = 5 }: { limit?: number }) {
  const { today } = useFlowItems();
  const { toggleTask } = useTasks();

  const tasks = today.filter((i) => i.source === "uppgift");
  const shown = tasks.slice(0, limit);

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
      aria-label="Dagens uppgifter"
    >
      <div className="mb-3 flex items-center gap-2">
        <ListChecks size={18} className="text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dagens uppgifter
        </h2>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Inget att bocka av just nu. Släpp en tanke i QuickFlow så landar den här.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => (
            <li key={item.id}>
              <MyFloveTransition transitionKey={String(item.done)}>
                <FlowItemCard
                  item={item}
                  onToggle={(i: FlowItem) => toggleTask(i.id.replace(/^task-/, ""))}
                />
              </MyFloveTransition>
            </li>
          ))}
        </ul>
      )}

      {tasks.length > shown.length && (
        <Link
          href="/tasks"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Se alla ({tasks.length}) <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}

export default TodayTasks;

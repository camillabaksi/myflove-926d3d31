import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { track } from "@/lib/analytics";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useFlowSettings } from "@/hooks/use-flow-settings";
import { cn } from "@/lib/utils";

/**
 * "Jag lär mig hur du fungerar."
 * Visar mjukt hur väl Flow känner dig och ett par saker han lagt märke till.
 * Ingen ny insamling – allt kommer från data som redan finns i MyFlove.
 */
export default function FlowLearningCard({ className }: { className?: string }) {
  const knowledge = useFlowLearning();
  const { settings } = useFlowSettings();

  if (!settings.enabled || !settings.learning) return null;

  return (
    <section
      data-flow-learning
      aria-label="Vad Flow lärt sig om dig"
      className={cn("rounded-3xl border border-border/60 bg-card p-4 shadow-sm", className)}
    >
      <div className="flex items-center gap-3">
        <FlowMascot size="xs" mood="calm" className="flow-alive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{knowledge.label}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.max(6, knowledge.level)}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {knowledge.insights.slice(0, 3).map((i) => (
          <li key={i.id} className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {i.text}
          </li>
        ))}
      </ul>

      <Link
        href="/insight"
        onClick={() => track("flow_learning_opened", { source: "hem" })}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Se vad jag har upptäckt <ArrowRight size={14} aria-hidden="true" />
      </Link>

      <p className="mt-3 text-xs text-muted-foreground/80">
        Du behöver inte lära dig hur jag fungerar. Jag lär mig hur du fungerar. 💜
      </p>
    </section>
  );
}

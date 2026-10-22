import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Leaf, Plus } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import { useInsightStrategies } from "@/hooks/use-insight";
import { personalSavedStrategies, strategyInPlanningDraft } from "@/lib/saved-strategy-planning";

type Props =
  | { mode: "today"; draftText?: never; onAddToDraft?: never }
  | { mode: "planning"; draftText: string; onAddToDraft: (title: string) => void };

/** Saved strategies are references, NEVER automatically due tasks. */
export default function OptionalSavedStrategies(props: Props) {
  const { saved } = useInsightStrategies();
  const supports = personalSavedStrategies(saved);
  if (!supports.length) return null;

  const isPlanning = props.mode === "planning";
  return (
    <CollapsibleSection
      id="optional-saved-strategies"
      title="Mina frivilliga stöd"
      description="Små idéer du själv har valt i Insikter – inget måste."
      defaultCollapsed
      className="min-w-0 rounded-2xl border border-border/60 bg-card/75 p-3"
      headingClassName="text-sm font-semibold"
    >
      <ul className="space-y-2" data-testid={isPlanning ? "planning-optional-supports" : "today-optional-supports"}>
        {supports.map((support) => (
          <li key={support.id} className="min-w-0 rounded-xl bg-secondary/30 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Leaf size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-foreground">{support.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Valfritt stöd · ungefär {support.minutes} min</p>
              </div>
            </div>
            {props.mode === "planning" && (
              <Button
                type="button"
                variant="outline"
                className="mt-2 min-h-11 rounded-xl text-xs"
                disabled={strategyInPlanningDraft(props.draftText, support.title)}
                onClick={() => props.onAddToDraft(support.title)}
              >
                <Plus size={14} aria-hidden />
                {strategyInPlanningDraft(props.draftText, support.title) ? "Finns i utkastet" : "Ta med i utkastet"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {props.mode === "today" ? (
        <Link
          to="/planera"
          search={{ audience: "me", period: "today" }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-primary underline underline-offset-4"
        >
          Använd ett stöd när jag planerar <ArrowUpRight size={16} aria-hidden />
        </Link>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Att välja ett stöd här ändrar bara texten i utkastet. Du får granska och spara planen själv.
        </p>
      )}
    </CollapsibleSection>
  );
}

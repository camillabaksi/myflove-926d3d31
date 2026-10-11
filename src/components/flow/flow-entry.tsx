/**
 * Flows förenklade ingång – samma princip som Hem:
 * en kort fråga, EN tydlig huvudhandling och de övriga lägena som
 * diskreta val. All information finns kvar, men bakom klick så första
 * skärmen förblir lugn.
 */
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";
import CollapsibleSection from "@/components/collapsible-section";
import { track } from "@/lib/analytics";

export default function FlowEntry({
  onPlan,
  onChat,
}: {
  /** Går till Planera-läget. */
  onPlan: () => void;
  /** Går till chatt-läget. */
  onChat: () => void;
}) {

  return (
    <section className="space-y-4" aria-label="Pace – vad passar bäst just nu">
      <div className="flex flex-col items-center gap-4 p-5 text-center animate-fade-in sm:p-8">
        <FlowMascot size="lg" glow className="flow-entry" />
        <div className="space-y-1.5">
          <h2 className="font-handwritten text-4xl font-semibold leading-tight text-ink">
            Vad behöver du hjälp med?
          </h2>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            Berätta vad som är svårt just nu. Vi tar ett steg i taget.
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-2xl px-8"
          onClick={() => {
            track("flow_opened", { source: "entry" });
            onChat();
          }}
        >
          Prata med Pace
        </Button>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={onPlan}>
            <ListOrdered size={16} aria-hidden />
            Visa mitt förslag
          </Button>
        </div>
      </div>

      <CollapsibleSection
        title="Mer om Pace"
        id="flow-mer-om"
        defaultCollapsed
        description="Pace är appens lugna hjälpare. Öppna om du undrar vad de olika lägena gör."
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-ink">Förslag</strong> – Pace föreslår en sak som
            passar dagens kapacitetsläge. Du väljer själv om du vill börja.
          </li>
          <li>
            <strong className="font-medium text-ink">Planera</strong> – Pace ordnar dagens saker i
            en rimlig ordning utifrån vad som är viktigt och hur mycket som ryms.
          </li>
          <li>
            <strong className="font-medium text-ink">Chatta</strong> – skriv av dig till Pace. Det
            känns för mycket, en uppgift känns klurig eller du bara vill fundera högt.
          </li>
        </ul>
      </CollapsibleSection>
    </section>
  );
}

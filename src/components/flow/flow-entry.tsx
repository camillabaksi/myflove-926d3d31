/**
 * Flows förenklade ingång – samma princip som Hem:
 * en kort fråga, EN tydlig huvudhandling och de övriga lägena som
 * diskreta val. All information finns kvar, men bakom klick så första
 * skärmen förblir lugn.
 */
import { ListOrdered, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";
import CollapsibleSection from "@/components/collapsible-section";
import { track } from "@/lib/analytics";

export default function FlowEntry({
  onOpen,
  onPlan,
  onChat,
}: {
  /** Öppnar Flow-decket (hjälpens karusell). */
  onOpen: () => void;
  /** Går till Planera-läget. */
  onPlan: () => void;
  /** Går till chatt-läget. */
  onChat: () => void;
}) {
  return (
    <section className="space-y-4" aria-label="Flow – vad passar bäst just nu">
      <div className="surface-card flex flex-col items-center gap-4 rounded-3xl p-6 text-center animate-fade-in sm:p-8">
        <FlowMascot size="lg" glow className="flow-entry" />
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-bold leading-tight text-ink">
            Vad passar bäst just nu?
          </h2>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            Flow tittar på din energi och dagens saker – och föreslår ett nästa steg i taget.
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-2xl px-8"
          onClick={() => {
            track("flow_opened", { source: "entry" });
            onOpen();
          }}
        >
          Visa mitt förslag
        </Button>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={onPlan}>
            <ListOrdered size={16} aria-hidden />
            Planera
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={onChat}>
            <MessageCircle size={16} aria-hidden />
            Chatta
          </Button>
        </div>
      </div>

      <CollapsibleSection
        title="Mer om Flow"
        id="flow-mer-om"
        defaultCollapsed
        description="Flow är appens lugna hjälpare. Öppna om du undrar vad de olika lägena gör."
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-ink">Förslag</strong> – Flow föreslår en sak som
            passar din energi just nu. Du väljer själv om du vill börja.
          </li>
          <li>
            <strong className="font-medium text-ink">Planera</strong> – Flow ordnar dagens saker i
            en rimlig ordning utifrån hur du mår.
          </li>
          <li>
            <strong className="font-medium text-ink">Chatta</strong> – skriv av dig till Flow. Det
            känns för mycket, en uppgift känns klurig eller du bara vill fundera högt.
          </li>
        </ul>
      </CollapsibleSection>
    </section>
  );
}

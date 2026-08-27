import { type ReactNode } from "react";
import CollapsibleSection from "@/components/collapsible-section";
import { cn } from "@/lib/utils";

interface StepSectionProps {
  /** Vilket steg i ordningen det här är – visas som en tydlig siffra. */
  step: number;
  /** Kort rubrik, gärna i du-form: "Se dagen", "Fånga tanken". */
  title: string;
  /** En mening som förklarar vad du gör här. */
  description?: ReactNode;
  /** Extra förklaring bakom i-knappen. */
  help?: ReactNode;
  /** Id för att komma ihåg om steget är hopfällt. */
  id?: string;
  /** Avancerade steg kan börja hopfällda. */
  defaultCollapsed?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Ett steg i en tydlig ordning – en sak i taget.
 * Byggd för NPF: numrerad rubrik, en förklarande mening och möjlighet
 * att fälla ihop det du inte behöver just nu.
 */
export default function StepSection({
  step,
  title,
  description,
  help,
  id,
  defaultCollapsed = false,
  className,
  children,
}: StepSectionProps) {
  return (
    <section className={cn("surface-card p-5", className)}>
      <CollapsibleSection
        id={id ?? `steg-${step}-${title.slice(0, 30)}`}
        defaultCollapsed={defaultCollapsed}
        help={help}
        description={description}
        headingClassName="text-base font-semibold text-ink"
        className="space-y-3"
        title={
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {step}
            </span>
            <span>
              <span className="sr-only">Steg {step}: </span>
              {title}
            </span>
          </span>
        }
      >
        {children}
      </CollapsibleSection>
    </section>
  );
}

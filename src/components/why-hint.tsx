import { useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhyHintProps {
  /** Mycket kort förklaring: vad användaren får tillbaka av funktionen. */
  children: ReactNode;
  /** Vad förklaringen gäller, används för skärmläsare. */
  label?: string;
  className?: string;
  appearance?: "chip" | "inline";
}

/**
 * Diskret "ⓘ Varför?" – används bara där nyttan inte är självklar.
 * Aldrig krav, aldrig påminnelse: bara en kort mening om vad du får tillbaka.
 * Förklaringen är stängd som standard och öppnas i sidflödet under knappen,
 * aldrig som en flytande popover, så den inte täcker knappar eller sparfält.
 */
export default function WhyHint({ children, label, className, appearance = "chip" }: WhyHintProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <span className="inline-flex max-w-full flex-col items-start">
      <button
        type="button"
        aria-label={label ? `Varför ${label}?` : "Varför?"}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          appearance === "inline"
            ? "inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-border/60 px-3 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Info size={11} aria-hidden="true" /> Varför?
      </button>
      {open ? (
        <span
          id={contentId}
          role="region"
          aria-label={label ? `Förklaring: ${label}` : "Förklaring"}
          className="mt-1 block w-64 max-w-[calc(100vw-3rem)] rounded-2xl border border-border/60 bg-card px-3 py-2 text-left text-sm leading-relaxed text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

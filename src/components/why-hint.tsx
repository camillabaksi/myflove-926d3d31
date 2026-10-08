import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
 */
export default function WhyHint({ children, label, className, appearance = "chip" }: WhyHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ? `Varför ${label}?` : "Varför?"}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            appearance === "inline"
              ? "inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : "inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info size={11} aria-hidden="true" /> Varför?
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 rounded-2xl text-sm leading-relaxed"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

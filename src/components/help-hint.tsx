import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HelpHintProps {
  /** Kort förklaring i klarspråk – vad vyn är till för och vad du gör här. */
  children: ReactNode;
  /** Vad hjälpen gäller, används för skärmläsare. */
  label?: string;
  className?: string;
}

/**
 * Liten i-knapp som visar en kort hjälptext. Alltid en mening om vad vyn gör
 * och en om vad du kan göra – inget mer.
 */
export default function HelpHint({ children, label, className }: HelpHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ? `Vad är ${label}?` : "Vad är det här?"}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border/70 bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info size={13} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 rounded-2xl text-sm leading-relaxed"
        onClick={(e) => e.stopPropagation()}
      >
        {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
        <div className="text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

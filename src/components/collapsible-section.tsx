import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useCollapsible, setCollapsed } from "@/lib/collapse-store";
import HelpHint from "@/components/help-hint";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  /** Rubriken som visas – används också för att komma ihåg läget. */
  title: ReactNode;
  /** Text-id om rubriken inte är ren text. */
  id?: string;
  revealToken?: string;
  /** Knappar eller liknande som ska ligga kvar i rubrikraden. */
  actions?: ReactNode;
  /** Liten hjälptext under rubriken. */
  description?: ReactNode;
  /** Kort förklaring bakom en i-knapp: vad vyn är till för och vad du gör här. */
  help?: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headingClassName?: string;
  children: ReactNode;
}

/**
 * En vy som går att minimera eller maximera. Läget sparas per sida och rubrik
 * och ligger kvar tills du väljer något annat.
 */
export default function CollapsibleSection({
  title,
  id,
  revealToken,
  actions,
  description,
  help,

  defaultCollapsed = false,
  className,
  headingClassName,
  children,
}: CollapsibleSectionProps) {
  const [path] = useLocation();
  const key = id ?? (typeof title === "string" ? title : "sektion");
  const storeId = `${path}::${key.slice(0, 60)}`;
  const { collapsed, toggle } = useCollapsible(storeId, defaultCollapsed);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!revealToken) return;
    setCollapsed(storeId, false, true);
    const frame = requestAnimationFrame(() => {
      section.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
      section.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [revealToken, storeId]);

  return (
    <section ref={section} id={id} className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-2 text-left group"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-muted-foreground transition-transform group-hover:text-foreground",
              collapsed && "-rotate-90",
            )}
          />
          <span className={cn("text-xl font-medium", headingClassName)}>{title}</span>
        </button>
        {help && <HelpHint label={typeof title === "string" ? title : undefined}>{help}</HelpHint>}
        {actions}
      </div>

      {description && !collapsed && (
        <p className="text-sm text-muted-foreground -mt-2">{description}</p>
      )}
      {!collapsed && <div className="animate-fade-in space-y-4">{children}</div>}
    </section>
  );
}

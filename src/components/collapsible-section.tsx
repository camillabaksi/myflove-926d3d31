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
    <section ref={section} id={id} className={cn("pace-collapse-section space-y-4", className)}>
      <div className="pace-collapse-header flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className="pace-collapse-trigger group flex min-h-11 min-w-[min(100%,10rem)] flex-1 items-center justify-between gap-3 rounded-xl text-left"
        >
          <span className={cn("pace-collapse-title min-w-0 break-words [overflow-wrap:anywhere] text-xl font-medium", headingClassName)}>{title}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn(
              "ml-auto shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
              !collapsed && "rotate-180",
            )}
          />
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

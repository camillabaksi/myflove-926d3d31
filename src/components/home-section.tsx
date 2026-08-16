import { type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocalStorage } from "@/lib/storage";
import HelpHint from "@/components/help-hint";

interface HomeSectionProps {
  id: string;
  title: string;
  /** Kort förklaring bakom en i-knapp: vad blocket visar och vad du gör här. */
  help?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  /** Används för att styra blockets plats i hemskärmens ordning. */
  style?: CSSProperties;
}

/**
 * Ett hopfällbart block på hemskärmen. Läget sparas per block,
 * så det du inte vill se just nu håller sig undan tills du vill ha tillbaka det.
 */
export default function HomeSection({ id, title, help, children, defaultCollapsed = false, style }: HomeSectionProps) {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    `myflove-home-collapsed-${id}`,
    defaultCollapsed,
  );

  return (
    <section style={style} className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          <span>{title}</span>
          <span className="ml-auto text-[11px] normal-case tracking-normal opacity-70">
            {collapsed ? "Visa" : "Dölj"}
          </span>
        </button>
        {help && <HelpHint label={title}>{help}</HelpHint>}
      </div>
      {!collapsed && <div className="animate-fade-in">{children}</div>}
    </section>
  );
}


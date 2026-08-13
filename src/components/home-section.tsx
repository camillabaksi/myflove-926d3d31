import { type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocalStorage } from "@/lib/storage";

interface HomeSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}

/**
 * Ett hopfällbart block på hemskärmen. Läget sparas per block,
 * så det du inte vill se just nu håller sig undan tills du vill ha tillbaka det.
 */
export default function HomeSection({ id, title, children, defaultCollapsed = false }: HomeSectionProps) {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    `myflove-home-collapsed-${id}`,
    defaultCollapsed,
  );

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        <span>{title}</span>
        <span className="ml-auto text-[11px] normal-case tracking-normal opacity-70">
          {collapsed ? "Visa" : "Dölj"}
        </span>
      </button>
      {!collapsed && <div className="animate-fade-in">{children}</div>}
    </section>
  );
}

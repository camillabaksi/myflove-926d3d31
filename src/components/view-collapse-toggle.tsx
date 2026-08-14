import { Minimize2, Maximize2 } from "lucide-react";
import { setAllVisible, useVisibleSections } from "@/lib/collapse-store";

/**
 * Minimera eller visa alla vyer på den sida du är på.
 * Valet ligger kvar tills du väljer något annat.
 */
export default function ViewCollapseToggle({ className = "" }: { className?: string }) {
  const { total, allCollapsed } = useVisibleSections();

  if (total === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setAllVisible(!allCollapsed)}
      className={`flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted ${className}`}
      title={allCollapsed ? "Visa alla vyer" : "Minimera alla vyer"}
    >
      {allCollapsed ? <Maximize2 size={14} aria-hidden="true" /> : <Minimize2 size={14} aria-hidden="true" />}
      <span>{allCollapsed ? "Visa allt" : "Minimera allt"}</span>
    </button>
  );
}

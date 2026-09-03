import { Brain } from "lucide-react";

/**
 * QuickFlow-knappen på desktop – öppnar samma QuickFlow-flöde som allt annat
 * via den globala händelsen som QuickflowCapture (variant="global") lyssnar på.
 */
export default function QuickflowFab() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
      aria-label="QuickFlow – få ut det ur huvudet"
      className="hidden md:inline-flex fixed right-4 bottom-8 z-40 items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3.5 font-semibold shadow-lifted press"
    >
      <Brain size={18} /> QuickFlow
    </button>
  );
}

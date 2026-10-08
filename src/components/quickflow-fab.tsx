import { ThoughtsIcon } from "@/components/paceable/navigation-icons";

/**
 * QuickFlow-knappen på desktop – öppnar samma QuickFlow-flöde som allt annat
 * via den globala händelsen som QuickflowCapture (variant="global") lyssnar på.
 */
export default function QuickflowFab() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
      aria-label="Fånga – få ut det ur huvudet"
      className="hidden"
    >
      <ThoughtsIcon size={18} /> Fånga
    </button>
  );
}

import room from "@/assets/flow-room.jpg";
import { FlowMascot } from "@/components/flow-mascot";
import { useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";

const themeClasses: Record<FlowAppearance["theme"], string> = {
  lavendel: "bg-lavender",
  rosen: "bg-pink-100/20",
  kvall: "bg-primary/20",
};

export function FlowRoom({ appearance, compact = false }: { appearance?: FlowAppearance; compact?: boolean }) {
  const [saved] = useMyFlowAppearance();
  const selected = appearance ?? saved;
  return (
    <div className={`relative isolate overflow-hidden rounded-3xl ${themeClasses[selected.theme]} ${compact ? "aspect-[4/3]" : "aspect-[1.45] sm:aspect-[2.15]"}`} aria-label="Flows rum, en trygg plats att vila i">
      <img src={room} width={1280} height={800} alt="Ombonat rum med fåtölj, växter, böcker och mjuk belysning" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className={`pointer-events-none absolute inset-0 ${selected.theme === "rosen" ? "bg-accent/15" : selected.theme === "kvall" ? "bg-primary/25" : "bg-transparent"}`} />
      <div className="absolute inset-0 flex items-end justify-center pb-[3%]">
        <FlowMascot size="lg" mood={selected.motion === "still" ? "none" : "calm"} alive={selected.motion !== "still"} className="drop-shadow-lg" />
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Armchair, Coffee, Footprints, Moon } from "lucide-react";
import room from "@/assets/flow-room.jpg";
import idleAnimation from "@/assets/flow-room-idle.webp.asset.json";
import stillImage from "@/assets/flow-room-idle-still.png.asset.json";
import walkRight from "@/assets/flow-room-walk-right.webp.asset.json";
import teaImage from "@/assets/flow-tea.png";
import blanketImage from "@/assets/flow-blanket.png";
import { Button } from "@/components/ui/button";
import { useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";
import { useNpfSettings } from "@/lib/npf-mode";

type RoomMoment = "sitta" | "promenera" | "te" | "filt";

const moments = [
  { id: "sitta", label: "Sitta", icon: Armchair },
  { id: "promenera", label: "Röra sig", icon: Footprints },
  { id: "te", label: "Dricka te", icon: Coffee },
  { id: "filt", label: "Mysa med filt", icon: Moon },
] as const;

const themeClasses: Record<FlowAppearance["theme"], string> = {
  lavendel: "bg-lavender",
  rosen: "bg-pink-100/20",
  kvall: "bg-primary/20",
};

export function FlowRoom({ appearance, compact = false }: { appearance?: FlowAppearance; compact?: boolean }) {
  const [saved] = useMyFlowAppearance();
  const { settings } = useNpfSettings();
  const [moment, setMoment] = useState<RoomMoment>("sitta");
  const [reducedMotion, setReducedMotion] = useState(false);
  const selected = appearance ?? saved;
  const still = selected.motion === "still" || settings.stillness || reducedMotion;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (moment !== "promenera" || still) return;
    const timer = window.setTimeout(() => setMoment("sitta"), 3600);
    return () => window.clearTimeout(timer);
  }, [moment, still]);

  const image = moment === "te" ? teaImage : moment === "filt" ? blanketImage : moment === "promenera" && !still ? walkRight.url : still ? stillImage.url : idleAnimation.url;
  const description = moment === "te" ? "Flow sitter i fåtöljen med en kopp te" : moment === "filt" ? "Flow myser med en filt i fåtöljen" : moment === "promenera" ? still ? "Flow står på mattan" : "Flow tar några steg på mattan" : "Flow sitter lugnt i fåtöljen";
  return (
    <div className="space-y-2">
      <div className={`relative isolate overflow-hidden rounded-3xl ${themeClasses[selected.theme]} ${compact ? "aspect-[4/3]" : "aspect-[1.45] sm:aspect-[2.15]"}`} aria-label="Flows rum, en trygg plats att vila i">
        <img src={room} width={1280} height={800} alt="Ombonat rum med fåtölj, växter, böcker och mjuk belysning" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className={`pointer-events-none absolute inset-0 ${selected.theme === "rosen" ? "bg-accent/15" : selected.theme === "kvall" ? "bg-primary/25" : "bg-transparent"}`} />
        <img src={image} alt={description} width={192} height={218} className={`flow-room-figure absolute z-10 object-contain ${moment === "promenera" ? still ? "flow-room-on-rug" : "flow-room-walking" : "flow-room-seated"}`} />
      </div>
      {!compact && <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Flow i rummet">
        {moments.map(({ id, label, icon: Icon }) => <Button key={id} type="button" variant={moment === id ? "secondary" : "ghost"} aria-pressed={moment === id} aria-label={label} title={label} onClick={() => setMoment(id)} className="h-14 min-w-0 flex-col gap-0.5 rounded-2xl px-1 text-foreground focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-5 shrink-0" aria-hidden="true" /><span className="text-[10px] leading-none">{id === "promenera" ? "Gå" : id === "te" ? "Te" : id === "filt" ? "Filt" : "Sitta"}</span></Button>)}
      </div>}
    </div>
  );
}
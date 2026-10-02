import { useEffect, useState } from "react";
import { Moon, Sun, Sunset } from "lucide-react";
import seatedRoom from "@/assets/flow-room-seated.jpg";
import { Button } from "@/components/ui/button";
import { useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";

export type RoomTime = "dag" | "kvall" | "natt";

export function roomTimeAt(hour: number): RoomTime {
  return hour >= 7 && hour < 18 ? "dag" : hour >= 18 && hour < 22 ? "kvall" : "natt";
}

/** Keep the approved character in one scene until pose-specific clothing and accessories exist.
 * Legacy choices remain stored, but must not be rendered as approximate overlays. */
export function roomSceneImage(_appearance: FlowAppearance): string {
  return seatedRoom;
}

export function FlowRoom({ appearance, compact = false }: { appearance?: FlowAppearance; compact?: boolean }) {
  const [saved] = useMyFlowAppearance();
  const [hour, setHour] = useState<number | null>(null);
  const [timeOverride, setTimeOverride] = useState<RoomTime | null>(null);
  const [greeting, setGreeting] = useState(false);
  const selected = appearance ?? saved;
  const time = timeOverride ?? roomTimeAt(hour ?? 12);

  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(() => setGreeting(false), 3000);
    return () => window.clearTimeout(timer);
  }, [greeting]);

  return <div className="space-y-2">
    <div className="flow-room-scene relative isolate aspect-[1264/848] overflow-hidden rounded-3xl bg-lavender" data-time={time} data-theme={selected.theme} aria-label="Flows rum, en trygg plats att vila i">
      <img src={roomSceneImage(selected)} width={1264} height={848} alt="Flow vilar med sitt rosa hjärta i fåtöljen i ett ombonat rum" className="flow-room-art absolute inset-0 h-full w-full" />
      <Button type="button" variant="ghost" onClick={() => setGreeting(true)} aria-label="Hälsa på Flow" className="flow-room-greet absolute z-[2] rounded-full bg-transparent p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring" />
      {greeting && <p role="status" className="absolute right-2 top-2 z-[3] max-w-[55%] rounded-2xl bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-soft">{time === "natt" ? "En lugn stund tillsammans ♡" : "Skönt att du är här ♡"}</p>}
      {!compact && <span className="absolute bottom-2 left-2 z-[2] rounded-full bg-card/85 px-2 py-1 text-[10px] text-foreground">{time === "dag" ? "Dag" : time === "kvall" ? "Kväll" : "Natt"}</span>}
    </div>
    {!compact && <div className="flex justify-end gap-0.5" role="group" aria-label="Visa tid på dygnet">
      {([{ id: "dag", label: "dag", icon: Sun }, { id: "kvall", label: "kväll", icon: Sunset }, { id: "natt", label: "natt", icon: Moon }] as const).map(({ id, label, icon: Icon }) => <Button key={id} type="button" variant={timeOverride === id ? "secondary" : "ghost"} aria-label={`Visa ${label}`} aria-pressed={timeOverride === id} title={`Visa ${label}`} onClick={() => setTimeOverride(prev => prev === id ? null : id)} className="size-9 rounded-full p-0"><Icon className="size-4" /></Button>)}
    </div>}
  </div>;
}
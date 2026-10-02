import { useEffect, useState } from "react";
import { Armchair, Coffee, Footprints, Moon, Sun, Sunset } from "lucide-react";
import room from "@/assets/flow-room.jpg";
import nightRoom from "@/assets/flow-room-night.jpg";
import idleAnimation from "@/assets/flow-room-idle-solid.webp.asset.json";
import stillImage from "@/assets/flow-room-idle-still-solid.png.asset.json";
import walkRight from "@/assets/flow-room-walk-right-solid.webp.asset.json";
import wave from "@/assets/flow-room-wave-solid.webp.asset.json";
import teaImage from "@/assets/flow-tea.png";
import blanketImage from "@/assets/flow-blanket.png";
import sleepingImage from "@/assets/flow-sleep.png";
import shirtImage from "@/assets/flow-shirt.png";
import hoodieImage from "@/assets/flow-hoodie.png";
import beanie from "@/assets/flow-accessory-beanie.png";
import glasses from "@/assets/flow-accessory-glasses.png";
import headphones from "@/assets/flow-accessory-headphones.png";
import bow from "@/assets/flow-accessory-bow.png";
import flowers from "@/assets/flow-decor-flowers.png";
import mountains from "@/assets/flow-decor-mountains.png";
import vine from "@/assets/flow-decor-vine.png";
import blossom from "@/assets/flow-decor-blossom.png";
import { Button } from "@/components/ui/button";
import { useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";
import { useNpfSettings } from "@/lib/npf-mode";

export type RoomTime = "dag" | "kvall" | "natt";
type Zone = "fatolj" | "matta" | "vaxter" | "hylla";
type Moment = "sitta" | "te" | "filt" | "vandra";

export function roomTimeAt(hour: number): RoomTime {
  return hour >= 7 && hour < 18 ? "dag" : hour >= 18 && hour < 22 ? "kvall" : "natt";
}

const zones: { id: Zone; label: string }[] = [
  { id: "fatolj", label: "Fåtöljen" }, { id: "matta", label: "Mattan" },
  { id: "vaxter", label: "Växterna" }, { id: "hylla", label: "Hyllan" },
];
const accessoryImages = { mossa: beanie, glasogon: glasses, horlurar: headphones, harspanne: bow };

export function FlowRoom({ appearance, compact = false }: { appearance?: FlowAppearance; compact?: boolean }) {
  const [saved] = useMyFlowAppearance();
  const { settings } = useNpfSettings();
  const [hour, setHour] = useState<number | null>(null);
  const [timeOverride, setTimeOverride] = useState<RoomTime | null>(null);
  const [zone, setZone] = useState<Zone>("fatolj");
  const [moment, setMoment] = useState<Moment>("sitta");
  const [greeting, setGreeting] = useState("");
  const [greetingMotion, setGreetingMotion] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const selected = appearance ?? saved;
  const still = selected.motion === "still" || settings.stillness || reducedMotion;
  const time = timeOverride ?? roomTimeAt(hour ?? 12);
  const isNight = time === "natt";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (isNight) { setZone("fatolj"); setMoment("sitta"); }
    else if (time === "kvall") { setZone("fatolj"); setMoment("te"); }
  }, [time, isNight]);
  useEffect(() => {
    if (compact || time !== "dag" || still) return;
    const timer = window.setInterval(() => {
      setZone(prev => zones[(zones.findIndex(item => item.id === prev) + 1) % zones.length].id);
      setMoment("vandra");
    }, 25000);
    return () => window.clearInterval(timer);
  }, [compact, time, still]);
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(() => { setGreeting(""); setGreetingMotion(false); }, 3000);
    return () => window.clearTimeout(timer);
  }, [greeting]);

  const outfit = isNight ? "pyjamas" : selected.outfit ?? "vanlig";
  const image = isNight ? sleepingImage : outfit === "hoodie" ? hoodieImage : outfit === "troja" ? shirtImage : outfit === "pyjamas" ? sleepingImage : moment === "te" && zone === "fatolj" ? teaImage : moment === "filt" && zone === "fatolj" ? blanketImage : greetingMotion && !still ? wave.url : zone !== "fatolj" && !still ? walkRight.url : still ? stillImage.url : idleAnimation.url;
  const accessory = selected.accessory && selected.accessory !== "ingen" && !isNight ? accessoryImages[selected.accessory] : null;
  const moveTo = (next: Zone) => { if (isNight) return; setZone(next); setMoment(next === "fatolj" ? "sitta" : "vandra"); };
  const sayHello = () => { setGreeting(isNight ? "Zzz… sov så gott ♡" : "Skönt att du är här ♡"); setGreetingMotion(!isNight && !still); };

  return <div className="space-y-2">
    <div className={`flow-room-scene relative isolate overflow-hidden rounded-3xl bg-lavender ${compact ? "aspect-[4/3]" : "aspect-[1.45] sm:aspect-[2.15]"}`} data-time={time} data-zone={zone} aria-label="Flows rum, en trygg plats att vila i">
      <img src={room} width={1280} height={800} alt="Ombonat rum med fåtölj, växter och mjuk belysning" className="absolute inset-0 h-full w-full object-cover object-center" />
      <img src={nightRoom} width={1144} height={736} alt="" className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${time === "natt" ? "opacity-100 brightness-75" : time === "kvall" ? "opacity-60" : "opacity-0"}`} />
      <div className={`pointer-events-none absolute inset-0 ${selected.theme === "rosen" ? "bg-accent/15" : selected.theme === "kvall" ? "bg-primary/15" : ""}`} />
      {time === "kvall" && <div className="flow-room-lamp pointer-events-none absolute inset-0" />}
      {selected.picture && selected.picture !== "original" && <img src={selected.picture === "blommor" ? flowers : mountains} alt="" className="flow-room-picture pointer-events-none absolute z-[1] object-fill" />}
      {selected.plant && selected.plant !== "original" && <img src={selected.plant === "gron" ? vine : blossom} alt="" className="flow-room-plant pointer-events-none absolute z-[1] object-contain" />}
      {selected.throwColor && selected.throwColor !== "original" && <div className={`flow-room-throw pointer-events-none absolute z-[1] ${selected.throwColor === "rosa" ? "bg-blush/70" : "bg-lavender/80"}`} />}
      {selected.pillowColor && selected.pillowColor !== "original" && <div className={`flow-room-pillow pointer-events-none absolute z-[1] ${selected.pillowColor === "rosa" ? "bg-blush/80" : "bg-lavender/90"}`} />}
      {!compact && zones.map(item => <Button key={item.id} type="button" variant="ghost" onClick={() => moveTo(item.id)} disabled={isNight} aria-label={`Flytta Flow till ${item.label.toLowerCase()}`} title={item.label} className={`flow-room-target flow-room-target-${item.id} absolute z-[2] rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring`} />)}
      <div className={`flow-room-figure absolute z-[3] ${still ? "flow-room-still" : ""} ${isNight ? "flow-room-sleep" : ""}`} data-zone={isNight ? "fatolj" : zone}>
        <div className="flow-room-contact-shadow" />
        <Button type="button" variant="ghost" onClick={sayHello} aria-label="Hälsa på Flow" className={`relative h-full w-full rounded-full p-0 hover:bg-transparent ${greetingMotion ? "flow-room-hop" : ""}`}>
          <img src={image} width={768} height={768} alt={isNight ? "Flow sover i pyjamas" : `Flow är vid ${zones.find(item => item.id === zone)?.label.toLowerCase()}`} className="h-full w-full object-contain" />
          {accessory && <img src={accessory} alt="" className={`flow-room-accessory absolute object-contain flow-room-accessory-${selected.accessory}`} />}
        </Button>
      </div>
      {greeting && <p role="status" className="flow-room-greeting absolute right-2 top-2 z-[4] max-w-[55%] rounded-2xl bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-soft">{greeting}</p>}
      {!compact && <div className="absolute bottom-2 left-2 z-[4] rounded-full bg-card/85 px-2 py-1 text-[10px] text-foreground">{time === "dag" ? "Dag" : time === "kvall" ? "Kväll" : "Natt"}</div>}
    </div>
    {!compact && <div className="flex items-center justify-between gap-2">
      <div className="flex gap-1" role="group" aria-label="Stund med Flow">
        {([{ id: "sitta", label: "Sitta", icon: Armchair }, { id: "vandra", label: "Gå", icon: Footprints }, { id: "te", label: "Te", icon: Coffee }, { id: "filt", label: "Filt", icon: Moon }] as const).map(({ id, label, icon: Icon }) => <Button key={id} type="button" variant={moment === id ? "secondary" : "ghost"} disabled={isNight && id !== "sitta"} aria-pressed={moment === id} aria-label={label} onClick={() => { setMoment(id); setZone(id === "vandra" ? "matta" : "fatolj"); }} className="h-12 min-w-11 flex-col gap-0 rounded-2xl px-1 text-foreground"><Icon className="size-4" /><span className="text-[10px]">{label}</span></Button>)}
      </div>
      <div className="flex gap-0.5" role="group" aria-label="Visa tid på dygnet">
        {([{ id: "dag", label: "dag", icon: Sun }, { id: "kvall", label: "kväll", icon: Sunset }, { id: "natt", label: "natt", icon: Moon }] as const).map(({ id, label, icon: Icon }) => <Button key={id} type="button" variant={timeOverride === id ? "secondary" : "ghost"} aria-label={`Visa ${label}`} aria-pressed={timeOverride === id} title={`Visa ${label}`} onClick={() => setTimeOverride(prev => prev === id ? null : id)} className="size-9 rounded-full p-0"><Icon className="size-4" /></Button>)}
      </div>
    </div>}
  </div>;
}
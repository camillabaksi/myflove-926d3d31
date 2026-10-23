import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus, Moon, Sunrise } from "lucide-react";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { isSameDay } from "@/lib/energy-flow";
import { useDayWindow } from "@/hooks/use-day-window";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * A single daily journey: subjective morning/evening readings plus energy factors.
 * Graph points between readings are illustrative relative movements, NOT battery
 * percentages or measured capacity. No invented baseline when morning is absent.
 */
export default function DayEdgesCheckin({ className }: { className?: string }) {
  const { t } = useLang();
  const { window: win, setWindow, todayEdges, setMorning, setEvening } = useDayWindow();
  const { entries } = useEnergyFlow();
  const [morning, setMorningValue] = useState(todayEdges.morning ?? 5);
  const [evening, setEveningValue] = useState(todayEdges.evening ?? 5);
  const [journeyOpen, setJourneyOpen] = useState(true);
  const [details, setDetails] = useState(false);
  const [settings, setSettings] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    if (todayEdges.morning != null) setMorningValue(todayEdges.morning);
    if (todayEdges.evening != null) setEveningValue(todayEdges.evening);
  }, [todayEdges.morning, todayEdges.evening]);

  const activities = useMemo(() => entries
    .filter(e => isSameDay(e.occurredAt) && Number.isFinite(Date.parse(e.occurredAt)))
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt)), [entries]);

  const graph = useMemo(() => {
    if (todayEdges.morning == null) return null;
    const startParts = win.start.split(":").map(Number);
    const endParts = win.end.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const validWindow = Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && endMinutes > startMinutes;
    const xFor = (minutes: number) => validWindow
      ? 16 + 308 * Math.max(0, Math.min(1, (minutes - startMinutes) / (endMinutes - startMinutes)))
      : 16;
    const yFor = (v: number) => 132 - (v - 1) * 11;
    let estimate = todayEdges.morning;
    const points = [{ x: 16, y: yFor(estimate), value: estimate, label: t("Morgon"), direction: "neutral", occurredAt: "" }];
    for (const activity of activities) {
      const time = new Date(activity.occurredAt);
      const minutes = time.getHours() * 60 + time.getMinutes();
      if (!validWindow || minutes < startMinutes || minutes > endMinutes) continue;
      const delta = activity.direction === "gives" ? 1 : activity.direction === "drains" ? -1 : 0;
      // Direction-only visual cue. Strength is NOT converted to battery percent.
      estimate = Math.max(1, Math.min(10, estimate + delta * 0.65));
      points.push({ x: xFor(minutes), y: yFor(estimate), value: estimate, label: activity.title, direction: activity.direction, occurredAt: activity.occurredAt });
    }
    if (todayEdges.evening != null) points.push({
      x: 324, y: yFor(todayEdges.evening), value: todayEdges.evening,
      label: t("Kväll"), direction: "neutral", occurredAt: "",
    });
    else points.push({ x: 324, y: yFor(estimate), value: estimate, label: t("Uppskattning"), direction: "neutral", occurredAt: "" });
    const line = points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
    }).join(" ");
    return { points, line };
  }, [activities, todayEdges.morning, todayEdges.evening, win.start, win.end, t]);

  const save = (kind: "morning" | "evening") => {
    if (kind === "morning") setMorning(morning);
    else setEvening(evening);
    track("battery_checkin_completed", { source: kind === "morning" ? "morgonstart" : "dagens-slut", method: "slider", result: "completed" });
  };

  return (
    <section aria-label={t("Din energiresa")} className={cn("pace-surface space-y-3 rounded-3xl p-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:p-5", className)}>
      <button type="button" onClick={() => setJourneyOpen(v => !v)} aria-expanded={journeyOpen} aria-controls="daily-energy-journey-content" className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl text-left">
        <span className="min-w-0">
          <span className="block font-sans text-base font-semibold text-ink">{t("Din energiresa")}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{t("Vad som gav och tog energi under dagen")}</span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className={cn("shrink-0 text-muted-foreground transition-transform duration-200", journeyOpen && "rotate-180")} />
      </button>
      {journeyOpen && <div id="daily-energy-journey-content" className="space-y-3">
      {graph ? (
        <div data-testid="daily-energy-journey" className="rounded-2xl bg-[#F5EDF7]/45 p-3">
          <svg viewBox="0 0 340 167" role="img" aria-label={t("Illustrativ energikurva utifrån morgonregistrering och aktiviteter")} className="w-full">
            <defs><linearGradient id="journey-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#A993BF" stopOpacity=".3"/><stop offset="100%" stopColor="#A993BF" stopOpacity="0"/></linearGradient></defs>
            {[33, 77, 121].map(y => <line key={y} x1="16" x2="324" y1={y} y2={y} stroke="#E7DFEA" strokeDasharray="3 5"/>)}
            <path d={graph.line + " L 324 145 L 16 145 Z"} fill="url(#journey-fill)" />
            <path d={graph.line} stroke="#9775AD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {graph.points.map((p, i) => <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill={p.direction === "gives" ? "#A1B6A5" : p.direction === "drains" ? "#D6A58E" : "#9775AD"} stroke="#FAF9F6" strokeWidth="2" pointerEvents="none" />
              <circle cx={p.x} cy={p.y} r={11} fill="transparent" role="button" tabIndex={0} aria-label={`${p.label}, ${p.direction === "gives" ? t("Gav energi") : p.direction === "drains" ? t("Tog energi") : p.direction === "both" ? t("Både gav och tog") : t("Uppskattning")}`} onClick={() => setSelectedPoint(i)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedPoint(i); } }} className="cursor-pointer focus:outline-none focus:stroke-[#512654] focus:stroke-2" />
            </g>)}
            <text x="16" y="161" fill="#756B77" fontSize="11">{win.start}</text>
            <text x="324" y="161" textAnchor="end" fill="#756B77" fontSize="11">{win.end}</text>
          </svg>
          {selectedPoint !== null && graph.points[selectedPoint] && <div role="status" className="mt-2 flex min-w-0 items-start justify-between gap-2 rounded-xl bg-card/75 p-3 text-sm text-ink shadow-sm">
            <div className="min-w-0">
              <p className="font-semibold">{graph.points[selectedPoint].label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{graph.points[selectedPoint].occurredAt ? new Date(graph.points[selectedPoint].occurredAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) + " · " : ""}{t(graph.points[selectedPoint].direction === "gives" ? "Gav energi" : graph.points[selectedPoint].direction === "drains" ? "Tog energi" : graph.points[selectedPoint].direction === "both" ? "Både gav och tog" : "Egen registrering eller uppskattning")}</p>
            </div>
            <button type="button" aria-label={t("Stäng")} onClick={() => setSelectedPoint(null)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2">×</button>
          </div>}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><span className="text-[#829C87]">●</span> {t("Gav energi")}</span>
            <span><span className="text-[#C58C70]">●</span> {t("Tog energi")}</span>
            <span><span className="text-[#9775AD]">●</span> {t("Uppskattning")}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("Kurvan illustrerar riktningen, inte uppmätta energinivåer eller batteriprocent. Morgon och kväll är dina egna registreringar.")}</p>
        </div>
      ) : (
        <div data-testid="daily-energy-journey" className="rounded-2xl bg-[#F5EDF7]/45 p-3 text-sm text-muted-foreground">{t("Registrera morgonenergi för att se dagens kurva. Vi gissar inte din startnivå.")}</div>
      )}
      <button type="button" onClick={() => setDetails(v => !v)} aria-expanded={details} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 text-left text-base font-medium text-ink">
        {t("Dagens aktiviteter")} ({activities.length}) <ChevronDown size={18} aria-hidden="true" className={cn("shrink-0 text-muted-foreground transition-transform duration-200", details && "rotate-180")} />
      </button>
      {details && <ol className="space-y-2 rounded-2xl bg-[#F5EDF7]/30 p-3">
        {activities.length === 0 && <li className="text-sm text-muted-foreground">{t("Inga aktiviteter registrerade idag.")}</li>}
        {activities.map(a => <li key={a.id} className="flex items-start gap-2 text-sm text-ink">
          {a.direction === "gives" ? <ArrowUpRight size={16} className="shrink-0 text-[#829C87]"/> : a.direction === "drains" ? <ArrowDownRight size={16} className="shrink-0 text-[#C58C70]"/> : <Minus size={16} className="shrink-0 text-muted-foreground"/>}
          <span className="min-w-0 flex-1">{a.title}<span className="block text-xs text-muted-foreground">{new Date(a.occurredAt).toLocaleTimeString("sv-SE", {hour:"2-digit",minute:"2-digit"})} · {t(a.direction === "gives" ? "Gav energi" : a.direction === "drains" ? "Tog energi" : a.direction === "both" ? "Både gav och tog" : "Ingen tydlig påverkan")}</span></span>
        </li>)}
      </ol>}
      <button type="button" onClick={() => setSettings(v => !v)} aria-expanded={settings} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 text-left text-base font-medium text-ink">
        {t("Morgon, kväll & tider")} <ChevronDown size={18} aria-hidden="true" className={cn("shrink-0 text-muted-foreground transition-transform duration-200", settings && "rotate-180")}/>
      </button>
      {settings && <div className="space-y-3 rounded-2xl bg-[#F5EDF7]/35 p-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">{t("Morgonen startar")}<input type="time" value={win.start} onChange={e => setWindow({start:e.target.value})} className="w-full min-w-0 rounded-xl border border-border bg-background px-2 py-2 text-sm text-ink"/></label>
          <label className="space-y-1 text-xs text-muted-foreground">{t("Dagen slutar")}<input type="time" value={win.end} onChange={e => setWindow({end:e.target.value})} className="w-full min-w-0 rounded-xl border border-border bg-background px-2 py-2 text-sm text-ink"/></label>
        </div>
        <EdgeSlider icon={<Sunrise size={16}/>} label={t("Energi vid morgonstart")} value={morning} onChange={setMorningValue} onSave={() => save("morning")} saved={todayEdges.morning != null}/>
        <EdgeSlider icon={<Moon size={16}/>} label={t("Energi vid dagens slut")} value={evening} onChange={setEveningValue} onSave={() => save("evening")} saved={todayEdges.evening != null}/>
        <p className="text-xs text-muted-foreground">{t("Morgonvärdet kan påverka batteriet. Kvällsvärdet sparas som reflektion.")}</p>
      </div>}
      </div>}
    </section>
  );
}

function EdgeSlider({icon,label,value,onChange,onSave,saved}: {icon:React.ReactNode;label:string;value:number;onChange:(n:number)=>void;onSave:()=>void;saved:boolean}) {
  const {t}=useLang();
  return <div className="space-y-2 rounded-xl bg-card/70 p-3">
    <div className="flex items-center gap-2 text-sm text-ink">{icon}<span className="flex-1">{label}</span><span className="text-xs font-semibold text-primary">{value}/10</span></div>
    <input type="range" min={1} max={10} step={1} value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label} className="w-full accent-[hsl(var(--primary))]"/>
    <button type="button" onClick={onSave} className="min-h-11 rounded-xl bg-secondary/70 px-4 py-2 text-sm font-medium text-ink shadow-sm">{saved?t("Uppdatera"):t("Spara")}</button>
  </div>;
}

import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { toast } from "sonner";
import { ArrowLeftRight, ArrowRight, Battery, BookOpen, CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, CircleHelp, Clock, Heart, Leaf, MoreHorizontal, SlidersHorizontal, Link2, Pill, Plus, Repeat, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlowItemActions } from "@/components/flow-item-actions";
import { useTasks, useReminders, type Task } from "@/hooks/use-data";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useLang } from "@/hooks/use-language";
import { buildFlowPlan } from "@/lib/flow-plan";
import { calendarClusters, calendarDate, calendarGaps, calendarLoad, layoutCalendar, minuteOf, periodDates, shiftDate, timeOf, type CalendarEntry, type CalendarView } from "@/lib/visual-calendar";
import { cn } from "@/lib/utils";
import { calendarArea, calendarAreaLabel } from "@/lib/calendar-area";
import { getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isActiveOwner } from "@/lib/account-scope";

const IMPACTS = [
  { value: "drains", label: "Tar energi", icon: Battery },
  { value: "gives", label: "Ger energi", icon: Leaf },
  { value: "both", label: "Både och", icon: ArrowLeftRight },
  { value: "unknown", label: "Vet inte", icon: CircleHelp },
] as const;
function EntryIcon({ entry, size = 16 }: { entry: CalendarEntry; size?: number }) {
  const Icon = entry.energyImpact === "gives" ? Leaf : /medicin|tablett/i.test(entry.title) ? Pill : entry.source === "study" ? BookOpen : entry.source === "family" || entry.source === "child" ? Users : entry.source === "routine" ? Repeat : entry.source === "task" ? CheckSquare : entry.source === "priority" || entry.source === "quickflow" ? Zap : CalendarDays;
  return <Icon size={size} aria-hidden data-calendar-area={calendarArea(entry)} className="shrink-0 calendar-area-text" />;
}
function Segments({ entries }: { entries: CalendarEntry[] }) {
  const load = calendarLoad(entries);
  return <span className="flex gap-0.5" aria-label={`${load.label}${load.unknown ? ` · ${load.unknown} utan energiuppskattning` : ""}`}>
    {[1, 2, 3, 4].map(n => <span key={n} className={cn("h-1.5 w-2.5 rounded-sm", n <= load.segments ? "bg-primary/55" : "bg-muted")} />)}
  </span>;
}
function entryStyle(start: number, end: number, lane: number, lanes: number, first: number): CSSProperties {
  return { top: `${(start - first) * 1.7}px`, height: `${Math.max(44, (end - start) * 1.7 - 4)}px`, left: `${lane / lanes * 100}%`, width: `${100 / lanes}%` };
}

export default function CalendarPlanner({ tools, weekGoals, checkin, connection, onDateChange }: {
  tools: ReactNode;
  weekGoals: ReactNode;
  checkin: ReactNode;
  connection: ReactNode;
  onDateChange: (date: string) => void;
}) {
  const { t, locale } = useLang();
  const { user } = useUser();
  const owner = user?.id;
  const today = calendarDate(new Date());
  const [date, setDate] = useState(today);
  const [view, setView] = useState<CalendarView>("manad");
  useEffect(() => { onDateChange(date); }, [date, onDateChange]);
  const dates = useMemo(() => periodDates(date, view), [date, view]);
  const { days: allDays, externalError } = useVisualCalendar(dates);
  const [visible, setVisible] = useCloudSyncedStorage<string[]>("myflove-calendar-categories", ["privat", "relationer", "barn", "jobb", "studier"]);
  const days = useMemo(() => Object.fromEntries(Object.entries(allDays).map(([d, items]) => [d, items.filter(e => visible.includes(e.source === "child" ? "barn" : e.source === "family" ? "relationer" : e.source === "study" || e.area === "studier" ? "studier" : e.area === "jobb" ? "jobb" : "privat") || (e.source === "family" && visible.includes("familj")))])), [allDays, visible]);
  const entries = days[date] ?? [];
  const { tasks, addTask, updateTask } = useTasks();
  const { reminders, addReminder, updateReminder } = useReminders();
  const { today: flowItems, toggleItem } = useFlowItems(date);
  const capacity = useCapacityMode();
  const capacityOf = useDayCapacity();
  const todayCap = capacityOf(today);
  const dayCap = capacityOf(date);
  const [utility, setUtility] = useState<"day" | "connection" | null>(null);
  const [capInfo, setCapInfo] = useState<string | null>(null);
  const infoCap = capInfo ? capacityOf(capInfo) : null;
  const [details, setDetails] = useState<CalendarEntry | null>(null);
  const [cluster, setCluster] = useState<CalendarEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("task");
  const [editDate, setEditDate] = useState(date);
  const [time, setTime] = useState("");
  const [length, setLength] = useState("");
  const [impact, setImpact] = useState<Task["energyImpact"]>("unknown");
  const [notify, setNotify] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const tick = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); }; tick(); const timer = setInterval(tick, 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { setDetails(null); setCluster([]); setAdding(false); setPlanning(false); setSuggestions(false); setDismissed(null); setUtility(null); }, [owner]);
  const timed = entries.filter(e => !!e.time);
  const untimed = entries.filter(e => !e.time);
  const gaps = calendarGaps(timed);
  const load = calendarLoad(entries);
  const plan = useMemo(() => buildFlowPlan(flowItems.filter(i => !i.done && entries.some(e => e.id === i.id)).map(i => ({ ...i, time: entries.find(e => e.id === i.id)?.time, fixed: i.source !== "uppgift", movable: i.source === "uppgift" })), { today: date, mode: capacity.mode, nowMinutes: now ?? 0 }), [flowItems, entries, date, capacity.mode, now]);
  const intensive = timed.filter(e => e.energyImpact === "drains" && !e.done).length >= 3;
  const period = new Date(`${date}T12:00:00`).toLocaleDateString(locale, view === "manad" ? { month: "long", year: "numeric" } : { weekday: "long", day: "numeric", month: "long" });
  const step = (direction: number) => {
    if (view === "manad") { const d = new Date(`${date}T12:00:00`); d.setDate(1); d.setMonth(d.getMonth() + direction); setDate(calendarDate(d)); }
    else setDate(shiftDate(date, direction * (view === "vecka" ? 7 : 1)));
  };
  const openAdd = () => { setEditDate(date); setTitle(""); setTime(""); setLength(""); setImpact("unknown"); setKind("task"); setNotify(false); setAdding(true); };
  const openDetails = (entry: CalendarEntry) => {
    setDetails(entry); setPlanning(false); setEditDate(entry.date); setTime(entry.time ?? "");
    const start = minuteOf(entry.time), end = minuteOf(entry.endTime);
    setLength(start !== null && end !== null && end > start ? String(end - start) : "");
    setImpact(entry.energyImpact ?? "unknown");
  };
  const moveEntry = (entry: CalendarEntry, nextDate: string, nextTime: string, minutes: string, nextImpact = entry.energyImpact) => {
    if (!owner || !isActiveOwner(owner) || !entry.editable || entry.recurring || document.documentElement.dataset.calendarOwner !== owner) return;
    const start = minuteOf(nextTime);
    const duration = Number(minutes);
    if (nextTime && start === null || minutes && (!Number.isFinite(duration) || duration <= 0 || (start ?? 0) + duration > 1439)) { toast.error(t("Kontrollera tid och längd.")); return; }
    const endTime = start !== null && duration > 0 ? timeOf(start + duration) : undefined;
    const beforeTask = tasks.find(e => e.id === entry.sourceId);
    const beforeReminder = reminders.find(e => e.id === entry.sourceId);
    if (entry.source === "task") {
      if (!beforeTask || beforeTask.syncKey) return;
      updateTask(entry.sourceId, { dueDate: nextDate, time: nextTime, endTime, energyImpact: nextImpact });
    } else if (entry.source === "reminder") {
      if (!beforeReminder || beforeReminder.repeat && beforeReminder.repeat !== "none" || beforeReminder.endDate) return;
      updateReminder(entry.sourceId, { date: nextDate, time: nextTime, endTime, energyImpact: nextImpact });
    } else return;
    setDetails(null);
    toast.success(nextTime ? `${t("Flyttad till")} ${nextDate} · ${nextTime}` : t("Tiden borttagen"), { action: { label: t("Ångra"), onClick: () => {
      // Scope callbacks to the still-signed-in owner; restore only scheduling fields.
      if (document.documentElement.dataset.calendarOwner !== owner) return;
      void getSyncUser().then(current => {
        if (current?.id !== owner || document.documentElement.dataset.calendarOwner !== owner) return;
        if (beforeTask && entry.source === "task") updateTask(entry.sourceId, { dueDate: beforeTask.dueDate, time: beforeTask.time ?? "", endTime: beforeTask.endTime, energyImpact: beforeTask.energyImpact, reminderMinutesBefore: beforeTask.reminderMinutesBefore });
        if (beforeReminder && entry.source === "reminder") updateReminder(entry.sourceId, { date: beforeReminder.date, time: beforeReminder.time ?? "", endTime: beforeReminder.endTime, energyImpact: beforeReminder.energyImpact, remindMinutesBefore: beforeReminder.remindMinutesBefore });
      });
    } } });
  };
  useEffect(() => { document.documentElement.dataset.calendarOwner = owner ?? ""; return () => { delete document.documentElement.dataset.calendarOwner; }; }, [owner]);
  const saveNew = () => {
    if (!title.trim() || !editDate || !owner || !isActiveOwner(owner) || document.documentElement.dataset.calendarOwner !== owner) return;
    const start = minuteOf(time), duration = Number(length);
    if (time && start === null || length && (!Number.isFinite(duration) || duration <= 0 || (start ?? 0) + duration > 1439)) { toast.error(t("Kontrollera tid och längd.")); return; }
    const end = start !== null && duration > 0 ? timeOf(start + duration) : undefined;
    const energy = kind === "recovery" ? "gives" : impact;
    if (kind === "task") addTask(title.trim(), editDate, { time: time || undefined, endTime: end, energyImpact: energy, reminderMinutesBefore: notify && time ? 0 : undefined });
    else addReminder(title.trim(), editDate, time || undefined, "none", end, notify && time ? 0 : undefined, undefined, undefined, undefined, energy);
    setAdding(false); toast.success(t("Tillagt i kalendern"));
  };
  const drop = (event: DragEvent, nextDate: string, nextMinute?: number) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/myflove-calendar");
    const entry = Object.values(days).flat().find(e => e.id === id);
    if (!entry?.editable || entry.recurring) return;
    const start = minuteOf(entry.time), end = minuteOf(entry.endTime);
    moveEntry(entry, nextDate, nextMinute === undefined ? entry.time ?? "" : timeOf(nextMinute), start !== null && end !== null && end > start ? String(end - start) : "");
  };
  const dateHeading = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric" });
  const blockButton = (entry: CalendarEntry, compact = false) => <Button type="button" variant="ghost" draggable={entry.editable && !entry.recurring} onDragStart={event => {
    if (!window.matchMedia("(pointer:fine)").matches) { event.preventDefault(); return; }
    event.dataTransfer.setData("application/myflove-calendar", entry.id); event.dataTransfer.effectAllowed = "move";
  }} onClick={() => openDetails(entry)} data-calendar-area={calendarArea(entry)} className={cn("h-full min-h-11 w-full items-start justify-start gap-1.5 overflow-hidden whitespace-normal rounded-xl border border-l-[3px] calendar-area-surface px-2 py-1.5 text-left font-normal text-foreground", entry.done && "opacity-65")} aria-label={`${entry.title}, ${entry.time ?? t("Ingen tid ännu")}${entry.endTime ? `–${entry.endTime}` : ""}${entry.label ? `, ${entry.label}` : ""}, ${t(calendarAreaLabel(calendarArea(entry)))}`}>
    <EntryIcon entry={entry} size={compact ? 14 : 18} />
    <span className="min-w-0 flex-1"><span className={cn("block truncate text-xs font-semibold leading-snug", !compact && "text-sm", entry.done && "line-through")}>{entry.title}</span><span className="block text-[11px] leading-snug text-muted-foreground">{entry.time}{entry.endTime && `–${entry.endTime}`}</span>{!compact && <span className="block truncate text-[11px] text-muted-foreground">{t(calendarAreaLabel(calendarArea(entry)))}{entry.label && ` · ${t(entry.label)}`}</span>}</span>
    {entry.done && <Check size={14} className="shrink-0" aria-hidden />}
  </Button>;
  const timeline = (day: string, dayItems: CalendarEntry[], compact: boolean) => {
    const blocks = layoutCalendar(dayItems);
    const periodBlocks = view === "vecka" ? layoutCalendar(Object.values(days).flat()) : blocks;
    const starts = periodBlocks.map(b => b.start), ends = periodBlocks.map(b => b.end);
    const first = Math.floor(Math.min(480, ...starts) / 60) * 60;
    const last = Math.min(1440, Math.ceil(Math.max(1080, ...ends) / 60) * 60);
    const height = (last - first) * 1.7;
    return <div className="relative ml-12 border-l border-border" style={{ height }} onDragOver={e => e.preventDefault()} onDrop={e => {
      const rect = e.currentTarget.getBoundingClientRect(); const minute = Math.round((first + (e.clientY - rect.top) / 1.7) / 15) * 15; drop(e, day, Math.max(first, Math.min(last - 15, minute)));
    }}>
      {Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60).map(m => <div key={m} className="pointer-events-none absolute left-0 right-0 border-t border-border/45" style={{ top: (m - first) * 1.7 }}><span className="absolute -left-12 -top-2 w-10 text-right text-[11px] text-muted-foreground">{m === 1440 ? "24:00" : timeOf(m)}</span></div>)}
      {!compact && calendarGaps(dayItems).map(gap => <div key={gap.start} className="absolute left-2 right-1 flex items-center gap-2 rounded-xl border border-dashed border-sage/35 bg-mint/40 px-3 text-xs text-foreground" style={{ top: (gap.start - first) * 1.7 + 2, height: Math.max(30, gap.minutes * 1.7 - 6) }}><Leaf size={15} aria-hidden />{gap.minutes} {t("min luft")}</div>)}
      {calendarClusters(blocks).map(group => group.blocks.some(b => b.lanes > (compact ? 1 : 2)) ? <div key={group.blocks[0]?.item.id} className="absolute left-1 right-1" style={{ top: (group.start - first) * 1.7, height: Math.max(50, (group.end - group.start) * 1.7 - 4) }}><Button variant="secondary" className="h-full w-full min-w-0 items-start justify-start rounded-xl border border-border px-2 text-xs" onClick={() => setCluster(group.blocks.map(b => b.item))}><CalendarDays size={14} /><span className="truncate">{timeOf(group.start)} · {group.blocks.length} {t("aktiviteter")}</span></Button></div> : group.blocks.map(block => <div key={block.item.id} className="absolute pl-1 pr-1" style={entryStyle(block.start, block.end, block.lane, block.lanes, first)}>{blockButton(block.item, compact)}</div>))}
      {day === today && now !== null && now >= first && now <= last && <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-accent" style={{ top: (now - first) * 1.7 }}><span className="absolute -left-11 -top-3 rounded-full bg-accent px-1.5 py-1 text-[10px] font-semibold text-accent-foreground">{t("NU")}</span></div>}
    </div>;
  };
  const balance = <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" aria-label={t("Dagens balans")}>
    <h2 className="font-display text-sm font-bold">{t(date === today ? "Din kapacitet idag" : "Dagens planering")}</h2>
    <button type="button" onClick={() => setCapInfo(date)} className="mt-3 block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t("Kapacitet")}: ${dayCap.percent == null ? t("ingen egen incheckning") : `${dayCap.percent} %`}. ${t("Visa vad den bygger på")}`}>
      <span className="block text-xs text-muted-foreground">{t("Kapacitet")}</span>
      <CapacityBattery percent={dayCap.percent} size="lg" className="mt-1 w-full" />{dayCap.percent == null && <span className="mt-1 block text-xs text-muted-foreground">{t(date > today ? "Kapacitet visas när du checkat in den dagen." : "Ingen egen incheckning för dagen.")}</span>}
    </button>
    <div className="mt-3 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Planerad belastning")}</p><p className="mt-0.5 text-sm font-semibold">{t(load.label)}</p></div><Segments entries={entries} /></div>
    <div className="mt-3 flex gap-2 rounded-2xl bg-lavender/50 p-3 text-xs leading-relaxed"><Heart size={15} className="shrink-0 text-primary" aria-hidden /><span>{t(!entries.length ? "Inget planerat än. Du behöver inte fylla dagen bara för att det finns plats." : load.segments >= 3 ? "Det ser ut som en ganska full dag. Vill du se om vi kan skapa lite mer luft?" : gaps.length ? "Det finns lite luft mellan aktiviteterna." : "En sak i taget, i din takt.")}</span></div>
    {load.unknown > 0 && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer py-2">{t("Om uppskattningen")}</summary><p>{load.unknown} {t("poster saknar uppskattad energipåverkan. Belastningen är ett stöd, inte ett mått på hur du mår.")}</p></details>}
  </section>;
  const todo = <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><details open><summary className="cursor-pointer py-1 font-display text-sm font-bold">{t("Att få gjort idag")} <span className="text-muted-foreground">{untimed.filter(e => !e.done).length}</span></summary><ul className="mt-3 space-y-2">{untimed.map(entry => <li key={entry.id} className="flex min-w-0 items-center gap-1"><div className="min-w-0 flex-1">{blockButton(entry)}</div></li>)}</ul>{untimed.length === 0 && <p className="mt-3 text-xs text-muted-foreground">{t("Inga oschemalagda saker den här dagen.")}</p>}</details></section>;
  const energyFields = <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("Hur brukar det påverka din energi?")}</legend><div className="grid grid-cols-2 gap-2">{IMPACTS.map(option => <Button key={option.value} variant="outline" type="button" aria-pressed={impact === option.value} className={cn("min-h-11 justify-start rounded-xl text-xs", impact === option.value && "border-primary bg-lavender/60")} onClick={() => setImpact(option.value)}><option.icon size={16} />{t(option.label)}</Button>)}</div></fieldset>;
  const scheduleFields = <><div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm">{t("Datum")}<Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 min-h-11" /></label><label className="min-w-0 text-sm">{t("Tid")}<Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 min-h-11" /></label></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setEditDate(today)}>{t("Idag")}</Button><Button variant="ghost" size="sm" onClick={() => setEditDate(shiftDate(today, 1))}>{t("Imorgon")}</Button><Button variant="ghost" size="sm" onClick={() => { setTime(""); setLength(""); }}>{t("Ingen tid ännu")}</Button></div>{time && <label className="block text-sm">{t("Hur lång tid ungefär?")}<div className="mt-2 flex flex-wrap gap-1">{[15, 30, 45, 60].map(n => <Button key={n} size="sm" variant={length === String(n) ? "default" : "outline"} onClick={() => setLength(String(n))}>{n} {t("min")}</Button>)}</div><Input type="number" min="1" max="1439" value={length} onChange={e => setLength(e.target.value)} placeholder={t("Längd i minuter (valfritt)")} className="mt-2 min-h-11" /></label>}</>;
  return <div className="mx-auto max-w-6xl space-y-4" data-testid="visual-calendar">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h1 className="min-w-0 font-display text-2xl font-bold text-ink">{t("Kalender")}</h1><Button onClick={openAdd} variant="secondary" className="min-h-11 shrink-0 rounded-2xl text-primary"><Plus size={16} />{t("Lägg till")}</Button></header>
    <div role="group" aria-label={t("Kalendervy")} className="grid grid-cols-3 rounded-2xl border border-border/60 bg-secondary/60 p-1">{([ ["manad", "Månad"], ["vecka", "Vecka"], ["dag", "Dag"] ] as const).map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setView(id)} aria-pressed={view === id} className={cn("min-h-11 rounded-xl", view === id ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground")}>{t(label)}</Button>)}</div>
    {view !== "dag" && <button type="button" onClick={() => setCapInfo(today)} className="flex w-full items-center gap-4 rounded-3xl border border-border/60 bg-card p-4 text-left shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t("Din kapacitet idag")}: ${todayCap.percent == null ? t("ingen egen incheckning") : `${todayCap.percent} %`}. ${t("Visa vad den bygger på")}`}><span className="min-w-0 flex-1"><span className="flex items-center gap-1 font-display text-sm font-bold">{t("Din kapacitet idag")}<CircleHelp size={14} className="text-muted-foreground" aria-hidden /></span><CapacityBattery percent={todayCap.percent} size="lg" className="mt-2 w-full" /><span className="mt-2 block text-xs text-muted-foreground">{t(todayCap.percent == null ? "Checka in din energi så visas dagens kapacitet här." : "Utifrån din egen incheckning idag.")}</span></span><ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden /></button>}
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Föregående period")} onClick={() => step(-1)}><ChevronLeft size={18} /></Button><div className="min-w-0 text-center"><p className="break-words font-display text-sm font-bold capitalize">{view === "vecka" ? `${dateHeading(dates[0] ?? date)} – ${dateHeading(dates[6] ?? date)}` : period}</p><Button variant="ghost" size="sm" onClick={() => setDate(today)} className="min-h-11 text-xs text-primary">{t("Idag")}</Button></div><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Nästa period")} onClick={() => step(1)}><ChevronRight size={18} /></Button></div>
    <div className="flex flex-wrap items-center gap-2" aria-label={t("Kalenderverktyg")}>
      <details className="min-w-0 flex-1 rounded-2xl border border-border/60 bg-card/70 px-3">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium"><SlidersHorizontal size={16} className="text-primary" aria-hidden />{t("Visa i kalendern")}<span className="ml-auto text-muted-foreground">{visible.length}/5</span></summary>
        <div className="flex flex-wrap gap-2 pb-3" role="group" aria-label={t("Visa kategorier")}>{[["privat", "Privat"], ["relationer", "Relationer"], ["barn", "Barn"], ["jobb", "Jobb"], ["studier", "Studier"]].map(([id, label]) => <Button key={id} size="sm" variant="outline" className={cn("min-h-11 rounded-xl", visible.includes(id ?? "") && "border-primary/30 bg-lavender/60 text-primary")} aria-pressed={visible.includes(id ?? "")} onClick={() => setVisible(prev => prev.includes(id ?? "") ? prev.filter(x => x !== id) : [...prev, id ?? "privat"])}>{t(label ?? "")}</Button>)}</div>
      </details>
      <Button variant="outline" className="min-h-11 rounded-2xl text-xs" onClick={() => setUtility("connection")}><Link2 size={16} className="text-primary" />{t("Kalenderkoppling")}</Button>
      <Button variant="outline" className="min-h-11 rounded-2xl text-xs" onClick={() => setUtility("day")}><MoreHorizontal size={16} className="text-primary" />{t("Dagens verktyg")}</Button>
    </div>
    <ul aria-label={t("Områdesfärger")} className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{[...new Set(Object.values(days).flat().map(calendarArea))].map(area => <li key={area} data-calendar-area={area} className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(area))}</li>)}</ul>
    {view !== "dag" && date === today && checkin}
    {externalError && <p role="status" className="text-sm text-muted-foreground">{t("Den externa kalendern kunde inte hämtas just nu. Dina MyFlove-poster finns kvar.")}</p>}
    {view === "manad" && <><div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t("Månadskalender")}>
      {dates.slice(0, 7).map(d => <span key={`heading-${d}`} className="py-1 text-center text-[11px] text-muted-foreground">{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}</span>)}
      {dates.map(d => { const dayEntries = days[d] ?? []; const adjacent = d.slice(0, 7) !== date.slice(0, 7); return <Button key={d} variant="ghost" onClick={() => setDate(d)} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, d)} aria-current={d === today ? "date" : undefined} aria-pressed={d === date} aria-label={`${new Date(`${d}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long" })}, ${dayEntries.length} ${t("aktiviteter")}`} className={cn("relative flex h-24 min-w-0 flex-col justify-start gap-1 rounded-xl border border-border/50 bg-card/60 px-0.5 py-2 text-xs sm:h-32 sm:px-2", adjacent && "opacity-50", d === today && "border-primary border-2", d === date && "bg-lavender ring-2 ring-primary/40 hover:bg-lavender")}>
        <span className="font-semibold">{Number(d.slice(-2))}</span><span className="hidden w-full min-w-0 space-y-1 sm:block">{dayEntries.slice(0, 2).map(e => <span key={e.id} data-calendar-area={calendarArea(e)} className="flex min-w-0 items-center gap-1 rounded-sm border border-l-2 calendar-area-surface px-0.5 text-[10px]"><EntryIcon entry={e} size={12} /><span className="truncate">{e.title}</span></span>)}</span><span className="flex gap-1 sm:hidden">{dayEntries.slice(0, 2).map(e => <span key={e.id} data-calendar-area={calendarArea(e)} className="rounded-sm border calendar-area-surface p-0.5" title={`${e.title} · ${t(calendarAreaLabel(calendarArea(e)))}`}><EntryIcon entry={e} size={12} /></span>)}</span>{dayEntries.length > 2 && <span className="text-[10px]">+{dayEntries.length - 2}</span>}<span className="mt-auto flex flex-col items-center gap-1">{(() => { const c = capacityOf(d).percent; return c != null && <span className="flex flex-col items-center"><span className="text-[10px] font-semibold tabular-nums">{c} %</span><CapacityBattery percent={c} size="xs" className="[&>span:last-child]:hidden" /></span>; })()}<Segments entries={dayEntries} /></span>
      </Button>; })}</div><section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</h2><Button size="icon" variant="ghost" className="min-h-11 min-w-11 text-primary" aria-label={t("Öppna dagen")} onClick={() => setView("dag")}><ArrowRight size={18} /></Button></div><ul className="mt-2 space-y-2">{entries.slice(0, 3).map(e => <li key={e.id}>{blockButton(e)}</li>)}</ul>{!entries.length && <p className="py-4 text-sm text-muted-foreground">{t("Inget planerat än. Du behöver inte fylla dagen bara för att det finns plats.")}</p>}{entries.length > 3 && <Button variant="ghost" onClick={() => setView("dag")} className="mt-2 text-primary">+{entries.length - 3} {t("till")}</Button>}</section></>}
    {view === "vecka" && <div className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl border border-border/60 bg-card p-2 shadow-soft motion-reduce:snap-none" role="group" aria-label={t("Veckovy, svep för fler dagar")} tabIndex={0}><div className="flex gap-2">{dates.map(d => <div key={d} className="w-[calc(100%-1rem)] min-w-0 shrink-0 snap-start min-[420px]:w-[calc(50%-0.25rem)] min-[640px]:w-[calc(33.333%-0.35rem)] lg:w-[272px]"><Button variant="ghost" onClick={() => { setDate(d); setView("dag"); }} className={cn("sticky top-0 z-20 mb-2 h-auto min-h-16 w-full flex-col rounded-xl bg-card", d === today && "border border-primary", d === date && "bg-lavender")}><span className="text-xs">{dateHeading(d)}</span><CapacityBattery percent={capacityOf(d).percent} size="sm" /><Segments entries={days[d] ?? []} /></Button>{timeline(d, days[d] ?? [], true)}{(days[d] ?? []).filter(e => !e.time).map(e => <div className="mt-2" key={e.id}>{blockButton(e, true)}</div>)}</div>)}</div></div>}
    {view === "dag" && <><div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 space-y-4">{balance}{date === today && checkin}{date === today && plan.now && <div className="grid grid-cols-2 gap-3 rounded-2xl bg-lavender/40 p-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Just nu")}</p><p className="mt-1 break-words text-sm font-semibold">{plan.now.item.title}</p></div>{plan.next && <div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Härnäst")}</p><p className="mt-1 break-words text-sm">{plan.next.item.title}</p></div>}</div>}<div className="lg:hidden">{todo}</div>{timed.length > 0 ? <section aria-label={t("Dagens tidslinje")} className="rounded-3xl border border-border/60 bg-card px-3 py-6 shadow-soft">{timeline(date, timed, false)}</section> : <div className="py-6 text-center text-sm text-muted-foreground"><Leaf className="mx-auto mb-2 text-primary" size={24} />{t("Ingen tid bokad. Det får finnas luft.")}</div>}</div><aside className="space-y-4"><div className="hidden lg:block">{todo}</div>{intensive && dismissed !== date && <section className="rounded-3xl border border-primary/20 bg-lavender/60 p-4"><h2 className="flex items-center gap-2 text-sm font-bold"><Heart size={16} className="text-primary" />{t("Flow ser att…")}</h2><p className="mt-3 text-sm">{t("Flera aktiviteter som tar energi ligger på dagen. Vill du se om det finns plats för återhämtning?")}</p><Button className="mt-3 w-full rounded-2xl" onClick={() => setSuggestions(true)}>{t("Hitta plats")}</Button><Button variant="ghost" className="mt-1 w-full" onClick={() => setDismissed(date)}>{t("Inte nu")}</Button></section>}</aside></div></>}
    <section aria-label={t("Veckans mål")} className="min-w-0">{weekGoals}</section>
    <Dialog open={utility !== null} onOpenChange={open => { if (!open) setUtility(null); }}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(utility === "connection" ? "Kalenderkoppling" : "Dagens verktyg")}</DialogTitle>
          <DialogDescription>{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</DialogDescription>
        </DialogHeader>
        {utility === "connection" ? connection : tools}
      </DialogContent>
    </Dialog>
    <Dialog open={cluster.length > 0} onOpenChange={open => { if (!open) setCluster([]); }}><DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Aktiviteter vid samma tid")}</DialogTitle><DialogDescription>{date}</DialogDescription></DialogHeader><ul className="space-y-2">{cluster.map(e => <li key={e.id} onClick={() => setCluster([])}>{blockButton(e)}</li>)}</ul></DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Vad vill du lägga till?")}</DialogTitle><DialogDescription>{t("En sak i taget, i din takt.")}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-2">{[["task", "Uppgift"], ["activity", "Aktivitet"], ["reminder", "Påminnelse"], ["recovery", "Återhämtning"]].map(([value, label]) => <Button key={value} variant={kind === value ? "default" : "outline"} onClick={() => { setKind(value ?? "task"); if (value === "recovery") setImpact("gives"); }}>{t(label ?? "")}</Button>)}</div><label className="block text-sm">{t("Namn")}<Input className="mt-1 min-h-11" value={title} onChange={e => setTitle(e.target.value)} maxLength={240} /></label>{scheduleFields}{energyFields}{time && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />{t("Påminn mig vid start")}</label>}<Button className="w-full min-h-11 rounded-2xl" disabled={!title.trim() || !editDate} onClick={saveNew}><Plus size={16} />{t("Lägg till")}</Button></div></DialogContent></Dialog>
    <Dialog open={!!details} onOpenChange={open => { if (!open) setDetails(null); }}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle className="break-words">{details?.title}</DialogTitle><DialogDescription>{details?.date} {details?.time}{details?.endTime && `–${details.endTime}`} {details?.label}</DialogDescription></DialogHeader>{details && <div className="space-y-4"><p data-calendar-area={calendarArea(details)} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(calendarArea(details)))}</p>{planning ? <>{scheduleFields}{energyFields}<Button className="w-full min-h-11" onClick={() => moveEntry(details, editDate, time, length, impact)}>{t("Spara")}</Button></> : <>{details.editable && !details.recurring && <Button variant="outline" className="min-h-11 w-full" onClick={() => setPlanning(true)}><Clock size={16} />{t("Planera tid")}</Button>}{details.editable && !details.recurring && details.time && <Button variant="ghost" className="min-h-11 w-full" onClick={() => moveEntry(details, details.date, "", "")}>{t("Ta bort tid")}</Button>}{details.editable && (details.source === "task" || details.source === "reminder") && <div className="flex items-center justify-between gap-2">{(() => { const match = flowItems.find(i => i.id === details.id); return match?.completable ? <Button variant="outline" className="min-h-11" onClick={() => { toggleItem(match); setDetails(null); }}><Check size={16} />{t(match.done ? "Ångra klart" : "Markera klar")}</Button> : null; })()}<FlowItemActions itemId={details.id} /></div>}{details.href && <Button asChild variant="outline" className="min-h-11 w-full"><Link href={details.href}>{t("Öppna där aktiviteten hör hemma")}<ArrowRight size={16} /></Link></Button>}</>}</div>}</DialogContent></Dialog>
    <Dialog open={!!capInfo} onOpenChange={open => { if (!open) setCapInfo(null); }}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t(capInfo === today ? "Din kapacitet idag" : "Kapacitet")}</DialogTitle><DialogDescription>{capInfo}</DialogDescription></DialogHeader>{infoCap && <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"><span>{t("Din morgonincheckning")}</span><span className="font-semibold tabular-nums">{infoCap.morning == null ? "–" : `${infoCap.morning} %`}</span></div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"><span>{t("Registrerad energi")}</span><span className="font-semibold tabular-nums">{infoCap.reportedLevel == null ? "–" : `${infoCap.reportedLevel}/5`}</span></div>
      {capInfo === today && capacity.chosen && <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"><span>{t("Ditt valda kapacitetsläge")}</span><span className="font-semibold">{t(capacity.mode === "fullt" ? "Fullt" : capacity.mode === "mellan" ? "Mellan" : "Lågt")}</span></div>}
      <div className="rounded-2xl bg-lavender/50 p-3"><p className="text-xs text-muted-foreground">{t("Din uppskattade kapacitet")}</p><CapacityBattery percent={infoCap.percent} size="md" className="mt-1" /></div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t(infoCap.percent == null ? "Vi har ingen egen incheckning för den här dagen. MyFlove gissar inte – checka in din energi när du vill." : "Kapaciteten bygger på din egen incheckning. Att flytta eller ta bort aktiviteter ändrar planerad belastning, inte din kapacitet.")}</p>
      {capInfo === today && <div className="grid grid-cols-3 gap-1" role="group" aria-label={t("Kapacitetsläge")}>{(["fullt", "mellan", "lagt"] as const).map(mode => <Button key={mode} variant="ghost" className={cn("min-h-11 rounded-xl px-1 text-xs", capacity.chosen && capacity.mode === mode ? "bg-lavender text-primary" : "text-muted-foreground")} aria-pressed={capacity.chosen && capacity.mode === mode} onClick={() => capacity.setMode(mode)}>{t(mode === "fullt" ? "Fullt" : mode === "mellan" ? "Mellan" : "Lågt")}</Button>)}</div>}
    </div>}</DialogContent></Dialog>
    <Dialog open={suggestions} onOpenChange={setSuggestions}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t("Lite mer luft")}</DialogTitle><DialogDescription>{t("Inget ändras förrän du själv väljer.")}</DialogDescription></DialogHeader>{gaps.filter(g => g.minutes >= 20).slice(0, 3).map(g => <Button key={g.start} variant="outline" className="h-auto min-h-14 justify-start whitespace-normal rounded-2xl text-left" onClick={() => { setSuggestions(false); setEditDate(date); setTime(timeOf(g.start)); setLength("20"); setTitle(t("Återhämtning")); setKind("recovery"); setImpact("gives"); setNotify(false); setAdding(true); }}><Leaf size={18} />{t("Lägg 20 min återhämtning")} · {timeOf(g.start)}</Button>)}{!gaps.length && <p className="text-sm text-muted-foreground">{t("Jag ser ingen säker lucka med kända sluttider. Du kan själv ändra en aktivitet eller planera återhämtning.")}</p>}</DialogContent></Dialog>
  </div>;
}
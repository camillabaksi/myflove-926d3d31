import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { toast } from "sonner";
import { ArrowLeftRight, ArrowRight, Battery, BookOpen, CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, CircleHelp, Clock, Heart, Leaf, MoreHorizontal, SlidersHorizontal, Link2, Pill, Plus, Repeat, UserRound, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlowItemActions } from "@/components/flow-item-actions";
import { useChildren } from "@/hooks/use-children";
import { decodeVisualNotes, encodeVisualNotes } from "@/lib/child-visual-schedule";
import { useTasks, useReminders, type Task } from "@/hooks/use-data";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useTextLayout } from "@/hooks/use-text-layout";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useLang } from "@/hooks/use-language";
import { buildFlowPlan } from "@/lib/flow-plan";
import { calendarClusters, calendarDate, calendarGaps, calendarLoad, layoutCalendar, minuteOf, periodDates, shiftDate, timeOf, isFamilyEntry, type CalendarEntry, type CalendarView } from "@/lib/visual-calendar";
import { cn } from "@/lib/utils";
import { calendarArea, calendarAreaLabel, calendarMonthAreas, calendarMonthCapacity } from "@/lib/calendar-area";
import { getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isActiveOwner } from "@/lib/account-scope";

import { FlowMascot } from "@/components/flow-mascot";
import { flowDaySupport } from "@/lib/flow-day-support";
import { FamilyLayerSettings } from "@/components/calendar/family-layer-settings";
import { applyFamilyPresence, DEFAULT_FAMILY_LAYER, familyLayerEntries, familyPlanningContext, type FamilyLayerPreferences } from "@/lib/family-calendar";

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
  // Presentation only: keep a single instance of each control/form in DOM order.
  const textLayout = useTextLayout();
  const [desktopLayout, setDesktopLayout] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktopLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const today = calendarDate(new Date());
  const [date, setDate] = useState(today);
  const [view, setView] = useState<CalendarView>("manad");
  useEffect(() => { onDateChange(date); }, [date, onDateChange]);
  const dates = useMemo(() => periodDates(date, view), [date, view]);
  const { days: allDays, familyMembers, externalError } = useVisualCalendar(dates);
  const [visible, setVisible] = useCloudSyncedStorage<string[]>("myflove-calendar-categories", ["privat", "relationer", "barn", "jobb", "studier"]);
  const [familyPreferences, setFamilyPreferences] = useCloudSyncedStorage<FamilyLayerPreferences>("myflove-calendar-family-layer", DEFAULT_FAMILY_LAYER);
  const [familySettings, setFamilySettings] = useState(false);
  const categoryDays = useMemo(() => Object.fromEntries(Object.entries(allDays).map(([d, items]) => [d, items.filter(e => isFamilyEntry(e) || visible.includes(e.source === "study" || e.area === "studier" ? "studier" : e.area === "jobb" ? "jobb" : "privat"))])), [allDays, visible]);
  const planningDays = useMemo(() => Object.fromEntries(Object.entries(categoryDays).map(([d, items]) => [d, applyFamilyPresence(items, familyPreferences)])), [categoryDays, familyPreferences]);
  const days = useMemo(() => Object.fromEntries(Object.entries(categoryDays).map(([d, items]) => [d, familyLayerEntries(items, familyPreferences)])), [categoryDays, familyPreferences]);
  const entries = days[date] ?? [];
  const myEntries = entries.filter(e => !isFamilyEntry(e));
  const familyEntries = entries.filter(isFamilyEntry);
  const planningEntries = (planningDays[date] ?? []).filter(e => !e.parentTaskId || !entries.some(own => own.source === "task" && own.sourceId === e.parentTaskId));
  const [familyConfirm, setFamilyConfirm] = useState<{ entries: CalendarEntry[]; action: () => void; duration: number; day: string } | null>(null);
  const [familyAlternatives, setFamilyAlternatives] = useState<{ day: string; duration: number } | null>(null);
  const { tasks, addTask, updateTask } = useTasks();
  const { reminders, addReminder, updateReminder } = useReminders();
  const { items: originalChildItems, updateItem: updateChildItem } = useChildren();
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
  useEffect(() => { setDetails(null); setCluster([]); setAdding(false); setPlanning(false); setSuggestions(false); setDismissed(null); setUtility(null); setFamilySettings(false); setFamilyConfirm(null); setFamilyAlternatives(null); }, [owner]);
  const timed = entries.filter(e => !!e.time);
  const untimed = myEntries.filter(e => !e.time && ["task", "quickflow", "priority"].includes(e.source));
  const gaps = calendarGaps(planningEntries);
  const load = calendarLoad(planningEntries);
  const plan = useMemo(() => buildFlowPlan(flowItems.filter(i => !i.done && entries.some(e => e.id === i.id)).map(i => ({ ...i, time: entries.find(e => e.id === i.id)?.time, fixed: i.source !== "uppgift", movable: i.source === "uppgift" })), { today: date, mode: capacity.mode, nowMinutes: now ?? 0 }), [flowItems, entries, date, capacity.mode, now]);
  const intensive = planningEntries.filter(e => e.energyImpact === "drains" && !e.done).length >= 3;
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
  const confirmFamily = (day: string, start: string, end: string | undefined, duration: number, action: () => void): boolean => {
    const related = familyPlanningContext(planningDays[day] ?? [], start, end);
    const context = [...related.presence, ...related.context];
    if (!context.length) return false;
    setFamilyConfirm({ entries: context, action, duration, day });
    return true;
  };
  const moveEntry = (entry: CalendarEntry, nextDate: string, nextTime: string, minutes: string, nextImpact = entry.energyImpact, confirmed = false) => {
    if (!owner || !isActiveOwner(owner) || !entry.editable || entry.recurring || document.documentElement.dataset.calendarOwner !== owner) return;
    const start = minuteOf(nextTime);
    const duration = Number(minutes);
    if (nextTime && start === null || minutes && (!Number.isFinite(duration) || duration <= 0 || (start ?? 0) + duration > 1439)) { toast.error(t("Kontrollera tid och längd.")); return; }
    const endTime = start !== null && duration > 0 ? timeOf(start + duration) : undefined;
    if (!confirmed && nextTime && confirmFamily(nextDate, nextTime, endTime, duration || 0, () => moveEntry(entry, nextDate, nextTime, minutes, nextImpact, true))) return;
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
    toast.success(nextTime ? `${t("Flyttad till")} ${nextDate} · ${nextTime}` : t("Tiden borttagen"), { description: t("Planen får ändras när dagen ändras."), action: { label: t("Ångra"), onClick: () => {
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
  const saveNew = (confirmed = false) => {
    if (!title.trim() || !editDate || !owner || !isActiveOwner(owner) || document.documentElement.dataset.calendarOwner !== owner) return;
    const start = minuteOf(time), duration = Number(length);
    if (time && start === null || length && (!Number.isFinite(duration) || duration <= 0 || (start ?? 0) + duration > 1439)) { toast.error(t("Kontrollera tid och längd.")); return; }
    const end = start !== null && duration > 0 ? timeOf(start + duration) : undefined;
    if (!confirmed && time && confirmFamily(editDate, time, end, duration || 0, () => saveNew(true))) return;
    const energy = kind === "recovery" ? "gives" : impact;
    if (kind === "task") addTask(title.trim(), editDate, { time: time || undefined, endTime: end, energyImpact: energy, reminderMinutesBefore: notify && time ? 0 : undefined });
    else addReminder(title.trim(), editDate, time || undefined, "none", end, notify && time ? 0 : undefined, undefined, undefined, undefined, energy);
    setAdding(false); toast.success(t("Tillagt i kalendern"), { description: kind === "recovery" ? t("Återhämtning får också ta plats i kalendern.") : undefined });
  };
  const drop = (event: DragEvent, nextDate: string, nextMinute?: number) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/myflove-calendar");
    const entry = Object.values(days).flat().find(e => e.id === id);
    if (!entry?.editable || entry.recurring) return;
    openDetails(entry); setPlanning(true);
    const start = minuteOf(entry.time), end = minuteOf(entry.endTime);
    moveEntry(entry, nextDate, nextMinute === undefined ? entry.time ?? "" : timeOf(nextMinute), start !== null && end !== null && end > start ? String(end - start) : "");
  };
  const setPresence = async (entry: CalendarEntry) => {
    if (!owner || !isActiveOwner(owner)) return;
    const value = !entry.requiresParent;
    const matches = (allDays[entry.date] ?? []).filter(e => isFamilyEntry(e) && (e.id === entry.id || e.source === entry.source && e.title === entry.title && e.time === entry.time && e.endTime === entry.endTime && e.familyMembers?.some(m => entry.familyMembers?.some(n => n.id === m.id))));
    try {
      for (const e of matches) {
        const original = e.source === "child" ? originalChildItems.find(i => i.id === e.sourceId && i.owner_id === owner) : undefined;
        if (original) {
          const decoded = decodeVisualNotes(original.notes);
          await updateChildItem(original.id, { notes: encodeVisualNotes({ ...decoded.meta, parentPresence: value }, decoded.note) });
          setFamilyPreferences(prev => { const presence = { ...prev.presence }; delete presence[e.id]; return { ...prev, presence }; });
        } else setFamilyPreferences(prev => ({ ...prev, presence: { ...prev.presence, [e.id]: value } }));
      }
      if (isActiveOwner(owner)) setDetails({ ...entry, requiresParent: value });
    } catch { toast.error(t("Kunde inte spara närvaromarkeringen.")); }
  };
  const dateHeading = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric" });
  const blockButton = (entry: CalendarEntry, compact = false) => <Button type="button" variant="ghost" draggable={entry.editable && !entry.recurring} onDragStart={event => {
    if (!window.matchMedia("(pointer:fine)").matches) { event.preventDefault(); return; }
    event.dataTransfer.setData("application/myflove-calendar", entry.id); event.dataTransfer.effectAllowed = "move";
  }} onClick={() => openDetails(entry)} data-family-entry={isFamilyEntry(entry) ? (entry.requiresParent ? "presence" : "context") : undefined} data-calendar-area={calendarArea(entry)} className={cn("pace-calendar-entry h-full min-h-11 w-full items-start justify-start gap-1.5 overflow-hidden whitespace-normal rounded-xl border border-l-[3px] calendar-area-surface px-2 py-1.5 text-left font-normal text-foreground", isFamilyEntry(entry) && "border-lavender/60 bg-secondary/35 text-muted-foreground shadow-none", isFamilyEntry(entry) && entry.requiresParent && "border-primary/35 bg-lavender/35", entry.done && !isFamilyEntry(entry) && "opacity-65")} aria-label={`${entry.title}, ${entry.time ?? t("Ingen tid ännu")}${entry.endTime ? `–${entry.endTime}` : ""}${entry.label ? `, ${entry.label}` : ""}, ${t(calendarAreaLabel(calendarArea(entry)))}`}>
    <EntryIcon entry={entry} size={compact ? 14 : 18} />
    <span className="min-w-0 flex-1"><span className={cn("pace-type-activity block text-xs font-semibold leading-snug", isFamilyEntry(entry) ? "line-clamp-2 break-words" : "truncate", !compact && "text-sm", entry.done && "line-through")}>{isFamilyEntry(entry) && entry.label ? `${entry.label} · ` : ""}{entry.title}</span>{entry.requiresParent && <span className="flex items-center gap-1 text-[10px] font-semibold text-primary"><UserRound size={11} />{t("Behöver mig")}</span>}<span className="pace-type-time block text-[11px] leading-snug text-muted-foreground">{entry.time}{entry.endTime && `–${entry.endTime}`}</span>{!compact && !entry.time && <span className="block truncate text-[11px] text-muted-foreground">{t(calendarAreaLabel(calendarArea(entry)))}{entry.label && ` · ${t(entry.label)}`}</span>}</span>
    {entry.done && !isFamilyEntry(entry) && <Check size={14} className="shrink-0" aria-hidden />}
  </Button>;
  const timeline = (day: string, dayItems: CalendarEntry[], compact: boolean) => {
    const familyBlocks = layoutCalendar(dayItems.filter(isFamilyEntry));
    const blocks = layoutCalendar(dayItems.filter(e => !isFamilyEntry(e)));
    const familyContextGroups = calendarClusters(familyBlocks);
    const periodBlocks = view === "vecka" ? layoutCalendar(Object.values(days).flat()) : blocks;
    const starts = [...periodBlocks, ...familyBlocks].map(b => b.start), ends = [...periodBlocks, ...familyBlocks].map(b => b.end);
    const first = Math.floor(Math.min(480, ...starts) / 60) * 60;
    const last = Math.min(1440, Math.ceil(Math.max(1080, ...ends) / 60) * 60);
    const height = (last - first) * 1.7;
    return <div className="pace-calendar-timeline relative ml-12 border-l border-border" style={{ height }} onDragOver={e => e.preventDefault()} onDrop={e => {
      const rect = e.currentTarget.getBoundingClientRect(); const minute = Math.round((first + (e.clientY - rect.top) / 1.7) / 15) * 15; drop(e, day, Math.max(first, Math.min(last - 15, minute)));
    }}>
      {Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60).map(m => <div key={m} className="pointer-events-none absolute left-0 right-0 border-t border-border/45" style={{ top: (m - first) * 1.7 }}><span className="pace-type-time absolute -left-12 -top-2 w-10 text-right text-[11px] text-muted-foreground">{m === 1440 ? "24:00" : timeOf(m)}</span></div>)}
      {!compact && calendarGaps(planningDays[day] ?? []).map(gap => <div key={gap.start} className={cn("absolute left-2 flex items-center", familyBlocks.length ? "right-[36%]" : "right-1", "gap-2 rounded-xl border border-dashed border-sage/35 bg-mint/40 px-3 text-xs text-foreground")} data-gap="true" style={{ top: (gap.start - first) * 1.7 + 2, height: Math.max(30, gap.minutes * 1.7 - 6) }}><Leaf size={15} aria-hidden />{gap.minutes} {t("min luft")}</div>)}
      {familyContextGroups.map(group => <div key={`family-${group.start}`} className="absolute right-0 w-[34%] pl-1" style={{ top: (group.start - first) * 1.7, height: Math.max(64, (group.end - group.start) * 1.7 - 4) }}>
        {group.blocks.length > 1 ? <Button variant="ghost" data-family-entry={group.blocks.some(b => b.item.requiresParent) ? "presence" : "context"} className="h-full min-h-11 w-full flex-col items-start justify-start overflow-hidden whitespace-normal rounded-xl border border-lavender/50 bg-secondary/35 px-1 py-2 text-left text-[10px] text-muted-foreground" onClick={() => setCluster(group.blocks.map(b => b.item))}><Users size={14} /><span className="line-clamp-3 break-words">{group.blocks.length} {t("i familjen")}</span>{group.blocks.some(b => b.item.requiresParent) && <span className="text-primary">{t("Behöver mig")}</span>}</Button> : group.blocks.map(b => <div className="h-full" key={b.item.id}>{blockButton(b.item, true)}</div>)}
      </div>)}
      <div className={cn("absolute inset-y-0 left-0", familyBlocks.length ? "w-[66%]" : "w-full")}>
      {calendarClusters(blocks).map(group => group.blocks.some(b => b.lanes > (compact ? 1 : 2)) ? <div key={group.blocks[0]?.item.id} className="absolute left-1 right-1" style={{ top: (group.start - first) * 1.7, height: Math.max(50, (group.end - group.start) * 1.7 - 4) }}><Button variant="secondary" className="h-full w-full min-w-0 items-start justify-start rounded-xl border border-border px-2 text-xs" onClick={() => setCluster(group.blocks.map(b => b.item))}><CalendarDays size={14} /><span className="truncate"><span className="pace-type-time">{timeOf(group.start)}</span> · {group.blocks.length} {t("aktiviteter")}</span></Button></div> : group.blocks.map(block => <div key={block.item.id} className="absolute pl-1 pr-1" style={entryStyle(block.start, block.end, block.lane, block.lanes, first)}>{blockButton(block.item, compact)}</div>))}
      </div>
      {day === today && now !== null && now >= first && now <= last && <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-accent" style={{ top: (now - first) * 1.7 }}><span className="absolute -left-11 -top-3 rounded-full bg-accent px-1.5 py-1 text-[10px] font-semibold text-accent-foreground">{t("NU")}</span></div>}
    </div>;
  };
  const balance = <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" aria-label={t("Dagens balans")}>
    <h2 className="font-display text-sm font-bold">{t(date === today ? "Din kapacitet idag" : "Dagens planering")}</h2>
    {date <= today && dayCap.percent !== null && <button type="button" onClick={() => setCapInfo(date)} className="mt-3 block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t("Kapacitet")}: ${dayCap.percent} %. ${t("Visa vad den bygger på")}`}>
      <span className="block text-xs text-muted-foreground">{t("Kapacitet")}</span>
      <CapacityBattery percent={dayCap.percent} size="lg" className="mt-1 w-full" />
    </button>}
    {date === today && dayCap.percent === null && <p className="mt-3 text-sm text-muted-foreground">{t("Hur börjar du dagen? Checka in när du vill.")}</p>}
    <div className="mt-3 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Planerad belastning")}</p><p className="mt-0.5 text-sm font-semibold">{t(load.label)}</p></div><Segments entries={planningEntries} /></div>
    <div className="mt-3 flex gap-2 rounded-2xl bg-lavender/50 p-3 text-xs leading-relaxed"><Heart size={15} className="shrink-0 text-primary" aria-hidden /><span>{t(!entries.length ? "Inget planerat än. Du behöver inte fylla dagen bara för att det finns plats." : load.segments >= 3 ? "Det ser ut som en ganska full dag. Vill du se om vi kan skapa lite mer luft?" : gaps.length ? "Det finns lite luft mellan aktiviteterna." : "En sak i taget, i din takt.")}</span></div>
    {load.unknown > 0 && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer py-2">{t("Om uppskattningen")}</summary><p>{load.unknown} {t("poster saknar uppskattad energipåverkan. Belastningen är ett stöd, inte ett mått på hur du mår.")}</p></details>}
  </section>;
  const todo = <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><details open><summary className="cursor-pointer py-1 font-display text-sm font-bold">{t("Att få gjort idag")} <span className="text-muted-foreground">{untimed.filter(e => !e.done).length}</span></summary><ul className="mt-3 space-y-2">{untimed.map(entry => <li key={entry.id} className="flex min-w-0 items-center gap-1"><div className="min-w-0 flex-1">{blockButton(entry)}</div></li>)}</ul>{untimed.length === 0 && <p className="mt-3 text-xs text-muted-foreground">{t("Inga oschemalagda saker den här dagen.")}</p>}</details></section>;
  const energyFields = <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("Hur brukar det påverka din energi?")}</legend><div className="grid grid-cols-2 gap-2">{IMPACTS.map(option => <Button key={option.value} variant="outline" type="button" aria-pressed={impact === option.value} className={cn("min-h-11 justify-start rounded-xl text-xs", impact === option.value && "border-primary bg-lavender/60")} onClick={() => setImpact(option.value)}><option.icon size={16} />{t(option.label)}</Button>)}</div></fieldset>;
  const scheduleFields = <><div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm">{t("Datum")}<Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 min-h-11" /></label><label className="min-w-0 text-sm">{t("Tid")}<Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 min-h-11" /></label></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setEditDate(today)}>{t("Idag")}</Button><Button variant="ghost" size="sm" onClick={() => setEditDate(shiftDate(today, 1))}>{t("Imorgon")}</Button><Button variant="ghost" size="sm" onClick={() => { setTime(""); setLength(""); }}>{t("Ingen tid ännu")}</Button></div>{time && <label className="block text-sm">{t("Hur lång tid ungefär?")}<div className="mt-2 flex flex-wrap gap-1">{[15, 30, 45, 60].map(n => <Button key={n} size="sm" variant={length === String(n) ? "default" : "outline"} onClick={() => setLength(String(n))}>{n} {t("min")}</Button>)}</div><Input type="number" min="1" max="1439" value={length} onChange={e => setLength(e.target.value)} placeholder={t("Längd i minuter (valfritt)")} className="mt-2 min-h-11" /></label>}</>;
  const calendarTools = <div className="flex flex-wrap items-center gap-1 text-xs" aria-label={t("Kalenderverktyg")}>
      <Button variant="ghost" size="sm" className="pace-compact-control px-2 text-xs text-muted-foreground hover:text-ink" onClick={() => setUtility("connection")}><Link2 size={16} aria-hidden />{t("Kalenderkoppling")}</Button>
      <Button variant="ghost" size="sm" className="pace-compact-control px-2 text-xs text-muted-foreground hover:text-ink" onClick={() => setUtility("day")}><MoreHorizontal size={16} aria-hidden />{t("Dagens verktyg")}</Button>
    </div>;
  return <div className={cn("pace-next-page pace-calendar-desktop mx-auto max-w-6xl space-y-4", textLayout.enlarged && "pace-text-enlarged")} data-testid="visual-calendar">
    <span ref={textLayout.ref} className="pace-text-probe" aria-hidden="true" />
    <div className="pace-calendar-heading">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h1 className="pace-next-title min-w-0 font-sans text-2xl font-semibold text-ink">{t("Kalender")}</h1><Button onClick={openAdd} className="pace-compact-control pace-compact-primary shrink-0"><Plus size={16} />{t("Lägg till")}</Button></header>
    <div role="group" aria-label={t("Kalendervy")} className="grid grid-cols-3 rounded-2xl border border-border/60 bg-secondary/60 p-1">{([ ["manad", "Månad"], ["vecka", "Vecka"], ["dag", "Dag"] ] as const).map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setView(id)} aria-pressed={view === id} className={cn("pace-compact-control", view === id ? "pace-compact-selected font-semibold" : "text-muted-foreground")}>{t(label)}</Button>)}</div>
    </div>
    <div className="pace-calendar-capacity">
    {view !== "dag" && (todayCap.percent === null ? <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><p className="font-display text-sm font-bold">{t("Hur börjar du dagen?")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Checka in när du vill för att se dagens kapacitet.")}</p></section> : <button type="button" onClick={() => setCapInfo(today)} className="flex w-full items-center gap-4 rounded-3xl border border-border/60 bg-card p-4 text-left shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t("Din kapacitet idag")}: ${todayCap.percent} %. ${t("Visa vad den bygger på")}`}><span className="min-w-0 flex-1"><span className="flex items-center gap-1 font-display text-sm font-bold">{t("Din kapacitet idag")}<CircleHelp size={14} className="text-muted-foreground" aria-hidden /></span><CapacityBattery percent={todayCap.percent} size="lg" className="mt-2 w-full" /><span className="mt-2 block text-xs text-muted-foreground">{t("Utifrån din egen incheckning idag.")}</span></span><ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden /></button>)}
    </div>
    <div className="pace-calendar-period grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Föregående period")} onClick={() => step(-1)}><ChevronLeft size={18} /></Button><div className="min-w-0 text-center"><p className="break-words font-display text-sm font-bold capitalize">{view === "vecka" ? `${dateHeading(dates[0] ?? date)} – ${dateHeading(dates[6] ?? date)}` : period}</p><Button variant="ghost" size="sm" onClick={() => setDate(today)} className="min-h-11 text-xs text-primary">{t("Idag")}</Button></div><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Nästa period")} onClick={() => step(1)}><ChevronRight size={18} /></Button></div>
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-y border-border/50 py-1" aria-label={t("Visningsval")}>
      <Button variant="ghost" className="pace-compact-control px-2 text-xs font-medium text-ink" onClick={() => setFamilySettings(true)}><Users size={16} className="text-primary" />{t("Familj")}</Button>
      <span className="h-4 w-px bg-border" aria-hidden />
      <details className="min-w-0 flex-1 px-2">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium"><SlidersHorizontal size={16} className="text-primary" aria-hidden />{t("Visa i kalendern")}<span className="ml-auto text-muted-foreground">{visible.filter(v => ["privat", "jobb", "studier"].includes(v)).length}/3</span></summary>
        <div className="flex flex-wrap gap-2 pb-3" role="group" aria-label={t("Visa kategorier")}>{[["privat", "Privat"], ["jobb", "Jobb"], ["studier", "Studier"]].map(([id, label]) => <Button key={id} size="sm" variant="outline" className={cn("pace-compact-control", visible.includes(id ?? "") && "pace-compact-selected")} aria-pressed={visible.includes(id ?? "")} onClick={() => setVisible(prev => prev.includes(id ?? "") ? prev.filter(x => x !== id) : [...prev, id ?? "privat"])}>{t(label ?? "")}</Button>)}</div>
      </details>
    </div>
    {desktopLayout && !textLayout.enlarged && calendarTools}
    <ul aria-label={t("Områdesfärger")} className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{(view === "manad" ? calendarMonthAreas(Object.values(days).flat()) : [...new Set(Object.values(days).flat().map(calendarArea))]).map(area => <li key={area} data-calendar-area={area} className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(area))}</li>)}</ul>
    {!desktopLayout && view !== "dag" && date === today && checkin}
    {externalError && <p role="status" className="text-sm text-muted-foreground">{t("Den externa kalendern kunde inte hämtas just nu. Dina egna poster finns kvar.")}</p>}
    {view === "manad" && <><div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t("Månadskalender")}>
      {dates.slice(0, 7).map(d => <span key={`heading-${d}`} className="py-1 text-center text-[11px] text-muted-foreground">{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}</span>)}
      {dates.map(d => {
        const areaEntries = days[d] ?? [];
        const areas = calendarMonthAreas(areaEntries);
        const recordedCapacity = calendarMonthCapacity(d, today, capacityOf(d).percent);
        const adjacent = d.slice(0, 7) !== date.slice(0, 7);
        const areaDescription = `${areas.length} ${t("områden har planerat innehåll denna dag")}${areas.length ? `: ${areas.map(a => t(calendarAreaLabel(a))).join(", ")}` : ""}`;
        return <Button key={d} data-month-date={d} variant="ghost" onClick={() => setDate(d)} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, d)} aria-current={d === today ? "date" : undefined} aria-pressed={d === date} aria-label={`${new Date(`${d}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long" })}, ${areaDescription}${recordedCapacity !== null ? `, ${t("Kapacitet")} ${recordedCapacity} %` : ""}`} title={areaDescription} className={cn("relative flex h-24 min-w-0 flex-col justify-start gap-2 rounded-xl border border-border/50 bg-card/60 px-0.5 py-2 text-xs sm:h-28 sm:px-2", adjacent && "opacity-50", d === today && "border-ink border-2", d === date && "pace-selected-day")}>
          <span className="font-semibold">{Number(d.slice(-2))}</span>
          {recordedCapacity !== null && <span data-month-capacity className={cn("flex items-center gap-0.5 whitespace-nowrap text-[9px] tabular-nums sm:text-[10px]", d === today ? "font-semibold text-primary" : "text-muted-foreground")}><Battery size={12} aria-hidden /><span>{recordedCapacity}%</span></span>}
          {areas.length > 0 && <span className="mt-auto flex h-3 items-center justify-center gap-0.5" aria-hidden>{areas.slice(0, 4).map(area => <span key={area} data-calendar-area={area} className="h-1.5 w-1.5 shrink-0 rounded-full calendar-area-dot" />)}{areas.length > 4 && <span className="text-[9px] text-muted-foreground">+{areas.length - 4}</span>}</span>}
        </Button>;
      })}</div><section className="border-t border-border/60 py-4"><div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</h2><Button size="icon" variant="ghost" className="min-h-11 min-w-11 text-primary" aria-label={t("Öppna dagen")} onClick={() => setView("dag")}><ArrowRight size={18} /></Button></div><h3 className="mt-3 text-xs font-semibold">{t("Min dag")}</h3><ul className="mt-2 flex flex-wrap gap-x-5 gap-y-3">{calendarMonthAreas(myEntries).map(area => <li key={area} data-calendar-area={area} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(area))} · {myEntries.filter(e => calendarArea(e) === area).length}</li>)}</ul>{!myEntries.length && <p className="py-4 text-sm text-muted-foreground">{t("Inget planerat än. Du behöver inte fylla dagen bara för att det finns plats.")}</p>}{familyEntries.length > 0 && <div className="mt-4 border-t border-border/60 pt-3"><h3 className="text-xs font-semibold text-muted-foreground">{t("Familjen")}</h3><p data-calendar-area="privat" className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full calendar-area-dot" aria-hidden />{t("Familj")} · {familyEntries.length}</p></div>}</section></>}
    {view === "vecka" && <div className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl border border-border/60 bg-card p-2 shadow-soft motion-reduce:snap-none" role="group" aria-label={t("Veckovy, svep för fler dagar")} tabIndex={0}><div className="flex gap-2">{dates.map(d => <div key={d} className="w-[calc(100%-1rem)] min-w-0 shrink-0 snap-start min-[420px]:w-[calc(50%-0.25rem)] min-[640px]:w-[calc(33.333%-0.35rem)] lg:w-[272px]"><Button variant="ghost" onClick={() => { setDate(d); setView("dag"); }} className={cn("sticky top-0 z-20 mb-2 h-auto min-h-16 w-full flex-col rounded-xl bg-card", d === today && "border border-primary", d === date && "bg-lavender")}><span className="text-xs">{dateHeading(d)}</span>{d <= today && capacityOf(d).percent !== null && <CapacityBattery percent={capacityOf(d).percent} size="sm" />}<Segments entries={days[d] ?? []} /></Button>{timeline(d, days[d] ?? [], true)}{(days[d] ?? []).filter(e => !e.time).map(e => <div className="mt-2" key={e.id}>{blockButton(e, true)}</div>)}</div>)}</div></div>}
    {view === "dag" && <><div className="pace-calendar-day grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 space-y-4">{balance}{!desktopLayout && date === today && checkin}{date === today && plan.now && <div className="grid grid-cols-2 gap-3 rounded-2xl bg-lavender/40 p-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Just nu")}</p><p className="mt-1 break-words text-sm font-semibold">{plan.now.item.title}</p></div>{plan.next && <div className="min-w-0"><p className="text-xs text-muted-foreground">{t("Härnäst")}</p><p className="mt-1 break-words text-sm">{plan.next.item.title}</p></div>}</div>}{timed.length > 0 ? <section aria-label={t("Dagens tidslinje")} className="rounded-3xl border border-border/60 bg-card px-3 py-6 shadow-soft">{timeline(date, timed, false)}</section> : <div className="py-6 text-center text-sm text-muted-foreground"><Leaf className="mx-auto mb-2 text-primary" size={24} />{t("Ingen tid bokad. Det får finnas luft.")}</div>}<div className="lg:hidden">{todo}</div></div><aside className="space-y-4"><div className="hidden lg:block">{todo}</div>{intensive && dismissed !== date && <section className="rounded-3xl border border-primary/20 bg-lavender/60 p-4"><div className="flex items-center gap-3"><FlowMascot size="xs" alive={false} /><p className="text-sm">{t(flowDaySupport(planningEntries, dayCap.percent).message)}</p></div><Button className="mt-3 w-full rounded-2xl" onClick={() => setSuggestions(true)}>{t("Hitta plats")}</Button><Button variant="ghost" className="mt-1 w-full" onClick={() => setDismissed(date)}>{t("Inte nu")}</Button></section>}</aside></div></>}
    {view === "dag" && familyEntries.some(e => !e.time) && <details className="py-2"><summary className="min-h-11 cursor-pointer text-sm text-muted-foreground">{t("Familjen · utan tid")}</summary><ul className="space-y-2">{familyEntries.filter(e => !e.time).map(e => <li key={e.id}>{blockButton(e, true)}</li>)}</ul></details>}
    {familyPreferences.mode === "overview" && <section aria-label={t("Familjeöversikt")} className="space-y-3 border-t border-border pt-4"><h2 className="font-display font-bold">{t("Familjeöversikt")}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{ id: "me", name: t("Min dag") }, ...familyMembers.filter(m => familyPreferences.children === null || familyPreferences.children.includes(m.id))].map(member => { const memberEntries = Object.values(days).flat().filter(e => member.id === "me" ? !isFamilyEntry(e) : e.familyMembers?.some(m => m.id === member.id)); return <section key={member.id} className="min-w-0"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><UserRound size={16} className="text-primary" />{member.name}</h3><ul className="space-y-2">{memberEntries.map(e => <li key={`${e.date}-${e.id}`}><span className="text-[10px] text-muted-foreground">{dateHeading(e.date)}</span>{blockButton(e, true)}</li>)}</ul>{!memberEntries.length && <p className="text-xs text-muted-foreground">{t("Inget planerat i perioden.")}</p>}</section>; })}</div></section>}
    <FamilyLayerSettings open={familySettings} onOpenChange={setFamilySettings} preferences={familyPreferences} onChange={setFamilyPreferences} members={familyMembers} />
    <Dialog open={familyConfirm !== null} onOpenChange={open => { if (!open) setFamilyConfirm(null); }}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Familjen runt den här tiden")}</DialogTitle><DialogDescription>{t("Vill du ändå planera aktiviteten här?")}</DialogDescription></DialogHeader><ul className="space-y-2">{familyConfirm?.entries.map(e => <li key={e.id} className="rounded-xl bg-secondary/40 p-3 text-sm"><p className="font-semibold">{e.label} · {e.title} · {e.time}{e.endTime && `–${e.endTime}`}</p><p className="mt-1 text-xs text-muted-foreground">{t(e.requiresParent ? "Behöver mig – din närvaro är markerad." : "Familjekontext – inte markerad som att barnet behöver dig. Tiden är inte automatiskt upptagen.")}</p></li>)}</ul><Button onClick={() => { const action = familyConfirm?.action; setFamilyConfirm(null); action?.(); }}>{t("Ja, planera här")}</Button><Button variant="outline" onClick={() => { if (!familyConfirm) return; setFamilyAlternatives({ day: familyConfirm.day, duration: familyConfirm.duration }); setFamilyConfirm(null); }}>{t("Hitta annan tid")}</Button></DialogContent></Dialog>
    <Dialog open={familyAlternatives !== null} onOpenChange={open => { if (!open) setFamilyAlternatives(null); }}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t("Hitta annan tid")}</DialogTitle><DialogDescription>{t("Inget flyttas automatiskt.")}</DialogDescription></DialogHeader>{familyAlternatives && calendarGaps(planningDays[familyAlternatives.day] ?? []).filter(g => familyAlternatives.duration > 0 && g.minutes >= familyAlternatives.duration).slice(0, 3).map(g => <Button key={g.start} variant="outline" onClick={() => { setTime(timeOf(g.start)); setFamilyAlternatives(null); }}>{timeOf(g.start)}–{timeOf(g.end)}</Button>)}<p className="text-xs text-muted-foreground">{t("Bara luckor med kända sluttider visas. Du kan alltid välja en annan tid själv.")}</p><Button variant="ghost" onClick={() => setFamilyAlternatives(null)}>{t("Välj tid själv")}</Button></DialogContent></Dialog>
    {desktopLayout && date === today && <div className="pace-calendar-secondary">{checkin}</div>}
    <section aria-label={t("Veckans mål")} className="min-w-0">{weekGoals}</section>
    {(!desktopLayout || textLayout.enlarged) && calendarTools}
    <Dialog open={utility !== null} onOpenChange={open => { if (!open) setUtility(null); }}>
      <DialogContent className={cn("pace-next-page max-h-[88dvh] overflow-y-auto rounded-3xl", utility === "day" ? "pace-calendar-day-tools sm:max-w-md" : "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{t(utility === "connection" ? "Kalenderkoppling" : "Dagens verktyg")}</DialogTitle>
          <DialogDescription>{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</DialogDescription>
        </DialogHeader>
        {utility === "connection" ? connection : tools}
      </DialogContent>
    </Dialog>
    <Dialog open={cluster.length > 0} onOpenChange={open => { if (!open) setCluster([]); }}><DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Aktiviteter vid samma tid")}</DialogTitle><DialogDescription>{date}</DialogDescription></DialogHeader><ul className="space-y-2">{cluster.map(e => <li key={e.id} onClick={() => setCluster([])}>{blockButton(e)}</li>)}</ul></DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Vad vill du lägga till?")}</DialogTitle><DialogDescription>{t("En sak i taget, i din takt.")}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-2">{[["task", "Uppgift"], ["activity", "Aktivitet"], ["reminder", "Påminnelse"], ["recovery", "Återhämtning"]].map(([value, label]) => <Button key={value} variant={kind === value ? "default" : "outline"} onClick={() => { setKind(value ?? "task"); if (value === "recovery") setImpact("gives"); }}>{t(label ?? "")}</Button>)}</div><label className="block text-sm">{t("Namn")}<Input className="mt-1 min-h-11" value={title} onChange={e => setTitle(e.target.value)} maxLength={240} /></label>{scheduleFields}{energyFields}{time && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />{t("Påminn mig vid start")}</label>}<Button className="w-full min-h-11 rounded-2xl" disabled={!title.trim() || !editDate} onClick={() => saveNew()}><Plus size={16} />{t("Lägg till")}</Button></div></DialogContent></Dialog>
    <Dialog open={!!details} onOpenChange={open => { if (!open) setDetails(null); }}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle className="break-words">{details?.title}</DialogTitle><DialogDescription>{details?.date} {details?.time}{details?.endTime && `–${details.endTime}`} {details?.label}</DialogDescription></DialogHeader>{details && <div className="space-y-4"><p data-calendar-area={calendarArea(details)} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(calendarArea(details)))}</p>{isFamilyEntry(details) && <div className="space-y-2 rounded-2xl bg-secondary/35 p-3"><p className="text-xs text-muted-foreground">{t("Familjekontext, inte en egen uppgift.")}</p><Button variant="outline" aria-pressed={details.requiresParent === true} className="min-h-11 w-full" onClick={() => void setPresence(details)}><UserRound size={16} />{t(details.requiresParent ? "Behöver mig" : "Markera: Behöver mig")}</Button></div>}{planning ? <>{scheduleFields}{energyFields}<Button className="w-full min-h-11" onClick={() => moveEntry(details, editDate, time, length, impact)}>{t("Spara")}</Button></> : <>{details.editable && !details.recurring && <Button variant="outline" className="min-h-11 w-full" onClick={() => setPlanning(true)}><Clock size={16} />{t("Planera tid")}</Button>}{details.editable && !details.recurring && details.time && <Button variant="ghost" className="min-h-11 w-full" onClick={() => moveEntry(details, details.date, "", "")}>{t("Ta bort tid")}</Button>}{details.editable && (details.source === "task" || details.source === "reminder") && <div className="flex items-center justify-between gap-2">{(() => { const match = flowItems.find(i => i.id === details.id); return match?.completable ? <Button variant="outline" className="min-h-11" onClick={() => { toggleItem(match); setDetails(null); }}><Check size={16} />{t(match.done ? "Ångra klart" : "Markera klar")}</Button> : null; })()}<FlowItemActions itemId={details.id} /></div>}{details.href && <Button asChild variant="outline" className="min-h-11 w-full"><Link href={details.href}>{t("Öppna där aktiviteten hör hemma")}<ArrowRight size={16} /></Link></Button>}</>}</div>}</DialogContent></Dialog>
    <Dialog open={!!capInfo} onOpenChange={open => { if (!open) setCapInfo(null); }}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t(capInfo === today ? "Din kapacitet idag" : "Kapacitet")}</DialogTitle><DialogDescription>{capInfo}</DialogDescription></DialogHeader>{infoCap && <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"><span>{t("Din morgonincheckning")}</span><span className="font-semibold tabular-nums">{infoCap.morning == null ? "–" : `${infoCap.morning} %`}</span></div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"><span>{t("Registrerad energi")}</span><span className="font-semibold tabular-nums">{infoCap.reportedLevel == null ? "–" : `${infoCap.reportedLevel}/5`}</span></div>
      {infoCap.percent !== null && <div className="rounded-2xl bg-lavender/50 p-3"><p className="text-xs text-muted-foreground">{t("Din uppskattade kapacitet")}</p><CapacityBattery percent={infoCap.percent} size="md" className="mt-1" /></div>}
      <p className="text-xs leading-relaxed text-muted-foreground">{t(infoCap.percent == null ? "Vi har ingen egen incheckning för den här dagen. Paceable gissar inte – checka in din energi när du vill." : "Kapaciteten bygger på din egen incheckning. Att flytta eller ta bort aktiviteter ändrar planerad belastning, inte din kapacitet.")}</p>
    </div>}</DialogContent></Dialog>
    <Dialog open={suggestions} onOpenChange={setSuggestions}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t("Lite mer luft")}</DialogTitle><DialogDescription>{t("Inget ändras förrän du själv väljer.")}</DialogDescription></DialogHeader>{gaps.filter(g => g.minutes >= 20).slice(0, 3).map(g => <Button key={g.start} variant="outline" className="h-auto min-h-14 justify-start whitespace-normal rounded-2xl text-left" onClick={() => { setSuggestions(false); setEditDate(date); setTime(timeOf(g.start)); setLength("20"); setTitle(t("Återhämtning")); setKind("recovery"); setImpact("gives"); setNotify(false); setAdding(true); }}><Leaf size={18} />{t("Lägg 20 min återhämtning")} · {timeOf(g.start)}</Button>)}{!gaps.length && <p className="text-sm text-muted-foreground">{t("Jag ser ingen säker lucka med kända sluttider. Du kan själv ändra en aktivitet eller planera återhämtning.")}</p>}</DialogContent></Dialog>
  </div>;
}

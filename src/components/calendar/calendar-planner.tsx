import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Link as PlanningLink } from "@tanstack/react-router";
import { useUser } from "@clerk/react";
import { toast } from "sonner";
import { ArrowLeftRight, ArrowRight, Battery, BookOpen, CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, CircleHelp, Clock, Heart, Leaf, MoreHorizontal, NotebookPen, SlidersHorizontal, Link2, Pill, Plus, Repeat, UserRound, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlowItemActions } from "@/components/flow-item-actions";
import { DayReplanButton } from "@/components/day/day-replan";
import DaySupportActions from "@/components/day/day-support-actions";
import { useChildren } from "@/hooks/use-children";
import { activityPresetForTitle, decodeVisualNotes, encodeVisualNotes } from "@/lib/child-visual-schedule";
import { useTasks, useReminders, type Task } from "@/hooks/use-data";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useTextLayout } from "@/hooks/use-text-layout";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useLang } from "@/hooks/use-language";
import { buildFlowPlan } from "@/lib/flow-plan";
import { calendarClusters, calendarDate, calendarGaps, calendarLoad, calendarTimelineRange, layoutCalendar, minuteOf, periodDates, shiftDate, timeOf, isFamilyEntry, type CalendarEntry, type CalendarView } from "@/lib/visual-calendar";
import { cn } from "@/lib/utils";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";
import { suggestActivityArea } from "@/lib/smart-area-suggestions";
import { calendarArea, calendarAreaLabel, calendarMonthAreas, calendarMonthCapacity } from "@/lib/calendar-area";
import { getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isActiveOwner } from "@/lib/account-scope";

import { MulberryPictogram, MulberryAttribution } from "@/components/calendar/mulberry-pictogram";
import { mulberryForTitle } from "@/lib/mulberry-symbols";
import { Images } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { flowDaySupport } from "@/lib/flow-day-support";
import { ChildScheduleRecipients } from "@/components/family/child-schedule-recipients";
import { addToChildSchedules } from "@/lib/add-child-schedule";
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

export default function CalendarPlanner({ tools, weekGoals, checkin, connection, onDateChange, initialView = "dag", showPictograms = false, onPictogramsChange }: {
  initialView?: CalendarView;
  showPictograms?: boolean;
  onPictogramsChange?: (enabled: boolean) => void;
  tools: ReactNode;
  weekGoals: ReactNode;
  checkin: ReactNode;
  connection: ReactNode;
  onDateChange: (date: string) => void;
}) {
  const { t, locale } = useLang();
  const [, navigate] = useLocation();
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
  const [view, setView] = useState<CalendarView>(initialView);
  const [fullDay, setFullDay] = useState(false);
  useEffect(() => { setView(initialView); }, [initialView]);
  useEffect(() => { onDateChange(date); }, [date, onDateChange]);
  const dates = useMemo(() => periodDates(date, view), [date, view]);
  const { days: allDays, familyMembers, externalError, planningReady, planningError } = useVisualCalendar(dates);
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
  const monthStats = view === "manad" ? (() => {
    const monthDates = dates.filter(d => d.slice(0, 7) === date.slice(0, 7));
    const counts = monthDates.map(d => (planningDays[d] ?? []).length);
    const total = counts.reduce((a, b) => a + b, 0);
    const active = counts.filter(n => n > 0).length;
    return { total, active, empty: monthDates.length - active };
  })() : null;
  const selectedDayList = [...myEntries.filter(e => e.time && !e.periodEnd).sort((a, b) => (minuteOf(a.time) ?? 0) - (minuteOf(b.time) ?? 0)), ...myEntries.filter(e => !e.time)];
  const [familyConfirm, setFamilyConfirm] = useState<{ entries: CalendarEntry[]; action: () => void; duration: number; day: string } | null>(null);
  const [familyAlternatives, setFamilyAlternatives] = useState<{ day: string; duration: number } | null>(null);
  const { tasks, addTask, updateTask } = useTasks();
  const { reminders, addReminder, updateReminder } = useReminders();
  const { children, items: originalChildItems, updateItem: updateChildItem, addItem: addChildItem } = useChildren();
  const ownedChildren = (children ?? []).filter(child => child.owner_id === owner);
  const { today: flowItems, toggleItem } = useFlowItems(date);
  const capacity = useCapacityMode();
  const capacityOf = useDayCapacity();
  const todayCap = capacityOf(today);
  const dayCap = capacityOf(date);
  const [utility, setUtility] = useState<"day" | "connection" | null>(null);
  const [capInfo, setCapInfo] = useState<string | null>(null);
  const infoCap = capInfo ? capacityOf(capInfo) : null;
  const [details, setDetails] = useState<CalendarEntry | null>(null);
  const [quickSupport, setQuickSupport] = useState<{ taskId: string; mode: "prioritera" | "dela" | "planera" } | null>(null);
  const [cluster, setCluster] = useState<CalendarEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [dayEditorOpen, setDayEditorOpen] = useState(false);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [savingChildren, setSavingChildren] = useState(false);
  const savingChildrenRef = useRef(false);
  const liveOwner = useRef(owner);
  liveOwner.current = owner;
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [chosenArea, setChosenArea] = useState<LifeArea | null>(null);
  const proposedArea = suggestActivityArea(title);
  const newArea = chosenArea ?? proposedArea ?? "vardag";
  const [kind, setKind] = useState("task");
  const [editDate, setEditDate] = useState(date);
  const [periodEnd, setPeriodEnd] = useState("");
  const [childPeriod, setChildPeriod] = useState(false);
  const [time, setTime] = useState("");
  const [length, setLength] = useState("");
  const [impact, setImpact] = useState<Task["energyImpact"]>("unknown");
  const [notify, setNotify] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const tick = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); }; tick(); const timer = setInterval(tick, 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { setDetails(null); setCluster([]); setAdding(false); setPlanning(false); setSuggestions(false); setDismissed(null); setUtility(null); setFamilySettings(false); setFamilyConfirm(null); setFamilyAlternatives(null); setChildIds([]); setFullDay(false); }, [owner]);
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
  const openAdd = (forChildren = false, targetDate = date) => { setDayEditorOpen(false); setChildIds(forChildren && ownedChildren.length === 1 ? [ownedChildren[0]!.id] : []); setEditDate(targetDate); setPeriodEnd(""); setChildPeriod(false); setTitle(""); setNote(""); setTime(""); setLength(""); setImpact("unknown"); setKind(forChildren ? "child" : "task"); setNotify(false); setAdding(true); };
  const openDetails = (entry: CalendarEntry) => {
    setDetails(entry); setPlanning(false); setEditingMeta(false); setEditDate(entry.date); setTime(entry.time ?? "");
    const task = tasks.find(item => item.id === entry.sourceId);
    const reminder = reminders.find(item => item.id === entry.sourceId);
    setNote(task?.note ?? reminder?.note ?? ""); setPeriodEnd(reminder?.endDate ?? "");
    const start = minuteOf(entry.time), end = minuteOf(entry.endTime);
    setLength(start !== null && end !== null && end > start ? String(end - start) : "");
    setImpact(entry.energyImpact ?? "unknown");
  };
  const saveMetadata = (entry: CalendarEntry) => {
    if (!owner || !isActiveOwner(owner) || document.documentElement.dataset.calendarOwner !== owner || !entry.editable || entry.recurring) return;
    const cleanNote = note.trim();
    if (entry.source === "task") {
      const task = tasks.find(item => item.id === entry.sourceId);
      if (!task || task.syncKey) return;
      updateTask(entry.sourceId, { note: cleanNote });
    } else if (entry.source === "reminder") {
      const reminder = reminders.find(item => item.id === entry.sourceId);
      if (!reminder || reminder.repeat && reminder.repeat !== "none") return;
      if (periodEnd && periodEnd < reminder.date) { toast.error(t("Slutdatum får inte vara före startdatum.")); return; }
      updateReminder(entry.sourceId, { note: cleanNote, endDate: periodEnd || undefined });
    } else return;
    setEditingMeta(false); setDetails(null); toast.success(t("Ändringarna sparades"));
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
  const saveForChildren = async (endTime?: string) => {
    if (!owner || savingChildrenRef.current || !childIds.length) return;
    const canContinue = async () => mounted.current && liveOwner.current === owner && isActiveOwner(owner) && (await getSyncUser())?.id === owner;
    savingChildrenRef.current = true;
    setSavingChildren(true);
    try {
      const preset = activityPresetForTitle(title);
      const notes = encodeVisualNotes({ pictogram: preset?.pictogram ?? "calendar", category: preset?.category ?? "familj", tone: preset?.tone ?? "lavender", familyLabel: "child", ...(endTime ? { endTime } : {}), ...(childPeriod ? { repeatUntil: periodEnd } : {}), linkGroup: crypto.randomUUID() }, note.trim());
      const result = await addToChildSchedules({ owner, children: ownedChildren, selectedIds: childIds, items: originalChildItems, input: { title, date: editDate, time: childPeriod ? undefined : time || undefined, notes, ...(childPeriod ? { repeat: "daily" as const } : {}) }, addItem: addChildItem, canContinue });
      if (!await canContinue()) return;
      if (result.failed.length) {
        setChildIds(result.failed);
        toast.error(t("Några barn återstår."), { description: `${result.created.length + result.skipped.length} ${t("klara. Tryck Spara igen för de återstående barnen.")}` });
      } else {
        setAdding(false);
        toast.success(t("Tillagt i barnens schema"), { description: `${result.created.length} ${t("nya aktiviteter")}${result.skipped.length ? ` · ${result.skipped.length} ${t("fanns redan")}` : ""}` });
      }
    } catch { if (mounted.current && liveOwner.current === owner) toast.error(t("Kunde inte spara. Kontrollera aktiviteten och valda barn.")); }
    finally { savingChildrenRef.current = false; if (mounted.current) setSavingChildren(false); }
  };

  const saveNew = (confirmed = false) => {
    if (!title.trim() || !editDate || !owner || !isActiveOwner(owner) || document.documentElement.dataset.calendarOwner !== owner) return;
    if ((kind === "period" || kind === "child" && childPeriod) && (!periodEnd || periodEnd < editDate)) { toast.error(t("Välj ett slutdatum som inte är före startdatumet.")); return; }
    const start = minuteOf(time), duration = Number(length);
    if (time && start === null || length && (!Number.isFinite(duration) || duration <= 0 || (start ?? 0) + duration > 1439)) { toast.error(t("Kontrollera tid och längd.")); return; }
    const end = start !== null && duration > 0 ? timeOf(start + duration) : undefined;
    if (kind === "child") { void saveForChildren(end); return; }
    if (!confirmed && time && confirmFamily(editDate, time, end, duration || 0, () => saveNew(true))) return;
    const energy = kind === "recovery" ? "gives" : impact;
    if (kind === "period") addReminder(title.trim(), editDate, undefined, "none", undefined, undefined, [note.trim(), "Sammanhängande period – ingen automatiskt upptagen tid."].filter(Boolean).join("\n\n"), newArea, periodEnd, "unknown");
    else if (kind === "task") addTask(title.trim(), editDate, { time: time || undefined, endTime: end, energyImpact: energy, reminderMinutesBefore: notify && time ? 0 : undefined, note: note.trim() || undefined, area: newArea });
    else addReminder(title.trim(), editDate, time || undefined, "none", end, notify && time ? 0 : undefined, note.trim() || undefined, newArea, undefined, energy);
    setAdding(false); setChosenArea(null); toast.success(t("Tillagt i kalendern"), { description: kind === "recovery" ? t("Återhämtning får också ta plats i kalendern.") : undefined });
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
    const matches = (allDays[entry.date] ?? []).filter(e => isFamilyEntry(e) && (e.id === entry.id || e.source === entry.source && e.title === entry.title && e.time === entry.time && e.endTime === entry.endTime && e.location === entry.location && e.familyMembers?.some(m => entry.familyMembers?.some(n => n.id === m.id))));
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
  }} onClick={() => entry.recoveryAction ? navigate(entry.recoveryAction === "stopp" ? "/stop-paus" : `/aterhamtning?start=${entry.recoveryAction}`) : openDetails(entry)} data-family-entry={isFamilyEntry(entry) ? (entry.requiresParent ? "presence" : "context") : undefined} data-calendar-area={calendarArea(entry)} className={cn("pace-journal-calendar-entry pace-calendar-entry h-full min-h-11 w-full items-start justify-start gap-1.5 overflow-hidden whitespace-normal rounded-xl border border-l-[3px] calendar-area-surface px-2 py-1.5 text-left font-normal text-foreground", isFamilyEntry(entry) && "text-muted-foreground shadow-none", entry.done && !isFamilyEntry(entry) && "opacity-65")} aria-label={`${entry.title}, ${entry.time ?? t("Ingen tid ännu")}${entry.endTime ? `–${entry.endTime}` : ""}${entry.label ? `, ${entry.label}` : ""}, ${t(calendarAreaLabel(calendarArea(entry)))}`}>
    {showPictograms ? <MulberryPictogram id={entry.pictogram ?? mulberryForTitle(entry.title, entry.source === "study" ? "study" : "calendar")} className={compact ? "h-7 w-7" : "h-8 w-8"} /> : <EntryIcon entry={entry} size={compact ? 14 : 18} />}
    <span className="min-w-0 flex-1"><span className={cn("pace-type-activity block text-xs font-semibold leading-snug", isFamilyEntry(entry) ? "line-clamp-2 break-words" : "truncate", !compact && "text-sm", entry.done && "line-through")}>{isFamilyEntry(entry) && entry.label ? `${entry.label} · ` : ""}{entry.title}</span>{entry.requiresParent && <span className="flex items-center gap-1 text-[10px] font-semibold text-primary"><UserRound size={11} />{t("Behöver mig")}</span>}<span className="pace-type-time block text-[11px] leading-snug text-muted-foreground">{entry.time}{entry.endTime && `–${entry.endTime}`}</span>{!compact && !entry.time && <span className="block truncate text-[11px] text-muted-foreground">{t(calendarAreaLabel(calendarArea(entry)))}{entry.label && ` · ${t(entry.label)}`}</span>}</span>
    {entry.done && !isFamilyEntry(entry) && <Check size={14} className="shrink-0" aria-hidden />}
  </Button>;
  const timeline = (day: string, dayItems: CalendarEntry[], compact: boolean) => {
    const familyBlocks = layoutCalendar(dayItems.filter(isFamilyEntry));
    const blocks = layoutCalendar(dayItems.filter(e => !isFamilyEntry(e)));
    if (!fullDay && !blocks.length && !familyBlocks.length) return <p className="px-3 py-2 text-sm text-muted-foreground" data-calendar-empty-day>{t(planningReady === false ? planningError ? "Kalenderunderlaget kunde inte hämtas helt." : "Laddar kalendern..." : dayItems.length ? "Inga inbokade klockslag." : "Inget planerat.")}</p>;
    const familyContextGroups = calendarClusters(familyBlocks);
    const periodBlocks = view === "vecka" ? layoutCalendar(Object.values(days).flat()) : [...blocks, ...familyBlocks];
    const { first, last } = calendarTimelineRange(periodBlocks, fullDay) ?? { first: 0, last: 1440 };
    const visibleGaps = calendarGaps(planningDays[day] ?? []).map(gap => {
      const start = Math.max(first, gap.start), end = Math.min(last, gap.end);
      return { start, end, minutes: end - start };
    }).filter(gap => gap.minutes >= 20);
    // A late activity still needs its full touch target below the 24:00 line.
    const height = (last - first) * 1.7 + (last === 1440 ? 64 : 16);
    return <div className="pace-journal-timeline pace-calendar-timeline relative ml-12 border-l border-border" data-calendar-timeline-start={first} data-calendar-timeline-end={last} style={{ height }} onDragOver={e => e.preventDefault()} onDrop={e => {
      const rect = e.currentTarget.getBoundingClientRect(); const minute = Math.round((first + (e.clientY - rect.top) / 1.7) / 15) * 15; drop(e, day, Math.max(first, Math.min(last - 15, minute)));
    }}>
      {Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60).map(m => <div key={m} className="pointer-events-none absolute left-0 right-0 border-t border-border/45" style={{ top: (m - first) * 1.7 }}><span className="pace-type-time absolute -left-12 -top-2 w-10 text-right text-[11px] text-muted-foreground">{m === 1440 ? "24:00" : timeOf(m)}</span></div>)}
      {!compact && visibleGaps.map(gap => <div key={gap.start} className={cn("absolute left-2 flex items-center", familyBlocks.length ? "right-[36%]" : "right-1", "gap-2 rounded-xl border border-dashed border-sage/35 bg-mint/40 px-3 text-xs text-foreground")} data-gap="true" style={{ top: (gap.start - first) * 1.7 + 2, height: Math.max(30, gap.minutes * 1.7 - 6) }}><Leaf size={15} aria-hidden />{gap.minutes} {t("min luft")}</div>)}
      {familyContextGroups.map(group => <div key={`family-${group.start}`} className="absolute right-0 w-[34%] pl-1" style={{ top: (group.start - first) * 1.7, height: Math.max(64, (group.end - group.start) * 1.7 - 4) }}>
        {group.blocks.length > 1 ? <Button variant="ghost" data-family-entry={group.blocks.some(b => b.item.requiresParent) ? "presence" : "context"} className="h-full min-h-11 w-full flex-col items-start justify-start overflow-hidden whitespace-normal rounded-xl border border-lavender/50 bg-secondary/35 px-1 py-2 text-left text-[10px] text-muted-foreground" onClick={() => setCluster(group.blocks.map(b => b.item))}><Users size={14} /><span className="line-clamp-3 break-words">{group.blocks.length} {t("i familjen")}</span>{group.blocks.some(b => b.item.requiresParent) && <span className="text-primary">{t("Behöver mig")}</span>}</Button> : group.blocks.map(b => <div className="h-full" key={b.item.id}>{blockButton(b.item, true)}</div>)}
      </div>)}
      <div className={cn("absolute inset-y-0 left-0", familyBlocks.length ? "w-[66%]" : "w-full")}>
      {calendarClusters(blocks).map(group => group.blocks.some(b => b.lanes > (compact ? 1 : 2)) ? <div key={group.blocks[0]?.item.id} className="absolute left-1 right-1" style={{ top: (group.start - first) * 1.7, height: Math.max(50, (group.end - group.start) * 1.7 - 4) }}><Button variant="secondary" className="h-full w-full min-w-0 items-start justify-start rounded-xl border border-border px-2 text-xs" onClick={() => setCluster(group.blocks.map(b => b.item))}><CalendarDays size={14} /><span className="truncate"><span className="pace-type-time">{timeOf(group.start)}</span> · {group.blocks.length} {t("aktiviteter")}</span></Button></div> : group.blocks.map(block => <div key={block.item.id} className="absolute pl-1 pr-1" style={entryStyle(block.start, block.end, block.lane, block.lanes, first)}>{blockButton(block.item, compact)}</div>))}
      </div>
      {day === today && now !== null && now >= first && now <= last && <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-accent" style={{ top: (now - first) * 1.7 }}><span className="absolute -left-11 -top-3 rounded-full bg-accent px-1.5 py-1 text-[10px] font-semibold text-accent-foreground">{t("NU")}</span></div>}
    </div>;
  };
  const balance = <section className="pace-journal-card rounded-3xl border border-border/60 bg-card p-4 shadow-soft" aria-label={t("Dagens balans")}>
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
  const hasSidebar = untimed.length > 0 || intensive && dismissed !== date;
  const todo = untimed.length > 0 ? <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><details open><summary className="cursor-pointer py-1 font-display text-sm font-bold">{t("Att få gjort idag")} <span className="text-muted-foreground">{untimed.filter(e => !e.done).length}</span></summary><ul className="mt-3 space-y-2.5">{untimed.map(entry => <li key={entry.id} className="flex min-w-0 items-center gap-1"><div className="min-w-0 flex-1">{blockButton(entry)}</div></li>)}</ul></details></section> : null;
  const energyFields = <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("Hur brukar det påverka din energi?")}</legend><div className="grid grid-cols-2 gap-2">{IMPACTS.map(option => <Button key={option.value} variant="outline" type="button" aria-pressed={impact === option.value} className={cn("min-h-11 justify-start rounded-xl text-xs", impact === option.value && "border-primary bg-lavender/60")} onClick={() => setImpact(option.value)}><option.icon size={16} />{t(option.label)}</Button>)}</div></fieldset>;
  const scheduleFields = <><div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm">{t("Datum")}<Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 min-h-11" /></label><label className="min-w-0 text-sm">{t("Tid")}<Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 min-h-11" /></label></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setEditDate(today)}>{t("Idag")}</Button><Button variant="ghost" size="sm" onClick={() => setEditDate(shiftDate(today, 1))}>{t("Imorgon")}</Button><Button variant="ghost" size="sm" onClick={() => { setTime(""); setLength(""); }}>{t("Ingen tid ännu")}</Button></div>{time && <label className="block text-sm">{t("Hur lång tid ungefär?")}<div className="mt-2 flex flex-wrap gap-1">{[15, 30, 45, 60].map(n => <Button key={n} size="sm" variant={length === String(n) ? "default" : "outline"} onClick={() => setLength(String(n))}>{n} {t("min")}</Button>)}</div><Input type="number" min="1" max="1439" value={length} onChange={e => setLength(e.target.value)} placeholder={t("Längd i minuter (valfritt)")} className="mt-2 min-h-11" /></label>}</>;
  const calendarTools = <div className="flex flex-wrap items-center gap-1 text-xs" aria-label={t("Kalenderverktyg")}>
      <Button variant="ghost" size="sm" className="pace-compact-control px-2 text-xs text-muted-foreground hover:text-ink" onClick={() => setUtility("connection")}><Link2 size={16} aria-hidden />{t("Kalenderkoppling")}</Button>
      <Button variant="ghost" size="sm" className="pace-compact-control px-2 text-xs text-muted-foreground hover:text-ink" onClick={() => setUtility("day")}><MoreHorizontal size={16} aria-hidden />{t("Dagens verktyg")}</Button>
    </div>;
  return <div className={cn("pace-next-page pace-calendar-desktop mx-auto max-w-6xl space-y-2", textLayout.enlarged && "pace-text-enlarged")} data-testid="visual-calendar">
    <span ref={textLayout.ref} className="pace-text-probe" aria-hidden="true" />
    <div className="pace-calendar-heading">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h1 className="pace-next-title min-w-0 font-display text-2xl font-medium tracking-tight text-[#512654]">{t("Min kalender")}</h1><Button asChild className="pace-compact-control pace-compact-primary shrink-0"><PlanningLink to="/planera" search={{ audience: "me", period: view === "vecka" ? "week" : "today" }}><Plus size={16} aria-hidden />{t("Lägg till")}</PlanningLink></Button></header>
    <div role="group" aria-label={t("Kalendervy")} className="grid grid-cols-3 rounded-2xl border border-border/60 bg-secondary/60 p-1">{([ ["dag", "Idag"], ["vecka", "Vecka"], ["manad", "Månad"] ] as const).map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setView(id)} aria-pressed={view === id} className={cn("pace-compact-control", view === id ? "pace-compact-selected font-semibold" : "text-muted-foreground")}>{t(label)}</Button>)}</div>
    </div>
    <div className="pace-calendar-capacity">
    {view !== "dag" && (todayCap.percent === null ? <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><p className="font-display text-sm font-bold">{t("Hur börjar du dagen?")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Checka in när du vill för att se dagens kapacitet.")}</p></section> : <button type="button" onClick={() => setCapInfo(today)} className="flex w-full items-center gap-4 rounded-3xl border border-border/60 bg-card p-4 text-left shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t("Din kapacitet idag")}: ${todayCap.percent} %. ${t("Visa vad den bygger på")}`}><span className="min-w-0 flex-1"><span className="flex items-center gap-1 font-display text-sm font-bold">{t("Din kapacitet idag")}<CircleHelp size={14} className="text-muted-foreground" aria-hidden /></span><CapacityBattery percent={todayCap.percent} size="lg" className="mt-2 w-full" /><span className="mt-2 block text-xs text-muted-foreground">{t("Utifrån din egen incheckning idag.")}</span></span><ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden /></button>)}
    </div>
    <div className="pace-calendar-period grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Föregående period")} onClick={() => step(-1)}><ChevronLeft size={18} /></Button><div className="min-w-0 text-center"><p className="break-words font-display text-sm font-bold capitalize">{view === "vecka" ? `${dateHeading(dates[0] ?? date)} – ${dateHeading(dates[6] ?? date)}` : period}</p><Button variant="ghost" size="sm" onClick={() => setDate(today)} className="min-h-11 text-xs text-primary">{t("Idag")}</Button></div><Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-full bg-card/60" aria-label={t("Nästa period")} onClick={() => step(1)}><ChevronRight size={18} /></Button></div>
    <div className="grid grid-cols-2 gap-2" aria-label={t("Kalenderinställningar")}>
    <details className="group min-w-0 rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] px-2 py-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-1 text-xs font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>{familyPreferences.mode === "mine" ? t("Bara jag") : familyPreferences.children === null ? t("Familjen") : `${familyPreferences.children.length} ${t("barn")}`}</span><ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden /></summary>
      <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2" role="group" aria-label={t("Visa för")}>
        <Button size="sm" variant={familyPreferences.mode === "mine" ? "default" : "outline"} aria-pressed={familyPreferences.mode === "mine"} className="min-h-11 rounded-xl" onClick={() => setFamilyPreferences(previous => ({ ...previous, mode: previous.mode === "mine" ? "context" : "mine" }))}>{t("Bara jag")}</Button>
        {familyMembers.map(member => { const active = familyPreferences.mode !== "mine" && (familyPreferences.children === null || familyPreferences.children.includes(member.id)); return <Button key={member.id} size="sm" variant={active ? "secondary" : "outline"} aria-pressed={active} className="min-h-11 rounded-xl" onClick={() => setFamilyPreferences(previous => { const current = previous.children === null ? familyMembers.map(m => m.id) : previous.children; const children = active ? current.filter(id => id !== member.id) : [...current, member.id]; return { ...previous, mode: "context", children }; })}>{member.name}</Button>; })}
        <Button size="sm" variant="ghost" className="min-h-11 rounded-xl text-muted-foreground" onClick={() => setFamilySettings(true)} aria-label={t("Fler familjeinställningar")}><SlidersHorizontal size={16} aria-hidden /></Button>
      </div>
    </details>
    <details className="min-w-0 rounded-2xl border border-border/50 bg-card px-2 py-1" aria-label={t("Fler visningsval")}><summary className="flex min-h-11 cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground"><SlidersHorizontal size={16} aria-hidden />{t("Visning")}</summary><div className="flex flex-wrap items-center gap-x-1 gap-y-1 py-2">
      

      {onPictogramsChange && <Button variant="ghost" className="pace-compact-control px-2 text-xs" aria-pressed={showPictograms} onClick={() => onPictogramsChange(!showPictograms)}><Images size={16} aria-hidden />{t("Bildstöd")}{showPictograms && <Check size={12} aria-hidden />}</Button>}
      {view !== "manad" && <Button variant="ghost" className="pace-compact-control px-2 text-xs" aria-pressed={fullDay} onClick={() => setFullDay(value => !value)}><Clock size={16} aria-hidden />{t(fullDay ? "Visa kompakt" : "Visa hela dygnet (00–24)")}</Button>}

      <details className={cn("min-w-0 flex-1 px-2", ownedChildren.length > 0 && "basis-full sm:basis-auto")}>
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium"><SlidersHorizontal size={16} className="text-primary" aria-hidden />{t("Visa i kalendern")}<span className="ml-auto text-muted-foreground">{visible.filter(v => ["privat", "jobb", "studier"].includes(v)).length}/3</span></summary>
        <div className="flex flex-wrap gap-2 pb-3" role="group" aria-label={t("Visa kategorier")}>{[["privat", "Privat"], ["jobb", "Jobb"], ["studier", "Studier"]].map(([id, label]) => <Button key={id} size="sm" variant="outline" className={cn("pace-compact-control", visible.includes(id ?? "") && "pace-compact-selected")} aria-pressed={visible.includes(id ?? "")} onClick={() => setVisible(prev => prev.includes(id ?? "") ? prev.filter(x => x !== id) : [...prev, id ?? "privat"])}>{t(label ?? "")}</Button>)}</div>
      </details>
    </div>
    </details>

</div>
    <ul aria-label={t("Områdesfärger")} className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{(view === "manad" ? calendarMonthAreas(Object.values(days).flat()) : [...new Set(Object.values(days).flat().map(calendarArea))]).map(area => <li key={area} data-calendar-area={area} className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(area))}</li>)}</ul>
    {!desktopLayout && view !== "dag" && date === today && checkin}
    {externalError && <p role="status" className="text-sm text-muted-foreground">{t("Den externa kalendern kunde inte hämtas just nu. Dina egna poster finns kvar.")}</p>}
    {view === "manad" && <>{monthStats && <p className="text-xs text-muted-foreground" aria-label={t("Månadens sammanfattning")}>{`${monthStats.total} ${t(monthStats.total === 1 ? "aktivitet" : "aktiviteter")} · ${monthStats.active} ${t(monthStats.active === 1 ? "dag med innehåll" : "dagar med innehåll")} · ${monthStats.empty} ${t(monthStats.empty === 1 ? "dag utan planering" : "dagar utan planering")}`}</p>}<div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t("Månadskalender")}>
      {dates.slice(0, 7).map(d => <span key={`heading-${d}`} className="py-1 text-center text-[11px] text-muted-foreground">{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}</span>)}
      {dates.map(d => {
        const areaEntries = days[d] ?? [];
        const areas = calendarMonthAreas(areaEntries);
        const recordedCapacity = calendarMonthCapacity(d, today, capacityOf(d).percent);
        const adjacent = d.slice(0, 7) !== date.slice(0, 7);
        const areaDescription = `${areas.length} ${t("områden har planerat innehåll denna dag")}${areas.length ? `: ${areas.map(a => t(calendarAreaLabel(a))).join(", ")}` : ""}`;
        return <Button key={d} data-month-date={d} variant="ghost" onClick={() => { setDate(d); setDayEditorOpen(true); }} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, d)} aria-current={d === today ? "date" : undefined} aria-pressed={d === date} aria-label={`${new Date(`${d}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long" })}, ${areaEntries.length} ${t(areaEntries.length === 1 ? "aktivitet" : "aktiviteter")}, ${areaDescription}${recordedCapacity !== null ? `, ${t("Kapacitet")} ${recordedCapacity} %` : ""}`} title={areaDescription} className={cn("relative flex h-24 min-w-0 flex-col justify-start gap-2 rounded-xl border border-border/50 bg-card/60 px-0.5 py-2 text-xs sm:h-28 sm:px-2", adjacent && "opacity-50", d === today && "border-ink border-2", d === date && "pace-selected-day")}>
          <span className="font-semibold">{Number(d.slice(-2))}</span>
          {recordedCapacity !== null && <span data-month-capacity className={cn("flex items-center gap-0.5 whitespace-nowrap text-[9px] tabular-nums sm:text-[10px]", d === today ? "font-semibold text-primary" : "text-muted-foreground")}><Battery size={12} aria-hidden /><span>{recordedCapacity}%</span></span>}
          {areas.length > 0 && <span className="mt-auto flex h-3 items-center justify-center gap-1"><span className="text-[9px] tabular-nums text-muted-foreground" aria-hidden>{areaEntries.length}</span><span className="flex h-3 items-center justify-center gap-0.5" aria-hidden>{areas.slice(0, 4).map(area => <span key={area} data-calendar-area={area} className="h-1.5 w-1.5 shrink-0 rounded-full calendar-area-dot" />)}{areas.length > 4 && <span className="text-[9px] text-muted-foreground">+{areas.length - 4}</span>}</span></span>}
        </Button>;
      })}</div><section className="border-t border-border/60 py-4"><div className="flex items-center justify-between gap-2"><h2 className="font-display text-sm font-bold capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</h2><Button size="icon" variant="ghost" className="min-h-11 min-w-11 text-primary" aria-label={t("Öppna dagen")} onClick={() => setView("dag")}><ArrowRight size={18} /></Button></div><h3 className="mt-3 text-xs font-semibold">{t("Min dag")}</h3><ul className="mt-2 space-y-2.5">{selectedDayList.map(entry => <li key={entry.id}>{blockButton(entry)}</li>)}</ul>{!myEntries.length && <p className="py-4 text-sm text-muted-foreground">{t("Inget planerat än. Du behöver inte fylla dagen bara för att det finns plats.")}</p>}{familyEntries.length > 0 && <div className="mt-4 border-t border-border/60 pt-3"><h3 className="text-xs font-semibold text-muted-foreground">{t("Familjen")}</h3><p data-calendar-area="privat" className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full calendar-area-dot" aria-hidden />{t("Familj")} · {familyEntries.length}</p>{showPictograms && <ul className="mt-2 space-y-2.5">{familyEntries.map(entry => <li key={entry.id}>{blockButton(entry)}</li>)}</ul>}</div>}</section></>}
    {view === "vecka" && <section className="space-y-2 rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] p-2 shadow-sm" aria-label={t("Veckans dagar")}>
      <h2 className="px-2 font-display text-base font-medium text-[#512654]">{t("Veckan i korthet")}</h2>
      {(() => { const active = dates.flatMap(d => days[d] ?? []).filter(e => e.periodEnd && (!isFamilyEntry(e) || familyPreferences.mode !== "mine")); const unique = [...new Map(active.map(e => [e.source === "child" ? `${e.title}:${e.periodEnd}:${e.linkGroup ?? e.sourceId}` : e.sourceId, e])).values()]; return unique.length ? <div className="space-y-1 rounded-xl bg-[#F2EDF5] p-2" aria-label="Perioder under veckan"><p className="text-xs font-medium text-[#512654]">Pågående perioder</p>{unique.map(e => <div key={e.id} className="flex min-h-9 items-center gap-2 rounded-lg bg-white/70 px-2 text-sm"><span className="min-w-0 flex-1 truncate">{e.title}</span><span className="shrink-0 text-xs text-muted-foreground">t.o.m. {e.periodEnd?.slice(5)}</span></div>)}</div> : null; })()}
      <div className="divide-y divide-[#EDE5E9]">{dates.map(d => {
        const dayEntries = (days[d] ?? []).filter(e => !isFamilyEntry(e) && !e.periodEnd);
        const ordered = [...dayEntries].sort((x,y) => (minuteOf(x.time) ?? 1440) - (minuteOf(y.time) ?? 1440));
        return <section key={d} className={cn("flex gap-2 rounded-xl px-2 py-2", d === date && "bg-[#F4EDF5]")}>
          <button type="button" onClick={() => { setDate(d); setDayEditorOpen(true); }} className="flex min-h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-[#512654] hover:bg-[#EEE3F1]" aria-label={`Öppna ${dateHeading(d)}`}>
            <span className="text-xs capitalize">{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}</span>
            <span className="font-display text-lg font-medium">{new Date(`${d}T12:00:00`).getDate()}</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="sr-only">{dayEntries.length} {t(dayEntries.length === 1 ? "aktivitet" : "aktiviteter")}</p>{ordered.length ? <ul className="space-y-0">{ordered.map(e => <li key={e.id}><button type="button" onClick={() => openDetails(e)} className="flex min-h-9 w-full items-center gap-1.5 rounded-md px-1.5 text-left hover:bg-[#EEE8F0]"><span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">{e.time ?? "—"}</span><span className="min-w-0 flex-1 truncate text-sm">{e.title}</span><ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden /></button></li>)}</ul> : <p className="py-3 text-sm text-muted-foreground">{t("Inget planerat")}</p>}
          </div>
        </section>;
      })}</div>
      <details className="border-t border-[#EDE5E9] pt-2"><summary className="min-h-11 cursor-pointer py-3 text-sm text-[#512654]">{t("Visa veckans tidslinje")}</summary><div className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl bg-[#FAF9F6] p-2" role="group" aria-label={t("Veckovy, svep för fler dagar")} tabIndex={0}><div className="flex items-start gap-2">{dates.map(d => <div key={d} className="w-[calc(100%-1rem)] min-w-0 shrink-0 snap-start min-[420px]:w-[calc(50%-0.25rem)] min-[640px]:w-[calc(33.333%-0.35rem)] lg:w-[272px]"><Button variant="ghost" onClick={() => { setDate(d); setView("dag"); }} className="mb-2 min-h-12 w-full rounded-xl bg-card">{dateHeading(d)}</Button>{timeline(d, days[d] ?? [], true)}</div>)}</div></div></details>
    </section>}
    {view === "dag" && <div className="pace-calendar-day mx-auto max-w-3xl space-y-4">
      <section className="rounded-3xl border border-[#EDE5E9] bg-[#FFFEFC] p-4 shadow-sm" aria-label={t("Min dag")}>
        <div className="flex items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">{t("Min dag")}</p><h2 className="font-display text-xl font-medium capitalize text-[#512654]">{dateHeading(date)}</h2></div><span className="text-sm text-muted-foreground">{myEntries.length} {t("aktiviteter")}</span></div>
        {myEntries.some(e => e.periodEnd) && <div className="mt-3 space-y-1 rounded-xl bg-[#F2EDF5] p-2"><p className="text-xs font-medium text-[#512654]">Pågående perioder</p>{myEntries.filter(e => e.periodEnd).map(e => <button key={e.id} type="button" onClick={() => openDetails(e)} className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-sm hover:bg-white/70"><span className="min-w-0 truncate">{e.title}</span><span className="shrink-0 text-xs text-muted-foreground">t.o.m. {e.periodEnd?.slice(5)}</span></button>)}</div>}
        {date === today && plan.now && <div className="mt-3 rounded-2xl bg-[#F7F1F5] p-3"><p className="text-xs text-muted-foreground">{t("Just nu")}</p><p className="mt-1 break-words text-sm font-medium">{plan.now.item.title}</p>{plan.next && <p className="mt-2 break-words text-xs text-muted-foreground">{t("Härnäst")}: {plan.next.item.title}</p>}</div>}
        {myEntries.some(e => e.time && !e.periodEnd) && <div className="mt-4"><h3 className="text-sm font-medium text-[#512654]">{t("Med bestämd tid")}</h3><ul className="mt-2 space-y-2.5">{myEntries.filter(e => e.time).sort((a,b) => (minuteOf(a.time) ?? 0) - (minuteOf(b.time) ?? 0)).map(e => <li key={e.id}>{blockButton(e)}</li>)}</ul></div>}
        {myEntries.some(e => !e.time && !e.periodEnd) && <div className="mt-4"><h3 className="text-sm font-medium text-[#512654]">{t("Utan bestämd tid")}</h3><ul className="mt-2 space-y-2.5">{myEntries.filter(e => !e.time && !e.periodEnd).map(e => <li key={e.id}>{blockButton(e)}</li>)}</ul></div>}
        {!myEntries.length && <p className="mt-3 text-sm text-muted-foreground">{t("Inget planerat än. Det får finnas luft.")}</p>}
      </section>
      {familyEntries.length > 0 && <details className="rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] px-4 py-3"><summary className="min-h-11 cursor-pointer py-2 font-display text-base text-[#512654]">{t("Barnens dag")} · {familyEntries.length}</summary><ul className="mt-2 space-y-2.5">{familyEntries.map(e => <li key={e.id}>{blockButton(e, true)}</li>)}</ul></details>}
      <details open className="rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] px-4 py-3"><summary className="min-h-11 cursor-pointer py-2 font-display text-base text-[#512654]">{t("Dagens stöd")}</summary><div className="mt-3 space-y-3">{balance}{date === today && checkin}{date === today && <DaySupportActions date={date} entries={entries} calendarReady={planningReady} calendarError={planningError} />}{todo}{intensive && dismissed !== date && <div className="rounded-2xl bg-lavender/40 p-3"><p className="text-sm">{t(flowDaySupport(planningEntries, dayCap.percent).message)}</p><Button className="mt-3 min-h-11 w-full rounded-2xl" onClick={() => setSuggestions(true)}>{t("Hitta plats")}</Button><Button variant="ghost" className="mt-1 min-h-11 w-full" onClick={() => setDismissed(date)}>{t("Inte nu")}</Button></div>}</div></details>
      
    </div>}
    <div className="mt-3">    <details className="rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] px-3 py-1" aria-label={t("Planeringsverktyg")}>
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-[#512654]"><NotebookPen size={17} aria-hidden />{t("Planera och lägg till flera aktiviteter")}<ChevronRight size={16} aria-hidden className="ml-auto" /></summary>
    <nav aria-label={t("Snabbplanering")} className="flex flex-wrap gap-2 rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] p-2 shadow-sm">
      <Button asChild variant="outline" size="sm" className="min-h-11 rounded-xl border-[#E8DDE6] bg-[#FAF9F6] text-[#512654] hover:bg-[#F3EBF2]"><PlanningLink to="/planera" search={{ audience: "me", period: "today" }}>{t("Planera idag")}</PlanningLink></Button>
      <Button asChild variant="outline" size="sm" className="min-h-11 rounded-xl border-[#E8DDE6] bg-[#FAF9F6] text-[#512654] hover:bg-[#F3EBF2]"><PlanningLink to="/planera" search={{ audience: "me", period: "tomorrow" }}>{t("Imorgon")}</PlanningLink></Button>
      <Button asChild variant="outline" size="sm" className="min-h-11 rounded-xl border-[#E8DDE6] bg-[#FAF9F6] text-[#512654] hover:bg-[#F3EBF2]"><PlanningLink to="/planera" search={{ audience: "me", period: "week" }}>{t("Veckan")}</PlanningLink></Button>
      {ownedChildren.length > 0 && <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-xl border-[#E8DDE6] bg-[#FAF9F6] text-[#512654] hover:bg-[#F3EBF2]"><PlanningLink to="/planera" search={{ audience: "children", period: view === "vecka" ? "week" : "today" }}><Users size={15} aria-hidden />{t("Barnens planering")}</PlanningLink></Button>}
    </nav>
    </details>
</div>
    {familyPreferences.mode === "overview" && <section aria-label={t("Familjeöversikt")} className="space-y-3 border-t border-border pt-4"><h2 className="font-display font-bold">{t("Familjeöversikt")}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{ id: "me", name: t("Min dag") }, ...familyMembers.filter(m => familyPreferences.children === null || familyPreferences.children.includes(m.id))].map(member => { const memberEntries = Object.values(days).flat().filter(e => member.id === "me" ? !isFamilyEntry(e) : e.familyMembers?.some(m => m.id === member.id)); return <section key={member.id} className="min-w-0"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><UserRound size={16} className="text-primary" />{member.name}</h3><ul className="space-y-2">{memberEntries.map(e => <li key={`${e.date}-${e.id}`}><span className="text-[10px] text-muted-foreground">{dateHeading(e.date)}</span>{blockButton(e, true)}</li>)}</ul>{!memberEntries.length && <p className="text-xs text-muted-foreground">{t("Inget planerat i perioden.")}</p>}</section>; })}</div></section>}
    <FamilyLayerSettings open={familySettings} onOpenChange={setFamilySettings} preferences={familyPreferences} onChange={setFamilyPreferences} members={familyMembers} />
    <Dialog open={familyConfirm !== null} onOpenChange={open => { if (!open) setFamilyConfirm(null); }}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Familjen runt den här tiden")}</DialogTitle><DialogDescription>{t("Vill du ändå planera aktiviteten här?")}</DialogDescription></DialogHeader><ul className="space-y-2">{familyConfirm?.entries.map(e => <li key={e.id} className="rounded-xl bg-secondary/40 p-3 text-sm"><p className="font-semibold">{e.label} · {e.title} · {e.time}{e.endTime && `–${e.endTime}`}</p><p className="mt-1 text-xs text-muted-foreground">{t(e.requiresParent ? "Behöver mig – din närvaro är markerad." : "Familjekontext – inte markerad som att barnet behöver dig. Tiden är inte automatiskt upptagen.")}</p></li>)}</ul><Button onClick={() => { const action = familyConfirm?.action; setFamilyConfirm(null); action?.(); }}>{t("Ja, planera här")}</Button><Button variant="outline" onClick={() => { if (!familyConfirm) return; setFamilyAlternatives({ day: familyConfirm.day, duration: familyConfirm.duration }); setFamilyConfirm(null); }}>{t("Hitta annan tid")}</Button></DialogContent></Dialog>
    <Dialog open={familyAlternatives !== null} onOpenChange={open => { if (!open) setFamilyAlternatives(null); }}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t("Hitta annan tid")}</DialogTitle><DialogDescription>{t("Inget flyttas automatiskt.")}</DialogDescription></DialogHeader>{familyAlternatives && calendarGaps(planningDays[familyAlternatives.day] ?? []).filter(g => familyAlternatives.duration > 0 && g.minutes >= familyAlternatives.duration).slice(0, 3).map(g => <Button key={g.start} variant="outline" onClick={() => { setTime(timeOf(g.start)); setFamilyAlternatives(null); }}>{timeOf(g.start)}–{timeOf(g.end)}</Button>)}<p className="text-xs text-muted-foreground">{t("Bara luckor med kända sluttider visas. Du kan alltid välja en annan tid själv.")}</p><Button variant="ghost" onClick={() => setFamilyAlternatives(null)}>{t("Välj tid själv")}</Button></DialogContent></Dialog>
    {desktopLayout && date === today && <div className="pace-calendar-secondary">{checkin}</div>}
    <section aria-label={t("Veckans mål")} className="min-w-0">{weekGoals}</section>
    {showPictograms && <MulberryAttribution />}
    {calendarTools}
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
    <Dialog open={dayEditorOpen} onOpenChange={setDayEditorOpen}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</DialogTitle><DialogDescription>{t("Visa, redigera eller lägg till aktiviteter för dagen.")}</DialogDescription></DialogHeader><div className="space-y-2">{(days[date] ?? []).map(entry => <button key={entry.id} type="button" className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-left" onClick={() => { setDayEditorOpen(false); openDetails(entry); }}><span className="min-w-0 flex-1 truncate">{entry.time ? `${entry.time} · ` : ""}{entry.title}</span><ChevronRight size={16} aria-hidden /></button>)}{!(days[date] ?? []).length && <p className="text-sm text-muted-foreground">{t("Inget planerat")}</p>}</div><Button className="min-h-11 w-full rounded-xl" onClick={() => openAdd(false, date)}><Plus size={16} aria-hidden />{t("Lägg till aktivitet eller period")}</Button>{ownedChildren.length > 0 && <Button variant="outline" className="min-h-11 w-full rounded-xl" onClick={() => openAdd(true, date)}><Users size={16} aria-hidden />{t("Lägg till i barnens schema")}</Button>}</DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={open => { if (!savingChildrenRef.current) setAdding(open); }}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl">
        <DialogHeader><DialogTitle>{t(kind === "child" ? "Lägg till i barnens schema" : "Vad vill du lägga till?")}</DialogTitle><DialogDescription>{t("En sak i taget, i din takt.")}</DialogDescription></DialogHeader>
        <fieldset disabled={savingChildren} className="min-w-0 space-y-4">
          {kind !== "child" && <div className="grid grid-cols-2 gap-2">{[["task", "Uppgift"], ["activity", "Aktivitet"], ["reminder", "Påminnelse"], ["recovery", "Återhämtning"], ["period", "Period"]].map(([value, label]) => <Button key={value} variant={kind === value ? "default" : "outline"} onClick={() => { setKind(value ?? "task"); if (value === "recovery") setImpact("gives"); }}>{t(label ?? "")}</Button>)}</div>}
          <label className="block text-sm">{t("Namn")}<Input className="mt-1 min-h-11" value={title} onChange={e => { setTitle(e.target.value); setChosenArea(null); }} maxLength={240} autoFocus /></label>
          <label className="block text-sm">{t("Anteckningar (valfritt)")}<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={4000} rows={3} placeholder={t("Detaljer, saker att komma ihåg…")} className="mt-1 min-h-20 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label>
          {kind !== "child" && <label className="block text-sm">{t("Område")}{proposedArea && chosenArea === null && <span className="ml-2 text-xs text-muted-foreground">{t("Föreslaget")}</span>}<select aria-label={t("Område")} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-card px-3" value={newArea} onChange={e => setChosenArea(e.target.value as LifeArea)}>{ALL_AREAS.map(id => <option key={id} value={id}>{AREA_META[id].label}</option>)}</select></label>}
          {kind === "child" && <ChildScheduleRecipients children={ownedChildren} selectedIds={childIds} onChange={setChildIds} disabled={savingChildren} />}
          {kind === "child" && <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={childPeriod} onChange={e => { setChildPeriod(e.target.checked); if (e.target.checked) { setTime(""); setLength(""); } }} />Flera dagar / semester / lov</label>}
          {kind === "child" && childPeriod && <div className="space-y-2"><label className="block text-sm">Från<Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 min-h-11" /></label><label className="block text-sm">Till och med<Input type="date" min={editDate} value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1 min-h-11" /></label><p className="text-xs text-muted-foreground">En sammanhängande familjeperiod för valda barn. Blockerar inte dagens tider.</p></div>}
          {kind === "period" ? <div className="space-y-2"><div className="grid grid-cols-2 gap-2"><label className="min-w-0 text-sm">{t("Från")}<Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 min-h-11" /></label><label className="min-w-0 text-sm">{t("Till och med")}<Input type="date" min={editDate} value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1 min-h-11" /></label></div><p className="text-xs text-muted-foreground">Visas under hela perioden utan att blockera tid eller påverka batteriet. Lektioner och utflykter läggs till separat.</p></div> : scheduleFields}
          {kind === "child" ? (title.trim() && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MulberryPictogram id={activityPresetForTitle(title)?.pictogram ?? "calendar"} className="h-8 w-8" />{t("Bildstödet kan ändras i barnets schema.")}</div>) : energyFields}
          {kind !== "child" && time && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />{t("Påminn mig vid start")}</label>}
          <Button className="w-full min-h-11 rounded-2xl" disabled={savingChildren || !title.trim() || !editDate || kind === "child" && !childIds.length || (kind === "period" || kind === "child" && childPeriod) && (!periodEnd || periodEnd < editDate)} onClick={() => saveNew()}><Plus size={16} />{savingChildren ? t("Sparar...") : kind === "child" ? `${t("Spara för")} ${childIds.length} ${t("barn")}` : t("Lägg till")}</Button>
        </fieldset>
      </DialogContent>
    </Dialog>
    <Dialog open={!!details} onOpenChange={open => { if (!open) setDetails(null); }}><DialogContent className="max-h-[88dvh] w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto rounded-3xl px-4 sm:px-6"><DialogHeader><DialogTitle className="break-words pr-5 text-xl leading-snug sm:text-2xl">{details?.title}</DialogTitle><DialogDescription>{details?.date} {details?.time}{details?.endTime && `–${details.endTime}`} {details?.label}</DialogDescription></DialogHeader>{details && <div className="space-y-4"><p data-calendar-area={calendarArea(details)} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full calendar-area-dot" aria-hidden />{t(calendarAreaLabel(calendarArea(details)))}</p>{isFamilyEntry(details) && <div className="space-y-2 rounded-2xl bg-secondary/35 p-3"><p className="text-xs text-muted-foreground">{t("Familjekontext, inte en egen uppgift.")}</p><Button variant="outline" aria-pressed={details.requiresParent === true} className="min-h-11 w-full" onClick={() => void setPresence(details)}><UserRound size={16} />{t(details.requiresParent ? "Behöver mig" : "Markera: Behöver mig")}</Button></div>}{planning ? <>{scheduleFields}{energyFields}<Button className="w-full min-h-11" onClick={() => moveEntry(details, editDate, time, length, impact)}>{t("Spara")}</Button></> : <>{details.editable && !details.recurring && (details.source === "task" || details.source === "reminder") && (editingMeta ? <div className="space-y-3 rounded-xl border border-border/60 p-3"><label className="block text-sm">{t("Anteckningar (valfritt)")}<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={4000} className="mt-1 w-full rounded-xl border border-border bg-card p-2 text-sm" /></label>{details.source === "reminder" && <label className="block text-sm">{t("Slutdatum för period (valfritt)")}<Input type="date" min={details.date} value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1" /></label>}<Button className="w-full" onClick={() => saveMetadata(details)}>{t("Spara ändringar")}</Button><Button variant="ghost" className="w-full" onClick={() => setEditingMeta(false)}>{t("Avbryt")}</Button></div> : <Button variant="outline" className="min-h-11 w-full" onClick={() => setEditingMeta(true)}><NotebookPen size={16} />{t("Redigera anteckningar och period")}</Button>)} {details.editable && !details.recurring && <Button variant="outline" className="min-h-11 w-full" onClick={() => setPlanning(true)}><Clock size={16} />{t("Planera tid")}</Button>}{details.editable && !details.recurring && details.time && <Button variant="ghost" className="min-h-11 w-full" onClick={() => moveEntry(details, details.date, "", "")}>{t("Ta bort tid")}</Button>}{details.editable && (details.source === "task" || details.source === "reminder") && <div className="space-y-3">
  <div className="flex min-w-0 flex-wrap items-center gap-2">
    {(() => { const match = flowItems.find(i => i.id === details.id); return match?.completable ? <Button variant="outline" className="min-h-11 min-w-0 flex-1 whitespace-normal px-3 text-sm sm:flex-none" onClick={() => { toggleItem(match); setDetails(null); }}><Check size={16} className="shrink-0" />{t(match.done ? "Ångra klart" : "Markera klar")}</Button> : null; })()}
    <FlowItemActions itemId={details.id} className="flex shrink-0 items-center gap-1 [&_button]:flex [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:items-center [&_button]:justify-center" />
  </div>
  {details.source === "task" && !details.done && details.date === today && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {(["prioritera", "dela", "planera"] as const).map(mode => <Button key={mode} type="button" variant="outline" className="h-auto min-h-11 min-w-0 whitespace-normal break-words px-2 py-2 text-center text-xs leading-snug" onClick={() => { setQuickSupport({ taskId: details.sourceId, mode }); setDetails(null); }}>{mode === "prioritera" ? t("Prioritera") : mode === "dela" ? t("Dela upp") : t("Planera om")}</Button>)}
  </div>}
</div>}{details.recoveryAction && <Button asChild variant="outline" className="min-h-11 w-full"><Link href={details.recoveryAction === "stopp" ? "/stop-paus" : `/aterhamtning?start=${details.recoveryAction}`}>{t("Öppna återhämtning")}<ArrowRight size={16} /></Link></Button>}{details.href && <Button asChild variant="outline" className="min-h-11 w-full"><Link href={details.href}>{t("Öppna där aktiviteten hör hemma")}<ArrowRight size={16} /></Link></Button>}</>}</div>}</DialogContent></Dialog>
    <Dialog open={!!quickSupport} onOpenChange={open => { if (!open) setQuickSupport(null); }}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>{t("Hjälp med aktiviteten")}</DialogTitle><DialogDescription>{t("Granska förslaget innan något sparas.")}</DialogDescription></DialogHeader>{quickSupport && <DaySupportActions key={`${quickSupport.taskId}:${quickSupport.mode}`} date={date} entries={entries} calendarReady={planningReady} calendarError={planningError} initialTaskId={quickSupport.taskId} initialMode={quickSupport.mode} />}</DialogContent></Dialog>
    <Dialog open={!!capInfo} onOpenChange={open => { if (!open) setCapInfo(null); }}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t(capInfo === today ? "Din kapacitet idag" : "Kapacitet")}</DialogTitle><DialogDescription>{capInfo}</DialogDescription></DialogHeader>{infoCap && <div className="space-y-3 text-sm">
      {infoCap.percent !== null && <div className="rounded-2xl bg-lavender/50 p-3"><p className="text-xs text-muted-foreground">{t("Din registrerade kapacitet")}</p><CapacityBattery percent={infoCap.percent} size="md" className="mt-1" /><p className="mt-2 text-xs text-muted-foreground">{t(infoCap.source === "morning" ? "Utifrån din morgonincheckning." : "Utifrån din senaste energilogg den här dagen.")}</p></div>}
      <p className="text-xs leading-relaxed text-muted-foreground">{t(infoCap.percent == null ? "Vi har ingen egen incheckning för den här dagen. Paceable gissar inte – checka in din energi när du vill." : "Kapaciteten bygger på din egen incheckning. Att flytta eller ta bort aktiviteter ändrar planerad belastning, inte din kapacitet.")}</p>
    </div>}</DialogContent></Dialog>
    <Dialog open={suggestions} onOpenChange={setSuggestions}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{t("Lite mer luft")}</DialogTitle><DialogDescription>{t("Inget ändras förrän du själv väljer.")}</DialogDescription></DialogHeader>{gaps.filter(g => g.minutes >= 20).slice(0, 3).map(g => <Button key={g.start} variant="outline" className="h-auto min-h-14 justify-start whitespace-normal rounded-2xl text-left" onClick={() => { setSuggestions(false); setEditDate(date); setTime(timeOf(g.start)); setLength("20"); setTitle(t("Återhämtning")); setKind("recovery"); setImpact("gives"); setNotify(false); setAdding(true); }}><Leaf size={18} />{t("Lägg 20 min återhämtning")} · {timeOf(g.start)}</Button>)}{!gaps.length && <p className="text-sm text-muted-foreground">{t("Jag ser ingen säker lucka med kända sluttider. Du kan själv ändra en aktivitet eller planera återhämtning.")}</p>}</DialogContent></Dialog>
  </div>;
}

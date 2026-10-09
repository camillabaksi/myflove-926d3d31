import { repeatUntilFromNotes } from "@/lib/child-visual-schedule";
import CalendarPlanner from "@/components/calendar/calendar-planner";
import { CopyDayButton } from "@/components/day/copy-day-dialog";
import { LinkifiedText } from "@/components/linkified-text";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isoWeekNumber, isoWeekNumberFromString } from "@/lib/iso-week";
import WeekGoals from "@/components/week-goals";
import { parseISODate } from "@/lib/day";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { useFocus, useTasks, useReminders } from "@/hooks/use-data";
import { useChildren } from "@/hooks/use-children";
import { Link } from "wouter";
import {
  CheckSquare,
  Target,
  Bell,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  Plus,
  Baby,
} from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/push-notifications";
import {
  occursOn,
  routineOccursOn,
  REPEAT_LABELS,
  type RepeatMode,
  type Routine,
} from "@/lib/recurrence";
import ImpactCheckin, { type CalendarImpactDraft } from "@/components/impact-checkin";
import { useUser } from "@clerk/react";
import {
  useGetMyHousehold,
  useListFamilyEvents,
  useCreateFamilyEvent,
  useDeleteFamilyEvent,
  getGetMyHouseholdQueryKey,
  getListFamilyEventsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CalendarAccount, { type CalendarPushItem } from "@/components/calendar-account";
import { QuickAddInline, type QuickAddResult } from "@/components/task-quick-add";
import DailyFlowList from "@/components/day/daily-flow-list";
import type { FlowItem } from "@/lib/flow-items";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { pictogramFor } from "@/lib/pictograms";
import { useNpfSettings } from "@/lib/npf-mode";
import { ALL_AREAS, AREA_META, getArea, type LifeArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";
import { DEFAULT_CHILD_COLOR, DEFAULT_MEMBER_COLOR } from "@/lib/palette";

export type CalCategory = "privat" | "relationer" | "barn" | "jobb" | "studier";

const CATEGORIES: { id: CalCategory; label: string; color: string }[] = [
  { id: "privat", label: "Privat", color: "hsl(258 62% 60%)" },
  { id: "relationer", label: "Relationer", color: "hsl(327 62% 62%)" },
  { id: "barn", label: "Barn", color: "hsl(285 52% 62%)" },
  { id: "jobb", label: "Jobb", color: "hsl(212 48% 52%)" },
  { id: "studier", label: "Studier", color: "hsl(232 58% 64%)" },
];

const ALL_CATEGORIES: CalCategory[] = CATEGORIES.map((c) => c.id);

/**
 * Kategorin "Familj" heter numera "Relationer". Gamla sparade filter och
 * händelser mappas om så att historiken i kalendern behåller sitt sammanhang.
 */
function normalizeCategory(value: string): CalCategory {
  if (value === "familj" || value === "family") return "relationer";
  return (ALL_CATEGORIES as string[]).includes(value) ? (value as CalCategory) : "privat";
}

/** "Dag 2 av 7" för en längre period, så att man ser var i resan man är. */
function periodDayLabel(
  start: string,
  end: string,
  current: string,
  t: (s: string) => string,
): string {
  const day = (iso: string) => parseISODate(iso).getTime();
  const oneDay = 86_400_000;
  const total = Math.round((day(end) - day(start)) / oneDay) + 1;
  const index = Math.min(Math.max(Math.round((day(current) - day(start)) / oneDay) + 1, 1), total);
  return `${t("dag")} ${index} ${t("av")} ${total}`;
}

/** Valbara påminnelser innan en händelse börjar. */
const REMIND_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Ingen" },
  { value: 0, label: "Vid start" },
  { value: 10, label: "10 min innan" },
  { value: 30, label: "30 min innan" },
  { value: 60, label: "1 tim innan" },
  { value: 1440, label: "1 dag innan" },
];

type CalView = "manad" | "vecka" | "dag";

/** YYYY-MM-DD i lokal tid */
function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Måndagen i veckan för ett givet datum */
function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = copy.getDay() === 0 ? 6 : copy.getDay() - 1;
  copy.setDate(copy.getDate() - wd);
  return copy;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

function useFamilyEventsByDate() {
  const { isSignedIn } = useUser();
  const { data: household } = useGetMyHousehold({
    query: { queryKey: getGetMyHouseholdQueryKey(), enabled: !!isSignedIn },
  });
  const { data: events = [] } = useListFamilyEvents({
    query: { queryKey: getListFamilyEventsQueryKey(), enabled: !!isSignedIn && !!household?.id },
  });
  const members = household?.members ?? [];

  const eventsForDate = (dateStr: string) =>
    events
      .filter((e) => e.date === dateStr)
      .map((e) => ({
        ...e,
        member: members.find((m) => m.id === e.memberId),
      }));

  return { eventsForDate, hasHousehold: !!household?.id, isSignedIn: !!isSignedIn };
}

export function CalendarContent() {
  // Page-lifetime only: keep the same unfinished registration across planner view remounts.
  const [impactDraft, setImpactDraft] = useState<CalendarImpactDraft | null>(null);
  const { t, locale } = useLang();
  const { currentFocus } = useFocus();
  const { activeTasks, completedTasks, deleteTask, addTask, updateTask } = useTasks();
  const { activeReminders, addReminder, deleteReminder, updateReminder } = useReminders();
  const { eventsForDate, hasHousehold } = useFamilyEventsByDate();
  const {
    children: kids,
    items: childItems,
    addItem: addChildItem,
    deleteItem: deleteChildItem,
  } = useChildren();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useCloudSyncedStorage<CalView>("myflove-calendar-view", "manad");
  /** Bildstöd: stora symboler per händelse i dagsvyn. */
  const { settings: npfSettings } = useNpfSettings();
  const [pictoStored, setPictoMode] = useCloudSyncedStorage<boolean>(
    "myflove-calendar-pictograms",
    false,
  );
  // Globalt bildstöd (Anpassa appen) slår på symboler överallt där det finns.
  const pictoMode = pictoStored || npfSettings.pictograms;
  const [visible, setVisible] = useCloudSyncedStorage<CalCategory[]>(
    "myflove-calendar-categories",
    ALL_CATEGORIES,
  );
  // Rutiner ("myflove-routines") visas som återkommande hållpunkter i kalendern.
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  // Migrerar gamla filter ("familj") en gång, utan att tappa vad du valt.
  useEffect(() => {
    if (!visible.some((c) => (c as string) === "familj")) return;
    setVisible((prev) => Array.from(new Set(prev.map((c) => normalizeCategory(c as string)))));
  }, [visible, setVisible]);

  const shows = (c: CalCategory) => visible.includes(c);
  const toggleCategory = (c: CalCategory) =>
    setVisible((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toLocaleDateString("sv-SE").split(" ")[0], // fallback format YYYY-MM-DD
  );
  // Den förenklade dagvyn är kalenderns enda primära dagpresentation.
  const allInDay = true;
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  // Inline lägg-till-flöde för den valda dagen – ingen separat dialog.
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderRepeat, setNewReminderRepeat] = useState<
    "none" | "daily" | "weekdays" | "weekly"
  >("none");
  const [editing, setEditing] = useState<{
    kind: "reminder" | "task";
    id: string;
    title: string;
    date: string;
    time: string;
    endTime: string;
    remind: number | null;
    note: string;
    area: LifeArea;
    repeat: "none" | "daily" | "weekdays" | "weekly";
  } | null>(null);

  /**
   * Redigering av en sammanfogad barnhändelse: här byter man vilka barn som
   * ingår i efterhand, utan att skapa om händelsen.
   */
  const [editChildGroup, setEditChildGroup] = useState<{
    title: string;
    time: string | null;
    date: string;
    note: string | null;
    items: Array<(typeof childItems)[number]>;
  } | null>(null);
  const [editChildIds, setEditChildIds] = useState<string[]>([]);
  const [savingChildGroup, setSavingChildGroup] = useState(false);

  const openChildGroupEditor = (group: Array<(typeof childItems)[number]>) => {
    const first = group[0]!;
    setEditChildGroup({
      title: first.title,
      time: first.time,
      date: first.date ?? selectedDateStr,
      note: first.notes,
      items: group,
    });
    setEditChildIds(group.map((g) => g.child_id));
  };

  const saveChildGroup = async () => {
    if (!editChildGroup) return;
    if (editChildIds.length === 0) {
      toast({
        description: t("Välj minst ett barn – annars tar du bort händelsen."),
        variant: "destructive",
      });
      return;
    }
    setSavingChildGroup(true);
    try {
      const existing = editChildGroup.items;
      const removed = existing.filter((i) => !editChildIds.includes(i.child_id));
      const existingIds = existing.map((i) => i.child_id);
      const added = editChildIds.filter((id) => !existingIds.includes(id));

      for (const item of removed) await deleteChildItem(item);
      for (const childId of added) {
        await addChildItem({
          childId,
          kind: "activity",
          title: editChildGroup.title,
          date: editChildGroup.date,
          time: editChildGroup.time ?? undefined,
          notes: editChildGroup.note ?? undefined,
        });
      }
      toast({ description: t("Uppdaterat vilka barn som ingår.") });
      setEditChildGroup(null);
    } catch {
      toast({ description: t("Kunde inte spara ändringen. Försök igen."), variant: "destructive" });
    } finally {
      setSavingChildGroup(false);
    }
  };

  const createEventMutation = useCreateFamilyEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyEventsQueryKey() });
        setIsAddingEvent(false);
        setNewEventTitle("");
        setNewEventTime("");
      },
      onError: () =>
        toast({ description: t("Något gick fel. Försök igen."), variant: "destructive" }),
    },
  });

  const deleteEventMutation = useDeleteFamilyEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyEventsQueryKey() });
      },
    },
  });

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !selectedDateStr) return;
    createEventMutation.mutate({
      data: {
        title: newEventTitle.trim(),
        date: selectedDateStr,
        time: newEventTime || null,
      },
    });
  };

  const handleQuickAdd = (result: QuickAddResult) => {
    addTask(result.title, result.dueDate, {
      time: result.time,
      completed: result.completed,
      completedAt: result.completedAt,
    });
  };

  const stepBack = () => {
    if (view === "manad") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const next = addDays(currentDate, view === "vecka" ? -7 : -1);
      setCurrentDate(next);
      setSelectedDateStr(fmtDate(next));
    }
  };

  const stepForward = () => {
    if (view === "manad") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const next = addDays(currentDate, view === "vecka" ? 7 : 1);
      setCurrentDate(next);
      setSelectedDateStr(fmtDate(next));
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentDate.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  const todayStr = new Date().toLocaleDateString("sv-SE").split(" ")[0];

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    fmtDate(addDays(startOfWeek(currentDate), i)),
  );
  const currentWeekNo = isoWeekNumber(currentDate);
  const periodLabel =
    view === "manad"
      ? monthName
      : view === "vecka"
        ? `v. ${currentWeekNo} · ${new Date(`${weekDays[0]}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} – ${new Date(`${weekDays[6]}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}`
        : `${currentDate.toLocaleDateString("sv-SE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })} · v. ${currentWeekNo}`;

  const allTasks = [...activeTasks, ...completedTasks];

  /** Vilken kategori en uppgift hör till. */
  const taskCategory = (area?: string): CalCategory =>
    area === "jobb" ? "jobb" : area === "studier" ? "studier" : "privat";

  const getItemsForDate = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    const focus = isToday && shows("privat") ? currentFocus : null;
    // En aktivitet visas alltid på sitt valda datum. Statusändring påverkar
    // bara completed/completedAt och kan aldrig flytta posten till idag.
    const tasks = allTasks.filter((t) => t.dueDate === dateStr && shows(taskCategory(t.area)));
    const allReminders = shows("privat")
      ? activeReminders.filter(
          (r) =>
            occursOn(r.date, r.repeat ?? "none", dateStr) ||
            (!!r.endDate && dateStr >= r.date && dateStr <= r.endDate),
        )
      : [];
    const familyEvents = shows("relationer") ? eventsForDate(dateStr) : [];
    const allChildEvents = shows("barn")
      ? childItems
          .filter((i) => occursOn(i.date, (i.repeat ?? "none") as RepeatMode, dateStr) && !((i.repeat ?? "none") !== "none" && (repeatUntilFromNotes(i.notes) ?? "9999") < dateStr))
          .map((i) => ({ ...i, child: kids.find((c) => c.id === i.child_id) }))
      : [];

    // Återkommande poster (som inte startar just denna dag) visas som prick, inte som händelse
    const isRecurringEcho = (date: string | null | undefined, repeat?: string | null) =>
      !!repeat && repeat !== "none" && date !== dateStr;

    const reminders = allReminders.filter((r) => !isRecurringEcho(r.date, r.repeat));
    const childEvents = allChildEvents.filter(
      (e) => !isRecurringEcho(e.date, e.repeat as string | null),
    );
    const recurring = [
      ...allReminders
        .filter((r) => isRecurringEcho(r.date, r.repeat))
        .map((r) => ({
          id: `r-${r.id}`,
          title: r.title,
          time: r.time ?? "",
          color: undefined as string | undefined,
        })),
      ...allChildEvents
        .filter((e) => isRecurringEcho(e.date, e.repeat as string | null))
        .map((e) => ({
          id: `c-${e.id}`,
          title: e.title,
          time: e.time ?? "",
          color: e.child?.color ?? DEFAULT_CHILD_COLOR,
        })),
      // Rutiner – återkommande aktiviteter med repetitionsregel – visas på
      // alla dagar där regeln infaller, inte bara på startdatumet.
      ...routines
        .filter((r) => r.enabled && routineOccursOn(r, dateStr))
        .map((r) => ({
          id: `ro-${r.id}`,
          title: r.title,
          time: r.time ?? "",
          color: "hsl(258 62% 60%)",
        })),
    ];

    return { focus, tasks, reminders, familyEvents, childEvents, recurring };
  };

  const days: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    // YYYY-MM-DD local format
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }

  const selectedItems = selectedDateStr
    ? getItemsForDate(selectedDateStr)
    : {
        focus: null,
        tasks: [],
        reminders: [],
        familyEvents: [] as ReturnType<typeof eventsForDate>,
        childEvents: [] as Array<(typeof childItems)[number] & { child?: (typeof kids)[number] }>,
        recurring: [] as Array<{ id: string; title: string; time: string; color?: string }>,
      };

  // Dagens aktiviteter med tid som kan skickas till det kopplade kalenderkontot.
  const pushItems: CalendarPushItem[] = selectedDateStr
    ? allTasks
        .filter((task) => task.dueDate === selectedDateStr && !task.completed)
        .map((task) => ({
          title: task.title,
          date: selectedDateStr,
          time: task.time,
          endTime: task.endTime,
        }))
    : [];

  const selectedSharedEvents: FlowItem[] = selectedItems.familyEvents.map((event) => ({
    id: `f-${event.id}`,
    title: event.title,
    time: event.time ?? undefined,
    source: "kalender",
    area: "socialt",
    emoji: pictoMode ? pictogramFor(event.title, "👨‍👩‍👧") : "👨‍👩‍👧",
    priority: "idag",
    done: false,
    completable: false,
    href: "/familj",
  }));

  return (
    <CalendarPlanner
      onDateChange={setSelectedDateStr}
      weekGoals={<WeekGoals />}
      checkin={<ImpactCheckin calendarMobile draft={impactDraft} onDraftChange={setImpactDraft} />}
      connection={selectedDateStr ? <CalendarAccount date={selectedDateStr} itemsToPush={pushItems} /> : null}
      tools={<>
            {selectedDateStr && (
              <div className="animate-in fade-in slide-in-from-bottom-4 mt-5 space-y-4 border-t border-border/60 pt-5 duration-500">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="min-w-0 truncate text-lg font-medium sm:text-xl">
                    {selectedDateStr === todayStr
                      ? t("Idag")
                      : parseISODate(selectedDateStr).toLocaleDateString(locale, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                  </h3>
                  <div className="pace-calendar-actions flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setQuickAddOpen((prev) => !prev)}
                      aria-expanded={quickAddOpen}
                      className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        quickAddOpen
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                      }`}
                    >
                      <Plus size={16} /> {t("Lägg till")}
                    </button>
                    <button
                      onClick={() => setIsAddingReminder(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-colors bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                    >
                      <Plus size={16} className="text-primary" />
                      {t("Påminnelse")}
                    </button>
                    <CopyDayButton date={selectedDateStr} />
                    <button
                      onClick={() => setPictoMode(!pictoMode)}
                      aria-pressed={pictoMode}
                      title={t("Visa stora symboler för varje händelse")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                        pictoMode
                          ? "bg-accent/30 border-accent/40 text-foreground"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <span aria-hidden>🖼️</span>
                      {t("Bildstöd")}
                    </button>
                  </div>
                </div>

                {quickAddOpen && (
                  <QuickAddInline
                    key={selectedDateStr}
                    date={selectedDateStr}
                    onAdd={(result) => {
                      handleQuickAdd(result);
                      setQuickAddOpen(false);
                    }}
                    onClose={() => setQuickAddOpen(false)}
                  />
                )}


                {allInDay && (
                  <div className="rounded-3xl border border-border/60 bg-card px-4 shadow-soft sm:px-5">
                    <DailyFlowList date={selectedDateStr} extraItems={selectedSharedEvents} />
                  </div>
                )}

                {!allInDay &&
                  !selectedItems.focus &&
                  selectedItems.tasks.length === 0 &&
                  selectedItems.reminders.length === 0 &&
                  selectedItems.familyEvents.length === 0 &&
                  selectedItems.childEvents.length === 0 &&
                  selectedItems.recurring.length === 0 && (
                    <div className="text-center py-10 bg-card/50 border border-border/50 rounded-3xl text-muted-foreground">
                      <MyFloveEmptyIllustration kind="calendar" className="mb-2 block" />
                      {t("Inget inplanerat denna dag.")}
                    </div>
                  )}

                {!allInDay && selectedItems.recurring.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("Återkommande")}
                    </span>
                    {selectedItems.recurring.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/50 text-xs text-muted-foreground"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: r.color ?? "hsl(var(--primary))" }}
                        />
                        {pictoMode && <span aria-hidden>{pictogramFor(r.title, "🔁")}</span>}
                        <span className="font-display text-lg font-semibold leading-none">{r.title}</span>
                        {r.time && ` · ${r.time}`}
                      </span>
                    ))}
                  </div>
                )}

                {!allInDay && (
                  <div className="space-y-3">
                    {/* Samma händelse för flera barn (t.ex. lämning av Bella och Bianca) visas ihop. */}
                    {(() => {
                      type ChildEv = (typeof selectedItems.childEvents)[number];
                      const groups = new Map<string, ChildEv[]>();
                      for (const e of selectedItems.childEvents) {
                        const key = `${e.title}|${e.time ?? ""}|${e.completed ? 1 : 0}`;
                        groups.set(key, [...(groups.get(key) ?? []), e]);
                      }
                      return Array.from(groups.values());
                    })().map((group) => {
                      const e = group[0]!;
                      const names = group.map((g) => g.child?.name ?? t("Barn"));
                      const color =
                        group.length > 1
                          ? DEFAULT_CHILD_COLOR
                          : (e.child?.color ?? DEFAULT_CHILD_COLOR);
                      return (
                        <div
                          key={`child-${e.id}`}
                          className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl"
                        >
                          <Link href="/barn" className="flex items-center gap-4 min-w-0 flex-1">
                            {pictoMode ? (
                              <span className="text-3xl leading-none shrink-0" aria-hidden>
                                {pictogramFor(e.title, "🐣")}
                              </span>
                            ) : (
                              <Baby style={{ color }} size={24} />
                            )}
                            <div className="min-w-0">
                              <div
                                className="text-xs font-medium uppercase tracking-wider mb-0.5"
                                style={{ color }}
                              >
                                {names.join(" & ")} {e.time && `${t("kl")} ${e.time}`}
                                {e.sharedWith.length > 0 && ` · ${t("delad")}`}
                              </div>
                              <div
                                 className={`font-display truncate text-2xl font-semibold leading-tight ${e.completed ? "line-through opacity-60" : ""}`}
                              >
                                {e.title}
                              </div>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openChildGroupEditor(group)}
                            className="shrink-0 text-xs font-medium px-3 py-2 rounded-full bg-secondary/60 hover:bg-secondary transition-colors"
                          >
                            {t("Ändra barn")}
                          </button>
                        </div>
                      );
                    })}

                    {selectedItems.familyEvents.map((e) => (
                      <div
                        key={`fam-${e.id}`}
                        className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl group"
                      >
                        <div className="flex items-center gap-4">
                          {pictoMode ? (
                            <span className="text-3xl leading-none shrink-0" aria-hidden>
                              {pictogramFor(e.title, "👨‍👩‍👧")}
                            </span>
                          ) : (
                            <Users
                              style={{ color: e.member?.color ?? DEFAULT_MEMBER_COLOR }}
                              size={24}
                            />
                          )}
                          <div>
                            <div
                              className="text-xs font-medium uppercase tracking-wider mb-0.5"
                              style={{ color: e.member?.color ?? DEFAULT_MEMBER_COLOR }}
                            >
                              {e.member?.displayName ?? t("Familj")}{" "}
                              {e.time && `${t("kl")} ${e.time}`}
                            </div>
                             <div className="font-display break-words text-2xl font-semibold leading-tight">{e.title}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEventMutation.mutate({ id: e.id })}
                          aria-label={t("Ta bort familjehändelse")}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}

                    {selectedItems.focus && (
                      <div className="flex items-center gap-4 p-4 bg-accent/20 border border-accent/30 rounded-2xl">
                        {pictoMode ? (
                          <span className="text-3xl leading-none shrink-0" aria-hidden>
                            {pictogramFor(selectedItems.focus.text, "🎯")}
                          </span>
                        ) : (
                          <Target className="text-accent-foreground" size={24} />
                        )}
                        <div>
                          <div className="text-xs text-accent-foreground font-medium uppercase tracking-wider mb-0.5">
                            {t("Viktigast idag")}
                          </div>
                           <div className="font-display break-words text-2xl font-semibold leading-tight">{selectedItems.focus.text}</div>
                        </div>
                      </div>
                    )}

                    {selectedItems.reminders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {pictoMode ? (
                            <span className="text-3xl leading-none shrink-0" aria-hidden>
                              {pictogramFor(r.title, "🔔")}
                            </span>
                          ) : (
                            <Bell className="text-primary shrink-0" size={24} />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                              {r.endDate
                                ? `${t("Period")} · ${periodDayLabel(r.date, r.endDate, selectedDateStr, t)}`
                                : t("Påminnelse")}{" "}
                              {r.time && `kl ${r.time}${r.endTime ? `–${r.endTime}` : ""}`}
                            </div>
                             <div className="font-display truncate text-2xl font-semibold leading-tight">{r.title}</div>
                            {r.note && (
                              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                                <LinkifiedText text={r.note} />
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setEditing({
                                kind: "reminder",
                                id: r.id,
                                title: r.title,
                                date: r.date,
                                time: r.time ?? "",
                                endTime: r.endTime ?? "",
                                remind: r.remindMinutesBefore ?? null,
                                note: r.note ?? "",
                                area: "vardag",
                                repeat: r.repeat ?? "none",
                              })
                            }
                            aria-label={t("Ändra påminnelse")}
                            className="px-3 py-2 text-sm text-primary rounded-xl hover:bg-primary/10"
                          >
                            {t("Ändra")}
                          </button>
                          <button
                            onClick={() => deleteReminder(r.id)}
                            aria-label={t("Ta bort påminnelse")}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedItems.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl ${task.completed ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {pictoMode ? (
                            <span className="text-3xl leading-none shrink-0" aria-hidden>
                              {pictogramFor(task.title, "✅")}
                            </span>
                          ) : (
                            <CheckSquare
                              className={task.completed ? "text-primary" : "text-muted-foreground"}
                              size={24}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            {task.time && (
                              <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                                {t("kl")} {task.time}
                                {task.endTime ? `–${task.endTime}` : ""}
                                {task.reminderMinutesBefore != null &&
                                  ` · ${t("påminn")} ${task.reminderMinutesBefore} ${t("min innan")}`}
                              </div>
                            )}
                            <div
                               className={`font-display truncate text-2xl font-semibold leading-tight ${task.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.title}
                            </div>
                            {task.note && (
                              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                                <LinkifiedText text={task.note} />
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setEditing({
                                kind: "task",
                                id: task.id,
                                title: task.title,
                                date: task.dueDate ?? selectedDateStr,
                                time: task.time ?? "",
                                endTime: task.endTime ?? "",
                                remind: task.reminderMinutesBefore ?? null,
                                note: task.note ?? "",
                                area: getArea(task),
                                repeat: "none",
                              })
                            }
                            aria-label={t("Ändra uppgift")}
                            className="px-3 py-2 text-sm text-primary rounded-xl hover:bg-primary/10"
                          >
                            {t("Ändra")}
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            aria-label={t("Ta bort uppgift")}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>{t("Ny påminnelse")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Vad ska du komma ihåg?")}</label>
                <Input
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder={t("T.ex. Möte med chefen")}
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Tid (valfritt)")}</label>
                <Input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Upprepa")}</label>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                  {(
                    [
                      ["none", "Bara en gång"],
                      ["daily", "Varje dag"],
                      ["weekdays", "Vardagar"],
                      ["weekly", "Varje vecka"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewReminderRepeat(val)}
                      className={`h-11 rounded-2xl text-sm font-medium border transition-all ${
                        newReminderRepeat === val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                      }`}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!newReminderTitle.trim() || !selectedDateStr) return;
                  if (newReminderTime && getNotificationPermission() === "default") {
                    await requestNotificationPermission();
                  }
                  addReminder(
                    newReminderTitle.trim(),
                    selectedDateStr,
                    newReminderTime || undefined,
                    newReminderRepeat,
                  );
                  setNewReminderTitle("");
                  setNewReminderTime("");
                  setNewReminderRepeat("none");
                  setIsAddingReminder(false);
                }}
                disabled={!newReminderTitle.trim()}
                className="w-full h-12 rounded-2xl"
              >
                {t("Lägg till")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>{t("Ny familjehändelse")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Titel")}</label>
                <Input
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={t("T.ex. Fotbollsträning")}
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Tid (valfritt)")}</label>
                <Input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>
              <Button
                onClick={handleAddEvent}
                disabled={!newEventTitle.trim() || createEventMutation.isPending}
                className="w-full h-12 rounded-2xl"
              >
                {t("Lägg till")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {editing?.kind === "task" ? t("Ändra uppgift") : t("Ändra påminnelse")}
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("Vad gäller det?")}</label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("Datum")}</label>
                  <Input
                    type="date"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Börjar (valfritt)")}</label>
                    <Input
                      type="time"
                      value={editing.time}
                      onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Slutar (valfritt)")}</label>
                    <Input
                      type="time"
                      value={editing.endTime}
                      onChange={(e) => setEditing({ ...editing, endTime: e.target.value })}
                      className="h-12 rounded-2xl"
                      disabled={!editing.time}
                    />
                  </div>
                </div>

                {editing.time && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Påminnelse")}</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {REMIND_OPTIONS.map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setEditing({ ...editing, remind: opt.value })}
                          className={`h-11 rounded-2xl text-xs font-medium border transition-all ${
                            editing.remind === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                          }`}
                        >
                          {t(opt.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editing.kind === "task" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Vart hör det hemma?")}</label>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                      {ALL_AREAS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setEditing({ ...editing, area: a })}
                          className={`h-11 rounded-2xl text-sm font-medium border transition-all ${
                            editing.area === a
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                          }`}
                        >
                          {AREA_META[a].emoji} {t(AREA_META[a].label)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editing.kind === "reminder" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Upprepa")}</label>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                      {(
                        [
                          ["none", "Bara en gång"],
                          ["daily", "Varje dag"],
                          ["weekdays", "Vardagar"],
                          ["weekly", "Varje vecka"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditing({ ...editing, repeat: val })}
                          className={`h-11 rounded-2xl text-sm font-medium border transition-all ${
                            editing.repeat === val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                          }`}
                        >
                          {t(label)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("Anteckning (valfritt)")}</label>
                  <textarea
                    value={editing.note}
                    onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                    rows={2}
                    placeholder={t("Skriv vad det gäller, vad du behöver ta med…")}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (editing.kind === "reminder") deleteReminder(editing.id);
                      else deleteTask(editing.id);
                      setEditing(null);
                      toast({ description: t("Borttagen.") });
                    }}
                    className="flex-1 h-12 rounded-2xl text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" /> {t("Ta bort")}
                  </Button>
                  <Button
                    onClick={() => {
                      const time = editing.time || undefined;
                      if (editing.kind === "reminder") {
                        updateReminder(editing.id, {
                          title: editing.title.trim() || "Påminnelse",
                          date: editing.date,
                          time,
                          endTime: time ? editing.endTime || undefined : undefined,
                          repeat: editing.repeat,
                          remindMinutesBefore: time ? (editing.remind ?? undefined) : undefined,
                          note: editing.note,
                        });
                      } else {
                        updateTask(editing.id, {
                          title: editing.title,
                          dueDate: editing.date,
                          time,
                          endTime: time ? editing.endTime || undefined : undefined,
                          reminderMinutesBefore: time ? (editing.remind ?? undefined) : undefined,
                          area: editing.area,
                          note: editing.note,
                        });
                      }
                      setEditing(null);
                      toast({ description: t("Sparat ✨") });
                    }}
                    className="flex-1 h-12 rounded-2xl"
                  >
                    {t("Spara")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Ändra vilka barn som ingår i en redan sparad, sammanfogad händelse. */}
      <Dialog open={!!editChildGroup} onOpenChange={(open) => !open && setEditChildGroup(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("Vilka barn ingår?")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {editChildGroup?.title}
              {editChildGroup?.time ? ` · ${t("kl")} ${editChildGroup.time}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => {
                const selected = editChildIds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setEditChildIds((prev) =>
                        prev.includes(k.id) ? prev.filter((id) => id !== k.id) : [...prev, k.id],
                      )
                    }
                    className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? "text-primary-foreground border-transparent"
                        : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                    }`}
                    style={selected ? { backgroundColor: k.color } : undefined}
                  >
                    {selected ? "✓ " : ""}
                    {k.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Lägg till eller ta bort barn – händelsen finns kvar, den flyttar bara in i rätt barns schema.",
              )}
            </p>
            <Button
              onClick={saveChildGroup}
              disabled={savingChildGroup}
              className="w-full h-12 rounded-2xl"
            >
              {savingChildGroup ? t("Sparar…") : t("Spara")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>} />
  );
}

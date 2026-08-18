import { useRef, useState } from "react";
import Layout from "@/components/layout";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { useFocus, useTasks, useReminders } from "@/hooks/use-data";
import { useChildren } from "@/hooks/use-children";
import { Link } from "wouter";
import { CheckSquare, Target, Bell, ChevronLeft, ChevronRight, Trash2, Users, Plus, Download, Upload, Baby } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/push-notifications";
import { downloadIcs, parseIcs, type IcsEvent } from "@/lib/ics";
import { occursOn, REPEAT_LABELS, type RepeatMode } from "@/lib/recurrence";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CollapsibleSection from "@/components/collapsible-section";
import DayTimeline from "@/components/day-timeline";
import { useLocalStorage } from "@/lib/storage";
import { pictogramFor } from "@/lib/pictograms";
import { useNpfSettings } from "@/lib/npf-mode";

export type CalCategory = "privat" | "familj" | "barn" | "jobb" | "studier";

const CATEGORIES: { id: CalCategory; label: string; color: string }[] = [
  { id: "privat", label: "Privat", color: "hsl(258 62% 60%)" },
  { id: "familj", label: "Familj", color: "hsl(327 62% 62%)" },
  { id: "barn", label: "Barn", color: "hsl(285 52% 62%)" },
  { id: "jobb", label: "Jobb", color: "hsl(212 48% 52%)" },
  { id: "studier", label: "Studier", color: "hsl(232 58% 64%)" },
];

const ALL_CATEGORIES: CalCategory[] = CATEGORIES.map((c) => c.id);

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

export default function CalendarPage() {
  const { currentFocus } = useFocus();
  const { activeTasks, completedTasks, deleteTask, setTaskTime, addTask } = useTasks();
  const { activeReminders, addReminder, deleteReminder, updateReminder } = useReminders();
  const { eventsForDate, hasHousehold } = useFamilyEventsByDate();
  const { children: kids, items: childItems, addItem: addChildItem } = useChildren();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useLocalStorage<CalView>("myflove-calendar-view", "manad");
  /** Bildstöd: stora symboler per händelse i dagsvyn. */
  const { settings: npfSettings } = useNpfSettings();
  const [pictoStored, setPictoMode] = useLocalStorage<boolean>("myflove-calendar-pictograms", false);
  // Globalt bildstöd (Anpassa appen) slår på symboler överallt där det finns.
  const pictoMode = pictoStored || npfSettings.pictograms;
  const [visible, setVisible] = useLocalStorage<CalCategory[]>(
    "myflove-calendar-categories",
    ALL_CATEGORIES,
  );
  const shows = (c: CalCategory) => visible.includes(c);
  const toggleCategory = (c: CalCategory) =>
    setVisible((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toLocaleDateString('sv-SE').split(' ')[0] // fallback format YYYY-MM-DD
  );
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingAny, setIsAddingAny] = useState(false);
  const [newCat, setNewCat] = useState<CalCategory>("privat");
  const [newAnyTitle, setNewAnyTitle] = useState("");
  const [newAnyTime, setNewAnyTime] = useState("");
  const [newAnyEndTime, setNewAnyEndTime] = useState("");
  /** Fri anteckning – vad det handlar om, vad man behöver ta med. */
  const [newAnyNote, setNewAnyNote] = useState("");

  /** Påminnelse innan start: null = ingen, annars minuter före (0 = vid start). */
  const [newAnyRemind, setNewAnyRemind] = useState<number | null>(null);
  const [newAnyChildId, setNewAnyChildId] = useState<string>("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderRepeat, setNewReminderRepeat] = useState<"none" | "daily" | "weekdays" | "weekly">("none");
  const [editing, setEditing] = useState<
    | { kind: "reminder"; id: string; title: string; time: string; repeat: "none" | "daily" | "weekdays" | "weekly" }
    | { kind: "task"; id: string; title: string; time: string }
    | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleExportAll = () => {
    const events: IcsEvent[] = [];
    for (const r of activeReminders) {
      events.push({ title: r.title, date: r.date, time: r.time, uid: `reminder-${r.id}@myflow` });
    }
    for (const t of allTasks) {
      if (t.dueDate) events.push({ title: t.title, date: t.dueDate, time: t.time, uid: `task-${t.id}@myflow` });
    }
    if (currentFocus) {
      events.push({ title: `Fokus: ${currentFocus.text}`, date: todayStr, uid: `focus-${todayStr}@myflow` });
    }
    if (events.length === 0) {
      toast({ description: "Inget att exportera ännu." });
      return;
    }
    downloadIcs(events, "myflow-kalender.ics");
    toast({ description: `Exporterade ${events.length} händelser. Öppna filen i din kalenderapp.` });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const events = parseIcs(text);
      if (events.length === 0) {
        toast({ description: "Hittade inga händelser i filen.", variant: "destructive" });
        return;
      }
      let added = 0;
      for (const e of events) {
        addReminder(e.title, e.date, e.time);
        added++;
      }
      toast({ description: `Importerade ${added} händelser till kalendern.` });
    } catch {
      toast({ description: "Kunde inte läsa filen. Kontrollera att det är en .ics-fil.", variant: "destructive" });
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
      onError: () => toast({ description: "Något gick fel. Försök igen.", variant: "destructive" }),
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

  /** Skapar en händelse i vald kategori på vald dag. */
  const handleAddAny = async () => {
    const title = newAnyTitle.trim();
    if (!title || !selectedDateStr) return;
    const time = newAnyTime || undefined;
    const endTime = newAnyEndTime || undefined;
    /** Fritextfält (familj/barn) lagrar intervallet som "09:00–10:00". */
    const timeRange = time && endTime ? `${time}–${endTime}` : (newAnyTime || null);
    const note = newAnyNote.trim() || undefined;
    try {
      const wantsReminder = Boolean(time) && newAnyRemind !== null;
      if (wantsReminder && getNotificationPermission() === "default") {
        await requestNotificationPermission();
      }
      if (newCat === "familj") {
        createEventMutation.mutate({
          data: { title, date: selectedDateStr, time: timeRange },
        });
      } else if (newCat === "barn") {
        const childId = newAnyChildId || kids[0]?.id;
        if (!childId) {
          toast({ description: "Lägg till ett barn först på sidan Barn.", variant: "destructive" });
          return;
        }
        await addChildItem({ childId, kind: "activity", title, date: selectedDateStr, time: timeRange ?? undefined, notes: note });
      } else if (newCat === "jobb" || newCat === "studier") {
        addTask(title, selectedDateStr, {
          time,
          endTime,
          note,
          area: newCat,
          reminderMinutesBefore: wantsReminder ? newAnyRemind ?? 0 : undefined,
        });
      } else {
        addReminder(title, selectedDateStr, time, "none", endTime, wantsReminder ? newAnyRemind ?? 0 : undefined, note);
      }
      // Familj- och barnhändelser bor i delade listor – lägg en personlig
      // påminnelse bredvid så att notisen faktiskt når just dig.
      if (wantsReminder && (newCat === "familj" || newCat === "barn")) {
        addReminder(title, selectedDateStr, time, "none", endTime, newAnyRemind ?? 0, note);
      }
      if (!visible.includes(newCat)) setVisible((prev) => [...prev, newCat]);
      setNewAnyTitle("");
      setNewAnyTime("");
      setNewAnyEndTime("");
      setNewAnyNote("");
      setNewAnyRemind(null);
      setIsAddingAny(false);

      toast({ description: "Händelsen är inlagd i kalendern." });
    } catch {
      toast({ description: "Kunde inte spara händelsen. Försök igen.", variant: "destructive" });
    }
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

  const monthName = currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('sv-SE').split(' ')[0];

  const weekDays = Array.from({ length: 7 }, (_, i) => fmtDate(addDays(startOfWeek(currentDate), i)));
  const periodLabel =
    view === "manad"
      ? monthName
      : view === "vecka"
        ? `${new Date(`${weekDays[0]}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} – ${new Date(`${weekDays[6]}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`
        : currentDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const allTasks = [...activeTasks, ...completedTasks];

  /** Vilken kategori en uppgift hör till. */
  const taskCategory = (area?: string): CalCategory =>
    area === "jobb" ? "jobb" : area === "studier" ? "studier" : "privat";

  const getItemsForDate = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    const focus = isToday && shows("privat") ? currentFocus : null;
    const tasks = allTasks.filter(t => t.dueDate === dateStr && shows(taskCategory(t.area)));
    const allReminders = shows("privat")
      ? activeReminders.filter(r => occursOn(r.date, r.repeat ?? 'none', dateStr))
      : [];
    const familyEvents = shows("familj") ? eventsForDate(dateStr) : [];
    const allChildEvents = shows("barn")
      ? childItems
          .filter((i) => occursOn(i.date, (i.repeat ?? 'none') as RepeatMode, dateStr))
          .map((i) => ({ ...i, child: kids.find((c) => c.id === i.child_id) }))
      : [];

    // Återkommande poster (som inte startar just denna dag) visas som prick, inte som händelse
    const isRecurringEcho = (date: string | null | undefined, repeat?: string | null) =>
      !!repeat && repeat !== 'none' && date !== dateStr;

    const reminders = allReminders.filter(r => !isRecurringEcho(r.date, r.repeat));
    const childEvents = allChildEvents.filter(e => !isRecurringEcho(e.date, e.repeat as string | null));
    const recurring = [
      ...allReminders
        .filter(r => isRecurringEcho(r.date, r.repeat))
        .map(r => ({ id: `r-${r.id}`, title: r.title, time: r.time ?? "", color: undefined as string | undefined })),
      ...allChildEvents
        .filter(e => isRecurringEcho(e.date, e.repeat as string | null))
        .map(e => ({ id: `c-${e.id}`, title: e.title, time: e.time ?? "", color: e.child?.color ?? '#a06cd5' })),
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
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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


  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kalender</h1>
          <p className="text-muted-foreground">Översikt över dina dagar. Inga stressiga detaljer.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Upload size={16} />
            Importera från telefonens kalender
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Download size={16} />
            Exportera till kalender (.ics)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-4">
          Tips: exportera i telefonens kalender som .ics och importera här för att få in dina möten i MyFlove.
        </p>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <CollapsibleSection
              title={periodLabel}
              id="månadsöversikt"
              help="Välj månad, vecka eller dag – och kryssa i vilka kategorier du vill se."
              headingClassName="text-xl font-medium capitalize"
              actions={
                <div className="flex items-center gap-1">
                  <button onClick={stepBack} aria-label="Föregående" className="p-2 hover:bg-secondary rounded-xl transition-colors">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={stepForward} aria-label="Nästa" className="p-2 hover:bg-secondary rounded-xl transition-colors">
                    <ChevronRight size={24} />
                  </button>
                </div>
              }
            >
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div role="group" aria-label="Välj vy" className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
              {([["manad", "Månad"], ["vecka", "Vecka"], ["dag", "Dag"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setView(id);
                    if (id !== "manad" && selectedDateStr) setCurrentDate(new Date(`${selectedDateStr}T12:00:00`));
                  }}
                  aria-pressed={view === id}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDateStr(fmtDate(now));
              }}
              className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Idag
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3" role="group" aria-label="Visa kategorier">
            {CATEGORIES.map((c) => {
              const active = shows(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground/60 border-border/50"
                  }`}
                  style={active ? { backgroundColor: `${c.color}22`, borderColor: `${c.color}66` } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? c.color : "hsl(var(--muted-foreground))" }} />
                  {c.label}
                </button>
              );
            })}
          </div>

          {view === "manad" && (
          <div className="pt-2">

            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-muted-foreground">
              <div>Må</div><div>Ti</div><div>On</div><div>To</div><div>Fr</div><div>Lö</div><div>Sö</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((dateStr, index) => {
                if (!dateStr) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const dNum = parseInt(dateStr.split('-')[2], 10);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const items = getItemsForDate(dateStr);
                const hasItems = items.focus || items.tasks.length > 0 || items.reminders.length > 0 || items.familyEvents.length > 0 || items.childEvents.length > 0 || items.recurring.length > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-sm scale-105 z-10 font-bold' 
                        : isToday
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <span className="text-lg">{dNum}</span>
                    {hasItems && (
                      <div className="absolute bottom-1.5 flex gap-1">
                        {items.focus && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />}
                        {items.reminders.length > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-primary'}`} />}
                        {items.tasks.length > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-muted-foreground'}`} />}
                        {items.childEvents.slice(0, 3).map((e, i) => (
                          <div
                            key={`child-${i}`}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? 'white' : (e.child?.color ?? '#a06cd5') }}
                          />
                        ))}
                        {items.familyEvents.slice(0, 3).map((e, i) => (
                          <div
                            key={`fam-${i}`}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? 'white' : (e.member?.color ?? '#8a9a5b') }}
                          />
                        ))}
                        {items.recurring.length > 0 && (
                          <div
                            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-muted-foreground/40'}`}
                            title="Återkommande"
                          />
                        )}

                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {view === "vecka" && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-7 gap-2">
              {weekDays.map((dateStr) => {
                const d = new Date(`${dateStr}T12:00:00`);
                const items = getItemsForDate(dateStr);
                const entries = [
                  ...items.childEvents.map((e) => ({ id: `c-${e.id}`, title: e.title, time: e.time ?? "", color: e.child?.color ?? '#a06cd5' })),
                  ...items.familyEvents.map((e) => ({ id: `f-${e.id}`, title: e.title, time: e.time ?? "", color: e.member?.color ?? '#8a9a5b' })),
                  ...items.reminders.map((r) => ({ id: `r-${r.id}`, title: r.title, time: r.time ?? "", color: 'hsl(var(--primary))' })),
                  ...items.tasks.map((t) => ({ id: `t-${t.id}`, title: t.title, time: t.time ?? "", color: 'hsl(var(--muted-foreground))' })),
                ].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
                const isSelected = dateStr === selectedDateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`text-left rounded-2xl border p-2 min-h-24 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${dateStr === todayStr ? 'text-primary' : 'text-muted-foreground'}`}>
                      {d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="space-y-1">
                      {entries.slice(0, 4).map((e) => (
                        <div key={e.id} className="flex items-center gap-1.5 text-xs text-foreground">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                          <span className="truncate">{e.time && `${e.time} `}{e.title}</span>
                        </div>
                      ))}
                      {entries.length > 4 && (
                        <div className="text-xs text-muted-foreground">+{entries.length - 4} till</div>
                      )}
                      {entries.length === 0 && <div className="text-xs text-muted-foreground/60">–</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

            </CollapsibleSection>
          </div>
        </div>

        {selectedDateStr && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-medium">
                {selectedDateStr === todayStr
                  ? "Idag"
                  : new Date(selectedDateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingAny(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-colors bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                >
                  <Plus size={16} className="text-primary" />
                  Ny händelse
                </button>
                <button
                  onClick={() => setIsAddingReminder(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-colors bg-card border-border text-foreground hover:border-primary/40 hover:bg-secondary/50"
                >
                  <Plus size={16} className="text-primary" />
                  Påminnelse
                </button>
                <button
                  onClick={() => setPictoMode(!pictoMode)}
                  aria-pressed={pictoMode}
                  title="Visa stora symboler för varje händelse"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                    pictoMode
                      ? "bg-accent/30 border-accent/40 text-foreground"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  <span aria-hidden>🖼️</span>
                  Bildstöd
                </button>
              </div>

            </div>
            
            {!selectedItems.focus && selectedItems.tasks.length === 0 && selectedItems.reminders.length === 0 && selectedItems.familyEvents.length === 0 && selectedItems.childEvents.length === 0 && selectedItems.recurring.length === 0 && (
              <div className="text-center py-10 bg-card/50 border border-border/50 rounded-3xl text-muted-foreground">
                <MyFloveEmptyIllustration kind="calendar" className="mb-2 block" />
                Inget inplanerat denna dag.
              </div>
            )}

            {selectedItems.recurring.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Återkommande</span>
                {selectedItems.recurring.map(r => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/50 text-xs text-muted-foreground"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: r.color ?? 'hsl(var(--primary))' }}
                    />
                    {pictoMode && <span aria-hidden>{pictogramFor(r.title, "🔁")}</span>}
                    {r.title}{r.time && ` · ${r.time}`}
                  </span>
                ))}
              </div>
            )}

            {view === "dag" && (
              <DayTimeline
                isToday={selectedDateStr === todayStr}
                entries={[
                  ...selectedItems.childEvents.map((e) => ({
                    id: `c-${e.id}`,
                    title: e.title,
                    time: e.time ?? "",
                    color: e.child?.color ?? "#a06cd5",
                    emoji: pictoMode ? pictogramFor(e.title, "🐣") : undefined,
                  })),
                  ...selectedItems.familyEvents.map((e) => ({
                    id: `f-${e.id}`,
                    title: e.title,
                    time: e.time ?? "",
                    color: e.member?.color ?? "#8a9a5b",
                    emoji: pictoMode ? pictogramFor(e.title, "👨‍👩‍👧") : undefined,
                  })),
                  ...selectedItems.reminders.map((r) => ({
                    id: `r-${r.id}`,
                    title: r.title,
                    time: r.time ?? "",
                    emoji: pictoMode ? pictogramFor(r.title, "🔔") : undefined,
                  })),
                  ...selectedItems.tasks.map((t) => ({
                    id: `t-${t.id}`,
                    title: t.title,
                    time: t.time ?? "",
                    endTime: t.endTime,
                    emoji: pictoMode ? pictogramFor(t.title, "✅") : undefined,
                  })),
                ]}
              />
            )}


            <div className="space-y-3">
              {selectedItems.childEvents.map(e => (
                <Link
                  key={`child-${e.id}`}
                  href="/barn"
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-secondary transition-colors"
                >
                  {pictoMode ? (
                    <span className="text-3xl leading-none shrink-0" aria-hidden>{pictogramFor(e.title, "🐣")}</span>
                  ) : (
                    <Baby style={{ color: e.child?.color ?? '#a06cd5' }} size={24} />
                  )}
                  <div className="min-w-0">
                    <div
                      className="text-xs font-medium uppercase tracking-wider mb-0.5"
                      style={{ color: e.child?.color ?? '#a06cd5' }}
                    >
                      {e.child?.name ?? "Barn"} {e.time && `kl ${e.time}`}
                      {e.sharedWith.length > 0 && " · delad"}
                    </div>
                    <div className={`text-lg font-medium truncate ${e.completed ? 'line-through opacity-60' : ''}`}>{e.title}</div>
                  </div>
                </Link>
              ))}

              {selectedItems.familyEvents.map(e => (
                <div key={`fam-${e.id}`} className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl group">
                  <div className="flex items-center gap-4">
                    {pictoMode ? (
                      <span className="text-3xl leading-none shrink-0" aria-hidden>{pictogramFor(e.title, "👨‍👩‍👧")}</span>
                    ) : (
                      <Users style={{ color: e.member?.color ?? '#8a9a5b' }} size={24} />
                    )}
                    <div>
                      <div
                        className="text-xs font-medium uppercase tracking-wider mb-0.5"
                        style={{ color: e.member?.color ?? '#8a9a5b' }}
                      >
                        {e.member?.displayName ?? "Familj"} {e.time && `kl ${e.time}`}
                      </div>
                      <div className="text-lg font-medium">{e.title}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEventMutation.mutate({ id: e.id })}
                    aria-label="Ta bort familjehändelse"
                    className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 shrink-0"

                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {selectedItems.focus && (
                <div className="flex items-center gap-4 p-4 bg-accent/20 border border-accent/30 rounded-2xl">
                  {pictoMode ? (
                    <span className="text-3xl leading-none shrink-0" aria-hidden>{pictogramFor(selectedItems.focus.text, "🎯")}</span>
                  ) : (
                    <Target className="text-accent-foreground" size={24} />
                  )}
                  <div>
                    <div className="text-xs text-accent-foreground font-medium uppercase tracking-wider mb-0.5">Dagens fokus</div>
                    <div className="text-lg font-medium">{selectedItems.focus.text}</div>
                  </div>
                </div>
              )}

              {selectedItems.reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <div className="flex items-center gap-4 min-w-0">
                    {pictoMode ? (
                      <span className="text-3xl leading-none shrink-0" aria-hidden>{pictogramFor(r.title, "🔔")}</span>
                    ) : (
                      <Bell className="text-primary shrink-0" size={24} />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                        Påminnelse {r.time && `kl ${r.time}${r.endTime ? `–${r.endTime}` : ""}`}
                      </div>
                      <div className="text-lg font-medium truncate">{r.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ kind: "reminder", id: r.id, title: r.title, time: r.time ?? "", repeat: r.repeat ?? "none" })}
                      aria-label="Ändra påminnelse"
                      className="px-3 py-2 text-sm text-primary rounded-xl hover:bg-primary/10"
                    >
                      Ändra
                    </button>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      aria-label="Ta bort påminnelse"
                      className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {selectedItems.tasks.map(t => (
                <div key={t.id} className={`flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl ${t.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    {pictoMode ? (
                      <span className="text-3xl leading-none shrink-0" aria-hidden>{pictogramFor(t.title, "✅")}</span>
                    ) : (
                      <CheckSquare className={t.completed ? "text-primary" : "text-muted-foreground"} size={24} />
                    )}
                    <div className="flex-1 min-w-0">
                      {t.time && (
                        <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                          kl {t.time}{t.endTime ? `–${t.endTime}` : ""}
                          {t.reminderMinutesBefore != null && ` · påminn ${t.reminderMinutesBefore} min innan`}
                        </div>
                      )}
                      <div className={`text-lg font-medium truncate ${t.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {t.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ kind: "task", id: t.id, title: t.title, time: t.time ?? "" })}
                      aria-label="Ändra tid"
                      className="px-3 py-2 text-sm text-primary rounded-xl hover:bg-primary/10"
                    >
                      Ändra tid
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      aria-label="Ta bort uppgift"
                      className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Ny påminnelse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vad ska du komma ihåg?</label>
                <Input
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder="T.ex. Möte med chefen"
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tid (valfritt)</label>
                <Input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upprepa</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["none", "Bara en gång"],
                    ["daily", "Varje dag"],
                    ["weekdays", "Vardagar"],
                    ["weekly", "Varje vecka"],
                  ] as const).map(([val, label]) => (
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
                      {label}
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
                  addReminder(newReminderTitle.trim(), selectedDateStr, newReminderTime || undefined, newReminderRepeat);
                  setNewReminderTitle("");
                  setNewReminderTime("");
                  setNewReminderRepeat("none");
                  setIsAddingReminder(false);
                }}
                disabled={!newReminderTitle.trim()}
                className="w-full h-12 rounded-2xl"
              >
                Lägg till
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Ny familjehändelse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titel</label>
                <Input
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="T.ex. Fotbollsträning"
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tid (valfritt)</label>
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
                Lägg till
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>
                {editing?.kind === "task" ? "Ändra uppgift" : "Ändra påminnelse"}
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 pt-2">
                {editing.kind === "reminder" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titel</label>
                    <Input
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      className="h-12 rounded-2xl"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tid (valfritt)</label>
                  <Input
                    type="time"
                    value={editing.time}
                    onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </div>
                {editing.kind === "reminder" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upprepa</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ["none", "Bara en gång"],
                        ["daily", "Varje dag"],
                        ["weekdays", "Vardagar"],
                        ["weekly", "Varje vecka"],
                      ] as const).map(([val, label]) => (
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
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (editing.kind === "reminder") deleteReminder(editing.id);
                      else deleteTask(editing.id);
                      setEditing(null);
                      toast({ description: "Borttagen." });
                    }}
                    className="flex-1 h-12 rounded-2xl text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" /> Ta bort
                  </Button>
                  <Button
                    onClick={() => {
                      if (editing.kind === "reminder") {
                        updateReminder(editing.id, {
                          title: editing.title.trim() || "Påminnelse",
                          time: editing.time || undefined,
                          repeat: editing.repeat,
                        });
                      } else {
                        setTaskTime(editing.id, editing.time || undefined);
                      }
                      setEditing(null);
                      toast({ description: "Sparat ✨" });
                    }}
                    className="flex-1 h-12 rounded-2xl"
                  >
                    Spara
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingAny} onOpenChange={setIsAddingAny}>
          <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="pr-8 text-left">Ny händelse</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => {
                    const disabled =
                      (c.id === "familj" && !hasHousehold) || (c.id === "barn" && kids.length === 0);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setNewCat(c.id)}
                        title={disabled ? "Kräver familj respektive barn i appen" : undefined}
                        className={`w-full h-11 px-2 rounded-2xl text-sm font-medium border transition-all disabled:opacity-40 ${
                          newCat === c.id ? "text-white border-transparent" : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                        }`}
                        style={newCat === c.id ? { backgroundColor: c.color } : undefined}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {newCat === "barn" && kids.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vilket barn?</label>
                  <div className="flex flex-wrap gap-2">
                    {kids.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setNewAnyChildId(k.id)}
                        className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                          (newAnyChildId || kids[0]?.id) === k.id
                            ? "text-white border-transparent"
                            : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                        }`}
                        style={(newAnyChildId || kids[0]?.id) === k.id ? { backgroundColor: k.color } : undefined}
                      >
                        {k.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Vad händer?</label>
                <Input
                  value={newAnyTitle}
                  onChange={(e) => setNewAnyTitle(e.target.value)}
                  placeholder="T.ex. Tandläkare"
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Starttid (valfritt)</label>
                  <Input
                    type="time"
                    value={newAnyTime}
                    onChange={(e) => setNewAnyTime(e.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sluttid (valfritt)</label>
                  <Input
                    type="time"
                    value={newAnyEndTime}
                    onChange={(e) => setNewAnyEndTime(e.target.value)}
                    disabled={!newAnyTime}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Påminnelse</label>
                {newAnyTime ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {REMIND_OPTIONS.map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setNewAnyRemind(opt.value)}
                          className={`w-full h-11 px-2 rounded-2xl text-sm font-medium border transition-all ${
                            newAnyRemind === opt.value
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Du får en notis innan händelsen börjar – om du vill.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ange en starttid ovan så kan du välja påminnelse.
                  </p>
                )}
              </div>



              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="ny-anteckning">
                  Anteckning (valfritt)
                </label>
                <textarea
                  id="ny-anteckning"
                  value={newAnyNote}
                  onChange={(e) => setNewAnyNote(e.target.value)}
                  rows={3}
                  placeholder="T.ex. ta med remiss, adress, vad mötet gäller"
                  className="w-full rounded-2xl border border-border bg-card p-3 text-base outline-none focus:border-primary"
                />
              </div>


              <p className="text-xs text-muted-foreground">
                Läggs in på {selectedDateStr === todayStr ? "idag" : selectedDateStr}.
              </p>

              <Button
                onClick={handleAddAny}
                disabled={!newAnyTitle.trim()}
                className="w-full h-12 rounded-2xl"
              >
                Lägg till
              </Button>
            </div>
          </DialogContent>
        </Dialog>



      </div>
    </Layout>
  );
}

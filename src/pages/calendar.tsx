import { useRef, useState } from "react";
import Layout from "@/components/layout";
import { useFocus, useTasks, useReminders } from "@/hooks/use-data";
import { CheckSquare, Target, Bell, ChevronLeft, ChevronRight, Trash2, Users, Plus, Download, Upload } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/push-notifications";
import { downloadIcs, parseIcs, type IcsEvent } from "@/lib/ics";
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
  const { activeTasks, completedTasks, deleteTask, setTaskTime } = useTasks();
  const { activeReminders, addReminder, deleteReminder, updateReminder } = useReminders();
  const { eventsForDate, hasHousehold } = useFamilyEventsByDate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toLocaleDateString('sv-SE').split(' ')[0] // fallback format YYYY-MM-DD
  );
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [editing, setEditing] = useState<
    | { kind: "reminder"; id: string; title: string; time: string }
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

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('sv-SE').split(' ')[0];

  const allTasks = [...activeTasks, ...completedTasks];

  const getItemsForDate = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    const focus = isToday ? currentFocus : null;
    const tasks = allTasks.filter(t => t.dueDate === dateStr);
    const reminders = activeReminders.filter(r => r.date === dateStr);
    const familyEvents = eventsForDate(dateStr);

    return { focus, tasks, reminders, familyEvents };
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
    : { focus: null, tasks: [], reminders: [], familyEvents: [] as ReturnType<typeof eventsForDate> };

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
          <div className="flex items-center justify-between p-6 pb-2">
            <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-medium capitalize">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="p-6 pt-4">
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
                const hasItems = items.focus || items.tasks.length > 0 || items.reminders.length > 0 || items.familyEvents.length > 0;

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
                        {items.familyEvents.slice(0, 3).map((e, i) => (
                          <div
                            key={`fam-${i}`}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? 'white' : (e.member?.color ?? '#8a9a5b') }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedDateStr && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">
                {selectedDateStr === todayStr
                  ? "Idag"
                  : new Date(selectedDateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddingReminder(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Plus size={16} />
                  Påminnelse
                </button>
                {hasHousehold && (
                  <button
                    onClick={() => setIsAddingEvent(true)}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Plus size={16} />
                    Familjehändelse
                  </button>
                )}
              </div>
            </div>
            
            {!selectedItems.focus && selectedItems.tasks.length === 0 && selectedItems.reminders.length === 0 && selectedItems.familyEvents.length === 0 && (
              <div className="text-center py-10 bg-card/50 border border-border/50 rounded-3xl text-muted-foreground">
                Inget inplanerat denna dag.
              </div>
            )}

            <div className="space-y-3">
              {selectedItems.familyEvents.map(e => (
                <div key={`fam-${e.id}`} className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl group">
                  <div className="flex items-center gap-4">
                    <Users style={{ color: e.member?.color ?? '#8a9a5b' }} size={24} />
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
                    className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all rounded-xl hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {selectedItems.focus && (
                <div className="flex items-center gap-4 p-4 bg-accent/20 border border-accent/30 rounded-2xl">
                  <Target className="text-accent-foreground" size={24} />
                  <div>
                    <div className="text-xs text-accent-foreground font-medium uppercase tracking-wider mb-0.5">Dagens fokus</div>
                    <div className="text-lg font-medium">{selectedItems.focus.text}</div>
                  </div>
                </div>
              )}

              {selectedItems.reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <div className="flex items-center gap-4 min-w-0">
                    <Bell className="text-primary shrink-0" size={24} />
                    <div className="min-w-0">
                      <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                        Påminnelse {r.time && `kl ${r.time}`}
                      </div>
                      <div className="text-lg font-medium truncate">{r.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ kind: "reminder", id: r.id, title: r.title, time: r.time ?? "" })}
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
                    <CheckSquare className={t.completed ? "text-primary" : "text-muted-foreground"} size={24} />
                    <div className="flex-1 min-w-0">
                      {t.time && (
                        <div className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
                          kl {t.time}
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
              <Button
                onClick={async () => {
                  if (!newReminderTitle.trim() || !selectedDateStr) return;
                  if (newReminderTime && getNotificationPermission() === "default") {
                    await requestNotificationPermission();
                  }
                  addReminder(newReminderTitle.trim(), selectedDateStr, newReminderTime || undefined);
                  setNewReminderTitle("");
                  setNewReminderTime("");
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
      </div>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide, MyFloveBlock } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useReminders } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Repeat, Clock, Sparkles } from "lucide-react";
import { REPEAT_LABELS, routineOccursOn, type RepeatMode, type Routine } from "@/lib/recurrence";
import { paceFormSurface } from "@/components/paceable/design-system";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";
import { suggestActivityArea } from "@/lib/smart-area-suggestions";

const REPEAT_OPTIONS: Array<{ value: RepeatMode; label: string }> = [
  { value: "daily", label: "Varje dag" },
  { value: "weekdays", label: "Vardagar" },
  { value: "weekly", label: "Varje vecka" },
  { value: "none", label: "En gång" },
];

const generateId = () => Math.random().toString(36).slice(2, 11);
const todayIso = () => new Date().toISOString().slice(0, 10);

const SUGGESTIONS: Array<{ title: string; time: string }> = [
  { title: "Ta medicinen", time: "07:00" },
  { title: "Frukost", time: "08:00" },
  { title: "Lunch", time: "11:30" },
  { title: "Mellanmål", time: "14:00" },
  { title: "Middag", time: "19:00" },
  { title: "Borsta tänderna", time: "20:00" },
];

interface RoutinesContentProps {
  showHeader?: boolean;
}

export function RoutinesContent({ showHeader = true }: RoutinesContentProps) {
  const [routines, setRoutines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { reminders, addReminder, deleteReminder } = useReminders();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [chosenArea, setChosenArea] = useState<LifeArea | null>(null);
  const proposedArea = suggestActivityArea(title);
  const newArea = chosenArea ?? proposedArea ?? "vardag";
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState<RepeatMode>("daily");
  const [startDate, setStartDate] = useState(() => todayIso());
  const [addOpen, setAddOpen] = useState(false);

  // Auto-materialize today's reminders from enabled routines (once per day per routine)
  useEffect(() => {
    const today = todayIso();
    const marker = `myflove-routines-materialized:${today}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(marker)) return;
    if (routines.length === 0) return;

    let created = 0;
    for (const r of routines) {
      if (!r.enabled) continue;
      if (!routineOccursOn(r, today)) continue;
      const exists = reminders.some(
        (rem) => rem.date === today && rem.time === r.time && rem.title === r.title,
      );
      if (!exists) {
        addReminder(r.title, today, r.time, "none", undefined, undefined, undefined, r.area ?? suggestActivityArea(r.title) ?? "vardag");
        created++;
      }
    }
    localStorage.setItem(marker, "1");
    if (created > 0) {
      toast({
        description: `La in ${created} rutin${created === 1 ? "" : "er"} i dagens kalender ✨`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines.length]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;
    setRoutines((prev) =>
      [
        ...prev,
        {
          id: generateId(),
          title: title.trim(),
          area: newArea,
          time,
          enabled: true,
          createdAt: Date.now(),
          repeat,
          ...(repeat === "daily" ? {} : { startDate }),
        },
      ].sort((a, b) => a.time.localeCompare(b.time)),
    );
    setTitle("");
    setChosenArea(null);
    setTime("");
    setRepeat("daily");
    toast({ description: "Rutin sparad – dyker upp i morgondagens dag också 🌱" });
    setAddOpen(false);
  };

  const addSuggestion = (s: { title: string; time: string }) => {
    if (routines.some((r) => r.title === s.title && r.time === s.time)) return;
    setRoutines((prev) =>
      [
        ...prev,
        {
          id: generateId(),
          title: s.title,
          area: suggestActivityArea(s.title) ?? "vardag",
          time: s.time,
          enabled: true,
          createdAt: Date.now(),
          repeat: "daily" as RepeatMode,
        },
      ].sort((a, b) => a.time.localeCompare(b.time)),
    );
  };

  const toggleEnabled = (id: string) => {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const updateTime = (id: string, newTime: string) => {
    if (!newTime) return;
    const r = routines.find((x) => x.id === id);
    if (!r || r.time === newTime) return;
    setRoutines((prev) => prev.map((x) => (x.id === id ? { ...x, time: newTime } : x)));
    // Update today's pending reminder to match new time
    const today = todayIso();
    const existing = reminders.find(
      (rem) => rem.date === today && rem.time === r.time && rem.title === r.title && !rem.completed,
    );
    if (existing) {
      deleteReminder(existing.id);
      addReminder(r.title, today, newTime, "none", undefined, undefined, undefined, r.area ?? suggestActivityArea(r.title) ?? "vardag");
    }
    toast({ description: `Tiden för "${r.title}" ändrad till ${newTime}` });
  };

  const remove = (id: string) => {
    const r = routines.find((x) => x.id === id);
    setRoutines((prev) => prev.filter((x) => x.id !== id));
    // Also clean today's auto-created reminder if it's still pending
    if (r) {
      const today = todayIso();
      const dup = reminders.find(
        (rem) =>
          rem.date === today && rem.time === r.time && rem.title === r.title && !rem.completed,
      );
      if (dup) deleteReminder(dup.id);
    }
  };

  const addAllForToday = () => {
    const today = todayIso();
    let created = 0;
    for (const r of routines) {
      if (!r.enabled) continue;
      if (!routineOccursOn(r, today)) continue;
      const exists = reminders.some(
        (rem) => rem.date === today && rem.time === r.time && rem.title === r.title,
      );
      if (!exists) {
        addReminder(r.title, today, r.time, "none", undefined, undefined, undefined, r.area ?? suggestActivityArea(r.title) ?? "vardag");
        created++;
      }
    }
    toast({
      description:
        created > 0
          ? `La in ${created} rutin${created === 1 ? "" : "er"} i dag`
          : "Alla rutiner finns redan i dag",
    });
  };

  const sorted = [...routines].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <MyFlovePageGrid className="pace-next-page pace-next-health pace-next-tools">
      {showHeader && (
        <MyFloveWide>
          <MyFloveHeader
            title="Rutiner"
            emojiKey="routines"
            description="Dina dagliga hållpunkter. Läggs automatiskt in i kalendern varje dag och skickar påminnelse om notiser är på."
          />
        </MyFloveWide>
      )}

      <MyFloveWide>
        <Button onClick={() => setAddOpen(true)} className="w-full h-12 rounded-xl">
          <Plus size={18} className="mr-2" /> Lägg till rutin
        </Button>
      </MyFloveWide>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className={`${paceFormSurface} max-h-[85vh] overflow-y-auto rounded-2xl`}>
          <DialogHeader>
            <DialogTitle>Ny rutin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setChosenArea(null); }}
                placeholder="T.ex. Borsta tänderna"
                className="p-3 rounded-xl bg-card border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="p-3 rounded-xl bg-card border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base"
              />
            </div>
            <label className="block text-sm text-muted-foreground">Område {proposedArea && chosenArea === null && <span className="text-xs">· Föreslaget</span>}<select aria-label="Område" className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base" value={newArea} onChange={e => setChosenArea(e.target.value as LifeArea)}>{ALL_AREAS.map(id => <option key={id} value={id}>{AREA_META[id].label}</option>)}</select></label>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Hur ofta?</p>
              <div className="flex flex-wrap gap-2">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRepeat(opt.value)}
                    aria-pressed={repeat === opt.value}
                    className={`pace-form-choice px-3 py-2 rounded-xl border text-sm transition-all ${
                      repeat === opt.value
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {repeat !== "daily" && (
                <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {repeat === "none" ? "Datum" : "Startdatum"}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 rounded-xl bg-card border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </label>
              )}
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl">
              <Plus size={18} className="mr-2" /> Lägg till rutin
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <MyFloveWide>
        <MyFloveBlock
          title="Snabbstart"
          icon={Sparkles}
          subtitle="Klicka för att lägga till"
          surface="plain"
          className={paceFormSurface}
          defaultCollapsed
        >
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const already = routines.some((r) => r.title === s.title && r.time === s.time);
              return (
                <button
                  key={`${s.title}-${s.time}`}
                  type="button"
                  disabled={already}
                  onClick={() => addSuggestion(s)}
                  className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                    already
                      ? "bg-primary/10 border-primary/30 text-primary cursor-default"
                      : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  {s.title} · {s.time}
                </button>
              );
            })}
          </div>
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide>
        {sorted.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
            <Repeat size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Inga rutiner än – börja smått, t.ex. bara medicin på morgonen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {sorted.filter((r) => r.enabled).length} aktiva av {sorted.length}
              </p>
              <Button variant="outline" size="sm" onClick={addAllForToday} className="rounded-xl">
                Lägg in i dag nu
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {sorted.map((r) => (
                <MyFloveBlock
                  key={r.id}
                  collapseId={`routine-${r.id}`}
                  title={r.title}
                  icon={Clock}
                  surface={r.enabled ? undefined : "plain"}
                  className={r.enabled ? undefined : "opacity-70"}
                  subtitle={`${REPEAT_LABELS[r.repeat ?? "daily"]}${
                    r.repeat === "none" && r.startDate
                      ? ` ${r.startDate}`
                      : r.repeat && r.repeat !== "daily" && r.startDate
                        ? ` från ${r.startDate}`
                        : ""
                  }`}
                  action={
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg"
                      aria-label="Ta bort rutin"
                    >
                      <Trash2 size={18} />
                    </button>
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="time"
                      value={r.time}
                      onChange={(e) => updateTime(r.id, e.target.value)}
                      className="p-2 rounded-lg bg-secondary/50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm w-[6.5rem]"
                      aria-label={`Ändra tid för ${r.title}`}
                    />
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={() => toggleEnabled(r.id)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">På</span>
                    </label>
                  </div>
                </MyFloveBlock>
              ))}
            </div>
          </div>
        )}
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

export default function RoutinesPage() {
  return (
    <Layout>
      <RoutinesContent />
    </Layout>
  );
}

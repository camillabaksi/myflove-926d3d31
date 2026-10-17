import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-data";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { calendarGaps, shiftDate, type CalendarEntry } from "@/lib/visual-calendar";
import { todayISO } from "@/lib/day";
import { DayReplanButton } from "@/components/day/day-replan";
import { Link } from "wouter";

type Mode = "prioritera" | "dela" | "planera" | "aterhamtning";
type Props = { date: string; entries: CalendarEntry[]; calendarReady: boolean; calendarError?: boolean; initialTaskId?: string; initialMode?: "prioritera" | "dela" | "planera" | "aterhamtning" };
const labels: { id: Mode; label: string }[] = [
  { id: "prioritera", label: "Prioritera" }, { id: "dela", label: "Dela upp" },
  { id: "planera", label: "Planera om" }, { id: "aterhamtning", label: "Återhämtning" },
];
function clock(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }

/** A single, consent-based entry point for help with today's own tasks. */
export default function DaySupportActions({ date, entries, calendarReady, calendarError, initialTaskId, initialMode = "prioritera" }: Props) {
  const { tasks, updateTask, addTaskSteps, addTask } = useTasks();
  const capacity = useDayCapacity()(date);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selected, setSelected] = useState<string[]>(initialTaskId ? [initialTaskId] : []);
  const [preview, setPreview] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [slot, setSlot] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const ownEntries = useMemo(() => entries.filter(entry => !entry.done && entry.source !== "child" && entry.source !== "family" && !entry.parentTaskId), [entries]);
  const own = useMemo(() => { const ids = new Set(ownEntries.filter(entry => entry.source === "task").map(entry => entry.sourceId)); return tasks.filter(task => !task.completed && (ids.has(task.id) || task.dueDate === date || (!task.dueDate && date === todayISO()))); }, [tasks, ownEntries, date]);
  const otherEntries = ownEntries.filter(entry => entry.source !== "task");
  const chosen = own.filter(task => selected.includes(task.id));
  const chosenCalendar = otherEntries.filter(entry => selectedCalendar.includes(entry.id));
  const gaps = useMemo(() => calendarGaps(entries).filter(gap => gap.minutes >= duration), [entries, duration]);
  const today = date === todayISO();
  const validGaps = gaps.filter(gap => !today || gap.end - duration >= new Date().getHours() * 60 + new Date().getMinutes());
  const chosenGap = validGaps.find(gap => clock(Math.max(gap.start, today ? new Date().getHours() * 60 + new Date().getMinutes() : gap.start)) === slot);
  const canSave = mode === "aterhamtning" ? Boolean(chosenGap && slot) : mode === "planera" ? chosen.some(task => !task.time && !task.dueDate) : chosen.length > 0;
  const reset = (next: Mode) => { setMode(next); setSelected([]); setSelectedCalendar([]); setPreview(false); setDrafts({}); setSlot(""); };
  const apply = () => {
    if (!preview || !canSave || chosenCalendar.length) return;
    if (mode === "aterhamtning") {
      if (!chosenGap || !slot || date !== todayISO()) return;
      addTask(`Paus ${duration} min`, date, { time: slot, endTime: clock(Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3)) + duration), energyImpact: "gives", recoveryAction: "paus" });
    } else if (mode === "dela") {
      chosen.forEach(task => {
        const steps = (drafts[task.id] ?? "").split("\n").map(step => step.trim()).filter(Boolean);
        if (steps.length) addTaskSteps(task.id, steps.map(title => ({ title })));
      });
    } else if (mode === "planera") {
      chosen.filter(task => !task.time && !task.dueDate).forEach(task => updateTask(task.id, { dueDate: shiftDate(date, 1) }));
    } else {
      chosen.forEach((task, index) => updateTask(task.id, { quickflowBucket: "nu", quickflowOrder: index }));
    }
    toast.success("Dina val har sparats.");
    setSelected([]); setPreview(false); setDrafts({});
  };
  return <section className="space-y-3 rounded-2xl bg-[#F5F1F8] p-3" aria-label="Välj stöd för dagen">
    <p className="text-sm font-medium text-[#512654]">Vad skulle hjälpa dig idag?</p>
    <div className="grid grid-cols-2 gap-2">{labels.map(item => <Button key={item.id} type="button" variant={mode === item.id ? "default" : "outline"} className="min-h-11 whitespace-normal" onClick={() => reset(item.id)}>{item.label}</Button>)}</div>
    {mode === "aterhamtning" ? <div className="space-y-2 rounded-xl bg-card p-3">
      <p className="text-sm">Välj hur lång paus du vill få plats med.</p>
      <div className="flex flex-wrap gap-2">{[5, 10, 20].map(n => <Button type="button" key={n} size="sm" variant={duration === n ? "default" : "outline"} onClick={() => { setDuration(n); setSlot(""); setPreview(false); }}>{n} min</Button>)}</div>
      {validGaps.length ? <div className="space-y-2">{validGaps.map(gap => { const start = Math.max(gap.start, today ? new Date().getHours() * 60 + new Date().getMinutes() : gap.start); const value = clock(start); if (start + duration > gap.end) return null; return <label key={value} className="flex min-h-11 items-center gap-2 rounded-lg bg-muted/40 p-2 text-sm"><input type="radio" name="recovery-gap" checked={slot === value} onChange={() => { setSlot(value); setPreview(false); }} />{value}–{clock(gap.end)} · ledig lucka</label>; })}</div> : <p className="text-sm text-muted-foreground">Inga säkra lediga luckor kunde hittas. Aktiviteter utan sluttid räknas inte som ledig tid.</p>}
      <Link href="/aterhamtning" className="inline-block text-sm font-medium text-primary underline">Öppna återhämtning</Link>
    </div> : <div className="space-y-2 rounded-xl bg-card p-3">
      <p className="text-sm text-muted-foreground">{mode === "prioritera" ? "Välj vilka uppgifter som är viktigast." : mode === "dela" ? "Välj uppgifter att dela upp i små steg." : "Välj uppgifter att flytta till imorgon. Fasta tider och deadlines skyddas."}</p>
      {otherEntries.length > 0 && <p className="text-xs text-muted-foreground">Du kan välja även andra egna aktiviteter för överblick. Dessa kan ännu inte ändras av stödet.</p>}
      {otherEntries.map(entry => <label key={entry.id} className="flex min-h-11 items-center gap-3 rounded-lg bg-muted/20 px-3 py-2 text-sm"><input type="checkbox" checked={selectedCalendar.includes(entry.id)} onChange={() => { setSelectedCalendar(old => old.includes(entry.id) ? old.filter(id => id !== entry.id) : [...old, entry.id]); setPreview(false); }} /><span className="min-w-0 flex-1 break-words">{entry.title}{entry.time ? ` · ${entry.time}` : ""}<span className="block text-xs text-muted-foreground">{entry.label ?? "Kalenderaktivitet"} · Endast överblick</span></span>{entry.href && <Link href={entry.href} className="text-xs underline">Öppna</Link>}</label>)}
      {own.length ? own.map(task => <label key={task.id} className="flex min-h-11 items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(task.id)} onChange={() => { setSelected(old => old.includes(task.id) ? old.filter(id => id !== task.id) : [...old, task.id]); setPreview(false); }} /><span className="min-w-0 break-words">{task.title}{task.time ? ` · ${task.time}` : ""}</span></label>) : <p className="text-sm text-muted-foreground">Inga egna uppgifter att välja för dagen.</p>}
      {mode === "planera" && <DayReplanButton compact date={date} entries={entries} capacity={capacity.percent} calendarReady={calendarReady} calendarError={calendarError} />}
    </div>}
    {!preview ? <Button type="button" className="min-h-11 w-full" disabled={!canSave && !chosenCalendar.length} onClick={() => { if (mode === "dela") { const next: Record<string,string> = {}; chosen.forEach(task => { next[task.id] = `Förbered ${task.title.toLowerCase()}\nBörja med en liten del\nAvsluta när du är redo`; }); setDrafts(next); } setPreview(true); }}>Visa förslag ({mode === "aterhamtning" ? (slot ? 1 : 0) : chosen.length + chosenCalendar.length})</Button> : <div className="space-y-3 rounded-xl bg-[#EAF1EC] p-3">
      <p className="text-sm font-medium">Granska innan du sparar</p>
      {chosenCalendar.length > 0 && <p className="rounded-lg border p-2 text-sm">Markerade kalenderaktiviteter (endast överblick): {chosenCalendar.map(entry => entry.title).join(", ")}. Avmarkera dessa för att spara ändringar i vanliga uppgifter.</p>}
      {mode === "dela" ? chosen.map(task => <label key={task.id} className="block space-y-1 text-sm"><span>{task.title}</span><textarea className="min-h-24 w-full rounded-lg border bg-card p-2" aria-label={`Delsteg för ${task.title}`} value={drafts[task.id] ?? ""} onChange={event => setDrafts(old => ({ ...old, [task.id]: event.target.value }))} /></label>) : <p className="text-sm">{mode === "aterhamtning" ? `Lägg till en paus på ${duration} minuter kl. ${slot}.` : mode === "prioritera" ? `Markera ${chosen.length} uppgifter som prioriterade.` : `Flytta ${chosen.filter(task => !task.time && (!task.dueDate || task.dueDate > date)).length} flyttbara uppgifter till imorgon. Övriga lämnas orörda.`}</p>}
      <div className="flex flex-wrap gap-2"><Button type="button" onClick={apply} disabled={chosenCalendar.length > 0 || (mode === "dela" ? !chosen.some(task => (drafts[task.id] ?? "").trim()) : !canSave)}>Godkänn och spara</Button><Button type="button" variant="outline" onClick={() => setPreview(false)}>Tillbaka</Button></div>
    </div>}
  </section>;
}

import { useMemo, useState } from "react";
import Layout from "@/components/layout";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { useTasks, Task, TaskKind, TaskStatus } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarIcon,
  Moon,
  RotateCcw,
  Clock,
  Pause,
  Check,
  ListChecks,
  Briefcase,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  BellRing,
} from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/push-notifications";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import { confirmations } from "@/lib/flow-voice";
import { AreaSwitcher } from "@/components/area-switcher";
import CollapsibleSection from "@/components/collapsible-section";
import { AREA_META, areaChipStyle, defaultAreaFor, filterByArea, getArea, useActiveArea } from "@/lib/life-areas";


// Blueprint 2.0 §7.4: Uppgift / Ärende / Projekt.
const KIND_META: Record<TaskKind, { label: string; hint: string; Icon: typeof ListChecks }> = {
  uppgift: { label: "Uppgift", hint: "Något enkelt du kan bocka av", Icon: ListChecks },
  arende:  { label: "Ärende",  hint: "Kräver flera steg eller väntetid", Icon: Briefcase },
  projekt: { label: "Projekt", hint: "Större sak med flera delar", Icon: FolderKanban },
};

const STATUS_META: Record<TaskStatus, { label: string; Icon: typeof Clock; badge: string }> = {
  pagar:  { label: "Pågår",     Icon: Clock, badge: "bg-primary/10 text-primary border-primary/20" },
  vantar: { label: "Väntar på", Icon: Pause, badge: "bg-amber-100 text-amber-800 border-amber-200" },
  klart:  { label: "Klart",     Icon: Check, badge: "bg-secondary text-muted-foreground border-border" },
};

function getKind(t: Task): TaskKind { return t.kind ?? "uppgift"; }
function getStatus(t: Task): TaskStatus {
  if (t.completed) return "klart";
  return t.status ?? "pagar";
}

export default function Tasks() {
  const {
    activeTasks,
    completedTasks,
    snoozedTasks,
    addTask,
    toggleTask,
    deleteTask,
    unsnoozeTask,
    setTaskStatus,
    setTaskKind,
    setTaskNote,

    addTaskStep,
    toggleTaskStep,
    deleteTaskStep,
  } = useTasks();
  const { toast } = useToast();
  const { activeArea } = useActiveArea();


  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newReminder, setNewReminder] = useState<number | "">("");
  const [newKind, setNewKind] = useState<TaskKind>("uppgift");

  const [filter, setFilter] = useState<"all" | TaskKind>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [stepDrafts, setStepDrafts] = useState<Record<string, string>>({});
  const [waitingDrafts, setWaitingDrafts] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggle = (task: Task) => {
    toggleTask(task.id);
    if (!task.completed) {
      toast({ description: `${confirmations.taskDone} ${getRandomEncouragement()}` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const reminderMinutes = newTime && newReminder !== "" ? Number(newReminder) : undefined;
    if (reminderMinutes !== undefined && getNotificationPermission() === "default") {
      await requestNotificationPermission();
    }
    addTask(newTask.trim(), dueDate || undefined, {
      kind: newKind,
      time: newTime || undefined,
      reminderMinutesBefore: reminderMinutes,
      area: defaultAreaFor(activeArea),
    });
    setNewTask("");
    setDueDate("");
    setNewTime("");
    setNewReminder("");
    setNewKind("uppgift");
  };

  const areaActive = useMemo(() => filterByArea(activeTasks, activeArea), [activeTasks, activeArea]);

  const filteredActive = useMemo(
    () => filter === "all" ? areaActive : areaActive.filter((t) => getKind(t) === filter),
    [areaActive, filter]
  );


  const grouped = useMemo(() => {
    const waiting = filteredActive.filter((t) => getStatus(t) === "vantar");
    const doing   = filteredActive.filter((t) => getStatus(t) === "pagar");
    return { waiting, doing };
  }, [filteredActive]);

  const kindTabs: Array<{ id: "all" | TaskKind; label: string }> = [
    { id: "all", label: "Allt" },
    { id: "uppgift", label: "Uppgifter" },
    { id: "arende", label: "Ärenden" },
    { id: "projekt", label: "Projekt" },
  ];

  const renderTask = (task: Task) => {
    const kind = getKind(task);
    const status = getStatus(task);
    const KindIcon = KIND_META[kind].Icon;
    const StatusIcon = STATUS_META[status].Icon;
    const isOpen = expanded.has(task.id);
    const steps = task.steps ?? [];
    const stepsDone = steps.filter((s) => s.done).length;

    return (
      <div
        key={task.id}
        className="group bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-colors overflow-hidden"
      >
        <div className="flex items-start gap-3 p-4">
          <button
            onClick={() => handleToggle(task)}
            className="mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
            aria-label="Markera klart"
          >
            <Circle size={26} strokeWidth={1.5} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${STATUS_META[status].badge}`}>
                <StatusIcon size={11} /> {STATUS_META[status].label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">
                <KindIcon size={11} /> {KIND_META[kind].label}
              </span>
              {activeArea === "alla" && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
                  style={areaChipStyle(getArea(task))}
                >
                  {AREA_META[getArea(task)].emoji} {AREA_META[getArea(task)].label}
                </span>
              )}

              {task.dueDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                  <CalendarIcon size={11} /> {task.dueDate}
                  {task.time && <> · kl {task.time}</>}
                </span>
              )}
              {task.time && task.reminderMinutesBefore ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BellRing size={11} /> {task.reminderMinutesBefore} min innan
                </span>
              ) : null}
              {steps.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {stepsDone}/{steps.length} delsteg
                </span>
              )}
            </div>

            <p className="text-base leading-snug">{task.title}</p>

            {task.note && !isOpen && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{task.note}</p>
            )}


            {status === "vantar" && task.waitingOn && (
              <p className="text-xs text-amber-800 mt-1">Väntar på: <strong>{task.waitingOn}</strong></p>
            )}

            {/* Status-switcher (Blueprint status: Pågår / Väntar på / Klart) */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => {
                const active = s === status;
                const Icon = STATUS_META[s].Icon;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s === "vantar" && !task.waitingOn) {
                        toggleExpand(task.id);
                      }
                      setTaskStatus(task.id, s);
                    }}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <Icon size={12} /> {STATUS_META[s].label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => toggleExpand(task.id)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground ml-auto"
              >
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Anteckning &amp; delsteg
              </button>
            </div>
          </div>





          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100 shrink-0"
            aria-label="Ta bort"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-border bg-secondary/20 p-4 space-y-3">
            {/* Kind-swap */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Typ:</span>
              {(Object.keys(KIND_META) as TaskKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTaskKind(task.id, k)}
                  className={`px-2.5 py-1 rounded-full border transition-colors ${
                    k === kind
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>

            {/* Waiting-on */}
            {status === "vantar" && (
              <div className="flex gap-2">
                <Input
                  value={waitingDrafts[task.id] ?? task.waitingOn ?? ""}
                  onChange={(e) => setWaitingDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                  onBlur={(e) => setTaskStatus(task.id, "vantar", e.target.value)}
                  placeholder="Vem eller vad väntar du på?"
                  className="h-10 rounded-xl text-sm bg-background"
                />
              </div>
            )}

            {/* Anteckning */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor={`note-${task.id}`}>
                Anteckning
              </label>
              <textarea
                id={`note-${task.id}`}
                defaultValue={task.note ?? ""}
                onBlur={(e) => setTaskNote(task.id, e.target.value)}
                rows={2}
                placeholder="Skriv vad det gäller, vad du behöver ta med…"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Steps */}

            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTaskStep(task.id, step.id)}
                    className="text-muted-foreground hover:text-primary"
                    aria-label={step.done ? "Ångra" : "Klar"}
                  >
                    {step.done ? (
                      <CheckCircle2 size={20} className="text-primary" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTaskStep(task.id, step.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                    aria-label="Ta bort delsteg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const draft = (stepDrafts[task.id] ?? "").trim();
                  if (!draft) return;
                  addTaskStep(task.id, draft);
                  setStepDrafts((d) => ({ ...d, [task.id]: "" }));
                }}
                className="flex gap-2"
              >
                <Input
                  value={stepDrafts[task.id] ?? ""}
                  onChange={(e) => setStepDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                  placeholder="Lägg till delsteg"
                  className="h-10 rounded-xl text-sm bg-background"
                />
                <Button type="submit" size="sm" variant="secondary" className="rounded-xl">
                  <Plus size={16} />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div
          className="rounded-3xl border border-border/60 p-5 shadow-soft"
          style={{
            backgroundImage:
              "linear-gradient(135deg, hsl(var(--lavender)) 0%, hsl(var(--cream)) 60%, hsl(var(--blush) / 0.8) 100%)",
          }}
        >
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-3xl leading-none">✅</span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-ink">Uppgifter</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bocka av det lilla, håll koll på det som väntar. En sak i taget.
              </p>
            </div>
          </div>
          <AreaSwitcher className="mt-4" size="sm" />
          {activeArea !== "alla" && (
            <p className="text-xs text-muted-foreground mt-2">
              Du är i {AREA_META[activeArea].label.toLowerCase()}srummet. Nya saker hamnar här.
            </p>
          )}
        </div>



        <form onSubmit={handleSubmit} className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Vad behöver du göra?"
              className="h-14 rounded-2xl text-lg bg-secondary/50 border-transparent focus-visible:ring-primary md:flex-1"
            />
            <div className="flex gap-3">
              <div className="relative flex-1 md:w-48">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <CalendarIcon size={18} />
                </div>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-14 rounded-2xl text-base bg-secondary/50 border-transparent focus-visible:ring-primary pl-10 w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={!newTask.trim()}
                className="h-14 px-6 rounded-2xl shadow-sm shrink-0"
              >
                <Plus size={24} className="md:mr-2" />
                <span className="hidden md:inline">Lägg till</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} />
              <span>Tid (valfritt)</span>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => {
                  setNewTime(e.target.value);
                  if (!e.target.value) setNewReminder("");
                }}
                className="h-9 w-28 rounded-xl text-sm bg-background"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <BellRing size={14} />
              <span>Påminn mig</span>
              <select
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={!newTime}
                className="h-9 rounded-xl text-sm bg-background border border-border px-2 disabled:opacity-50"
              >
                <option value="">Ingen</option>
                <option value={0}>På minuten</option>
                <option value={5}>5 min innan</option>
                <option value={15}>15 min innan</option>
                <option value={30}>30 min innan</option>
                <option value={60}>1 h innan</option>
              </select>
            </label>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            placeholder="Anteckning (valfritt) – vad det gäller, vad du behöver ta med"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(KIND_META) as TaskKind[]).map((k) => {
              const active = k === newKind;
              const Icon = KIND_META[k].Icon;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNewKind(k)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                  title={KIND_META[k].hint}
                >
                  <Icon size={13} /> {KIND_META[k].label}
                </button>
              );
            })}
          </div>
        </form>

        {/* Kind-filter */}
        <div className="flex flex-wrap gap-2">
          {kindTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`press rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-lavender text-ink hover:bg-lavender/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        <div className="space-y-8">
          {filteredActive.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
              <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
              <p className="text-lg">Inget att göra just nu.</p>
              <p className="text-sm mt-2 opacity-70">Ta en paus och andas.</p>
            </div>
          )}

          {grouped.doing.length > 0 && (
            <CollapsibleSection
              className="space-y-3"
              headingClassName="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-2"
              title={<><Clock size={14} /> Pågår</>}
              help="Saker du börjat på. Tryck på en rad för att bocka av eller ändra."
            >
              {grouped.doing.map(renderTask)}
            </CollapsibleSection>
          )}

          {grouped.waiting.length > 0 && (
            <CollapsibleSection
              className="space-y-3"
              headingClassName="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-2"
              title={<><Pause size={14} /> Väntar på</>}
              help="Saker som hänger på någon annan. De ligger här så du slipper hålla dem i huvudet."
            >
              {grouped.waiting.map(renderTask)}
            </CollapsibleSection>
          )}

          {completedTasks.length > 0 && (
            <CollapsibleSection
              className="space-y-3 pt-6 border-t border-border"
              headingClassName="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-2"
              title={<><Check size={14} /> Avklarat</>}
              help="Det du gjort idag. Ligger kvar så du ser att det faktiskt blev något."
            >
              {completedTasks
                .filter((t) => filter === "all" || getKind(t) === filter)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-card/50 border border-border/50 rounded-2xl opacity-70"
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="text-primary shrink-0">
                        <CheckCircle2 size={28} className="fill-primary/20" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg line-through">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {KIND_META[getKind(task)].label}
                          {task.dueDate ? ` · ${task.dueDate}` : ""}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                      aria-label="Ta bort"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
            </CollapsibleSection>
          )}

          {snoozedTasks.length > 0 && (
            <CollapsibleSection
              className="space-y-3 pt-6 border-t border-border"
              headingClassName="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-2"
              title={<><Moon size={16} /> Undanstoppat ett tag</>}
              help="Sådant du skjutit upp. Tryck för att ta tillbaka det när du orkar."
            >
              {snoozedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 border border-dashed border-border rounded-2xl"
                >
                  <div className="flex flex-col">
                    <span className="text-lg text-muted-foreground">{task.title}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalendarIcon size={16} />
                      Syns igen {task.snoozedUntil}
                    </span>
                  </div>
                  <button
                    onClick={() => unsnoozeTask(task.id)}
                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    aria-label="Visa igen nu"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              ))}
            </CollapsibleSection>
          )}
        </div>
      </div>
    </Layout>
  );
}

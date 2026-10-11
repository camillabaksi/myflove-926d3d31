import { LinkifiedText } from "@/components/linkified-text";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { useTasks, Task, TaskKind, TaskStatus } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
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
  Plus,
  Sparkles,
  Sun,
  CalendarClock,
  Cloud,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import { confirmations } from "@/lib/flow-voice";
import { AreaSwitcher } from "@/components/area-switcher";
import CollapsibleSection from "@/components/collapsible-section";
import TaskQuickAdd, { type QuickAddResult } from "@/components/task-quick-add";
import {
  ENERGY_IMPACTS,
  ENERGY_IMPACT_META,
  FRICTIONS,
  FRICTION_META,
  agendaSuggestion,
  describeDay,
  groupAgenda,
  laterTodayTime,
  todayISO,
  type EnergyImpact,
  type TaskFriction,
} from "@/lib/task-agenda";
import {
  ALL_AREAS,
  AREA_META,
  areaChipStyle,
  defaultAreaFor,
  filterByArea,
  getArea,
  useActiveArea,
} from "@/lib/life-areas";

// Blueprint 2.0 §7.4: Uppgift / Ärende / Projekt.
const KIND_META: Record<TaskKind, { label: string; hint: string; Icon: typeof ListChecks }> = {
  uppgift: { label: "Uppgift", hint: "Något enkelt du kan bocka av", Icon: ListChecks },
  arende: { label: "Ärende", hint: "Kräver flera steg eller väntetid", Icon: Briefcase },
  projekt: { label: "Projekt", hint: "Större sak med flera delar", Icon: FolderKanban },
};

const STATUS_META: Record<TaskStatus, { label: string; Icon: typeof Clock; badge: string }> = {
  pagar: { label: "Pågår", Icon: Clock, badge: "bg-primary/10 text-primary border-primary/20" },
  vantar: {
    label: "Väntar på",
    Icon: Pause,
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  klart: { label: "Klart", Icon: Check, badge: "bg-secondary text-muted-foreground border-border" },
};

type TabId = "idag" | "kommande" | "klart";

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: "idag", emoji: "☀️", label: "Idag" },
  { id: "kommande", emoji: "📅", label: "Kommande" },
  { id: "klart", emoji: "✅", label: "Klart" },
];

function getKind(t: Task): TaskKind {
  return t.kind ?? "uppgift";
}
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
    updateTask,
    addTaskStep,
    addTaskSteps,
    toggleTaskStep,
    deleteTaskStep,
  } = useTasks();
  const { toast } = useToast();
  const { activeArea } = useActiveArea();
  const { flow } = useFlowScore();

  const [tab, setTab] = useState<TabId>("idag");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [stepDrafts, setStepDrafts] = useState<Record<string, string>>({});
  const [waitingDrafts, setWaitingDrafts] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggle = (task: Task) => {
    toggleTask(task.id);
    if (!task.completed) {
      toast({ description: `${confirmations.taskDone} ${getRandomEncouragement()}` });
    }
  };

  const handleQuickAdd = (result: QuickAddResult) => {
    addTask(result.title, result.dueDate, {
      time: result.time,
      completed: result.completed,
      completedAt: result.completedAt,
      energyImpact: result.energyImpact,
      friction: result.friction,
      area: defaultAreaFor(activeArea),
    });
    toast({
      description: result.time
        ? `Sparad – ${describeDay(result.dueDate).toLowerCase()} kl ${result.time}. Den syns även i kalendern.`
        : "Sparad. Den ligger under Idag tills du gör något av den.",
    });
    if (result.dueDate && result.dueDate > todayISO()) setTab("kommande");
  };

  const areaActive = useMemo(
    () => filterByArea(activeTasks, activeArea),
    [activeTasks, activeArea],
  );
  const areaDone = useMemo(
    () => filterByArea(completedTasks, activeArea),
    [completedTasks, activeArea],
  );

  const agenda = useMemo(() => groupAgenda(areaActive), [areaActive]);

  const todayCount = agenda.timed.length + agenda.untimed.length + agenda.overdue.length;

  const suggestion = useMemo(
    () =>
      agendaSuggestion({
        flowScore: flow.score,
        heavyCount: [...agenda.timed, ...agenda.untimed, ...agenda.overdue].filter(
          (t) => t.friction === "large" || t.energyImpact === "drains",
        ).length,
        totalToday: todayCount,
      }),
    [flow.score, agenda, todayCount],
  );

  /** Dela upp en tung uppgift i tre små steg – ett förslag, inget tvång. */
  const splitTask = (task: Task) => {
    addTaskSteps(task.id, [
      { title: "Steg 1 – börja i 15 min" },
      { title: "Steg 2 – fortsätt 15 min" },
      { title: "Steg 3 – avsluta 15 min" },
    ]);
    setExpanded((prev) => new Set(prev).add(task.id));
    toast({
      description: "Uppdelad i tre små steg. Ta ett i taget – eller kör ändå på i ett svep.",
    });
  };

  const chipBtn = (active: boolean) =>
    `press rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-muted-foreground hover:text-foreground"
    }`;

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
        className="group pace-tasks-card"
      >
        <div className="pace-tasks-card-body">
          <Button variant="ghost"
            onClick={() => handleToggle(task)}
            size="icon" className="pace-tasks-check text-muted-foreground hover:text-primary"
            aria-label="Markera klart"
          >
            <Circle size={26} strokeWidth={1.5} />
          </Button>

          <div className="pace-tasks-copy min-w-0">
             <p className="pace-tasks-title">{task.title}</p>

            <div className="pace-tasks-meta flex items-center gap-1.5 flex-wrap mt-2">
              {task.time && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
                  <Clock size={11} /> {task.time}
                  {task.endTime ? `–${task.endTime}` : ""}
                </span>
              )}
              {task.dueDate && task.dueDate !== todayISO() && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarIcon size={11} /> {describeDay(task.dueDate)}
                </span>
              )}
              {task.energyImpact && (
                <span className="rounded-pill bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {ENERGY_IMPACT_META[task.energyImpact].emoji}{" "}
                  {ENERGY_IMPACT_META[task.energyImpact].label}
                </span>
              )}
              {task.friction && (
                <span className="rounded-pill bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {FRICTION_META[task.friction].emoji} {FRICTION_META[task.friction].label}
                </span>
              )}
              {status === "vantar" && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${STATUS_META[status].badge}`}
                >
                  <StatusIcon size={11} /> {STATUS_META[status].label}
                </span>
              )}
              {kind !== "uppgift" && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">
                  <KindIcon size={11} /> {KIND_META[kind].label}
                </span>
              )}
              {activeArea === "alla" && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium"
                  style={areaChipStyle(getArea(task))}
                >
                  {AREA_META[getArea(task)].emoji} {AREA_META[getArea(task)].label}
                </span>
              )}
              {steps.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {stepsDone}/{steps.length} delsteg
                </span>
              )}
            </div>

            {task.note && !isOpen && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                <LinkifiedText text={task.note} />
              </p>
            )}

            {status === "vantar" && task.waitingOn && (
              <p className="text-xs text-amber-800 mt-1">
                Väntar på: <strong>{task.waitingOn}</strong>
              </p>
            )}

            <div className="pace-tasks-actions mt-3 flex flex-wrap items-center gap-1.5">
              {!task.time && (
                <Button variant="ghost"
                  type="button"
                  onClick={() => {
                    updateTask(task.id, { dueDate: todayISO(), time: laterTodayTime() });
                    toast({ description: "Tillagd i kalendern idag. Ändra tiden när du vill." });
                  }}
                  className={chipBtn(false)}
                >
                  📅 Lägg till i kalender
                </Button>
              )}
              {(task.friction === "large" || task.energyImpact === "drains") &&
                steps.length === 0 && (
                  <Button variant="ghost" type="button" onClick={() => splitTask(task)} className={chipBtn(false)}>
                    ✂️ Dela upp
                  </Button>
                )}
              <Button variant="ghost"
                type="button"
                onClick={() => toggleExpand(task.id)}
                className="pace-tasks-edit text-xs border border-border text-muted-foreground ml-auto"
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Ändra
              </Button>
            </div>
          </div>

          <Button variant="ghost"
            onClick={() => deleteTask(task.id)}
            size="icon" className="pace-tasks-delete text-muted-foreground hover:text-destructive"
            aria-label="Ta bort"
          >
            <Trash2 size={18} />
          </Button>
        </div>

        {isOpen && (
          <div className="pace-tasks-details border-t border-border p-4 space-y-3">
            {/* Energi & friktion – hänger ihop med FlowScore och energihistoriken */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Energi:</span>
              {ENERGY_IMPACTS.map((id) => (
                <Button variant="ghost"
                  key={id}
                  type="button"
                  onClick={() =>
                    updateTask(task.id, {
                      energyImpact: (task.energyImpact === id ? undefined : id) as EnergyImpact,
                    })
                  }
                  className={chipBtn(task.energyImpact === id)}
                >
                  {ENERGY_IMPACT_META[id].emoji} {ENERGY_IMPACT_META[id].label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Storlek:</span>
              {FRICTIONS.map((id) => (
                <Button variant="ghost"
                  key={id}
                  type="button"
                  onClick={() =>
                    updateTask(task.id, {
                      friction: (task.friction === id ? undefined : id) as TaskFriction,
                    })
                  }
                  className={chipBtn(task.friction === id)}
                >
                  {FRICTION_META[id].emoji} {FRICTION_META[id].label}
                </Button>
              ))}
            </div>

            {/* Status */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Status:</span>
              {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => {
                const Icon = STATUS_META[s].Icon;
                return (
                  <Button variant="ghost"
                    key={s}
                    type="button"
                    onClick={() => setTaskStatus(task.id, s)}
                    className={chipBtn(s === status)}
                  >
                    <Icon size={11} className="inline mr-1" />
                    {STATUS_META[s].label}
                  </Button>
                );
              })}
            </div>

            {/* Kind-swap */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Typ:</span>
              {(Object.keys(KIND_META) as TaskKind[]).map((k) => (
                <Button variant="ghost"
                  key={k}
                  type="button"
                  onClick={() => setTaskKind(task.id, k)}
                  className={chipBtn(k === kind)}
                >
                  {KIND_META[k].label}
                </Button>
              ))}
            </div>

            {/* Waiting-on */}
            {status === "vantar" && (
              <Input
                value={waitingDrafts[task.id] ?? task.waitingOn ?? ""}
                onChange={(e) => setWaitingDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                onBlur={(e) => setTaskStatus(task.id, "vantar", e.target.value)}
                placeholder="Vem eller vad väntar du på?"
                className="h-10 rounded-xl text-sm bg-background"
              />
            )}

            {/* Datum, tider och påminnelse */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor={`date-${task.id}`}
                >
                  Datum
                </label>
                <Input
                  id={`date-${task.id}`}
                  type="date"
                  value={task.dueDate ?? ""}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                  className="h-10 rounded-xl text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor={`time-${task.id}`}
                >
                  Tid (valfritt)
                </label>
                <Input
                  id={`time-${task.id}`}
                  type="time"
                  value={task.time ?? ""}
                  onChange={(e) => updateTask(task.id, { time: e.target.value })}
                  className="h-10 rounded-xl text-sm bg-background"
                />
              </div>
              {task.time && (
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`end-${task.id}`}
                  >
                    Slutar (valfritt)
                  </label>
                  <Input
                    id={`end-${task.id}`}
                    type="time"
                    value={task.endTime ?? ""}
                    onChange={(e) => updateTask(task.id, { endTime: e.target.value || undefined })}
                    className="h-10 rounded-xl text-sm bg-background"
                  />
                </div>
              )}
              {task.time && (
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`remind-${task.id}`}
                  >
                    Påminn innan
                  </label>
                  <select
                    id={`remind-${task.id}`}
                    value={String(task.reminderMinutesBefore ?? "")}
                    onChange={(e) =>
                      updateTask(task.id, {
                        reminderMinutesBefore: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Ingen</option>
                    <option value="0">Vid start</option>
                    <option value="10">10 min innan</option>
                    <option value="30">30 min innan</option>
                    <option value="60">1 tim innan</option>
                    <option value="1440">1 dag innan</option>
                  </select>
                </div>
              )}
            </div>

            {/* Livsområde */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-muted-foreground self-center mr-1">Hör hemma i:</span>
              {ALL_AREAS.map((a) => (
                <Button variant="ghost"
                  key={a}
                  type="button"
                  onClick={() => updateTask(task.id, { area: a })}
                  className={chipBtn(getArea(task) === a)}
                >
                  {AREA_META[a].emoji} {AREA_META[a].label}
                </Button>
              ))}
            </div>

            {/* Anteckning */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`note-${task.id}`}
              >
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

            {/* Delsteg */}
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <Button variant="ghost"
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
                  </Button>
                  <span
                    className={`flex-1 text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}
                  >
                    {step.title}
                  </span>
                  <Button variant="ghost"
                    type="button"
                    onClick={() => deleteTaskStep(task.id, step.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                    aria-label="Ta bort delsteg"
                  >
                    <Trash2 size={14} />
                  </Button>
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
      <MyFlovePageGrid className="page-enter pace-tasks-page">
        <MyFloveWide>
          <div
            className="pace-tasks-header"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="pace-tasks-heading-icon">
                <ListChecks size={24} />
              </span>
              <div className="min-w-0">
                <h1 className="pace-app-title pace-tasks-heading text-ink">
                  Alla uppgifter
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hela listan framåt – samma uppgifter som i Idag, Planera och Hem.
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
        </MyFloveWide>

        <MyFloveWide>
          <TaskQuickAdd onAdd={handleQuickAdd} className="pace-tasks-add" />
        </MyFloveWide>

        <MyFloveWide>
          {/* Flikar: Idag är standardvyn */}
          <div className="pace-tasks-tabs" role="group" aria-label="Visa uppgifter">
            {TABS.map((t) => {
              const count =
                t.id === "idag"
                  ? todayCount
                  : t.id === "kommande"
                    ? agenda.upcoming.length
                    : areaDone.length;
              return (
                <Button variant="ghost"
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className="pace-tasks-tab"
                >
                  {t.id === "idag" ? <Sun aria-hidden size={16} /> : t.id === "kommande" ? <CalendarIcon aria-hidden size={16} /> : <Check aria-hidden size={16} />}
                   <span>{t.label}{count > 0 && <span className="ml-1 opacity-70">{count}</span>}</span>
                </Button>
              );
            })}
          </div>
        </MyFloveWide>

        {tab === "idag" && (
          <MyFloveWide>
            <div className="space-y-6">
              {suggestion && (
                <div className="pace-tasks-support p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{suggestion.headline}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{suggestion.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href="/flow"
                          className="press rounded-pill bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          Låt Pace föreslå en ordning
                        </Link>
                        <span className="rounded-pill border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                          Du bestämmer – gör ändå om du vill
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {agenda.overdue.length > 0 && (
                <CollapsibleSection
                  className="space-y-3"
                  headingClassName="pace-tasks-group-title"
                  title={
                    <>
                      <Cloud size={14} /> Saker vi tar när du har energi
                    </>
                  }
                  help="De ligger tryggt här. Du behöver inte bestämma något om dem just nu."
                >
                  {agenda.overdue.map(renderTask)}
                </CollapsibleSection>
              )}

              {agenda.timed.length > 0 && (
                <CollapsibleSection
                  className="space-y-3"
                  headingClassName="pace-tasks-group-title"
                  title={
                    <>
                      <Clock size={14} /> Med tid idag
                    </>
                  }
                  help="Hållpunkter med klockslag. De syns även i kalendern."
                >
                  {agenda.timed.map(renderTask)}
                </CollapsibleSection>
              )}

              {agenda.untimed.length > 0 && (
                <CollapsibleSection
                  className="space-y-3"
                  headingClassName="pace-tasks-group-title"
                  title={
                    <>
                      <Sun size={14} /> Ingen specifik tid
                    </>
                  }
                  help="Sånt du vill få gjort idag, men som inte är låst till en tid."
                >
                  {agenda.untimed.map(renderTask)}
                </CollapsibleSection>
              )}

              {todayCount === 0 && (
                <div className="pace-tasks-empty text-center py-12 text-muted-foreground">
                  <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
                  <p className="text-lg">Inget inplanerat idag.</p>
                  <p className="text-sm mt-2 opacity-70">Det är också ett fullt giltigt schema.</p>
                </div>
              )}

              {snoozedTasks.length > 0 && (
                <CollapsibleSection
                  className="space-y-3 pt-6 border-t border-border"
                  headingClassName="pace-tasks-group-title"
                  title={
                    <>
                      <Moon size={16} /> Saker vi tar när du har energi
                    </>
                  }
                  help="Sådant du skjutit upp. Tryck för att ta tillbaka det när du orkar."
                >
                  {snoozedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="pace-tasks-card pace-tasks-compact grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
                    >
                      <div className="flex min-w-0 flex-col">
                         <span className="pace-tasks-title text-muted-foreground">{task.title}</span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <CalendarIcon size={16} />
                          Syns igen {task.snoozedUntil}
                        </span>
                      </div>
                      <Button variant="ghost"
                        onClick={() => unsnoozeTask(task.id)}
                        className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                        aria-label="Visa igen nu"
                      >
                        <RotateCcw size={20} />
                      </Button>
                    </div>
                  ))}
                </CollapsibleSection>
              )}
            </div>
          </MyFloveWide>
        )}

        {tab === "kommande" && (
          <MyFloveWide>
            <div className="space-y-3">
              {agenda.upcoming.length === 0 ? (
                <div className="pace-tasks-empty text-center py-12 text-muted-foreground">
                  <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
                  <p className="text-lg">Inget framåt just nu.</p>
                  <p className="text-sm mt-2 opacity-70">
                    Lägg till något med datum så dyker det upp här och i kalendern.
                  </p>
                </div>
              ) : (
                Object.entries(
                  agenda.upcoming.reduce<Record<string, Task[]>>((acc, t) => {
                    const key = t.dueDate ?? "";
                    (acc[key] ??= []).push(t);
                    return acc;
                  }, {}),
                ).map(([day, list]) => (
                  <div key={day} className="space-y-3">
                    <p className="pl-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <CalendarClock size={14} /> {describeDay(day)}
                    </p>
                    {list.map(renderTask)}
                  </div>
                ))
              )}
            </div>
          </MyFloveWide>
        )}

        {tab === "klart" && (
          <MyFloveWide>
            <div className="space-y-3">
              {areaDone.length === 0 ? (
                <div className="pace-tasks-empty text-center py-12 text-muted-foreground">
                  <p className="text-lg">Inget avbockat än.</p>
                  <p className="text-sm mt-2 opacity-70">Det första kryssen kommer.</p>
                </div>
              ) : (
                areaDone.map((task) => (
                  <div
                    key={task.id}
                    className="pace-tasks-card pace-tasks-compact grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
                  >
                    <Button variant="ghost"
                      onClick={() => handleToggle(task)}
                      className="min-w-0 justify-start gap-3 p-0 text-left"
                    >
                      <div className="text-primary shrink-0">
                        <CheckCircle2 size={28} className="fill-primary/20" strokeWidth={2} />
                      </div>
                      <div className="flex min-w-0 flex-col">
                         <span className="pace-tasks-title line-through">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.dueDate ? describeDay(task.dueDate) : "Ingen dag"}
                          {task.actualEnergy
                            ? ` · ${ENERGY_IMPACT_META[task.actualEnergy].emoji} ${ENERGY_IMPACT_META[task.actualEnergy].doneLabel}`
                            : ""}
                        </span>
                      </div>
                    </Button>
                    <Button variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                      aria-label="Ta bort"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </MyFloveWide>
        )}
      </MyFlovePageGrid>

    </Layout>
  );
}

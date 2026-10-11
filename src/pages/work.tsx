import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Plus,
  Loader2,
  Sparkles,
  Paperclip,
  CalendarDays,
  Circle,
  CheckCircle2,
  Trash2,
  FileText,
  AlertCircle,
  BellRing,
  FolderOpen,
} from "lucide-react";
import { useTasks, type Task } from "@/hooks/use-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjects } from "@/hooks/use-projects";
import { breakDownWorkTask } from "@/lib/work.functions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { celebrateFromEvent } from "@/lib/celebrate";
import CollapsibleSection from "@/components/collapsible-section";
import { QuickflowCapture } from "@/components/quickflow-capture";
import { QuickflowList } from "@/components/quickflow-list";
import { WorkflowContent } from "@/pages/workflow";
import LifeProfileLink from "@/components/life-profile-link";
import AreaFocus from "@/components/area-focus";

const BUCKET = "work-docs";

/** Standard: notis 7, 3 och 1 dag innan deadline. */
const DEFAULT_LEADS = [7, 3, 1];
const LEAD_CHOICES = [14, 7, 3, 1, 0];
const leadLabel = (d: number) => (d === 0 ? "På dagen" : `${d} d`);

function daysLeft(dueDate?: string) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function deadlineLabel(dueDate?: string) {
  const d = daysLeft(dueDate);
  if (d === null) return null;
  if (d < 0)
    return {
      text: `Passerade för ${Math.abs(d)} dag${Math.abs(d) === 1 ? "" : "ar"} sedan`,
      tone: "late" as const,
    };
  if (d === 0) return { text: "Idag", tone: "soon" as const };
  if (d === 1) return { text: "Imorgon", tone: "soon" as const };
  if (d <= 7) return { text: `Om ${d} dagar`, tone: "soon" as const };
  return { text: `Om ${d} dagar`, tone: "calm" as const };
}

export default function WorkPage() {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    addTaskSteps,
    toggleTaskStep,
    addTaskAttachment,
    removeTaskAttachment,
    setTaskDeadlineReminders,
    setTaskCourse,
  } = useTasks();
  const { activeProjects, addProject, deleteProject } = useProjects();
  const { toast } = useToast();
  const run = useServerFn(breakDownWorkTask);

  const [projectDraft, setProjectDraft] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [details, setDetails] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [folder, setFolder] = useState<string>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [intros, setIntros] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const workTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.area === "jobb")
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        }),
    [tasks],
  );

  const countFor = (id: string) =>
    id === "all"
      ? workTasks.length
      : id === "none"
        ? workTasks.filter((t) => !t.courseId).length
        : workTasks.filter((t) => t.courseId === id).length;

  const visible = useMemo(() => {
    if (folder === "all") return workTasks;
    if (folder === "none") return workTasks.filter((t) => !t.courseId);
    return workTasks.filter((t) => t.courseId === folder);
  }, [workTasks, folder]);

  const projectName = (id?: string) => activeProjects.find((p) => p.id === id)?.title;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDraft.trim()) return;
    const p = addProject(projectDraft.trim());
    setProjectId(p.id);
    setProjectDraft("");
  };

  const handleAddWorkTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), dueDate || undefined, {
      kind: "projekt",
      area: "jobb",
      courseId: projectId || undefined,
      deadlineLeadDays: dueDate ? DEFAULT_LEADS : undefined,
      deadlineReminderTime: reminderTime,
    });
    setTitle("");
    setDueDate("");
    setDetails("");
    setTaskDialogOpen(false);
  };

  const handleBreakDown = async (task: Task) => {
    setBusyId(task.id);
    try {
      const result = await run({
        data: {
          title: task.title,
          project: projectName(task.courseId),
          dueDate: task.dueDate,
          details: details.trim() || undefined,
        },
      });
      addTaskSteps(task.id, result.steps);
      setIntros((prev) => ({
        ...prev,
        [task.id]: [
          result.intro,
          result.startBy ? `Börja senast ${result.startBy}.` : null,
          result.note,
        ]
          .filter(Boolean)
          .join(" "),
      }));
    } catch (err) {
      toast({
        title: "Pace kunde inte dela upp uppgiften",
        description: err instanceof Error ? err.message : "Prova igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleUpload = async (task: Task, file: File) => {
    setUploadingId(task.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Du behöver vara inloggad för att ladda upp dokument.");
      const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
      const path = `${uid}/${task.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      addTaskAttachment(task.id, {
        path,
        name: file.name,
        size: file.size,
        uploadedAt: Date.now(),
      });
    } catch (err) {
      toast({
        title: "Kunde inte ladda upp filen",
        description: err instanceof Error ? err.message : "Prova igen.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data) {
      toast({ title: "Kunde inte öppna dokumentet", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const deleteAttachment = async (task: Task, path: string) => {
    await supabase.storage.from(BUCKET).remove([path]);
    removeTaskAttachment(task.id, path);
  };

  const toggleLead = (task: Task, lead: number) => {
    const current = task.deadlineLeadDays ?? [];
    const next = current.includes(lead) ? current.filter((d) => d !== lead) : [...current, lead];
    setTaskDeadlineReminders(task.id, next, task.deadlineReminderTime ?? "09:00");
  };

  return (
    <Layout>
      <MyFlovePageGrid area="planera">
        <MyFloveWide>
          <div className="space-y-8">
            <MyFloveHeader
              title="Jobb"
              emojiKey="work"
              description="Din arbetsdag – plan, uppgifter, projekt och dokument på ett ställe."
            />

            <AreaFocus
              intent="Jag ska jobba"
              lowHint="Låg ork idag – välj en liten uppgift och stanna där."
            />

            {/* Dagens plan: vad som är rimligt just nu */}
            <WorkflowContent section="plan" />

            {/* Jobbhjälp */}
            <section
              className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm"
              aria-labelledby="jobbhjalp"
            >
              <h2 id="jobbhjalp" className="font-display text-lg text-ink">
                Jobbhjälp
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Vad behöver du hjälp med?</p>

              <div className="mt-4 space-y-3">
                <CollapsibleSection
                  className="rounded-2xl border border-border/70 bg-background p-4"
                  headingClassName="font-display text-base text-ink"
                  defaultCollapsed
                  id="jobbhjalp-kom-igang"
                  title="Kom igång"
                >
                  <p className="mt-1 text-sm text-muted-foreground">
                    Töm huvudet först – skriv ner det du bär på, så tar vi en sak i taget. 💙
                  </p>
                  <div className="mt-3 space-y-3">
                    <QuickflowCapture />
                    <QuickflowList />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  defaultCollapsed
                  id="jobbhjalp-projekt"
                  className="rounded-2xl border border-border/70 bg-background p-4"
                  title="Dina projekt"
                  help="Samla uppgifter per projekt så blir listan lättare att överblicka."
                  headingClassName="font-display text-base text-ink"
                >
                  <form onSubmit={handleAddProject} className="flex gap-2">
                    <Input
                      value={projectDraft}
                      onChange={(e) => setProjectDraft(e.target.value)}
                      placeholder="T.ex. Kvartalsrapport"
                      className="h-11 rounded-2xl bg-secondary/50 border-transparent"
                    />
                    <Button
                      type="submit"
                      disabled={!projectDraft.trim()}
                      className="h-11 rounded-2xl"
                    >
                      <Plus size={18} />
                    </Button>
                  </form>
                  {activeProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Inga projekt än. Lägg till ett så vet Pace vad uppgiften hör till.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {activeProjects.map((p) => (
                        <li key={p.id}>
                          <span
                            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border"
                            style={{
                              borderColor: `hsl(${p.color} / 0.35)`,
                              background: `hsl(${p.color} / 0.08)`,
                              color: `hsl(${p.color})`,
                            }}
                          >
                            💼 {p.title}
                            <button
                              type="button"
                              onClick={() => deleteProject(p.id)}
                              aria-label={`Ta bort projektet ${p.title}`}
                              className="opacity-60 hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CollapsibleSection>

                {/* Ny arbetsuppgift */}
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <h3 className="font-display text-base text-ink">Ny arbetsuppgift</h3>
                  <Button
                    type="button"
                    className="mt-3 h-11 rounded-2xl"
                    onClick={() => setTaskDialogOpen(true)}
                  >
                    <Plus size={18} className="mr-1" /> Lägg till uppgift
                  </Button>
                </div>

                <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                  <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Ny arbetsuppgift</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddWorkTask} className="space-y-3 pt-2">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Vad ska göras? T.ex. Skicka underlag till chefen"
                      className="h-12 rounded-2xl bg-secondary/50 border-transparent"
                    />
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays size={16} />
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-11 rounded-2xl bg-background w-44"
                        />
                      </label>
                      <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                        aria-label="Välj projekt"
                      >
                        <option value="">Inget projekt</option>
                        {activeProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BellRing size={16} />
                        <Input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          aria-label="Klockslag för deadline-påminnelser"
                          className="h-11 rounded-2xl bg-background w-28"
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={!title.trim()}
                        className="h-11 rounded-2xl px-5"
                      >
                        <Plus size={18} className="mr-1" /> Lägg till
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Med deadline får du automatiskt notis 7, 3 och 1 dag innan – du kan ändra per
                      uppgift.
                    </p>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Valfritt: klistra in uppdraget så kan Pace dela upp det bättre."
                        rows={2}
                        className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                      />
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </section>

            {/* Uppgifter */}
            <CollapsibleSection
              title="Uppgifter och deadlines"
              help="Allt med ett datum. Det som är närmast ligger överst."
              headingClassName="text-lg font-semibold"
            >
              {/* Mappar */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "Alla", color: null as string | null },
                  ...activeProjects.map((p) => ({ id: p.id, label: p.title, color: p.color })),
                  { id: "none", label: "Utan mapp", color: null as string | null },
                ].map((f) => {
                  const on = folder === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFolder(f.id)}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        on
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary"
                      }`}
                      style={
                        !on && f.color
                          ? { borderColor: `hsl(${f.color} / 0.35)`, color: `hsl(${f.color})` }
                          : undefined
                      }
                    >
                      <FolderOpen size={12} />
                      {f.label}
                      <span className="opacity-60">{countFor(f.id)}</span>
                    </button>
                  );
                })}
              </div>

              {visible.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {workTasks.length === 0
                    ? "Inget inlagt än. När du lägger till en uppgift hamnar den här – och i din kalender."
                    : "Inget i den här mappen än."}
                </p>
              )}

              {visible.map((task) => {
                const dl = deadlineLabel(task.dueDate);
                const steps = task.steps ?? [];
                const done = steps.filter((s) => s.done).length;
                const files = task.attachments ?? [];

                return (
                  <article
                    key={task.id}
                    className={`surface-card p-5 space-y-4 ${task.completed ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          if (!task.completed) celebrateFromEvent(e);
                          toggleTask(task.id);
                        }}
                        className="mt-1 text-muted-foreground hover:text-primary shrink-0"
                        aria-label={task.completed ? "Ångra klarmarkering" : "Markera som klar"}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={24} className="text-primary" />
                        ) : (
                          <Circle size={24} strokeWidth={1.5} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {projectName(task.courseId) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground border border-border">
                              💼 {projectName(task.courseId)}
                            </span>
                          )}
                          {dl && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                                dl.tone === "late"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : dl.tone === "soon"
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground"
                              }`}
                            >
                              {dl.tone === "late" ? (
                                <AlertCircle size={11} />
                              ) : (
                                <CalendarDays size={11} />
                              )}
                              {task.dueDate} · {dl.text}
                            </span>
                          )}
                          {steps.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {done}/{steps.length} steg
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-base leading-snug ${task.completed ? "line-through" : ""}`}
                        >
                          {task.title}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Ta bort uppgiften"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {intros[task.id] && (
                      <p className="text-sm leading-relaxed bg-primary/5 border border-primary/20 rounded-2xl p-3">
                        {intros[task.id]}
                      </p>
                    )}

                    {steps.length > 0 && (
                      <ul className="space-y-2">
                        {steps.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => toggleTaskStep(task.id, s.id)}
                              className="w-full flex items-start gap-2 text-left text-sm p-2 rounded-2xl hover:bg-secondary/60"
                            >
                              {s.done ? (
                                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                              ) : (
                                <Circle
                                  size={16}
                                  strokeWidth={1.5}
                                  className="text-muted-foreground mt-0.5 shrink-0"
                                />
                              )}
                              <span className={s.done ? "line-through text-muted-foreground" : ""}>
                                {s.title}
                                {s.when && (
                                  <span className="text-xs text-muted-foreground"> · {s.when}</span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {files.length > 0 && (
                      <ul className="space-y-1">
                        {files.map((f) => (
                          <li key={f.path} className="flex items-center gap-2 text-sm">
                            <FileText size={14} className="text-muted-foreground shrink-0" />
                            <button
                              onClick={() => openAttachment(f.path)}
                              className="text-primary hover:underline truncate"
                            >
                              {f.name}
                            </button>
                            <button
                              onClick={() => deleteAttachment(task, f.path)}
                              className="text-muted-foreground hover:text-destructive ml-auto shrink-0"
                              aria-label={`Ta bort ${f.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {task.dueDate && !task.completed && (
                      <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <BellRing size={12} /> Påminn mig innan deadline
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {LEAD_CHOICES.map((lead) => {
                            const on = (task.deadlineLeadDays ?? []).includes(lead);
                            return (
                              <button
                                key={lead}
                                type="button"
                                onClick={() => toggleLead(task, lead)}
                                aria-pressed={on}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  on
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-secondary"
                                }`}
                              >
                                {leadLabel(lead)}
                              </button>
                            );
                          })}
                          <Input
                            type="time"
                            value={task.deadlineReminderTime ?? "09:00"}
                            onChange={(e) =>
                              setTaskDeadlineReminders(
                                task.id,
                                task.deadlineLeadDays ?? DEFAULT_LEADS,
                                e.target.value,
                              )
                            }
                            aria-label={`Klockslag för påminnelser om ${task.title}`}
                            className="h-8 w-24 rounded-full bg-background text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={task.courseId ?? ""}
                        onChange={(e) => setTaskCourse(task.id, e.target.value || undefined)}
                        aria-label={`Flytta ${task.title} till mapp`}
                        className="h-9 rounded-xl border border-border bg-background px-2 text-xs"
                      >
                        <option value="">Utan mapp</option>
                        {activeProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-2xl"
                        disabled={busyId === task.id}
                        onClick={() => handleBreakDown(task)}
                      >
                        {busyId === task.id ? (
                          <>
                            <Loader2 size={14} className="mr-2 animate-spin" /> Pace tänker…
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="mr-2" /> Dela upp i steg
                          </>
                        )}
                      </Button>

                      <input
                        type="file"
                        hidden
                        ref={(el) => {
                          fileInputs.current[task.id] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(task, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                        disabled={uploadingId === task.id}
                        onClick={() => fileInputs.current[task.id]?.click()}
                      >
                        {uploadingId === task.id ? (
                          <>
                            <Loader2 size={14} className="mr-2 animate-spin" /> Laddar upp…
                          </>
                        ) : (
                          <>
                            <Paperclip size={14} className="mr-2" /> Ladda upp dokument
                          </>
                        )}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </CollapsibleSection>

            {/* Mer i jobb */}
            <CollapsibleSection
              defaultCollapsed
              id="mer-i-jobb"
              title="Mer i jobb"
              help="Tid, övergångar, mötesläge, avslutningscheck och hjälp när dagen spårar ur."
              headingClassName="text-lg font-semibold"
            >
              <div className="space-y-4">
                <LifeProfileLink />
                <WorkflowContent section="more" />
              </div>
            </CollapsibleSection>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}

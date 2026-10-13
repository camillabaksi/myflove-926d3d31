import { openSignedDocument } from "@/lib/open-signed-document";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GraduationCap,
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
import { MyFloveThinking } from "@/components/myflove/motion";
import { useCourses } from "@/hooks/use-courses";
import { breakDownAssignment } from "@/lib/study.functions";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { lifeProfileContext, toStudyProfile } from "@/lib/life-profile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { celebrateFromEvent } from "@/lib/celebrate";
import CollapsibleSection from "@/components/collapsible-section";
import AreaFocus from "@/components/area-focus";

const BUCKET = "study-docs";

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

export function StudiesSection() {
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
  const { activeCourses, addCourse, deleteCourse } = useCourses();
  const { toast } = useToast();
  const run = useServerFn(breakDownAssignment);
  const { profile: lifeProfile } = useLifeProfile();

  const [courseDraft, setCourseDraft] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [details, setDetails] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [folder, setFolder] = useState<string>("all");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [intros, setIntros] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const assignments = useMemo(
    () =>
      tasks
        .filter((t) => t.area === "studier")
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        }),
    [tasks],
  );

  const countFor = (id: string) =>
    id === "all"
      ? assignments.length
      : id === "none"
        ? assignments.filter((t) => !t.courseId).length
        : assignments.filter((t) => t.courseId === id).length;

  const visible = useMemo(() => {
    if (folder === "all") return assignments;
    if (folder === "none") return assignments.filter((t) => !t.courseId);
    return assignments.filter((t) => t.courseId === folder);
  }, [assignments, folder]);

  const courseName = (id?: string) => activeCourses.find((c) => c.id === id)?.title;

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseDraft.trim()) return;
    const c = addCourse(courseDraft.trim());
    setCourseId(c.id);
    setCourseDraft("");
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), dueDate || undefined, {
      kind: "projekt",
      area: "studier",
      courseId: courseId || undefined,
      deadlineLeadDays: dueDate ? DEFAULT_LEADS : undefined,
      deadlineReminderTime: reminderTime,
    });
    setTitle("");
    setDueDate("");
    setDetails("");
    setAssignmentDialogOpen(false);
  };

  const handleBreakDown = async (task: Task) => {
    setBusyId(task.id);
    try {
      const result = await run({
        data: {
          title: task.title,
          course: courseName(task.courseId),
          dueDate: task.dueDate,
          details: details.trim() || undefined,
          profileContext: lifeProfileContext(lifeProfile) || undefined,
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
    try {
      await openSignedDocument(async () => {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
        if (error || !data) throw new Error("Kunde inte hämta dokumentlänken.");
        return data.signedUrl;
      });
    } catch (error) {
      toast({ title: "Kunde inte öppna dokumentet", description: error instanceof Error ? error.message : "Försök igen.", variant: "destructive" });
    }
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

  // Nästa steg: den öppna uppgift som har närmast deadline (annars den första).
  const nextUp =
    [...assignments]
      .filter((t) => !t.completed)
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))[0] ?? null;

  return (
    <div className="space-y-8">
      <AreaFocus
        intent="Jag ska plugga"
        lowHint="Låg ork idag – 5 minuters repetition räknas."
      />
      {/* Nästa steg – en sak i taget */}
      <section className="pace-card-surface rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Nästa steg</h2>
        {nextUp ? (
          <>
            <p className="mt-1 text-lg font-semibold text-ink">{nextUp.title}</p>
            {deadlineLabel(nextUp.dueDate) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {deadlineLabel(nextUp.dueDate)?.text}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11 rounded-2xl"
                disabled={busyId === nextUp.id}
                onClick={() => void handleBreakDown(nextUp)}
              >
                {busyId === nextUp.id ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <Sparkles size={16} className="mr-1" />
                )}
                Bryt ner
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 rounded-2xl"
                onClick={(e) => {
                  toggleTask(nextUp.id);
                  celebrateFromEvent(e);
                }}
              >
                <CheckCircle2 size={16} className="mr-1" /> Klar
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Inget som väntar just nu. Lägg till en uppgift när du vill.
          </p>
        )}
      </section>

      {/* Kurser */}

      <CollapsibleSection
        title="Dina kurser"
        help="Kurserna du läser. Lägg till en kurs så kan uppgifter kopplas till den."
        headingClassName="text-lg font-semibold"
        className="pace-card-surface bg-card border border-border rounded-2xl p-5"
      >
        <form onSubmit={handleAddCourse} className="flex gap-2">
          <Input
            value={courseDraft}
            onChange={(e) => setCourseDraft(e.target.value)}
            placeholder="T.ex. Socialpedagogik"
            className="h-11 rounded-xl bg-secondary/50 border-transparent"
          />
          <Button type="submit" disabled={!courseDraft.trim()} className="h-11 rounded-xl">
            <Plus size={18} />
          </Button>
        </form>
        {activeCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga kurser än. Lägg till en så vet Pace vad inlämningen hör till.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {activeCourses.map((c) => (
              <li key={c.id}>
                <span
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: `hsl(${c.color} / 0.35)`,
                    background: `hsl(${c.color} / 0.08)`,
                    color: `hsl(${c.color})`,
                  }}
                >
                  📚 {c.title}
                  <button
                    type="button"
                    onClick={() => deleteCourse(c.id)}
                    aria-label={`Ta bort kursen ${c.title}`}
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

      {/* Ny inlämning */}
      <section className="pace-card-surface bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Ny skoluppgift</h2>
          <p className="text-sm text-muted-foreground">Lägg till en inlämning eller deadline.</p>
        </div>
        <Button type="button" className="h-11 rounded-xl px-5" onClick={() => setAssignmentDialogOpen(true)}>
          <Plus size={18} className="mr-1" /> Lägg till
        </Button>
      </section>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ny skoluppgift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAssignment} className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vad ska göras? T.ex. Inlämning: fallbeskrivning"
              className="h-12 rounded-xl bg-secondary/50 border-transparent"
            />
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays size={16} />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11 rounded-xl bg-background w-44"
                />
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                aria-label="Välj kurs"
              >
                <option value="">Ingen kurs</option>
                {activeCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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
                  className="h-11 rounded-xl bg-background w-28"
                />
              </label>
              <Button type="submit" disabled={!title.trim()} className="h-11 rounded-xl px-5">
                <Plus size={18} className="mr-1" /> Lägg till
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Med deadline får du automatiskt notis 7, 3 och 1 dag innan – du kan ändra per uppgift.
            </p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Valfritt: klistra in instruktionen så kan Pace dela upp den bättre."
              rows={2}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Inlämningar */}
      <CollapsibleSection
        title="Inlämningar och deadlines"
        help="Allt med ett datum. Det som är närmast ligger överst."
        headingClassName="text-lg font-semibold"
      >
        {/* Mappar */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Alla", color: null as string | null },
            ...activeCourses.map((c) => ({ id: c.id, label: c.title, color: c.color })),
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
            {assignments.length === 0
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
              className={`bg-card border border-border rounded-2xl p-5 space-y-4 ${
                task.completed ? "opacity-60" : ""
              }`}
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
                    {courseName(task.courseId) && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground border border-border">
                        📚 {courseName(task.courseId)}
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
                  <p className={`text-base leading-snug ${task.completed ? "line-through" : ""}`}>
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
                <p className="text-sm leading-relaxed bg-primary/5 border border-primary/20 rounded-xl p-3">
                  {intros[task.id]}
                </p>
              )}

              {steps.length > 0 && (
                <ul className="space-y-2">
                  {steps.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => toggleTaskStep(task.id, s.id)}
                        className="w-full flex items-start gap-2 text-left text-sm p-2 rounded-xl hover:bg-secondary/60"
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
                <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
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
                  {activeCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>

                {busyId === task.id && (
                  <MyFloveThinking
                    steps={["📚", "🧠", "✂️", "✨"]}
                    label="Jag delar upp den i mindre steg…"
                    className="py-2"
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
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
                  className="rounded-xl"
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
    </div>
  );
}

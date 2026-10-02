import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Brain,
  Sparkles,
  Loader2,
  Upload,
  Trash2,
  CalendarDays,
  RotateCcw,
  ListChecks,
  Target,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { useCourses } from "@/hooks/use-courses";
import { useToast } from "@/hooks/use-toast";
import { celebrateFromEvent } from "@/lib/celebrate";
import { generateStudySet } from "@/lib/flowstudy.functions";
import LifeProfileLink from "@/components/life-profile-link";
import AdaptiveIntentPrompt from "@/components/adaptive-intent-prompt";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { lifeProfileContext, toStudyProfile } from "@/lib/life-profile";
import {
  studyMaterialPlan,
  applyEmphasis,
  EMPHASIS_META,
  type StudyEmphasis,
} from "@/lib/study-profile";

import {
  useFlowStudy,
  adaptiveOrder,
  daysUntil,
  examPhase,
  type StudySetRecord,
} from "@/hooks/use-flowstudy";
import CollapsibleSection from "@/components/collapsible-section";
import { ACCEPT_DOCUMENTS, UPLOAD_HINT, prepareUpload } from "@/lib/file-formats";
import { MyFloveThinking, MyFloveEmptyIllustration } from "@/components/myflove/motion";

export function StudyBuddyContent() {
  const { activeCourses } = useCourses();
  const { toast } = useToast();
  const run = useServerFn(generateStudySet);
  const { profile: lifeProfile } = useLifeProfile();
  const {
    sets,
    addSet,
    appendToSet,
    deleteSet,
    setExamDate,
    gradeCard,
    gradeQuestion,
    recordAttempt,
    stats,
  } = useFlowStudy();

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDateInput] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [newMaterialOpen, setNewMaterialOpen] = useState(false);

  const [openSetId, setOpenSetId] = useState<string | null>(null);
  const [mode, setMode] = useState<"cards" | "quiz" | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [emphasis, setEmphasis] = useState<StudyEmphasis | null>(null);
  const [output, setOutput] = useState<"both" | "cards" | "quiz">("both");
  const wantCards = output !== "quiz";
  const wantQuiz = output !== "cards";

  const basePlan = useMemo(() => studyMaterialPlan(toStudyProfile(lifeProfile)), [lifeProfile]);
  const plan = useMemo(
    () => (emphasis ? applyEmphasis(basePlan, emphasis) : basePlan),
    [basePlan, emphasis],
  );

  const courseName = (id?: string) => activeCourses.find((c) => c.id === id)?.title;
  const openSet = useMemo(() => sets.find((s) => s.id === openSetId) ?? null, [sets, openSetId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!text.trim() && !file) {
      toast({
        title: "Lägg till material",
        description: `Klistra in text eller ladda upp en fil. ${UPLOAD_HINT}`,
      });
      return;
    }
    setBusy(true);
    try {
      let filePayload: { name: string; mime: string; dataUrl: string } | undefined;
      let extraText = "";
      if (file) {
        const prepared = await prepareUpload(file);
        if (prepared.kind === "file") filePayload = prepared.file;
        else extraText = prepared.text;
      }

      const result = await run({
        data: {
          title: title.trim(),
          course: courseName(courseId),
          text: [text.trim(), extraText].filter(Boolean).join("\n\n") || undefined,
          file: filePayload,
          profileContext: lifeProfileContext(lifeProfile) || undefined,
          focus: plan.focus || undefined,
          cardCount: wantCards ? plan.cardCount : 0,
          quizCount: wantQuiz ? plan.quizCount : 0,
        },
      });

      const cards = wantCards ? result.cards : [];
      const quiz = wantQuiz ? result.quiz : [];

      const record = addSet({
        title: title.trim(),
        courseId: courseId || undefined,
        examDate: examDate || undefined,
        summary: result.summary,
        topics: result.topics,
        cards,
        quiz,
      });

      setTitle("");
      setText("");
      setFile(null);
      setExamDateInput("");
      setNewMaterialOpen(false);
      setOpenSetId(record.id);
      setMode(cards.length > 0 ? "cards" : "quiz");
      toast({
        title: "Klart – materialet är förvandlat",
        description: [
          cards.length > 0 ? `${cards.length} flashcards` : null,
          quiz.length > 0 ? `${quiz.length} quizfrågor` : null,
        ]
          .filter(Boolean)
          .join(" och "),
      });
    } catch (err) {
      toast({
        title: "Flow kunde inte skapa frågorna",
        description: err instanceof Error ? err.message : "Prova igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Ladda upp materialet – Flow gör flashcards och quiz, och kommer ihåg vad du behöver
        repetera.
      </p>

      <LifeProfileLink />

      {/* Samma adaptiva princip som i resten av appen. */}
      <AdaptiveIntentPrompt
        source="studier"
        chips={["Jag behöver plugga", "Jag behöver repetera", "Jag har prov snart"]}
        placeholder="Vad behöver du plugga?"
        className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
      />

      {(stats.dueCards > 0 || stats.dueQuestions > 0) && (
        <p className="text-sm rounded-2xl border border-primary/20 bg-primary/5 p-3">
          Att repetera nu: {stats.dueCards} flashcards och {stats.dueQuestions} frågor. Ta det du
          orkar.
        </p>
      )}

      {/* Nytt material */}
      <Button
        type="button"
        onClick={() => setNewMaterialOpen(true)}
        className="h-12 rounded-xl px-5"
      >
        <PlusCircle size={16} className="mr-2" /> Nytt studiematerial
      </Button>

      <Dialog open={newMaterialOpen} onOpenChange={setNewMaterialOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Nytt studiematerial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-3 pt-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Prov – Socialpedagogik"
              className="h-12 rounded-xl bg-secondary/50 border-transparent"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                aria-label="Välj kurs"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">Ingen kurs</option>
                {activeCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays size={16} />
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDateInput(e.target.value)}
                  aria-label="Provdatum"
                  className="h-11 rounded-xl bg-background w-44"
                />
              </label>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept={ACCEPT_DOCUMENTS}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />{" "}
                {file ? file.name.slice(0, 24) : "Ladda upp fil"}
              </Button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Klistra in anteckningar, lärarens frågor eller en text."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
            <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-medium">Flow anpassar efter din livsprofil</p>
              {basePlan.chips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {basePlan.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground border border-border"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Fyll i din livsprofil ovan så anpassas kort och frågor efter dina stödbehov.
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Object.keys(EMPHASIS_META) as StudyEmphasis[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEmphasis(key)}
                    className={`rounded-full px-3 py-1 text-[11px] border transition ${
                      plan.emphasis === key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {EMPHASIS_META[key]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Blir ungefär{" "}
                {[
                  wantCards ? `${plan.cardCount} flashcards` : null,
                  wantQuiz ? `${plan.quizCount} quizfrågor` : null,
                ]
                  .filter(Boolean)
                  .join(" och ")}
                . Du kan alltid ändra.
              </p>
            </div>

            <div
              className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2"
              role="group"
              aria-label="Vad vill du få?"
            >
              <p className="text-xs font-medium">Vad vill du få?</p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["both", "Både och"],
                    ["cards", "Bara flashcards"],
                    ["quiz", "Bara quiz"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={output === key}
                    onClick={() => setOutput(key)}
                    className={`rounded-full px-3 py-1 text-[11px] border transition ${
                      output === key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {busy && (
              <MyFloveThinking
                steps={["📄", "🧠", "🃏", "✨"]}
                label="Jag läser materialet och gör kort av det…"
              />
            )}
            <Button type="submit" disabled={busy || !title.trim()} className="h-11 rounded-xl px-5">
              {busy ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Flow läser materialet…
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" /> Skapa{" "}
                  {output === "cards" ? "flashcards" : output === "quiz" ? "quiz" : "flashcards och quiz"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Lägger du in ett provdatum får du en lugn pluggplan: flashcards först, quiz sen,
              repetition sist.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Studiematerial */}
      <CollapsibleSection title="Ditt material" headingClassName="text-lg font-semibold">
        {sets.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <MyFloveEmptyIllustration kind="documents" className="mb-2 block" />
            Inget material än. Börja med en text eller en bild på dina anteckningar.
          </p>
        )}

        {sets.map((set) => {
          const days = daysUntil(set.examDate);
          const phase = examPhase(days);
          const last = set.attempts[0];
          const isOpen = openSetId === set.id;
          return (
            <article
              key={set.id}
              className="bg-card border border-border rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {courseName(set.courseId) && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground border border-border">
                        📚 {courseName(set.courseId)}
                      </span>
                    )}
                    {phase && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                        {set.examDate} · {phase.label}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {set.cards.length} kort · {set.quiz.length} frågor
                    </span>
                  </div>
                  <p className="text-base leading-snug font-medium">{set.title}</p>
                  {set.summary && (
                    <p className="text-sm text-muted-foreground mt-1">{set.summary}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteSet(set.id)}
                  aria-label={`Ta bort ${set.title}`}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {phase && (
                <p className="text-sm rounded-xl bg-secondary/40 border border-border p-3">
                  {phase.advice}
                </p>
              )}

              {!set.examDate && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays size={14} /> Provdatum
                  <Input
                    type="date"
                    onChange={(e) => setExamDate(set.id, e.target.value || undefined)}
                    aria-label={`Provdatum för ${set.title}`}
                    className="h-9 w-40 rounded-xl bg-background text-xs"
                  />
                </label>
              )}

              {last && (
                <p className="text-sm">
                  🎯 Senast hade du rätt på {last.correct} av {last.total}.
                  {last.wrongTopics.length > 0 && ` Repetera: ${last.wrongTopics.join(", ")}.`}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {set.cards.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      setOpenSetId(set.id);
                      setMode("cards");
                    }}
                  >
                    <RotateCcw size={14} className="mr-2" /> Flashcards
                  </Button>
                )}
                {set.quiz.length > 0 && (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      setOpenSetId(set.id);
                      setMode("quiz");
                    }}
                  >
                    <ListChecks size={14} className="mr-2" /> Kör quiz
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setAddingId(addingId === set.id ? null : set.id)}
                >
                  <PlusCircle size={14} className="mr-2" />
                  {addingId === set.id ? "Stäng" : "Lägg till material"}
                </Button>
              </div>

              <Dialog
                open={addingId === set.id}
                onOpenChange={(open) => setAddingId(open ? set.id : null)}
              >
                <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Lägg till i setet</DialogTitle>
                  </DialogHeader>
                <AddMaterialForm
                  onCancel={() => setAddingId(null)}
                  onSubmit={async (payload) => {
                    const result = await run({
                      data: {
                        title: set.title,
                        course: courseName(set.courseId),
                        text: payload.text,
                        file: payload.file,
                        profileContext: lifeProfileContext(lifeProfile) || undefined,
                        cardCount: 8,
                        quizCount: 6,
                      },
                    });
                    appendToSet(set.id, {
                      topics: result.topics,
                      cards: result.cards,
                      quiz: result.quiz,
                    });
                    setAddingId(null);
                    toast({
                      title: "Materialet är påfyllt",
                      description: `+${result.cards.length} flashcards och +${result.quiz.length} frågor.`,
                    });
                  }}
                />
                </DialogContent>
              </Dialog>

              {isOpen && mode === "cards" && openSet && (
                <FlashcardRunner
                  set={openSet}
                  onGrade={(cardId, knewIt) => gradeCard(set.id, cardId, knewIt)}
                  onClose={() => setMode(null)}
                />
              )}
              {isOpen && mode === "quiz" && openSet && (
                <QuizRunner
                  set={openSet}
                  onGrade={(qid, ok) => gradeQuestion(set.id, qid, ok)}
                  onFinish={(attempt) => recordAttempt(set.id, attempt)}
                  onClose={() => setMode(null)}
                />
              )}
            </article>
          );
        })}
      </CollapsibleSection>
    </div>
  );
}

function AddMaterialForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: {
    text?: string;
    file?: { name: string; mime: string; dataUrl: string };
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      toast({
        title: "Lägg till material",
        description: `Klistra in text eller välj en fil. ${UPLOAD_HINT}`,
      });
      return;
    }
    setBusy(true);
    try {
      let filePayload: { name: string; mime: string; dataUrl: string } | undefined;
      let extraText = "";
      if (file) {
        const prepared = await prepareUpload(file);
        if (prepared.kind === "file") filePayload = prepared.file;
        else extraText = prepared.text;
      }
      await onSubmit({
        text: [text.trim(), extraText].filter(Boolean).join("\n\n") || undefined,
        file: filePayload,
      });
      setText("");
      setFile(null);
    } catch (err) {
      toast({
        title: "Flow kunde inte lägga till materialet",
        description: err instanceof Error ? err.message : "Prova igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-secondary/30 p-3 space-y-3"
    >
      <p className="text-xs text-muted-foreground">
        Fyll på med mer material – de nya korten och frågorna läggs till i samma set.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Klistra in mer anteckningar eller frågor."
        className="w-full rounded-xl border border-border bg-background p-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPT_DOCUMENTS}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} className="mr-2" /> {file ? file.name.slice(0, 24) : "Ladda upp fil"}
        </Button>
        <Button type="submit" size="sm" className="rounded-xl" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" /> Flow läser…
            </>
          ) : (
            <>
              <Sparkles size={14} className="mr-2" /> Lägg till i setet
            </>
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}

function FlashcardRunner({
  set,
  onGrade,
  onClose,
}: {
  set: StudySetRecord;
  onGrade: (cardId: string, knewIt: boolean) => void;
  onClose: () => void;
}) {
  const [queue] = useState(() => adaptiveOrder(set.cards).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = queue[index];

  if (!card) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <p className="text-sm">Runda klar. Det du var osäker på kommer tillbaka snart.</p>
        <Button size="sm" variant="secondary" className="rounded-xl" onClick={onClose}>
          Stäng
        </Button>
      </div>
    );
  }

  const grade = (knewIt: boolean) => {
    onGrade(card.id, knewIt);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        Kort {index + 1} av {queue.length}
        {card.topic ? ` · ${card.topic}` : ""}
      </p>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left rounded-xl bg-card border border-border p-4 min-h-24"
      >
        <p className="text-base">{flipped ? card.back : card.front}</p>
        {!flipped && <p className="text-xs text-muted-foreground mt-2">Tryck för att se svaret</p>}
      </button>
      {flipped && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => grade(false)}>
            Behöver repetera
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={(e) => {
              celebrateFromEvent(e);
              grade(true);
            }}
          >
            Jag kunde den
          </Button>
        </div>
      )}
    </div>
  );
}

function QuizRunner({
  set,
  onGrade,
  onFinish,
  onClose,
}: {
  set: StudySetRecord;
  onGrade: (questionId: string, wasCorrect: boolean) => void;
  onFinish: (attempt: {
    at: number;
    total: number;
    correct: number;
    wrongTopics: string[];
  }) => void;
  onClose: () => void;
}) {
  const [queue] = useState(() => adaptiveOrder(set.quiz).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongTopics, setWrongTopics] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const q = queue[index];

  if (done || !q) {
    const strong = correctCount >= Math.ceil(queue.length * 0.8);
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <p className="text-base font-medium">
          🎯 Du hade rätt på {correctCount} av {queue.length}!
        </p>
        <p className="text-sm text-muted-foreground">
          {wrongTopics.length > 0
            ? `Du verkar ha koll på det mesta, men behöver repetera ${wrongTopics.join(" och ")}. De frågorna sparar jag till nästa gång.`
            : strong
              ? "Fin koll på materialet. Vi tar en lätt repetition längre fram."
              : "Bra jobbat att du körde en runda. Vi tar det igen när du orkar."}
        </p>
        <Button size="sm" variant="secondary" className="rounded-xl" onClick={onClose}>
          Stäng
        </Button>
      </div>
    );
  }

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    onGrade(q.id, ok);
    if (ok) setCorrectCount((c) => c + 1);
    else if (q.topic && !wrongTopics.includes(q.topic))
      setWrongTopics((t) => [...t, q.topic as string]);
  };

  const next = () => {
    setPicked(null);
    if (index + 1 >= queue.length) {
      const total = queue.length;
      const finalCorrect = correctCount;
      setDone(true);
      onFinish({ at: Date.now(), total, correct: finalCorrect, wrongTopics });
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        Fråga {index + 1} av {queue.length}
        {q.topic ? ` · ${q.topic}` : ""}
      </p>
      <p className="text-base">{q.question}</p>
      <ul className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const state =
            picked === null
              ? "border-border bg-card hover:bg-secondary/60"
              : isCorrect
                ? "border-primary/40 bg-primary/10 text-primary"
                : picked === i
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border bg-card opacity-60";
          return (
            <li key={i}>
              <button
                onClick={() => answer(i)}
                disabled={picked !== null}
                className={`w-full text-left text-sm rounded-xl border p-3 transition-colors ${state}`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div className="space-y-2">
          {picked !== q.correctIndex && (
            <p className="text-sm text-muted-foreground">Den här sparar jag till repetition.</p>
          )}
          {q.explanation && <p className="text-sm">{q.explanation}</p>}
          <Button size="sm" className="rounded-xl" onClick={next}>
            {index + 1 >= queue.length ? (
              <>
                <Target size={14} className="mr-2" /> Se resultat
              </>
            ) : (
              <>
                Nästa <ArrowRight size={14} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

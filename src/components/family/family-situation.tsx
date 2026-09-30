import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useLang } from "@/hooks/use-language";
import { useTasks } from "@/hooks/use-data";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useChildEvents } from "@/hooks/use-child-events";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import type { PictogramId } from "@/lib/child-visual-schedule";
import {
  SITUATION_CATEGORIES,
  HELPED_OPTIONS,
  HELPED_TO_CHILD_HELP,
  LOW_CAPACITY_PROMPTS,
  alternativesAfter,
  detectCategory,
  questionsFor,
  strategiesFor,
  summarize,
  type SituationAnswers,
  type SituationCategoryId,
  type Strategy,
  type StrategyId,
} from "@/lib/situation-helper";
import { todayISO } from "@/lib/day";
import SituationLog, { type SituationLogEntry, type AttemptResult } from "@/components/family/situation-log";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export interface SituationChild {
  id: string;
  name: string;
  helps: string[];
}

type Step = "what" | "who" | "questions" | "capacity" | "summary" | "options" | "strategy" | "done";

const VISUAL_ICON: Record<string, PictogramId> = {
  "Klä på sig": "dress",
  "Ta på skor": "walk",
  "Packa väskan": "bag",
  "Gå till bilen": "car",
  "Borsta tänder": "teeth",
  "Tvätta händerna": "shower",
  Pyjamas: "dress",
  "Läsa saga": "study",
  Sova: "sleep",
  "Sätta sig vid bordet": "meal",
  "Smaka en tugga": "meal",
  "Gå till skolan": "school",
};

/**
 * "Hjälp mig med en situation" – ett steg i taget.
 * Återanvänder barnprofiler, barnens schema, kapacitetsläget, uppgifter och bildstöd.
 */
export default function FamilySituation({
  childrenList,
  selectedChildId,
  onSaveHelp,
  log,
  onChangeLog,
  className,
}: {
  childrenList: SituationChild[];
  /** Barnspecifik ingång: välj barnet direkt och behåll det under hela stödet. */
  selectedChildId?: string;
  /** Spara en observation i barnets befintliga profil ("brukar hjälpa"). */
  onSaveHelp?: (childId: string, helps: string[]) => Promise<unknown> | void;
  /** Situationlogg som ägs av sidan, så "Tidigare situationer" också kan visas i Family Flow. */
  log: SituationLogEntry[];
  onChangeLog: (update: (prev: SituationLogEntry[]) => SituationLogEntry[]) => void;
  className?: string;
}) {
  const { t } = useLang();
  const { tasks, addTask } = useTasks();
  const capacity = useCapacityMode();
  const events = useChildEvents();

  const [step, setStep] = useState<Step>("what");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<SituationCategoryId | null>(null);
  const [whoIds, setWhoIds] = useState<string[]>(selectedChildId ? [selectedChildId] : []);
  const [whoSelf, setWhoSelf] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<SituationAnswers>({});
  const [lowMode, setLowMode] = useState(false);
  const [current, setCurrent] = useState<Strategy | null>(null);
  const [tried, setTried] = useState<StrategyId[]>([]);
  const [retry, setRetry] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [added, setAdded] = useState(false);
  const [helped, setHelped] = useState<string | null>(null);
  const [savedHelp, setSavedHelp] = useState(false);
  // Loggen ägs av sidan (family-flow) så den kan visas i flera sektioner.
  const setLog = onChangeLog;
  const [entryId, setEntryId] = useState<string | null>(null);

  /** Uppdaterar aktuell situation i loggen (skapas vid första valda väg). */
  const logAttempt = (title: string, result: AttemptResult) => {
    const catLabel = SITUATION_CATEGORIES.find((c) => c.id === cat)?.label ?? "Annat";
    const id = entryId ?? `sit-${Date.now()}`;
    if (!entryId) setEntryId(id);
    setLog((prev) => {
      const list = prev ?? [];
      const existing = list.find((e) => e.id === id);
      const base: SituationLogEntry = existing ?? {
         id, at: Date.now(), category: catLabel, text: text.trim().slice(0, 300), who, childId: selectedChildId, attempts: [], helped: null,
      };
      const attempts = base.attempts.some((a) => a.title === title && a.result === "provat")
        ? base.attempts.map((a) => (a.title === title && a.result === "provat" ? { ...a, result } : a))
        : [...base.attempts, { title, result }];
      const next = { ...base, attempts };
      return [next, ...list.filter((e) => e.id !== id)].slice(0, 100);
    });
  };
  const logHelped = (h: string) => {
    if (!entryId) return;
    setLog((prev) => (prev ?? []).map((e) => (e.id === entryId ? { ...e, helped: h } : e)));
  };

  const cat = category ?? "annat";
  const kids = childrenList.filter((c) => whoIds.includes(c.id));
  const who = whoSelf
    ? "Du"
    : kids.length > 1
      ? kids.map((k) => k.name).join(" och ")
      : (kids[0]?.name ?? "Barnet");
  const questions = useMemo(() => questionsFor(cat, text), [cat, text]);
  const summary = useMemo(
    () => summarize({ text, category: cat, who, answers }),
    [text, cat, who, answers],
  );
  const options = useMemo(
    () => (retry ? alternativesAfter(tried, cat) : strategiesFor(cat, answers)),
    [retry, tried, cat, answers],
  );
  const single = kids.length === 1 ? kids[0]! : null;
  const nextEvent = single
    ? events.find((e) => e.childId === single.id && !e.completed && e.time >= nowHHMM())
    : null;

  const reset = () => {
    setStep("what");
    setText("");
    setCategory(null);
    setWhoIds(selectedChildId ? [selectedChildId] : []);
    setWhoSelf(false);
    setQIndex(0);
    setAnswers({});
    setLowMode(false);
    setCurrent(null);
    setTried([]);
    setRetry(false);
    setShowVisual(false);
    setAdded(false);
    setHelped(null);
    setSavedHelp(false);
    setEntryId(null);
  };

  const afterQuestions = () => setStep(capacity.mode === "lagt" ? "capacity" : "summary");

  const goNextFromWhat = (id: SituationCategoryId | null) => {
    const c = id ?? detectCategory(text) ?? "annat";
    setCategory(c);
    track("flow_suggestion_shown", { source: "family-situation" });
    if (childrenList.length === 0) {
      setWhoSelf(false);
      setStep("questions");
    } else setStep(selectedChildId ? "questions" : "who");
  };

  const choose = (s: Strategy) => {
    setCurrent(s);
    logAttempt(s.title, "provat");
    setShowVisual(false);
    setAdded(false);
    setStep("strategy");
  };

  const taskTitle = current ? `${current.title} (${who})` : "";
  const addToDay = () => {
    if (!current || added) return;
    const exists = tasks.some((x) => x.title === taskTitle && x.dueDate === todayISO());
    if (!exists) addTask(taskTitle, todayISO(), { steps: current.steps, note: current.say });
    setAdded(true);
    track("flow_suggestion_accepted", { source: "family-situation" });
    toast.success(exists ? t("Den finns redan i din dag.") : t("Den ligger i din dag nu. 💙"));
  };

  const back = () => {
    const prev: Partial<Record<Step, Step>> = {
      who: "what",
      questions: selectedChildId ? "what" : childrenList.length ? "who" : "what",
      capacity: "questions",
      summary: capacity.mode === "lagt" ? "capacity" : "questions",
      options: "summary",
      strategy: "options",
    };
    if (step === "questions" && qIndex > 0) return setQIndex(qIndex - 1);
    const p = prev[step];
    if (p) setStep(p);
  };

  const big = (active = false) =>
    cn(
      "press flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium text-ink",
      active ? "border-primary bg-primary/10" : "border-border bg-card",
    );
  const primary =
    "press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50";
  const ghost =
    "press inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium text-ink";

  return (
    <div className={cn("space-y-4", className)} data-testid="family-situation">
      {step !== "what" && step !== "done" && (
        <button
          type="button"
          onClick={back}
          className="press inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft size={15} aria-hidden /> {t("Tillbaka")}
        </button>
      )}

      {step === "what" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{selectedChildId ? t("Vad behöver ni hjälp med just nu?") : t("Vad händer?")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Du behöver inte formulera dig perfekt. Berätta bara lite så hjälper Flow dig vidare.")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SITUATION_CATEGORIES.map((c) => (
              <button key={c.id} type="button" className={big()} onClick={() => goNextFromWhat(c.id)}>
                <span aria-hidden className="text-lg">{c.emoji}</span>
                <span className="min-w-0 flex-1">{t(c.label)}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder={t("Eller skriv med egna ord…")}
              aria-label={t("Vad händer?")}
              className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => goNextFromWhat(null)}
              className={primary}
            >
              {t("Fortsätt")} <ChevronRight size={16} aria-hidden />
            </button>
          </div>
          {!selectedChildId && <SituationLog
            entries={log ?? []}
            onDelete={(id) => setLog((prev) => (prev ?? []).filter((e) => e.id !== id))}
          />}
        </div>
      )}

      {step === "who" && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">{t("Vem gäller det?")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {childrenList.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={whoIds.includes(c.id)}
                className={big(whoIds.includes(c.id))}
                onClick={() => {
                  setWhoSelf(false);
                  setWhoIds((ids) => (ids.includes(c.id) ? ids.filter((x) => x !== c.id) : [...ids, c.id]));
                }}
              >
                <span aria-hidden>👧</span> <span className="flex-1">{c.name}</span>
                {whoIds.includes(c.id) && <Check size={16} aria-hidden />}
              </button>
            ))}
            {childrenList.length > 1 && (
              <button
                type="button"
                className={big(whoIds.length === childrenList.length)}
                onClick={() => {
                  setWhoSelf(false);
                  setWhoIds(childrenList.map((c) => c.id));
                }}
              >
                <span aria-hidden>👨‍👩‍👧</span> {t("Flera barn")}
              </button>
            )}
            <button
              type="button"
              className={big(whoSelf)}
              onClick={() => {
                setWhoIds([]);
                setWhoSelf(true);
              }}
            >
              <span aria-hidden>👤</span> {t("Jag som förälder")}
            </button>
          </div>
          <button
            type="button"
            className={primary}
            onClick={() => {
              setQIndex(0);
              setStep("questions");
            }}
          >
            {whoIds.length || whoSelf ? t("Fortsätt") : t("Hoppa över")} <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}

      {step === "questions" && questions[qIndex] && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t("Fråga")} {qIndex + 1}/{questions.length}
          </p>
          <h3 className="font-display text-lg font-bold text-ink">{t(questions[qIndex]!.question)}</h3>
          {qIndex === 0 && single && single.helps.length > 0 && (
            <p className="rounded-2xl bg-lavender/30 p-3 text-sm text-ink">
              {t("Du har skrivit att")} {single.name} {t("brukar må bra av")}:{" "}
              {single.helps.slice(0, 2).map((h) => h.toLowerCase()).join(", ")}.
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {questions[qIndex]!.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={big(answers[questions[qIndex]!.id] === o.id)}
                onClick={() => {
                  setAnswers((a) => ({ ...a, [questions[qIndex]!.id]: o.id }));
                  if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
                  else afterQuestions();
                }}
              >
                {t(o.label)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="press min-h-10 text-sm text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => (qIndex + 1 < questions.length ? setQIndex(qIndex + 1) : afterQuestions())}
          >
            {t("Hoppa över")}
          </button>
        </div>
      )}

      {step === "capacity" && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">{t("Har du väldigt lite ork just nu?")}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => { setLowMode(true); setStep("summary"); }}>
              {t("Ja")}
            </button>
            <button type="button" className={ghost} onClick={() => { setLowMode(false); setStep("summary"); }}>
              {t("Nej")}
            </button>
          </div>
        </div>
      )}

      {step === "summary" && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">{t("Jag tror jag förstår situationen:")}</h3>
          <p className="text-sm text-ink">{summary.sentence}</p>
          <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <SummaryRow icon="⏰" label={t("Tid")} value={summary.time} />
            <SummaryRow icon="👧" label={t("Gäller")} value={summary.who === "Du" ? t("Dig") : summary.who} />
            <SummaryRow icon="🔄" label={t("Situation")} value={t(summary.situation)} />
            <SummaryRow icon="🎯" label={t("Målet")} value={t(summary.goal)} />
          </ul>
          {nextEvent && (
            <p className="text-xs text-muted-foreground">
              {t("Nästa för")} {single!.name}: {nextEvent.time} {nextEvent.title}
            </p>
          )}
          {lowMode && (
            <div className="space-y-2 rounded-2xl bg-lavender/30 p-3">
              <p className="text-sm font-semibold text-ink">{t("Även din kapacitet räknas.")} 💜</p>
              <ul className="space-y-1 text-sm text-ink">
                {LOW_CAPACITY_PROMPTS.map((p) => <li key={p}>• {t(p)}</li>)}
              </ul>
            </div>
          )}
          <p className="text-sm font-medium text-ink">{t("Stämmer det?")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primary}
              onClick={() => {
                if (lowMode) {
                  const quick = strategiesFor(cat, answers).find((s) => s.id === "mindre") ?? options[0]!;
                  choose(quick);
                } else setStep("options");
              }}
            >
              {t("Ja, hjälp mig vidare")}
            </button>
            <button type="button" className={ghost} onClick={() => { setQIndex(0); setStep("questions"); }}>
              {t("Ändra något")}
            </button>
          </div>
        </div>
      )}

      {step === "options" && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">
            {retry ? t("Vill du prova något annat?") : t("Vad vill du prova?")}
          </h3>
          {retry && (
            <p className="text-sm text-muted-foreground">
              {t("Det är helt vanligt att första försöket inte fungerar. Här är fler vägar.")}
            </p>
          )}
          <div className="space-y-2">
            {options.map((s, i) => (
              <button key={s.id} type="button" className={big()} onClick={() => choose(s)}>
                <Dot dot={s.dot} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{String.fromCharCode(65 + i)}</span> – {t(s.title)}
                </span>
                <ChevronRight size={16} aria-hidden className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "strategy" && current && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">
            <Dot dot={current.dot} /> {t(current.title)}
          </h3>
          {single && single.helps.length > 0 && (
            <p className="rounded-2xl bg-lavender/30 p-3 text-sm text-ink">
              {t("Tänk på det som brukar hjälpa")} {single.name}: {single.helps.map((h) => t(h)).join(" · ")}
            </p>
          )}
          <ol className="space-y-2 text-sm text-ink">
            {current.steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5">{t(s)}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-primary/20 bg-lavender/30 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <MessageCircle size={14} aria-hidden /> {t("Säg så här")}
            </p>
            <p className="mt-1 text-sm italic text-ink">"{t(current.say)}"</p>
          </div>

          {current.visual && (
            <div className="space-y-2">
              {!showVisual ? (
                <button type="button" className="press min-h-10 text-sm font-medium text-primary" onClick={() => setShowVisual(true)}>
                  {t("Vill du göra detta visuellt?")}
                </button>
              ) : (
                <ol className="flex flex-wrap gap-2" aria-label={t("Bildstöd")}>
                  {current.visual.map((v) => (
                    <li key={v} className="flex w-20 flex-col items-center gap-1 text-center text-xs text-ink">
                      <ActivityPictogram id={VISUAL_ICON[v] ?? "task"} tone="lavender" className="h-12 w-12" />
                      {t(v)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primary}
              onClick={() => {
                setTried((x) => [...x, current.id]);
                logAttempt(current.title, "fungerade");
                setStep("done");
                track("flow_suggestion_accepted", { source: "family-situation-done" });
              }}
            >
              {t("Det gick!")} <Check size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={ghost}
              onClick={() => {
                setTried((x) => [...x, current.id]);
                logAttempt(current.title, "fungerade inte");
                setRetry(true);
                setStep("options");
                track("flow_suggestion_rejected", { source: "family-situation" });
              }}
            >
              {t("Det fungerade inte")}
            </button>
          </div>
          <button type="button" disabled={added} onClick={addToDay} className="press min-h-10 text-sm text-muted-foreground underline-offset-2 hover:underline disabled:no-underline">
            {added ? t("Tillagd i Min dag ✓") : t("Vill du lägga detta i planen?")}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-ink">{t("Det gick!")} 💜</h3>
          <p className="text-sm text-ink">{t("Vad hjälpte mest?")}</p>
          <div className="flex flex-wrap gap-2">
            {HELPED_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={helped === h}
                onClick={() => {
                  setHelped(h);
                  logHelped(h);
                  track("flow_suggestion_accepted", { source: "family-situation-feedback" });
                }}
                className={cn(
                  "press min-h-11 rounded-full border px-4 text-sm font-medium",
                  helped === h ? "border-primary bg-primary/10 text-ink" : "border-border bg-card text-muted-foreground",
                )}
              >
                {t(h)}
              </button>
            ))}
          </div>
          {helped && single && onSaveHelp && HELPED_TO_CHILD_HELP[helped] && !single.helps.includes(HELPED_TO_CHILD_HELP[helped]!) && (
            <button
              type="button"
              disabled={savedHelp}
              className={ghost}
              onClick={async () => {
                await onSaveHelp(single.id, [...single.helps, HELPED_TO_CHILD_HELP[helped]!]);
                setSavedHelp(true);
                toast.success(t("Sparat i barnets profil."));
              }}
            >
              {savedHelp ? t("Sparat ✓") : `${t("Kom ihåg för")} ${single.name}`}
            </button>
          )}
          <div>
            <button type="button" className={primary} onClick={reset}>
              {t("Klar")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <li className="flex items-start gap-2 rounded-2xl bg-muted/40 p-3">
      <span aria-hidden>{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="text-ink">{value}</span>
      </span>
    </li>
  );
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DOT_CLASS: Record<string, string> = {
  "🟣": "bg-primary",
  "🟢": "bg-mint",
  "🟡": "bg-sun",
  "🔵": "bg-sky",
  "🟠": "bg-blush",
};

function Dot({ dot }: { dot: string }) {
  return <span aria-hidden className={cn("inline-block h-3 w-3 shrink-0 rounded-full align-middle", DOT_CLASS[dot] ?? "bg-primary")} />;
}

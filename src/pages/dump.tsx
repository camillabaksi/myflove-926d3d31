import { track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MyFloveBlock } from "@/components/myflove/block";


// Minimala typer för webbläsarens SpeechRecognition (saknas i TS lib.dom).
type SpeechRecognitionStreamEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionStreamEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTasks, useShoppingList, useReminders, useMoods } from "@/hooks/use-data";
import {
  parseDump,
  CATEGORY_LABELS,
  type DumpCategory,
  type ParsedThought,
} from "@/lib/brain-dump";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/lib/storage";
import { REPEAT_LABELS } from "@/lib/recurrence";
import { getRandomEncouragement } from "@/lib/encouragements";
import { useQuickflow } from "@/hooks/use-quickflow";
import QuickflowList from "@/components/quickflow-list";
import InsightQuickflowHint from "@/components/insight-quickflow-hint";
import QuickflowCapture from "@/components/quickflow-capture";
import {
  Mic,
  Square,
  Sparkles,
  CheckSquare,
  ShoppingBag,
  Calendar,
  Lightbulb,
  Check,
  Smile,
  NotebookPen,
} from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import StepSection from "@/components/step-section";
import QuickflowRulesSettings from "@/components/quickflow-rules-settings";
import { MyFloveListening } from "@/components/myflove/motion";
import { todayISO } from "@/lib/day";

interface SortableThought extends ParsedThought {
  id: string;
  added: boolean;
}

const CATEGORY_ICONS: Record<DumpCategory, typeof CheckSquare> = {
  task: CheckSquare,
  shopping: ShoppingBag,
  reminder: Calendar,
  idea: Lightbulb,
  mood: Smile,
};

const CATEGORY_OPTIONS: DumpCategory[] = ["task", "shopping", "reminder", "mood", "idea"];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `thought-${Date.now()}-${idCounter}`;
}

export default function Dump() {
  const [rawText, setRawText] = useLocalStorage<string>("myflow-dump-draft", "");
  const [thoughts, setThoughts] = useLocalStorage<SortableThought[] | null>(
    "myflow-dump-thoughts",
    null,
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const { addTask } = useTasks();
  const { addItem } = useShoppingList();
  const { addReminder } = useReminders();
  const { addMood } = useMoods();
  const { add: addQuickflow, absorb: absorbQuickflow } = useQuickflow();
  const { toast } = useToast();

  useEffect(() => {
    track("quickflow_opened", { source: "sida" });
  }, []);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as SpeechRecognitionWindow).SpeechRecognition ||
      (window as unknown as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionStreamEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        setRawText((prev) => (prev ? `${prev}\n${transcript.trim()}` : transcript.trim()));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    // Sätts upp en gång; setRawText läses via stängning och behöver inte trigga omstart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSort = () => {
    if (!rawText.trim()) return;
    const parsed = parseDump(rawText);
    setThoughts(parsed.map((p) => ({ ...p, id: nextId(), added: false })));
  };

  const updateCategory = (id: string, category: DumpCategory) => {
    setThoughts((prev) => (prev ? prev.map((t) => (t.id === id ? { ...t, category } : t)) : prev));
  };

  const addSingle = (thought: SortableThought) => {
    track("quickflow_created", { source: "quickflow", method: thought.category });
    // Landar tanken någon annanstans? Ta bort ev. dubblett i Quickflow-listan.
    if (thought.category !== "idea") absorbQuickflow(thought.text);
    if (thought.category === "task") addTask(thought.text);
    else if (thought.category === "shopping") addItem(thought.text);
    else if (thought.category === "reminder") {
      addReminder(thought.text, thought.date ?? todayISO(), thought.time, thought.repeat ?? "none");
    } else if (thought.category === "mood") {
      addMood(thought.moodScore ?? 3, thought.text);
    } else {
      // "Quickflow" – tanken får inte försvinna. Sparas som öppen tanke
      // som MyFlove frågar om senare.
      const { merged } = addQuickflow({ text: thought.text, level: "tanke" });
      if (merged) toast({ description: "Den fanns redan i Quickflow – jag slog ihop dem." });
    }

    setThoughts((prev) =>
      prev ? prev.map((t) => (t.id === thought.id ? { ...t, added: true } : t)) : prev,
    );
  };

  const addAll = () => {
    if (!thoughts) return;
    thoughts.filter((t) => !t.added).forEach((t) => addSingle(t));
    track("quickflow_completed", { source: "quickflow", result: "completed" });
    toast({ description: getRandomEncouragement() });
  };

  const startOver = () => {
    setThoughts(null);
    setRawText("");
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-lifted pop-in">
          <div className="pointer-events-none absolute -top-16 -right-12 h-36 w-36 rounded-full bg-lavender opacity-70 blur-md" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-mint opacity-60 blur-[2px]" />
          <div
            className="pointer-events-none absolute right-6 top-6 select-none text-4xl breathe"
            aria-hidden
          >
            💭
          </div>
          <div className="relative space-y-2">
            <h1 className="font-display text-3xl font-bold text-ink pr-14">QuickFlow</h1>
            <p className="text-sm font-medium text-primary">Fånga en tanke snabbt</p>
            <p className="text-muted-foreground leading-relaxed">
              Få ut det ur huvudet. Skriv eller prata in allt som snurrar – huller om buller går
              bra. Jag håller det åt dig tills du orkar sortera. 💜
            </p>
          </div>
        </div>

        <QuickflowCapture />

        {!thoughts ? (
          <StepSection
            step={1}
            id="quickflow::steg-fanga"
            title="Skriv eller prata in"
            description="Allt som snurrar – huller om buller går bra. Tryck sedan på Sortera."
          >
          <div className="relative rounded-3xl border border-border/60 bg-card p-2 shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="T.ex. 'Handla mjölk. Ringa tandläkaren imorgon. Kanske börja måla om vardagsrummet någon gång...'"
              className="h-48 w-full resize-none border-none bg-transparent p-4 pb-16 text-lg outline-none"
            />
            {(isListening || rawText.trim().length > 0) && (
              <MyFloveListening
                active={isListening || rawText.trim().length > 0}
                label={isListening ? "Jag lyssnar..." : "Jag följer med."}
                className="absolute right-4 top-4"
              />
            )}
            <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center gap-2">
              {voiceSupported ? (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isListening
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                  }`}
                >
                  {isListening ? <Square size={16} /> : <Mic size={16} />}
                  {isListening ? "Lyssnar..." : "Tala in"}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground px-2">
                  Röstinmatning stöds inte i denna webbläsare
                </span>
              )}
              <Button
                onClick={handleSort}
                disabled={!rawText.trim()}
                className="rounded-xl shadow-sm h-10 px-6"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Sortera
              </Button>
            </div>
          </div>
          </StepSection>
        ) : (
          <StepSection
            step={2}
            id="quickflow::steg-sortera"
            title="Granska och spara"
            description="Ändra var något hör hemma om Flow gissat fel – spara en i taget eller allt på en gång."
            help="Flow gissar var varje tanke hör hemma. Du bestämmer – tryck för att spara eller strunta i det."
          >
            <div className="space-y-3">
              {thoughts.map((thought) => {
                const Icon = CATEGORY_ICONS[thought.category];
                return (
                  <div
                    key={thought.id}
                    className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-wrap items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <p className="flex-1 min-w-[10rem] text-foreground">{thought.text}</p>
                    {thought.category === "reminder" &&
                      (thought.date ||
                        thought.time ||
                        (thought.repeat && thought.repeat !== "none")) && (
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                          {thought.repeat && thought.repeat !== "none"
                            ? REPEAT_LABELS[thought.repeat]
                            : (thought.date ?? "Idag")}
                          {thought.time ? ` kl ${thought.time}` : ""}
                        </span>
                      )}
                    <select
                      value={thought.category}
                      onChange={(e) => updateCategory(thought.id, e.target.value as DumpCategory)}
                      disabled={thought.added}
                      className="text-sm border border-border rounded-xl px-2 py-1.5 bg-secondary/50 outline-none"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant={thought.added ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => addSingle(thought)}
                      disabled={thought.added}
                      className={`shrink-0 rounded-xl ${thought.added ? "text-primary" : "text-primary hover:bg-primary/10"}`}
                    >
                      {thought.added ? <Check size={16} /> : "Lägg till"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button onClick={addAll} className="rounded-xl flex-1">
                Lägg till allt som är kvar
              </Button>
              <Button variant="outline" onClick={startOver} className="rounded-xl flex-1">
                Börja om med ny dump
              </Button>
            </div>
          </StepSection>
        )}

        <InsightQuickflowHint />
        <QuickflowList />

        <Link
          to="/anteckningar"
          className="surface-card mt-4 flex items-center gap-3 p-4 text-left hover:border-primary/40"
        >
          <NotebookPen size={20} className="text-primary" />
          <span className="flex-1">
            <span className="block font-semibold text-ink">Anteckningar &amp; idébank</span>
            <span className="block text-sm text-muted-foreground">
              Tankar utan krav bor i en egen del under Flow.
            </span>
          </span>
        </Link>

        <CollapsibleSection
          title={
            <span className="flex items-center gap-2">
              <Sparkles size={20} /> Mina sorteringsregler
            </span>
          }
          id="QuickFlow-regler"
          headingClassName="font-semibold"
          className="pt-4"
        >
          <QuickflowRulesSettings />
        </CollapsibleSection>
      </div>
    </Layout>
  );
}

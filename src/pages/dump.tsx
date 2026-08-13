import { useEffect, useRef, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTasks, useShoppingList, useReminders, useDumpIdeas, useMoods } from "@/hooks/use-data";
import { parseDump, CATEGORY_LABELS, type DumpCategory, type ParsedThought } from "@/lib/brain-dump";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/lib/storage";
import { REPEAT_LABELS } from "@/lib/recurrence";
import { getRandomEncouragement } from "@/lib/encouragements";
import { useQuickflow } from "@/hooks/use-quickflow";
import { suggestWhen, formatWhen } from "@/lib/quickflow";
import QuickflowList from "@/components/quickflow-list";
import { Mic, Square, Sparkles, CheckSquare, ShoppingBag, Calendar, Lightbulb, Check, Trash2, Inbox, Smile } from "lucide-react";

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
  const [thoughts, setThoughts] = useLocalStorage<SortableThought[] | null>("myflow-dump-thoughts", null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const { addTask } = useTasks();
  const { addItem } = useShoppingList();
  const { addReminder } = useReminders();
  const { addMood } = useMoods();
  const { ideas, deleteIdea } = useDumpIdeas();
  const { add: addQuickflow } = useQuickflow();
  const [ideaCategories, setIdeaCategories] = useState<Record<string, DumpCategory>>({});
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "sv-SE";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
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
    if (thought.category === "task") addTask(thought.text);
    else if (thought.category === "shopping") addItem(thought.text);
    else if (thought.category === "reminder") {
      addReminder(
        thought.text,
        thought.date ?? new Date().toISOString().split("T")[0]!,
        thought.time,
        thought.repeat ?? "none"
      );
    } else if (thought.category === "mood") {
      addMood(thought.moodScore ?? 3, thought.text);
    } else {
      // "Quickflow" – tanken får inte försvinna. Sparas som öppen tanke
      // som MyFlove frågar om senare.
      addQuickflow({ text: thought.text, level: "tanke" });
    }

    setThoughts((prev) => (prev ? prev.map((t) => (t.id === thought.id ? { ...t, added: true } : t)) : prev));
  };

  const moveIdea = (idea: { id: string; text: string }) => {
    const category = ideaCategories[idea.id] ?? "idea";
    if (category === "task") addTask(idea.text);
    else if (category === "shopping") addItem(idea.text);
    else if (category === "reminder") addReminder(idea.text, new Date().toISOString().split("T")[0]!);
    else if (category === "mood") addMood(3, idea.text);
    else addQuickflow({ text: idea.text, level: "tanke" });
    deleteIdea(idea.id);
    toast({ description: getRandomEncouragement() });
  };

  const addAll = () => {
    if (!thoughts) return;
    thoughts.filter((t) => !t.added).forEach((t) => addSingle(t));
    toast({ description: getRandomEncouragement() });
  };

  const startOver = () => {
    setThoughts(null);
    setRawText("");
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quickflow</h1>
          <p className="text-muted-foreground leading-relaxed">
            Få ut det ur huvudet. Skriv eller prata in allt som snurrar – huller om buller går bra.
            Jag sorterar det till rätt plats, och det du inte vill bestämma dig om håller jag åt dig. 💙
          </p>
        </div>

        {!thoughts ? (
          <div className="bg-card p-2 rounded-3xl shadow-sm border border-border relative focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="T.ex. 'Handla mjölk. Ringa tandläkaren imorgon. Kanske börja måla om vardagsrummet någon gång...'"
              className="w-full h-48 p-4 pb-16 bg-transparent border-none outline-none resize-none text-lg"
            />
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
                <span className="text-xs text-muted-foreground px-2">Röstinmatning stöds inte i denna webbläsare</span>
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
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold">Förslag på sortering:</h2>
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
                    {thought.category === "reminder" && (thought.date || thought.time || (thought.repeat && thought.repeat !== "none")) && (
                      <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                        {thought.repeat && thought.repeat !== "none"
                          ? REPEAT_LABELS[thought.repeat]
                          : thought.date ?? "Idag"}
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
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
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
          </div>
        )}

        <QuickflowList />

        {ideas.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Inbox size={20} /> Äldre idébank
            </h2>
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-wrap items-center gap-3">
                  <p className="text-foreground flex-1 min-w-[10rem]">{idea.text}</p>
                  <select
                    value={ideaCategories[idea.id] ?? "idea"}
                    onChange={(e) =>
                      setIdeaCategories((prev) => ({ ...prev, [idea.id]: e.target.value as DumpCategory }))
                    }
                    className="text-sm border border-border rounded-xl px-2 py-1.5 bg-secondary/50 outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveIdea(idea)}
                    disabled={(ideaCategories[idea.id] ?? "idea") === "idea"}
                    className="rounded-xl text-primary hover:bg-primary/10 shrink-0"
                  >
                    Flytta
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteIdea(idea.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg shrink-0"
                    aria-label="Ta bort idé"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { MyFloveThinking } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Send,
  Sparkles,
  History,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { chatWithFlow } from "@/lib/flow-chat.functions";
import { useTasks, useMoods, useFocus, useReminders } from "@/hooks/use-data";
import { useLifePuzzle } from "@/hooks/use-life-puzzle";
import { lastPlace, placeFor, shortcutsFor, type FlowPlace } from "@/lib/flow-context";
import {
  AREA_META,
  ALL_AREAS,
  areaChipStyle,
  areaTint,
  areaColor,
  type LifeArea,
} from "@/lib/life-areas";
import { Link } from "@tanstack/react-router";
import { useLocalStorage } from "@/lib/storage";
import { generateCoachMessage } from "@/lib/coach";
import {
  createFlowConversation,
  saveFlowMessage,
  useFlowConversations,
  useFlowMessages,
  type FlowMessage,
} from "@/hooks/use-flow-chats";

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

const GREETING =
  "Hej, jag är Flow. Jag finns här för att avlasta – inte för att ge dig mer att göra. Vad snurrar i huvudet just nu?";

const QUICK_PROMPTS = [
  "Det känns för mycket idag",
  "Hjälp mig bryta ner en uppgift",
  "Vad borde jag börja med?",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function Assistant({ chatId }: { chatId?: string }) {
  const navigate = useNavigate();
  const conversationId = chatId ?? null;

  const { conversations, refresh, remove } = useFlowConversations();
  const { messages, setMessages, loading: loadingMessages } = useFlowMessages(conversationId);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = useServerFn(chatWithFlow);
  const { puzzle, contextPrompt } = useLifePuzzle();
  const [place, setPlace] = useState<FlowPlace | null>(null);
  useEffect(() => {
    setPlace(lastPlace());
  }, []);
  /** Byt del av livet utan att lämna Flow – ändrar bara vad Flow utgår från. */
  const switchArea = (area: LifeArea) => {
    const home: Record<LifeArea, string> = {
      vardag: "/hem",
      privat: "/familj",
      barn: "/barn",
      studier: "/studyflow",
      jobb: "/workflow",
    };
    setPlace(placeFor(home[area]));
  };

  const { activeTasks } = useTasks();
  const { moods } = useMoods();
  const { currentFocus } = useFocus();
  const { activeReminders } = useReminders();
  const [sessionLog] = useLocalStorage<{ date: string; count: number }>(
    "myflow-pomodoro-sessions",
    {
      date: todayStr(),
      count: 0,
    },
  );
  const pomodoroTodaySessions = sessionLog.date === todayStr() ? sessionLog.count : 0;
  const coachMessage = generateCoachMessage({
    moods,
    activeTasks,
    currentFocus,
    activeReminders,
    pomodoroTodaySessions,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isSending, conversationId]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    setInput("");
    setIsSending(true);

    const optimistic: FlowMessage = { id: `tmp-${Date.now()}`, role: "user", content: trimmed };
    const history = [...messages, optimistic];
    setMessages(history);

    try {
      let id = conversationId;
      let created = false;
      if (!id) {
        id = await createFlowConversation(trimmed);
        if (!id) throw new Error("Kunde inte skapa chatten. Är du inloggad?");
        created = true;
      }
      await saveFlowMessage(id, "user", trimmed);

      const { reply } = await chat({
        data: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context: contextPrompt,
        },
      });
      setMessages((m) => [...m, { id: `tmp-a-${Date.now()}`, role: "assistant", content: reply }]);
      await saveFlowMessage(id, "assistant", reply);
      void refresh();
      // Navigera först när svaret är sparat – annars avbryts anropet av omladdningen.
      if (created) {
        void navigate({ to: "/assistant/$chatId", params: { chatId: id }, replace: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Något gick fel. Prova igen om en stund.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };


  const historyList = (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setHistoryOpen(false);
          void navigate({ to: "/assistant" });
        }}
        className="w-full flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-3 py-2 text-sm font-medium hover:bg-primary/15 transition-colors"
      >
        <Plus size={16} /> Ny chatt
      </button>

      {conversations.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">
          Dina samtal sparas här så du kan läsa dem igen när du vill.
        </p>
      ) : (
        conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-1 rounded-2xl border px-2 transition-colors ${
              c.id === conversationId
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setHistoryOpen(false);
                void navigate({ to: "/assistant/$chatId", params: { chatId: c.id } });
              }}
              className="flex-1 min-w-0 text-left py-2.5"
            >
              <p className="text-sm truncate">{c.title}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(c.updated_at)}</p>
            </button>
            <button
              type="button"
              aria-label={`Ta bort ${c.title}`}
              onClick={() => {
                void remove(c.id);
                if (c.id === conversationId) void navigate({ to: "/assistant" });
              }}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Layout>
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Historik</p>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{historyList}</div>
        </aside>

        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (place && place.path !== "/assistant") void navigate({ to: place.path });
                else void navigate({ to: "/hem" });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-transform active:scale-95"
            >
              <ArrowLeft size={16} />
              Tillbaka till {place ? place.label : "Hem"}
            </button>
          </div>

          <nav
            aria-label="Brödsmulor"
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            <Link to="/hem" className="hover:text-foreground">
              Hem
            </Link>
            {place && (
              <>
                <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
                <span style={{ color: areaColor(place.area) }} className="font-medium">
                  {AREA_META[place.area].emoji} {AREA_META[place.area].label}
                </span>
                <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
                <Link to={place.path} className="hover:text-foreground">
                  {place.label}
                </Link>
              </>
            )}
            <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
            <span className="font-medium text-foreground">Flow</span>
          </nav>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-3xl font-bold leading-tight">Flow</h1>
                <p className="text-sm text-muted-foreground">
                  Din andra hjärna – lugn, empatisk, aldrig dömande
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl lg:hidden shrink-0"
              onClick={() => setHistoryOpen(true)}
            >
              <History size={16} className="mr-1" />
              Historik
            </Button>
          </div>

          {place && (
            <div
              className="rounded-3xl border p-4"
              style={{
                backgroundColor: areaTint(place.area, 0.1),
                borderColor: areaTint(place.area, 0.3),
              }}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Du är i</p>
              <p className="text-sm font-semibold" style={{ color: areaColor(place.area) }}>
                {AREA_META[place.area].emoji} {AREA_META[place.area].label} · {place.label}
              </p>
              <p data-npf="optional" className="mt-1 text-xs text-muted-foreground">
                {AREA_META[place.area].blurb}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {shortcutsFor(place).map((sc) => (
                  <Link
                    key={sc.href}
                    to={sc.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-transform active:scale-95"
                  >
                    <span aria-hidden="true">{sc.emoji}</span>
                    {sc.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_AREAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => switchArea(a)}
                    style={areaChipStyle(a, a === place.area)}
                    className="rounded-full px-3 py-1 text-[11px] font-medium"
                  >
                    {AREA_META[a].emoji} {AREA_META[a].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-card border border-border rounded-2xl">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Idag</p>
            <p className="text-sm leading-snug">{coachMessage.text}</p>
          </div>

          <div
            ref={scrollRef}
            className="bg-card border border-border rounded-3xl p-4 space-y-4 max-h-[55vh] overflow-y-auto"
          >
            {loadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Hämtar samtalet…
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-secondary text-foreground">
                      {GREETING}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </>
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-secondary text-muted-foreground px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                  <MyFloveThinking
                    steps={["💬", "🧠", "💜", "✨"]}
                    label="Flow tänker…"
                    className="py-1"
                  />
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {[puzzle.flowPrompt, ...(place ? [place.prompt] : []), ...QUICK_PROMPTS]
                .filter((p, i, arr) => p && arr.indexOf(p) === i)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => void send(p)}
                    className="px-3 py-2 rounded-full text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
            </div>
          )}

          <div className="bg-card p-2 rounded-3xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Skriv till Flow…"
              className="w-full h-24 p-3 pb-14 bg-transparent border-none outline-none resize-none text-base"
            />
            <div className="flex justify-end px-2 pb-2 -mt-12 relative">
              <Button
                onClick={() => void send(input)}
                disabled={!input.trim() || isSending}
                className="rounded-xl h-10 px-5"
              >
                <Send className="w-4 h-4 mr-2" />
                Skicka
              </Button>
            </div>
          </div>
        </div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setHistoryOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-xs bg-card border-l border-border p-4 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Dina samtal</p>
              <button
                type="button"
                aria-label="Stäng historik"
                onClick={() => setHistoryOpen(false)}
                className="p-2 rounded-xl hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>
            {historyList}
          </div>
        </div>
      )}
    </Layout>
  );
}

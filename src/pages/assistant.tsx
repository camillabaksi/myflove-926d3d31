import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles } from "lucide-react";
import { chatWithFlow } from "@/lib/flow-chat.functions";
import { useTasks, useMoods, useFocus, useReminders } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { generateCoachMessage } from "@/lib/coach";

type ChatMessage = { role: "user" | "assistant"; content: string };

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hej, jag är Flow. Jag finns här för att avlasta – inte för att ge dig mer att göra. Vad snurrar i huvudet just nu?",
};

const QUICK_PROMPTS = [
  "Det känns för mycket idag",
  "Hjälp mig bryta ner en uppgift",
  "Vad borde jag börja med?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = useServerFn(chatWithFlow);

  const { activeTasks } = useTasks();
  const { moods } = useMoods();
  const { currentFocus } = useFocus();
  const { activeReminders } = useReminders();
  const [sessionLog] = useLocalStorage<{ date: string; count: number }>("myflow-pomodoro-sessions", {
    date: todayStr(),
    count: 0,
  });
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
  }, [isSending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setIsSending(true);
    try {
      const { reply } = await chat({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Något gick fel. Prova igen om en stund.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">Flow</h1>
              <p className="text-sm text-muted-foreground">Din andra hjärna – lugn, empatisk, aldrig dömande</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Idag</p>
          <p className="text-sm leading-snug">{coachMessage.text}</p>
        </div>

        <div
          ref={scrollRef}
          className="bg-card border border-border rounded-3xl p-4 space-y-4 max-h-[55vh] overflow-y-auto"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-secondary text-muted-foreground px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Flow tänker…
              </div>
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
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
          <div className="absolute-none flex justify-end px-2 pb-2 -mt-12 relative">
            <Button
              onClick={() => void send(input)}
              disabled={!input.trim() || isSending}
              className="rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Skicka
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

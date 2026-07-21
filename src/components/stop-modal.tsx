import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand, Send, Wind, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithFlow } from "@/lib/flow-chat.functions";

type Msg = { role: "user" | "assistant"; content: string };

interface StopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STOP_SYSTEM_HINT = `Användaren har tryckt på "Stop!"-knappen. Det betyder att de är nära att ta ett impulsivt beslut som de kan ångra (t.ex. impulsshopping, sms till ett ex, för mycket alkohol, självskada, spela bort pengar, säga upp sig i affekt).

Din roll nu:
- Möt användaren mjukt och utan att döma. Namnge inget beteende de inte själva nämnt.
- Ställ EN lugn fråga i taget. Bekräfta känslan innan du frågar vidare.
- Hjälp dem sätta ord på: Vad känns starkt just nu? Vad ville jag egentligen ha (tröst, ro, kontakt, spänning)? Hur mår jag om 24 timmar om jag gör det?
- Föreslå gärna en liten paus (dricka vatten, gå ut 2 min, andas 4-7-8) innan beslutet tas.
- Om användaren beskriver akut fara för sig själv eller andra: uppmana varmt att kontakta 112 eller Mind Självmordslinjen 90101.
- Håll svaren korta – 2–4 meningar. Aldrig långa listor.`;

const OPENERS = [
  "Bra att du tryckte på Stop. Vad är det som händer just nu?",
  "Andas ut. Vad känns starkt i kroppen precis nu?",
  "Du behöver inte göra något direkt. Vill du berätta vad du var på väg att göra?",
];

export default function StopModal({ open, onOpenChange }: StopModalProps) {
  const chat = useServerFn(chatWithFlow);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<"breathe" | "talk">("breathe");
  const [breathCount, setBreathCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPhase("breathe");
      setBreathCount(0);
      const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)] as string;
      setMessages([{ role: "assistant", content: opener }]);
      setInput("");
    }
  }, [open]);

  // Breathing loop – ~7s per cycle (in 4, hold 2, out 4… simplified visual)
  useEffect(() => {
    if (!open || phase !== "breathe") return;
    const id = setInterval(() => setBreathCount((c) => c + 1), 7000);
    return () => clearInterval(id);
  }, [open, phase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const payload: Msg[] = [
        { role: "user", content: STOP_SYSTEM_HINT },
        { role: "assistant", content: "Okej, jag är här. Jag lyssnar utan att döma." },
        ...next,
      ];
      const { reply } = await chat({ data: { messages: payload } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Jag når inte fram just nu. Men du är fortfarande här – det är det viktiga. Andas en gång till.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden">
        <div
          className="p-6 text-cream"
          style={{ background: "linear-gradient(135deg, hsl(var(--terracotta)) 0%, hsl(var(--terracotta-soft)) 100%)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-cream">
              <Hand size={24} /> Stop.
            </DialogTitle>
            <DialogDescription className="text-cream/90">
              Du behöver inte bestämma något direkt. Vi tar det lugnt tillsammans.
            </DialogDescription>
          </DialogHeader>
        </div>

        {phase === "breathe" ? (
          <div className="p-6 space-y-6 text-center">
            <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full bg-sage/40"
                style={{
                  animation: "stop-breath 7s ease-in-out infinite",
                }}
              />
              <div className="relative flex flex-col items-center gap-1">
                <Wind size={28} className="text-sage-foreground" />
                <p className="text-sm font-medium text-foreground">Andas</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Andas in långsamt … håll … andas ut ännu långsammare. Gör det ett par gånger.
              Impulsen brukar mildras inom några minuter.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setPhase("talk")}
                className="w-full h-12 rounded-2xl"
              >
                <Sparkles size={18} className="mr-2" />
                Prata med Flow om det
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full h-11 rounded-2xl"
              >
                Jag klarar mig nu, tack
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                Akut? Ring <span className="font-semibold">112</span> eller Mind Självmordslinjen{" "}
                <span className="font-semibold">90101</span>.
              </p>
            </div>
            <style>{`@keyframes stop-breath { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.9; } }`}</style>
          </div>
        ) : (
          <div className="flex flex-col h-[70vh] max-h-[520px]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-muted-foreground rounded-2xl px-4 py-2.5 text-sm">
                    Flow tänker …
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border p-3 flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Vad känns starkt just nu?"
                rows={1}
                className="flex-1 resize-none rounded-2xl bg-secondary/60 px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary max-h-32"
              />
              <Button
                onClick={() => void send()}
                disabled={!input.trim() || sending}
                size="icon"
                aria-label="Skicka meddelande till Flow"
                className="rounded-full h-11 w-11 shrink-0"
              >
                <Send size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

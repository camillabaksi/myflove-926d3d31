import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { breakDownTask } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ArrowRight, Bot } from "lucide-react";
import { useTasks, useMoods, useFocus, useReminders } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { generateCoachMessage } from "@/lib/coach";

function todayStr(): string {
  return new Date().toISOString().split("T")[0] as string;
}

export default function Assistant() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<string[] | null>(null);
  
  const { addTask, activeTasks } = useTasks();
  const [addedSteps, setAddedSteps] = useState<Set<number>>(new Set());

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

  const handleBreakdown = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setSteps(null);
    setAddedSteps(new Set());
    
    try {
      const result = await breakDownTask(input);
      setSteps(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStepToTasks = (step: string, index: number) => {
    addTask(step);
    setAddedSteps(prev => new Set(prev).add(index));
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">AI-Assistent</h1>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold tracking-wider">BETA</div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Känns en uppgift för stor eller svår att starta med? Skriv vad du behöver göra, 
            så hjälper assistenten till att bryta ner det i små, hanterbara steg.
          </p>
        </div>

        <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bot size={22} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Din coach idag</p>
            <p className="font-medium leading-snug">
              {coachMessage.emoji} {coachMessage.text}
            </p>
            {coachMessage.ctaHref && coachMessage.ctaLabel && (
              <Link
                href={coachMessage.ctaHref}
                className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-2 hover:underline"
              >
                {coachMessage.ctaLabel} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div className="bg-card p-2 rounded-3xl shadow-sm border border-border relative focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="T.ex. 'Jag måste städa hela lägenheten inför helgen men vet inte var jag ska börja...'"
            className="w-full h-32 p-4 pb-16 bg-transparent border-none outline-none resize-none text-lg"
          />
          <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center">
            <span className="text-xs text-muted-foreground px-2">Tips: Var så specifik som möjligt.</span>
            <Button 
              onClick={handleBreakdown}
              disabled={!input.trim() || isProcessing}
              className="rounded-xl shadow-sm h-10 px-6 bg-primary hover:bg-primary/90 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tänker...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Bryt ner uppgift
                </>
              )}
            </Button>
          </div>
        </div>

        {steps && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
            <h2 className="text-xl font-semibold">Förslag på små steg:</h2>
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isAdded = addedSteps.has(idx);
                return (
                  <div key={idx} className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-foreground">{step}</p>
                    </div>
                    <Button
                      variant={isAdded ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleAddStepToTasks(step, idx)}
                      disabled={isAdded}
                      className={`shrink-0 rounded-xl transition-all ${isAdded ? "text-primary" : "text-primary hover:bg-primary/10"}`}
                    >
                      {isAdded ? "Tillagd i Att göra" : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-1 md:mr-2" />
                          <span className="hidden md:inline">Lägg till i Att göra</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-8 border-t border-border flex flex-col items-center text-center">
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                Kom ihåg att du inte måste göra alla steg idag. Börja med steg 1 och se hur det känns.
              </p>
              <Button variant="outline" onClick={() => { setSteps(null); setInput(""); }} className="rounded-xl">
                Börja om med ny uppgift
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { useFocus } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";

/**
 * Dagens fokus – "en enda sak idag".
 * Bor numera överst på FlowPlan-sidan istället för en egen sektion.
 */
export function DailyFocusCard() {
  const { currentFocus, setTodayFocus, toggleFocusCompleted } = useFocus();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");

  const handleToggleFocus = () => {
    const wasCompleted = currentFocus?.completed;
    toggleFocusCompleted();
    if (!wasCompleted) {
      toast({ description: getRandomEncouragement() });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTodayFocus(inputValue.trim());
      setInputValue("");
    }
  };

  if (!currentFocus) {
    return (
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium leading-tight">Dagens fokus</h2>
            <p className="text-sm text-muted-foreground">
              Om allt annat misslyckas idag – vad skulle kännas skönt att ha bockat av?
            </p>
          </div>
        </div>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="T.ex. Betala hyran…"
          aria-label="Dagens fokus"
          className="h-12 rounded-xl px-4 bg-secondary/50 border-transparent"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim()}
          className="w-full h-12 rounded-xl font-medium"
        >
          <Plus className="mr-2" size={20} />
          Sätt fokus
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleToggleFocus}
        className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
          currentFocus.completed
            ? "bg-primary/10 border-primary/20"
            : "bg-card border-border hover:border-primary/50"
        }`}
      >
        <div className="flex items-start gap-4">
          <CheckCircle2
            size={32}
            className={`mt-0.5 shrink-0 ${
              currentFocus.completed
                ? "fill-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Dagens fokus
            </p>
            <h2
              className={`text-xl font-medium leading-tight ${
                currentFocus.completed ? "opacity-70 line-through" : "text-foreground"
              }`}
            >
              {currentFocus.text}
            </h2>
            {currentFocus.completed && (
              <div className="mt-2 flex items-center gap-2 text-primary font-medium text-sm">
                <Sparkles size={16} />
                <span>Fantastiskt jobbat – allt annat är bonus.</span>
              </div>
            )}
          </div>
        </div>
      </button>
      {currentFocus.completed && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setTodayFocus("")}
            className="rounded-xl h-10 px-5"
          >
            Byt uppgift
          </Button>
        </div>
      )}
    </div>
  );
}

export default DailyFocusCard;

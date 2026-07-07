import { useState } from "react";
import Layout from "@/components/layout";
import { useMoods } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import OverwhelmedModal from "@/components/overwhelmed-modal";
import FlowInsightsModal from "@/components/flow-insights-modal";
import { LifeBuoy, Sparkles } from "lucide-react";
import { getRandomEncouragement } from "@/lib/encouragements";
import { useToast } from "@/hooks/use-toast";
import { useFocus, useTasks, useReminders } from "@/hooks/use-data";
import { generateFlowInsights } from "@/lib/flow-insights";
import { Link } from "wouter";
import { TrendingUp, ArrowRight } from "lucide-react";
import WidgetGrid from "@/components/widget-grid";
import { getGreeting } from "@/lib/greeting";

const EMOJIS = [
  { score: 1, emoji: "😢", label: "Tungt" },
  { score: 2, emoji: "😕", label: "Låg" },
  { score: 3, emoji: "😐", label: "Okej" },
  { score: 4, emoji: "🙂", label: "Bra" },
  { score: 5, emoji: "😄", label: "Toppen" }
];

export default function Mood() {
  const { moods, addMood } = useMoods();
  const { toast } = useToast();
  const { currentFocus } = useFocus();
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [overwhelmedOpen, setOverwhelmedOpen] = useState(false);
  const [flowInsightsOpen, setFlowInsightsOpen] = useState(false);

  const handleSave = () => {
    if (selectedScore !== null) {
      addMood(selectedScore, note.trim());
      setSelectedScore(null);
      setNote("");
      setJustSaved(true);
      toast({ description: getRandomEncouragement() });
      setTimeout(() => setJustSaved(false), 3000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const todayScore = moods.length > 0 && new Date(moods[0]!.date).toDateString() === new Date().toDateString()
    ? EMOJIS.find(e => e.score === moods[0]!.score)
    : null;

  const insights = generateFlowInsights(moods, activeTasks, currentFocus);
  const topInsight = insights[0];

  return (
    <Layout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
          <p className="text-muted-foreground">Hur känns det i kroppen och knoppen just nu? Ingen dömer dig här.</p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border">
          {justSaved ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="text-5xl mb-4">💚</div>
              <h2 className="text-xl font-medium">Tack för att du checkade in</h2>
              <p className="text-muted-foreground mt-2">Det är värdefullt att lyssna på sig själv.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between md:justify-center md:gap-6">
                {EMOJIS.map(item => (
                  <button
                    key={item.score}
                    onClick={() => setSelectedScore(item.score)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                      selectedScore === item.score 
                        ? "bg-primary/10 scale-110" 
                        : "hover:bg-secondary opacity-70 hover:opacity-100 grayscale-[0.5] hover:grayscale-0"
                    }`}
                  >
                    <span className="text-4xl md:text-5xl drop-shadow-sm">{item.emoji}</span>
                    <span className={`text-xs md:text-sm font-medium ${selectedScore === item.score ? "text-primary" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedScore !== null && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Vill du skriva en kort rad om varför? (Valfritt)"
                    className="w-full h-24 p-4 rounded-2xl bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all text-base"
                  />
                  <Button 
                    onClick={handleSave} 
                    className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm"
                  >
                    Spara mående
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setOverwhelmedOpen(true)}
            className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-accent/60 text-accent-foreground flex items-center justify-center shrink-0">
              <LifeBuoy size={24} />
            </div>
            <div>
              <p className="font-medium">Jag är överväldigad</p>
              <p className="text-sm text-muted-foreground">Prioritera det viktigaste, flytta undan resten</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFlowInsightsOpen(true)}
            className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="font-medium">Hitta mitt flow</p>
              <p className="text-sm text-muted-foreground">Se vad som gått bra på sistone</p>
            </div>
          </button>
        </div>

        <WidgetGrid />

        <button
          type="button"
          onClick={() => setFlowInsightsOpen(true)}
          className="w-full flex items-center gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/40 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Sammanfattning</p>
            <p className="font-medium leading-snug line-clamp-2">
              {todayScore ? `Idag: ${todayScore.emoji} ${todayScore.label}` : (topInsight?.text ?? "Checka in för att se din sammanfattning")}
            </p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground shrink-0" />
        </button>

        {moods.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tidigare incheckningar</h2>
            <div className="space-y-3">
              {moods.map((mood) => {
                const emoji = EMOJIS.find(e => e.score === mood.score)?.emoji;
                return (
                  <div key={mood.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                    <div className="text-3xl shrink-0 pt-1">{emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground capitalize mb-1">{formatDate(mood.date)}</p>
                      {mood.note && <p className="text-foreground leading-relaxed">{mood.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <OverwhelmedModal open={overwhelmedOpen} onOpenChange={setOverwhelmedOpen} />
      <FlowInsightsModal open={flowInsightsOpen} onOpenChange={setFlowInsightsOpen} />
    </Layout>
  );
}

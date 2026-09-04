import { useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useMoods } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import FlowInsightsModal from "@/components/flow-insights-modal";
import { Sparkles } from "lucide-react";
import { getRandomEncouragement } from "@/lib/encouragements";
import { useToast } from "@/hooks/use-toast";
import { getGreeting } from "@/lib/greeting";
import { useLang } from "@/hooks/use-language";
import { MyFloveHeart } from "@/components/myflove/motion";
import { useUserProfile } from "@/hooks/use-user-profile";
import CollapsibleSection from "@/components/collapsible-section";

const EMOJIS = [
  { score: 1, emoji: "😢", label: "Tungt" },
  { score: 2, emoji: "😕", label: "Låg" },
  { score: 3, emoji: "😐", label: "Okej" },
  { score: 4, emoji: "🙂", label: "Bra" },
  { score: 5, emoji: "😄", label: "Toppen" },
];

interface MoodContentProps {
  showHeader?: boolean;
  /** Historikläge: visar tidigare loggar utan eget loggningsformulär. */
  readOnly?: boolean;
}

export function MoodContent({ showHeader = true, readOnly = false }: MoodContentProps) {
  const { moods, addMood } = useMoods();
  const { toast } = useToast();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [flowInsightsOpen, setFlowInsightsOpen] = useState(false);
  const [showAllMoods, setShowAllMoods] = useState(false);

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

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat("sv-SE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));

  return (
    <MyFlovePageGrid>
      {showHeader && (
        <MyFloveWide>
          <MoodHeader />
        </MyFloveWide>
      )}

      {readOnly ? (
        <MyFloveWide>
          <div
            className="rounded-3xl border-2 border-border/60 bg-card p-5 text-sm text-muted-foreground"
            data-testid="mood-history-readonly"
          >
            Här ser du dina tidigare loggar. Vill du logga nytt gör du det under{" "}
            <span className="font-medium text-ink">Mitt batteri → Logga energi &amp; mående</span>.
          </div>
        </MyFloveWide>
      ) : (
        <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border">
          {justSaved ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="text-5xl mb-4">💚</div>
              <h2 className="text-xl font-medium">Tack för att du checkade in</h2>
              <p className="text-muted-foreground mt-2">
                Det är värdefullt att lyssna på sig själv.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between md:justify-center md:gap-6">
                {EMOJIS.map((item) => (
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
                    <span
                      className={`text-xs md:text-sm font-medium ${selectedScore === item.score ? "text-primary" : "text-muted-foreground"}`}
                    >
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
      )}

      <button
        type="button"
        onClick={() => setFlowInsightsOpen(true)}
        className="press flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-border/60 bg-lavender/60 px-3 py-6 text-center shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles size={24} />
        </span>
        <span className="font-display text-base font-bold leading-tight text-ink">
          Hitta mitt flow
        </span>
      </button>

      {moods.length > 0 && (
        <MyFloveWide>
          <CollapsibleSection
            title="Tidigare incheckningar"
            help="Dina tidigare loggar. Mönstren här används för att anpassa dagens förslag."
            headingClassName="text-xl font-semibold"
            actions={
              moods.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllMoods((v) => !v)}
                  aria-expanded={showAllMoods}
                  className="text-sm font-medium text-primary hover:underline shrink-0"
                >
                  {showAllMoods ? "Visa färre" : `Visa alla (${moods.length})`}
                </button>
              )
            }
          >
            <div className="space-y-3">
              {(showAllMoods ? moods : moods.slice(0, 3)).map((mood) => {
                const emoji = EMOJIS.find((e) => e.score === mood.score)?.emoji;
                return (
                  <div
                    key={mood.id}
                    className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-start gap-4"
                  >
                    <div className="text-3xl shrink-0 pt-1">{emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground capitalize mb-1">
                        {formatDate(mood.date)}
                      </p>
                      {mood.note && <p className="text-foreground leading-relaxed">{mood.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </MyFloveWide>
      )}

      <MyFloveWide>
        <FlowInsightsModal open={flowInsightsOpen} onOpenChange={setFlowInsightsOpen} />
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

export default function Mood() {
  return (
    <Layout>
      {/* Read-only även som fristående sida: ny loggning sker bara i Mitt batteri. */}
      <MoodContent readOnly />
    </Layout>
  );
}

function MoodHeader() {
  const { name, lastVisit } = useUserProfile();
  const { lang } = useLang();
  const g = getGreeting({ name, lastVisit, lang });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <MyFloveHeart size={26} /> {g.title}
      </h1>
      <p className="text-muted-foreground">
        Hur känns det i kroppen och knoppen just nu? Ingen dömer dig här.
      </p>
    </div>
  );
}

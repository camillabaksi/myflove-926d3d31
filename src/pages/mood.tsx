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
  const { t, locale } = useLang();
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
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));

  return (
    <MyFlovePageGrid className="pace-next-page pace-next-health">
      {showHeader && (
        <MyFloveWide>
          <MoodHeader />
        </MyFloveWide>
      )}

      {readOnly ? (
        <MyFloveWide>
          <div
            className="rounded-2xl bg-[#F5EDF7]/40 p-3 text-sm text-muted-foreground"
            data-testid="mood-history-readonly"
          >
            {t("Här ser du dina tidigare loggar. Vill du logga nytt gör du det under")}{" "}
            <span className="font-medium text-ink">
              {t("Idag → Logga energi & mående")}
            </span>
            .
          </div>
        </MyFloveWide>
      ) : (
        <div className="pace-card-surface bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border">
          {justSaved ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="text-5xl mb-4">💚</div>
              <h2 className="text-xl font-medium">{t("Tack för att du checkade in")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("Det är värdefullt att lyssna på sig själv.")}
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between md:justify-center md:gap-6">
                {EMOJIS.map((item) => (
                  <button
                    key={item.score}
                    onClick={() => setSelectedScore(item.score)}
                    aria-pressed={selectedScore === item.score}
                    className={`pace-health-choice min-h-11 min-w-11 flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
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
                    placeholder={t("Vill du skriva en kort rad om varför? (Valfritt)")}
                    className="w-full h-24 p-4 rounded-2xl bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all text-base"
                  />
                  <Button
                    onClick={handleSave}
                    className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm"
                  >
                    {t("Spara mående")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!readOnly && <button
        type="button"
        onClick={() => setFlowInsightsOpen(true)}
        className="pace-card-surface press flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-border/60 bg-lavender/60 px-3 py-6 text-center shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles size={24} />
        </span>
        <span className="font-display text-base font-bold leading-tight text-ink">
          {t("Hitta mitt flow")}
        </span>
      </button>}

      {moods.length > 0 && (
        <MyFloveWide>
          <CollapsibleSection
            title={t("Tidigare incheckningar")}
            help={t("Dina tidigare loggar. Mönstren här används för att anpassa dagens förslag.")}
            headingClassName="font-sans text-base font-semibold text-ink"
            className="rounded-2xl bg-[#F5EDF7]/30 p-3"
          >
            <div className="space-y-2">
              {(showAllMoods ? moods : moods.slice(0, 3)).map((mood) => {
                const emoji = EMOJIS.find((e) => e.score === mood.score)?.emoji;
                return (
                  <div
                    key={mood.id}
                    className="flex items-center gap-3 rounded-xl bg-white/65 px-3 py-2"
                  >
                    <div className="text-xl shrink-0">{emoji}</div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground capitalize">
                        {formatDate(mood.date)}
                      </p>
                      {mood.note && <p className="text-foreground leading-relaxed">{mood.note}</p>}
                    </div>
                  </div>
                );
              })}
              {moods.length > 3 && (
                <button type="button" onClick={() => setShowAllMoods(v => !v)} aria-expanded={showAllMoods} className="min-h-11 w-full rounded-xl text-sm font-medium text-primary hover:bg-secondary/40">
                  {showAllMoods ? t("Visa färre") : `${t("Visa alla")} (${moods.length})`}
                </button>
              )}
            </div>
          </CollapsibleSection>
        </MyFloveWide>
      )}

      {!readOnly && <MyFloveWide>
        <FlowInsightsModal open={flowInsightsOpen} onOpenChange={setFlowInsightsOpen} />
      </MyFloveWide>}
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
  const { lang, t } = useLang();
  const g = getGreeting({ name, lastVisit, lang });
  return (
    <div>
      <h1 className="pace-next-title font-display text-2xl font-bold text-ink sm:text-3xl mb-2 flex items-center gap-2">
        <MyFloveHeart size={26} /> {g.title}
      </h1>
      <p className="text-muted-foreground">
        {t("Hur känns det i kroppen och knoppen just nu? Ingen dömer dig här.")}
      </p>
    </div>
  );
}

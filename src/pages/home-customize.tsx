import { useEffect } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { track } from "@/lib/analytics";
import { HOME_BLOCKS, useHomeLayout } from "@/lib/home-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, PlayCircle } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import HomeShortcuts from "@/components/home-shortcuts";

/**
 * Anpassa hemskärmen – välj vilka block som syns, i vilken ordning,
 * och vilka fyra genvägar som ligger på Hem.
 */
export default function HomeCustomizePage() {
  const { order, hidden, toggle, move, reset } = useHomeLayout();

  useEffect(() => {
    track("settings_opened", { source: "hemskarm" });
  }, []);

  /** Ett event per anpassning – aldrig vilket innehåll blocket visar. */
  const toggleBlock = (id: Parameters<typeof toggle>[0]) => {
    track("settings_opened", { source: "hemskarm", method: "visa-dolj" });
    toggle(id);
  };
  const moveBlock = (id: Parameters<typeof move>[0], dir: -1 | 1) => {
    track("settings_opened", { source: "hemskarm", method: "ordning" });
    move(id, dir);
  };

  /** Nollställ introduktionen så den visas igen nästa gång Hem öppnas. */
  const replayIntro = () => {
    try {
      window.localStorage.removeItem("myflove-intro-seen");
    } catch {
      /* utan lagring går det inte att spara valet – appen fungerar ändå */
    }
    window.location.href = "/hem";
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href="/hem"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={14} /> Till Hem
            </Link>
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mt-2">
              Anpassa hemskärmen
            </h1>
            <p className="text-sm text-muted-foreground">
              Slå av det du inte vill se och flytta resten dit du vill ha det.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="rounded-xl gap-1 shrink-0">
            <RotateCcw size={14} /> Återställ
          </Button>
        </div>

        <CollapsibleSection
          title="Block på Hem"
          id="home-customize-blocks"
          headingClassName="text-sm font-semibold uppercase tracking-wide"
          className="rounded-3xl border-2 border-border/60 bg-card p-4 shadow-soft"
        >
          <ul className="space-y-2">
            {order.map((id, idx) => {
              const meta = HOME_BLOCKS.find((b) => b.id === id);
              if (!meta) return null;
              const isHidden = hidden.includes(id);
              return (
                <li
                  key={id}
                  className={`flex items-center gap-3 rounded-2xl border border-border/60 p-3 ${
                    isHidden ? "bg-secondary/30 opacity-70" : "bg-background"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(id, -1)}
                      disabled={idx === 0}
                      className="rounded-lg bg-secondary p-2 text-foreground disabled:opacity-30"
                      aria-label={`Flytta upp ${meta.label}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(id, 1)}
                      disabled={idx === order.length - 1}
                      className="rounded-lg bg-secondary p-2 text-foreground disabled:opacity-30"
                      aria-label={`Flytta ner ${meta.label}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBlock(id)}
                      className={`rounded-lg p-2 ${
                        isHidden
                          ? "bg-secondary text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                      aria-label={isHidden ? `Visa ${meta.label}` : `Dölj ${meta.label}`}
                      title={isHidden ? "Visa" : "Dölj"}
                    >
                      {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection
          title="Mina genvägar"
          id="home-customize-shortcuts"
          headingClassName="text-sm font-semibold uppercase tracking-wide"
          className="rounded-3xl border-2 border-border/60 bg-card p-4 shadow-soft"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Välj vad du vill ha direkt på startsidan. Tryck för att lägga till eller ta bort.
          </p>
          <HomeShortcuts />
        </CollapsibleSection>

        <CollapsibleSection
          title="Introduktionen"
          id="home-customize-intro"
          headingClassName="text-sm font-semibold uppercase tracking-wide"
          className="rounded-3xl border-2 border-border/60 bg-card p-4 shadow-soft"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Vill du se den korta introduktionen igen? Den dyker upp nästa gång du öppnar Hem.
          </p>
          <Button variant="outline" className="rounded-xl gap-2" onClick={replayIntro}>
            <PlayCircle size={16} /> Visa introduktionen igen
          </Button>
        </CollapsibleSection>
      </div>
    </Layout>
  );
}

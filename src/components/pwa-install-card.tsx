import { useEffect } from "react";
import { Check, Download, Menu, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { haptic } from "@/lib/haptics";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * "Lägg till Paceable på hemskärmen"
 * Riktig installationsprompt där webbläsaren stödjer den, annars en mjuk
 * instruktion för iOS/Safari. Döljs helt när appen redan är installerad.
 * `compact` gör den till en liten, diskret notering (används längst ner på Hem).
 */
export default function PwaInstallCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { installed, isIos, showInstallHelp, setShowInstallHelp, install, justInstalled } =
    usePwaInstall();

  useEffect(() => {
    if (installed) return;
    track("install_prompt_shown", { source: compact ? "hem" : "kort" });
  }, [installed, compact]);

  useEffect(() => {
    if (justInstalled) track("install_completed", { result: "completed" });
  }, [justInstalled]);

  const startInstall = () => {
    haptic("success");
    track("install_started", { source: compact ? "hem" : "kort" });
    void install();
  };

  // Redan installerad – ingen knapp, inget påstående om lyckad installation.
  if (installed) return null;

  if (compact && !showInstallHelp) {
    return (
      <button
        type="button"
        data-pwa-install
        onClick={startInstall}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <FlowMascot size="xs" mood="wave" bump className="shrink-0" />
        <span>Vill du ha Flow nära till hands? Lägg till på hemskärmen</span>
      </button>
    );
  }

  return (
    <section
      data-pwa-install
      aria-label="Lägg till Paceable på hemskärmen"
      className={cn(
        "rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-lifted space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <FlowMascot size="xs" mood="wave" bump className="flow-alive shrink-0" />
        <p className="min-w-0 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Ha Flow nära till hands 💜</span>
          <span className="mt-0.5 block">Paceable kan ligga direkt på din hemskärm.</span>
        </p>
      </div>

      <Button className="w-full rounded-full" onClick={startInstall}>
        <Download className="mr-2 size-4" />
        Lägg till Paceable på hemskärmen
      </Button>

      {showInstallHelp && (
        <div className="relative rounded-2xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground animate-fade-in">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 size-6 rounded-full"
            aria-label="Stäng instruktionen"
            onClick={() => setShowInstallHelp(false)}
          >
            <X className="size-3.5" />
          </Button>
          <p className="pr-6 font-medium text-foreground">
            {isIos ? "Så gör du på iPhone eller iPad:" : "Så lägger du till Paceable:"}
          </p>
          {isIos ? (
            <ol className="mt-1.5 space-y-1">
              <li className="flex items-start gap-2">
                <Share className="mt-0.5 size-3.5 shrink-0" />
                <span>1. Tryck på Dela i webbläsaren.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0" />
                <span>2. Välj ”Lägg till på hemskärmen” och sedan Lägg till.</span>
              </li>
            </ol>
          ) : (
            <ol className="mt-1.5 space-y-1">
              <li className="flex items-start gap-2">
                <Menu className="mt-0.5 size-3.5 shrink-0" />
                <span>1. Öppna webbläsarens meny.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0" />
                <span>2. Välj ”Installera app” eller ”Lägg till på startskärmen”.</span>
              </li>
            </ol>
          )}
          <p className="mt-2">Sen ligger Paceable som en riktig app – och jag med. 💜</p>
        </div>
      )}
    </section>
  );
}

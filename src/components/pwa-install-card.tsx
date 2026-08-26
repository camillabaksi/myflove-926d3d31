import { Check, Download, Menu, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowMascot } from "@/components/flow-mascot";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * "Lägg till MyFlove på hemskärmen"
 * Riktig installationsprompt där webbläsaren stödjer den, annars en mjuk
 * instruktion för iOS/Safari. Döljs helt när appen redan är installerad.
 */
export default function PwaInstallCard({ className }: { className?: string }) {
  const { installed, canPrompt, isIos, showInstallHelp, setShowInstallHelp, install } =
    usePwaInstall();

  // Redan installerad – ingen knapp, inget påstående om lyckad installation.
  if (installed) return null;

  return (
    <section
      data-pwa-install
      aria-label="Lägg till MyFlove på hemskärmen"
      className={cn(
        "rounded-3xl border border-primary/20 bg-card p-4 shadow-lifted space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <FlowMascot size="xs" mood="wave" className="flow-alive shrink-0" />
        <p className="min-w-0 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Ha Flow nära till hands 💜</span>
          <span className="mt-0.5 block">MyFlove kan ligga direkt på din hemskärm.</span>
        </p>
      </div>

      <Button
        className="w-full rounded-full"
        onClick={() => {
          haptic("success");
          void install();
        }}
      >
        <Download className="mr-2 size-4" />
        Lägg till MyFlove på hemskärmen
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
            {isIos ? "Så gör du på iPhone eller iPad:" : "Så lägger du till MyFlove:"}
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
          <p className="mt-2">Sen ligger MyFlove som en riktig app – och jag med. 💜</p>
        </div>
      )}
    </section>
  );
}

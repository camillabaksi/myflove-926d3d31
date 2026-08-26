import { Check, Download, Share, X } from "lucide-react";
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
  const { installed, canPrompt, needsIosInstructions, showIosHelp, setShowIosHelp, install } =
    usePwaInstall();

  // Redan installerad – ingen knapp, inget påstående om lyckad installation.
  if (installed) return null;
  if (!canPrompt && !needsIosInstructions) return null;

  return (
    <section
      data-pwa-install
      aria-label="Lägg till MyFlove på hemskärmen"
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-4 shadow-sm space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <FlowMascot size="xs" mood="wave" className="flow-alive shrink-0" />
        <p className="min-w-0 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          Vill du ha mig nära till hands? 💜 Lägg till MyFlove på hemskärmen.
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
        {canPrompt ? "Installera MyFlove" : "Lägg till MyFlove på hemskärmen"}
      </Button>

      {needsIosInstructions && showIosHelp && (
        <div className="relative rounded-2xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground animate-fade-in">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 size-6 rounded-full"
            aria-label="Stäng instruktionen"
            onClick={() => setShowIosHelp(false)}
          >
            <X className="size-3.5" />
          </Button>
          <p className="pr-6 font-medium text-foreground">Så gör du i Safari:</p>
          <ol className="mt-1.5 space-y-1">
            <li className="flex items-start gap-2">
              <Share className="mt-0.5 size-3.5 shrink-0" />
              <span>1. Tryck på Dela-ikonen längst ner i Safari.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0" />
              <span>2. Välj "Lägg till på hemskärmen" och tryck Lägg till.</span>
            </li>
          </ol>
          <p className="mt-2">Sen ligger MyFlove som en riktig app – och jag med. 💜</p>
        </div>
      )}
    </section>
  );
}

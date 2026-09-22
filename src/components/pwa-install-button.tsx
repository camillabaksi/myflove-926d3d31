import { Check, Download, Menu, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowMascot } from "@/components/flow-mascot";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useLang } from "@/hooks/use-language";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Alltid synlig knapp för att lägga till MyFlove på hemskärmen.
 * Fungerar oavsett webbläsare: riktig prompt när den finns, annars en
 * instruktionsruta i appen (ingen popup som kan blockeras).
 */
export default function PwaInstallButton({
  className,
  label = "Lägg till MyFlove på hemskärmen",
  variant = "default",
  row = false,
  hint = "Öppna MyFlove snabbare när du behöver Flow.",
}: {
  className?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Visa som inställningsrad (rubrik + underrubrik) i Mer/Inställningar. */
  row?: boolean;
  hint?: string;
}) {
  const { installed, isIos, showInstallHelp, setShowInstallHelp, install } = usePwaInstall();
  const { t } = useLang();

  if (installed) return null;

  const start = () => {
    haptic("success");
    void install();
  };

  return (
    <>
      {row ? (
        <button
          type="button"
          onClick={start}
          className={cn(
            "press flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors",
            className,
          )}
        >
          <span className="shrink-0">
            <Download size={22} strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-tight">Lägg till på hemskärmen</span>
            <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
          </span>
        </button>
      ) : (
        <Button
          type="button"
          variant={variant}
          className={cn("w-full rounded-full", className)}
          onClick={start}
        >
          <Download className="mr-2 size-4" />
          {label}
        </Button>
      )}

      <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlowMascot size="xs" mood="wave" bump />
              Så lägger du till MyFlove
            </DialogTitle>
            <DialogDescription>
              Ha Flow nära till hands 💜 – appen hamnar direkt på din hemskärm.
            </DialogDescription>
          </DialogHeader>
          {isIos ? (
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Share className="mt-0.5 size-4 shrink-0" />
                <span>1. Tryck på Dela längst ner i Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0" />
                <span>2. Välj ”Lägg till på hemskärmen” och tryck Lägg till.</span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Menu className="mt-0.5 size-4 shrink-0" />
                <span>1. Öppna webbläsarens meny (⋮ eller ☰).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0" />
                <span>2. Välj ”Installera app” eller ”Lägg till på startskärmen”.</span>
              </li>
            </ol>
          )}
          <Button className="mt-2 w-full rounded-full" onClick={() => setShowInstallHelp(false)}>
            Okej, jag fixar det
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

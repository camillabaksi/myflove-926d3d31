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
}: {
  className?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const { installed, isIos, showInstallHelp, setShowInstallHelp, install } = usePwaInstall();

  if (installed) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={cn("w-full rounded-full", className)}
        onClick={() => {
          haptic("success");
          void install();
        }}
      >
        <Download className="mr-2 size-4" />
        {label}
      </Button>

      <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlowMascot size="xs" mood="wave" />
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

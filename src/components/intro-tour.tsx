import { useState } from "react";
import { Calendar, Heart, Inbox, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/storage";
import { useHydrated } from "@/hooks/use-hydrated";

const STEPS = [
  {
    icon: Sparkles,
    title: "Välkommen till MyFlove",
    body: "MyFlove är till för att göra vardagen enklare. Du behöver inte använda allt – börja med en sak.",
  },
  {
    icon: Inbox,
    title: "Quickflow – töm huvudet",
    body: "Kommer du på något? Skriv in det i Quickflow direkt. Du behöver inte bestämma när eller hur. Det försvinner inte.",
  },
  {
    icon: Calendar,
    title: "Kalender och Att göra",
    body: "Här ligger det som har en tid. Du kan lägga till påminnelse om du vill – annars ligger det bara kvar.",
  },
  {
    icon: Heart,
    title: "Må bra – hur mycket orkar du?",
    body: "När du loggar hur du mår anpassar appen dagens förslag. Låg ork = färre saker. Det är hela idén.",
  },
];

export default function IntroTour() {
  const hydrated = useHydrated();
  const [seen, setSeen] = useLocalStorage<boolean>("myflove-intro-seen", false);
  const [step, setStep] = useState(0);

  if (!hydrated || seen) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) setSeen(true); }}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={26} />
          </div>
          <DialogTitle className="text-center font-display text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 py-1" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full rounded-2xl"
            onClick={() => (isLast ? setSeen(true) : setStep((s) => s + 1))}
          >
            {isLast ? "Nu kör vi" : "Nästa"}
          </Button>
          {!isLast && (
            <button
              type="button"
              onClick={() => setSeen(true)}
              className="text-xs text-muted-foreground hover:underline"
            >
              Hoppa över
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

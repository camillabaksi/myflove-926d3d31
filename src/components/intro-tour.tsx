import { useEffect, useRef, useState } from "react";
import { Calendar, Heart, Inbox, Sparkles, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/storage";

const STEPS = [
  {
    icon: Sparkles,
    tint: "bg-lavender",
    title: "Välkommen till MyFlove",
    body: "MyFlove finns till för att göra vardagen enklare. Du behöver inte använda allt – börja med en sak.",
  },
  {
    icon: Inbox,
    tint: "bg-mint",
    title: "Quickflow – töm huvudet",
    body: "Kommer du på något? Skriv in det i Quickflow direkt. Du behöver inte bestämma när eller hur. Det försvinner inte.",
  },
  {
    icon: Calendar,
    tint: "bg-sky",
    title: "Kalender och Att göra",
    body: "Här ligger det som har en tid. Du kan lägga till en påminnelse om du vill – annars ligger det bara kvar.",
  },
  {
    icon: Heart,
    tint: "bg-blush",
    title: "Må bra – hur mycket orkar du?",
    body: "När du loggar hur du mår anpassas dagens förslag. Låg ork = färre saker. Det är hela idén.",
  },
];

export default function IntroTour() {
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useLocalStorage<boolean>("myflove-intro-seen", false);
  const [step, setStep] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || seen) return null;

  const isLast = step === STEPS.length - 1;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    setStep(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  // Håll punkterna i takt med fingret när man sveper
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== step) setStep(i);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) setSeen(true); }}>
      <DialogContent className="max-w-sm rounded-3xl px-0 pb-5 pt-6 overflow-hidden">
        <DialogTitle className="sr-only">{STEPS[step].title}</DialogTitle>
        <DialogDescription className="sr-only">{STEPS[step].body}</DialogDescription>

        {/* Svep i sidled – ett kort i taget */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-roledescription="karusell"
          aria-label={`Steg ${step + 1} av ${STEPS.length}`}
        >
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="w-full shrink-0 snap-center px-6">
                <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl ${s.tint} text-primary breathe`}>
                  <Icon size={28} />
                </div>
                <h2 className="text-center font-display text-xl font-bold text-ink">{s.title}</h2>
                <p className="mt-2 text-center leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>

        {/* Progress: punkter man kan trycka på + tydlig räknare */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Gå till steg ${i + 1}: ${s.title}`}
                aria-current={i === step}
                className="press p-1.5"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : "w-2 bg-border"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Steg {step + 1} av {STEPS.length}
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 px-6">
          <div className="flex w-full items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                className="rounded-2xl press"
                onClick={() => goTo(step - 1)}
              >
                Tillbaka
              </Button>
            )}
            <Button
              className="flex-1 rounded-2xl press"
              onClick={() => (isLast ? setSeen(true) : goTo(step + 1))}
            >
              {isLast ? "Nu kör vi" : "Nästa"}
            </Button>
          </div>
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

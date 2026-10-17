import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Check,
  Footprints,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Tre små prova-på-demoer på landningssidan. Allt är lokalt i webbläsaren —
 * inget sparas, inget konto behövs och ingen användardata berörs.
 */
export type FeatureDemoId = "quickflow" | "energi" | "steg";

export function FeatureDemoDialog({
  demo,
  onClose,
  returnFocus,
}: {
  demo: FeatureDemoId | null;
  onClose: () => void;
  returnFocus?: () => void;
}) {
  return (
    <Dialog open={demo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus();
          }
        }}
        className="max-w-md bg-landing-background p-5 sm:p-6"
      >
        {demo === "quickflow" && <QuickflowDemo />}
        {demo === "energi" && <EnergyDemo />}
        {demo === "steg" && <StepsDemo />}
      </DialogContent>
    </Dialog>
  );
}

function DemoFooter() {
  return (
    <div className="mt-5 flex flex-col items-center gap-2 border-t border-border/60 pt-4">
      <Button asChild size="lg" className="w-full rounded-full shadow-soft">
        <Link to="/sign-up">
          Skapa konto och spara på riktigt <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Det här är bara ett exempel – inget sparas här.
      </p>
    </div>
  );
}

function QuickflowDemo() {
  const [text, setText] = useState("");
  const [captured, setCaptured] = useState<string[]>(["Ring tandläkaren", "Köp mjölk"]);

  const add = () => {
    const value = text.trim();
    if (!value) return;
    setCaptured((current) => [value, ...current]);
    setText("");
  };

  return (
    <div>
      <DialogTitle className="flex items-center gap-2 font-display text-xl">
        <span className="grid size-9 place-items-center rounded-full bg-lavender text-primary">
          <Zap className="size-4" aria-hidden="true" />
        </span>
        Prova Fånga
      </DialogTitle>
      <DialogDescription className="mt-2 text-sm leading-6">
        Skriv en tanke innan den försvinner. I appen hjälper Pace dig sedan att sortera den till
        kalender, uppgift eller påminnelse.
      </DialogDescription>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Vad snurrar i huvudet just nu?"
          aria-label="Skriv en tanke"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Fånga tanken"
          className="size-10 shrink-0 rounded-full"
        >
          <Plus aria-hidden="true" />
        </Button>
      </form>
      <ul className="mt-4 space-y-2">
        {captured.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm shadow-soft"
          >
            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item}</span>
            <button
              type="button"
              aria-label={`Ta bort ${item}`}
              onClick={() => setCaptured((current) => current.filter((_, i) => i !== index))}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <DemoFooter />
    </div>
  );
}

const ENERGY_LEVELS = [
  {
    id: "lagt",
    label: "Lågt",
    icon: BatteryLow,
    plan: ["En sak i taget", "Ta pauser ofta", "Välj det viktigaste bara"],
  },
  {
    id: "mellan",
    label: "Mellan",
    icon: BatteryMedium,
    plan: ["Blanda lätt och tyngre", "Korta fokuspass", "Avsluta med något mjukt"],
  },
  {
    id: "fullt",
    label: "Fullt",
    icon: BatteryFull,
    plan: ["Börja med det tyngsta", "Längre fokuspass", "Lägg in återhämtning ändå"],
  },
] as const;

function EnergyDemo() {
  const [level, setLevel] = useState<(typeof ENERGY_LEVELS)[number]["id"]>("mellan");
  const active = ENERGY_LEVELS.find((item) => item.id === level)!;

  return (
    <div>
      <DialogTitle className="flex items-center gap-2 font-display text-xl">
        <span className="grid size-9 place-items-center rounded-full bg-lavender text-primary">
          <BatteryMedium className="size-4" aria-hidden="true" />
        </span>
        Prova energiplanering
      </DialogTitle>
      <DialogDescription className="mt-2 text-sm leading-6">
        Välj hur mycket energi du har idag, så anpassar Paceable dagen efter det – inte tvärtom.
      </DialogDescription>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Välj energinivå">
        {ENERGY_LEVELS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={level === item.id}
            onClick={() => setLevel(item.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-sm font-semibold transition-colors ${
              level === item.id
                ? "border-primary bg-lavender text-primary"
                : "border-border/60 bg-card text-muted-foreground"
            }`}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Så kan din dag se ut
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {active.plan.map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-primary" aria-hidden="true" /> {line}
            </li>
          ))}
        </ul>
      </div>
      <DemoFooter />
    </div>
  );
}

function StepsDemo() {
  const [done, setDone] = useState<number[]>([0]);
  const steps = [
    "Lägg fram träningskläderna",
    "Sätt på skorna",
    "Gå runt kvarteret",
    "Fira att du gjorde det",
  ];

  return (
    <div>
      <DialogTitle className="flex items-center gap-2 font-display text-xl">
        <span className="grid size-9 place-items-center rounded-full bg-lavender text-primary">
          <Footprints className="size-4" aria-hidden="true" />
        </span>
        Prova ett steg i taget
      </DialogTitle>
      <DialogDescription className="mt-2 text-sm leading-6">
        Stora mål blir enklare när de bryts ner. Bocka av stegen och känn hur det rör sig framåt.
      </DialogDescription>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Mål: Börja röra mig lite varje dag
      </p>
      <ul className="mt-2 space-y-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm shadow-soft"
          >
            <Checkbox
              checked={done.includes(index)}
              onCheckedChange={(checked) =>
                setDone((current) =>
                  checked ? [...current, index] : current.filter((item) => item !== index),
                )
              }
              aria-label={`Markera steg: ${step}`}
              className="size-4 rounded-full"
            />
            <span className={done.includes(index) ? "text-muted-foreground line-through" : ""}>
              {step}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-secondary"
          role="img"
          aria-label={`${done.length} av ${steps.length} steg klara`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(done.length / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          {done.length === steps.length
            ? "Hela målet klart – fira! 🎉"
            : `${done.length} av ${steps.length} steg – varje steg räknas`}
        </p>
      </div>
      <DemoFooter />
    </div>
  );
}

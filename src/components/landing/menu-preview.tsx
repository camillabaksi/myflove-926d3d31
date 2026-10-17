import {
  Baby,
  BarChart3,
  BatteryMedium,
  BellRing,
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  CheckSquare,
  Dumbbell,
  Flame,
  Gauge,
  GraduationCap,
  Hand,
  Heart,
  HeartPulse,
  History,
  Home,
  House,
  ListChecks,
  MessageCircle,
  NotebookPen,
  Settings2,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Sun,
  Timer,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type MenuItem = {
  label: string;
  hint: string;
  icon: LucideIcon;
};

type MenuGroup = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  items: MenuItem[];
};

/**
 * Speglar appens riktiga sidomeny (src/components/layout.tsx) så besökare kan
 * se vad som finns innan de skapar konto. Helt statisk – inget sparas, ingen
 * kontodata berörs.
 */
const MENU_GROUPS: MenuGroup[] = [
  {
    id: "myflow",
    label: "Min dag",
    hint: "Dagen, kalendern och påminnelser",
    icon: CalendarDays,
    items: [
      { label: "Översikt", hint: "Dagen, energin och nästa steg", icon: Home },
      { label: "Idag", hint: "Vad som händer idag – hela dagens lista", icon: CalendarDays },
      { label: "Kalender", hint: "Tider och händelser, dag för dag", icon: Calendar },
      { label: "Påminnelser", hint: "Lägg till, ändra och avboka påminnelser", icon: BellRing },
      { label: "Timer", hint: "Jobba en stund, ta paus", icon: Timer },
    ],
  },
  {
    id: "flowflow",
    label: "Pace",
    hint: "Chatt, planering, Fånga och anteckningar",
    icon: Sparkles,
    items: [
      { label: "Pace", hint: "Hjälp, planering och chatt på ett ställe", icon: Sparkles },
      {
        label: "Prata med Pace",
        hint: "Chatta med din personliga följeslagare",
        icon: MessageCircle,
      },
      { label: "Planera", hint: "Planeringsläget – ordna dagens saker", icon: ListChecks },
      { label: "Fånga", hint: "Fånga något snabbt – sortera sedan", icon: Zap },
      { label: "Anteckningar", hint: "Din idébank – tankar utan krav", icon: NotebookPen },
      { label: "Alla uppgifter", hint: "Hela listan framåt", icon: CheckSquare },
    ],
  },
  {
    id: "healthflow",
    label: "Hälsa & ork",
    hint: "Energi, mående, träning, rutiner och medicin",
    icon: HeartPulse,
    items: [
      { label: "Hälsa", hint: "Energi, mående, träning, medicin och vila", icon: HeartPulse },
      { label: "Mitt batteri", hint: "Checka in på några sekunder", icon: BatteryMedium },
      { label: "Energins historik", hint: "Vad som brukar ge och ta energi", icon: Zap },
      { label: "Träning", hint: "Enkla pass anpassade efter din ork", icon: Dumbbell },
      { label: "Rutiner & medicin", hint: "Fasta rutiner och dagens doser", icon: Sun },
      { label: "Morgonstart", hint: "Kom igång på morgonen", icon: Sun },
    ],
  },
  {
    id: "recoveryflow",
    label: "Återhämtning",
    hint: "Paus, Ljusboost och Stopp-knappen",
    icon: Wind,
    items: [
      { label: "Återhämtning", hint: "Paus du väljer längden på", icon: Wind },
      { label: "Stop-paus", hint: "En paus mellan impuls och beslut", icon: Hand },
    ],
  },
  {
    id: "studyflow",
    label: "Studier & jobb",
    hint: "Schema, uppgifter, möten och deadlines",
    icon: BookOpen,
    items: [
      {
        label: "Studier",
        hint: "Schema, studiehjälp och vad du ska plugga nu",
        icon: GraduationCap,
      },
    ],
  },
  {
    id: "familyflow",
    label: "Familj",
    hint: "Barnens dagar och personer du delar vardagen med",
    icon: Users,
    items: [
      { label: "Familj", hint: "Få vardagen att fungera för hela familjen", icon: Users },
      { label: "Barn", hint: "Scheman och rutiner för barnen", icon: Baby },
      { label: "Relationer", hint: "Personerna som hör till ditt liv", icon: Heart },
      { label: "Dela & bjud in", hint: "Dela listor och kalender med andra", icon: Users },
    ],
  },
  {
    id: "homeflow",
    label: "Hem & vardag",
    hint: "Mat, inköp, städning och pengar",
    icon: House,
    items: [
      { label: "Matlista", hint: "Planera veckans mat", icon: UtensilsCrossed },
      { label: "Inköpslista", hint: "Inköpslista du kan dela", icon: ShoppingBag },
      { label: "Städning", hint: "Vad som behöver göras hemma", icon: SprayCan },
      { label: "Ekonomi", hint: "Räkningar och budget", icon: Wallet },
    ],
  },
  {
    id: "insightflow",
    label: "Insikter",
    hint: "Mönster, historik och detaljer – bara om du vill se dem",
    icon: Brain,
    items: [
      { label: "Insikter", hint: "Beskrivande mönster från din egen data", icon: Brain },
      { label: "Historik", hint: "Vad hände dina dagar", icon: History },
      { label: "Statistik", hint: "Se dina mönster över tid", icon: BarChart3 },
      { label: "Belöningar", hint: "Små morötter när du gjort något", icon: Trophy },
      { label: "Dagens balans", hint: "Hur dagens krav matchar din ork", icon: Gauge },
      { label: "Feedback", hint: "Berätta vad som skaver i appen", icon: Flame },
    ],
  },
];

export function MenuPreviewDialog({
  open,
  onClose,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  returnFocus?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus();
          }
        }}
        className="max-h-[85vh] max-w-2xl overflow-y-auto bg-landing-background p-5 sm:p-7"
      >
        <DialogTitle className="font-display text-xl font-extrabold sm:text-2xl">
          Så ser menyn ut i Paceable
        </DialogTitle>
        <DialogDescription className="text-sm leading-6 text-muted-foreground">
          Allt du kan göra i appen – grupperat så det är lätt att hitta. Skapa ett konto för att
          börja använda dem.
        </DialogDescription>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MENU_GROUPS.map((group) => (
            <section
              key={group.id}
              aria-label={group.label}
              className="rounded-3xl border border-border/60 bg-landing-surface p-4 shadow-soft"
            >
              <header className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lavender text-primary">
                  <group.icon aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold">{group.label}</h3>
                  <p className="truncate text-xs text-muted-foreground">{group.hint}</p>
                </div>
              </header>
              <ul className="mt-3 space-y-1">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 rounded-2xl px-2 py-1.5">
                    <item.icon
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      strokeWidth={1.8}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5">{item.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{item.hint}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-1 mt-5 flex justify-center bg-landing-background pb-1 pt-3">
          <Button asChild size="lg" className="min-h-12 rounded-full px-7 shadow-soft">
            <Link to="/sign-up">Skapa konto och prova på riktigt</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  Accessibility, Ambulance, Apple, Bed, Bike, BookOpen, BriefcaseBusiness,
  BriefcaseMedical, BrushCleaning, Bus, Car, CirclePause, ClipboardCheck, Dumbbell, Ear,
  Gamepad2, Glasses, Headphones, HeartHandshake, HeartPulse, Home, Hospital, House, Medal,
  MessagesSquare, Music, Palette, PersonStanding, Pill, School, ShoppingCart, ShowerHead,
  Smile, SmilePlus, Sparkles, Stethoscope, Syringe, TestTube2, TrainFront, Tv, Users,
  Utensils, WashingMachine, Waves, type LucideIcon,
} from "lucide-react";
import type { PictogramId, VisualActivityTone } from "@/lib/child-visual-schedule";
import { cn } from "@/lib/utils";

const ICONS: Record<PictogramId, LucideIcon> = {
  breakfast: Apple, meal: Utensils, dress: PersonStanding, teeth: BrushCleaning, shower: ShowerHead,
  sleep: Bed, bag: BriefcaseBusiness, home: Home, clean: BrushCleaning, laundry: WashingMachine,
  shopping: ShoppingCart, school: School, break: Sparkles, study: BookOpen,
  childcare: Smile, walk: PersonStanding, car: Car, bus: Bus, train: TrainFront, bike: Bike,
  play: Smile, friends: Users, exercise: Dumbbell, swim: Waves, game: Gamepad2, tv: Tv,
  craft: Palette, music: Music, pause: CirclePause, quiet: HeartHandshake, headphones: Headphones,
  rest: Bed, family: House, visit: Users, doctor: Stethoscope, dentist: SmilePlus,
  hospital: Hospital, pharmacy: Pill, clinic: HeartPulse, vaccination: Syringe,
  nurse: BriefcaseMedical, examination: TestTube2, emergency: Ambulance,
  conversation: MessagesSquare, optician: Glasses, hearing: Ear, physio: Accessibility,
  followup: ClipboardCheck,
};

const TONES: Record<VisualActivityTone, string> = {
  lavender: "bg-lavender/70 border-primary/15 text-primary",
  blush: "bg-blush/70 border-blush text-accent-foreground",
  mint: "bg-mint/70 border-mint text-ink",
  sky: "bg-sky/70 border-sky text-ink",
  sun: "bg-sun/75 border-sun text-ink",
};

export function ActivityPictogram({ id, tone, className, iconClassName }: { id: PictogramId; tone: VisualActivityTone; className?: string; iconClassName?: string }) {
  const PictogramIcon = ICONS[id] ?? Medal;
  return (
    <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", TONES[tone], className)} aria-hidden>
      <PictogramIcon className={cn("h-7 w-7", iconClassName)} strokeWidth={2.2} absoluteStrokeWidth />
    </span>
  );
}

export const PICTOGRAM_LICENSE = "Lucide Icons, ISC License (commercial use permitted), https://lucide.dev/license";

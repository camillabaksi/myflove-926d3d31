import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ORK_LEVELS, MOOD_FACES, type OrkId } from "@/lib/ork";

type Translate = (text: string) => string;
const identity: Translate = (text) => text;
const ENERGY_ICONS = { fullt: BatteryFull, mellan: BatteryMedium, lagt: BatteryLow };
const MOOD_ICONS = [Frown, Annoyed, Meh, Smile, Laugh];

/** Presentation only: the caller owns the draft and saving. */
export function EnergyChoices({
  value,
  onChange,
  t = identity,
}: {
  value?: OrkId;
  onChange: (value: number) => void;
  t?: Translate;
}) {
  return (
    <div className="pace-form-ork grid gap-2">
      {ORK_LEVELS.map((level) => {
        const Icon = ENERGY_ICONS[level.id];
        return (
          <Button
            key={level.id}
            type="button"
            variant="outline"
            aria-pressed={value === level.id}
            aria-label={t(level.label)}
            onClick={() => onChange(level.value10)}
            className="pace-form-choice rounded-xl"
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="pace-checkin-label">{t(level.label)}</span>
          </Button>
        );
      })}
    </div>
  );
}

export function MoodChoices({
  value,
  onChange,
  t = identity,
}: {
  value: number | null;
  onChange: (value: number) => void;
  t?: Translate;
}) {
  return (
    <div className="pace-form-moods">
      {MOOD_FACES.map((mood, index) => {
        const Icon = MOOD_ICONS[index];
        return (
          <Button
            key={mood.score10}
            type="button"
            variant="outline"
            aria-pressed={value === mood.score10}
            aria-label={t(mood.label)}
            onClick={() => onChange(mood.score10)}
            className="pace-form-choice flex-col rounded-xl"
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="pace-checkin-label text-muted-foreground">{t(mood.label)}</span>
          </Button>
        );
      })}
    </div>
  );
}

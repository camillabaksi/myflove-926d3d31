import type { ExerciseVisualKey } from "@/lib/exercise-library";

import visual01 from "@/assets/workouts/exercises/glute-bridge.webp";
import visual02 from "@/assets/workouts/exercises/hip-thrust-floor.webp";
import visual03 from "@/assets/workouts/exercises/rdl.webp";
import visual04 from "@/assets/workouts/exercises/sit-to-stand.webp";
import visual05 from "@/assets/workouts/exercises/calf-raise.webp";
import visual06 from "@/assets/workouts/exercises/bird-dog.webp";
import visual07 from "@/assets/workouts/exercises/dead-bug.webp";
import visual08 from "@/assets/workouts/exercises/pelvic-tilt.webp";
import visual09 from "@/assets/workouts/exercises/one-arm-row.webp";
import visual10 from "@/assets/workouts/exercises/seated-row-band.webp";
import visual11 from "@/assets/workouts/exercises/chest-press.webp";
import visual12 from "@/assets/workouts/exercises/biceps-curl.webp";
import visual13 from "@/assets/workouts/exercises/suitcase-carry.webp";
import visual14 from "@/assets/workouts/exercises/band-side-walk.webp";
import visual15 from "@/assets/workouts/exercises/low-step-up.webp";
import visual16 from "@/assets/workouts/exercises/reverse-lunge.webp";
import visual17 from "@/assets/workouts/exercises/med-ball-twist.webp";
import visual18 from "@/assets/workouts/exercises/march-in-place.webp";
import visual19 from "@/assets/workouts/exercises/shoulder-rolls.webp";
import visual20 from "@/assets/workouts/exercises/cat-cow.webp";
import visual21 from "@/assets/workouts/exercises/hip-opener.webp";
import visual22 from "@/assets/workouts/exercises/chest-stretch.webp";
import visual23 from "@/assets/workouts/exercises/breathing-down.webp";
import visual24 from "@/assets/workouts/exercises/wall-pushup.webp";
import visual25 from "@/assets/workouts/exercises/kb-deadlift.webp";
import visual26 from "@/assets/workouts/exercises/kb-swing-low.webp";
import visual27 from "@/assets/workouts/exercises/squat-to-press.webp";
import visual28 from "@/assets/workouts/exercises/step-touch.webp";
import visual29 from "@/assets/workouts/exercises/low-impact-jack.webp";
import visual30 from "@/assets/workouts/exercises/farmer-carry.webp";
import visual31 from "@/assets/workouts/exercises/sit-to-stand-reach.webp";
import visual32 from "@/assets/workouts/exercises/incline-pushup.webp";
import visual33 from "@/assets/workouts/exercises/shoulder-press-seated.webp";
import visual34 from "@/assets/workouts/exercises/band-pull-apart.webp";
import visual35 from "@/assets/workouts/exercises/triceps-kickback.webp";
import visual36 from "@/assets/workouts/exercises/lateral-raise.webp";
import visual37 from "@/assets/workouts/exercises/band-face-pull.webp";
import visual38 from "@/assets/workouts/exercises/shrug.webp";
import visual39 from "@/assets/workouts/exercises/wall-sit.webp";
import visual40 from "@/assets/workouts/exercises/goblet-squat.webp";
import visual41 from "@/assets/workouts/exercises/single-leg-bridge.webp";
import visual42 from "@/assets/workouts/exercises/side-lying-leg-raise.webp";
import visual43 from "@/assets/workouts/exercises/hamstring-curl-standing.webp";
import visual44 from "@/assets/workouts/exercises/split-squat-support.webp";
import visual45 from "@/assets/workouts/exercises/forearm-plank.webp";
import visual46 from "@/assets/workouts/exercises/side-plank-knees.webp";
import visual47 from "@/assets/workouts/exercises/heel-taps.webp";
import visual48 from "@/assets/workouts/exercises/standing-twist.webp";
import visual49 from "@/assets/workouts/exercises/pallof-band.webp";
import visual50 from "@/assets/workouts/exercises/hollow-hold-easy.webp";
import visual51 from "@/assets/workouts/exercises/childs-pose.webp";
import visual52 from "@/assets/workouts/exercises/hamstring-stretch.webp";
import visual53 from "@/assets/workouts/exercises/neck-release.webp";
import visual54 from "@/assets/workouts/exercises/thoracic-rotation.webp";
import visual55 from "@/assets/workouts/exercises/ankle-mobility.webp";
import visual56 from "@/assets/workouts/exercises/figure-four-stretch.webp";
import visual57 from "@/assets/workouts/exercises/standing-side-bend.webp";
import visual58 from "@/assets/workouts/exercises/wrist-mobility.webp";

const EXERCISE_VISUALS: Record<ExerciseVisualKey, string> = {
  "glute-bridge": visual01,
  "hip-thrust-floor": visual02,
  "rdl": visual03,
  "sit-to-stand": visual04,
  "calf-raise": visual05,
  "bird-dog": visual06,
  "dead-bug": visual07,
  "pelvic-tilt": visual08,
  "one-arm-row": visual09,
  "seated-row-band": visual10,
  "chest-press": visual11,
  "biceps-curl": visual12,
  "suitcase-carry": visual13,
  "band-side-walk": visual14,
  "low-step-up": visual15,
  "reverse-lunge": visual16,
  "med-ball-twist": visual17,
  "march-in-place": visual18,
  "shoulder-rolls": visual19,
  "cat-cow": visual20,
  "hip-opener": visual21,
  "chest-stretch": visual22,
  "breathing-down": visual23,
  "wall-pushup": visual24,
  "kb-deadlift": visual25,
  "kb-swing-low": visual26,
  "squat-to-press": visual27,
  "step-touch": visual28,
  "low-impact-jack": visual29,
  "farmer-carry": visual30,
  "sit-to-stand-reach": visual31,
  "incline-pushup": visual32,
  "shoulder-press-seated": visual33,
  "band-pull-apart": visual34,
  "triceps-kickback": visual35,
  "lateral-raise": visual36,
  "band-face-pull": visual37,
  "shrug": visual38,
  "wall-sit": visual39,
  "goblet-squat": visual40,
  "single-leg-bridge": visual41,
  "side-lying-leg-raise": visual42,
  "hamstring-curl-standing": visual43,
  "split-squat-support": visual44,
  "forearm-plank": visual45,
  "side-plank-knees": visual46,
  "heel-taps": visual47,
  "standing-twist": visual48,
  "pallof-band": visual49,
  "hollow-hold-easy": visual50,
  "childs-pose": visual51,
  "hamstring-stretch": visual52,
  "neck-release": visual53,
  "thoracic-rotation": visual54,
  "ankle-mobility": visual55,
  "figure-four-stretch": visual56,
  "standing-side-bend": visual57,
  "wrist-mobility": visual58,
};

export default function ExerciseVisual({
  visual,
  name,
  className,
  eager = false,
}: {
  visual: ExerciseVisualKey;
  name: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={EXERCISE_VISUALS[visual]}
      alt={`${name}: tydlig visning av övningens rörelsefaser`}
      width={768}
      height={768}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}

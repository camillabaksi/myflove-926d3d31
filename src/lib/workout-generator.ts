/**
 * Träningsgeneratorn – ren logik, inget UI och inga nätverksanrop.
 *
 * Den tar ett behov (tid, energi, plats, utrustning, fokus, ömma områden)
 * och bygger ett rimligt pass av övningarna i biblioteket. Modulen är
 * medvetet fristående så att en AI-generator senare kan returnera samma
 * `Workout`-form utan att UI:t behöver byggas om.
 */

import {
  EXERCISES,
  exerciseById,
  type BodyArea,
  type Equipment,
  type Exercise,
  type ExerciseFocus,
} from "@/lib/exercise-library";

export type WorkoutIntent = "styrka" | "rörlighet" | "återhämtning" | "eget";
export type EnergyLevel = "låg" | "normal" | "mycket";
export type Place = "hemma" | "gym" | "ute";

export interface WorkoutRequest {
  intent: WorkoutIntent;
  /** Fritext från användaren, t.ex. "ont i knäna, vill fokusera på rumpa". */
  text?: string;
  minutes: number;
  energy: EnergyLevel;
  place: Place;
  equipment: Equipment[];
  focus: ExerciseFocus[];
  limitations: BodyArea[];
}

export interface WorkoutBlock {
  exerciseId: string;
  sets: number;
  reps?: number;
  seconds?: number;
  restSeconds: number;
  section: "uppvärmning" | "huvuddel" | "nedvarvning";
  /** Görs en sida i taget – tiden delas mellan höger och vänster. */
  sideSplit?: boolean;
  /** Nedräkning innan övningen startar i automatiskt läge. */
  transitionSeconds?: number;
}

export interface Workout {
  id: string;
  title: string;
  /** Flows korta, icke-dömande förklaring till upplägget. */
  note: string;
  createdAt: number;
  minutes: number;
  energy: EnergyLevel;
  place: Place;
  equipment: Equipment[];
  focus: ExerciseFocus[];
  limitations: BodyArea[];
  intent: WorkoutIntent;
  blocks: WorkoutBlock[];
  /** Grov uppskattning, aldrig exakt. */
  /** Valfri maxtid för spelaren, utan att skriva om övningar eller doser. */
  maxMinutes?: number;
  kcalLow: number;
  kcalHigh: number;
}

export const DEFAULT_REQUEST: WorkoutRequest = {
  intent: "styrka",
  text: "",
  minutes: 30,
  energy: "normal",
  place: "hemma",
  equipment: ["kroppsvikt"],
  focus: ["helkropp"],
  limitations: [],
};

const FOCUS_WORDS: { focus: ExerciseFocus; words: string[] }[] = [
  { focus: "underkropp", words: ["rumpa", "säte", "ben", "lår", "underkropp", "glutes"] },
  { focus: "bål", words: ["mage", "bål", "core", "magen"] },
  { focus: "överkropp", words: ["armar", "rygg", "bröst", "överkropp", "axlar"] },
  { focus: "rörlighet", words: ["rörlighet", "stretch", "mjuka upp", "stelhet"] },
  { focus: "helkropp", words: ["helkropp", "hela kroppen"] },
];

const EQUIPMENT_WORDS: { equipment: Equipment; words: string[] }[] = [
  { equipment: "hantlar", words: ["hantel", "hantlar", "vikter"] },
  { equipment: "kettlebell", words: ["kettlebell", "kettle"] },
  { equipment: "medicinboll", words: ["medicinboll", "boll"] },
  { equipment: "miniband", words: ["miniband", "gummiband", "band"] },
  { equipment: "kroppsvikt", words: ["kroppsvikt", "utan redskap", "inga redskap"] },
];

const AREA_WORDS: { area: BodyArea; words: string[] }[] = [
  { area: "knän", words: ["knä", "knän", "knäna", "knäet"] },
  { area: "skuldra", words: ["skuldra", "skuldror", "axel", "axlar"] },
  { area: "rygg", words: ["rygg", "ländrygg", "ryggen"] },
  { area: "handled", words: ["handled", "handleder"] },
  { area: "nacke", words: ["nacke", "nacken"] },
  { area: "höft", words: ["höft", "höften"] },
];

/**
 * Läser fritext och fyller i det användaren redan sagt, så att hen slipper
 * välja samma sak två gånger. Allt som inte hittas lämnas orört.
 */
export function parseWorkoutText(text: string, base: WorkoutRequest): WorkoutRequest {
  const t = text.toLowerCase();
  if (!t.trim()) return { ...base, text };
  const next: WorkoutRequest = { ...base, text };

  const time = t.match(/(\d{1,3})\s*(min|minuter)/);
  if (time) {
    const m = Number(time[1]);
    next.minutes = Math.max(5, Math.min(90, m));
  }

  if (/(hemma|hemmet)/.test(t)) next.place = "hemma";
  else if (/\b(gym|gymmet)\b/.test(t)) next.place = "gym";
  else if (/\b(ute|utomhus|parken)\b/.test(t)) next.place = "ute";

  if (/(orkar inte|trött|låg energi|slut på energi|tung dag)/.test(t)) next.energy = "låg";
  else if (/(pigg|mycket energi|full av energi)/.test(t)) next.energy = "mycket";

  const eq = EQUIPMENT_WORDS.filter((e) => e.words.some((w) => t.includes(w))).map(
    (e) => e.equipment,
  );
  if (eq.length) next.equipment = Array.from(new Set(["kroppsvikt", ...eq])) as Equipment[];

  const fo = FOCUS_WORDS.filter((f) => f.words.some((w) => t.includes(w))).map((f) => f.focus);
  if (fo.length) next.focus = Array.from(new Set(fo));

  const painy = /(ont|smärta|värk|känslig|skadad|problem)/.test(t);
  if (painy) {
    const areas = AREA_WORDS.filter((a) => a.words.some((w) => t.includes(w))).map((a) => a.area);
    if (areas.length) next.limitations = Array.from(new Set([...base.limitations, ...areas]));
  }
  return next;
}

const ENERGY_SETS: Record<EnergyLevel, number> = { låg: 2, normal: 3, mycket: 3 };
const ENERGY_REST: Record<EnergyLevel, number> = { låg: 40, normal: 30, mycket: 25 };
const ENERGY_REP_FACTOR: Record<EnergyLevel, number> = { låg: 0.7, normal: 1, mycket: 1.15 };

/** Ungefärlig tid för ett block, inklusive vila. */
function blockSeconds(block: WorkoutBlock): number {
  const work = block.seconds ?? (block.reps ?? 10) * 4;
  return block.sets * (work + block.restSeconds);
}

function suitable(ex: Exercise, req: WorkoutRequest): boolean {
  if (ex.avoid?.some((a) => req.limitations.includes(a))) return false;
  const eq = req.equipment.length ? req.equipment : (["kroppsvikt"] as Equipment[]);
  if (!ex.equipment.some((e) => eq.includes(e))) return false;
  if (req.energy === "låg" && ex.difficulty === "utmanande") return false;
  if (req.place === "ute" && ex.id === "chest-stretch") return false;
  return true;
}

function scoreExercise(ex: Exercise, req: WorkoutRequest): number {
  let score = 0;
  if (req.focus.includes(ex.focus)) score += 5;
  if (req.focus.includes("helkropp") && ex.focus === "helkropp") score += 3;
  if (req.intent === "rörlighet" && ex.focus === "rörlighet") score += 4;
  if (req.intent === "återhämtning" && ex.intensity === 1) score += 4;
  if (req.intent === "styrka" && ex.focus !== "rörlighet") score += 2;
  if (req.energy === "låg" && ex.difficulty === "lätt") score += 2;
  if (req.energy === "mycket" && ex.difficulty !== "lätt") score += 1;
  // Fler redskap valda? Prioritera övningar som faktiskt använder dem.
  if (ex.equipment.some((e) => e !== "kroppsvikt" && req.equipment.includes(e))) score += 1;
  return score;
}

function toBlock(ex: Exercise, req: WorkoutRequest, section: WorkoutBlock["section"]): WorkoutBlock {
  const light = section !== "huvuddel" || req.intent === "återhämtning";
  const sets = light ? ex.defaultSets : Math.max(1, ENERGY_SETS[req.energy]);
  // Uppvärmning och nedvarvning flyter på utan vila – förvarningen räcker.
  const rest = light ? 0 : ENERGY_REST[req.energy];
  const sideSplit = ex.sideSplit === true;
  const transitionSeconds = 5;
  if (ex.measure === "tid") {
    return {
      exerciseId: ex.id,
      sets,
      seconds: Math.round((ex.defaultSeconds ?? 30) * (light ? 1 : ENERGY_REP_FACTOR[req.energy])),
      restSeconds: rest,
      section,
      sideSplit,
      transitionSeconds,
    };
  }
  return {
    exerciseId: ex.id,
    sets,
    reps: Math.max(5, Math.round((ex.defaultReps ?? 10) * ENERGY_REP_FACTOR[req.energy])),
    restSeconds: rest,
    section,
    sideSplit,
    transitionSeconds,
  };
}

function pick(
  role: Exercise["role"],
  req: WorkoutRequest,
  count: number,
  used: Set<string>,
): Exercise[] {
  return EXERCISES.filter((e) => e.role === role && !used.has(e.id) && suitable(e, req))
    .sort((a, b) => scoreExercise(b, req) - scoreExercise(a, req))
    .slice(0, count);
}

const TITLES: Record<WorkoutIntent, string> = {
  styrka: "Styrkepass",
  rörlighet: "Rörlighetspass",
  återhämtning: "Mjukt återhämtningspass",
  eget: "Ditt pass",
};

function focusLabel(focus: ExerciseFocus[]): string {
  if (!focus.length || focus.includes("helkropp")) return "helkropp";
  return focus.join(" och ");
}

/**
 * Bygger passet. Alltid: kort uppvärmning, huvuddel som får plats inom vald
 * tid, och en nedvarvning. Vid låg energi blir det ett "minsta rimliga pass".
 */
export function generateWorkout(input: WorkoutRequest, now = Date.now()): Workout {
  const req: WorkoutRequest = {
    ...input,
    equipment: input.equipment.length ? input.equipment : ["kroppsvikt"],
    focus: input.focus.length ? input.focus : ["helkropp"],
    minutes: Math.max(5, Math.min(90, input.minutes)),
  };

  const used = new Set<string>();
  const warmCount = req.minutes <= 10 ? 1 : 2;
  const warm = pick("uppvärmning", req, warmCount, used);
  warm.forEach((e) => used.add(e.id));
  const down = pick("nedvarvning", req, req.minutes <= 10 ? 1 : 2, used);
  down.forEach((e) => used.add(e.id));

  const blocks: WorkoutBlock[] = [
    ...warm.map((e) => toBlock(e, req, "uppvärmning")),
    ...down.map((e) => toBlock(e, req, "nedvarvning")),
  ];
  const fixedSeconds = blocks.reduce((sum, b) => sum + blockSeconds(b), 0);
  let budget = req.minutes * 60 - fixedSeconds;

  const candidates =
    req.intent === "återhämtning" || req.intent === "rörlighet"
      ? EXERCISES.filter((e) => e.role !== "huvuddel" || e.intensity === 1)
      : EXERCISES;

  const main: WorkoutBlock[] = [];
  const pool = candidates
    .filter((e) => e.role === "huvuddel" && !used.has(e.id) && suitable(e, req))
    .sort((a, b) => scoreExercise(b, req) - scoreExercise(a, req));

  for (const ex of pool) {
    if (main.length >= Math.max(req.energy === "låg" ? 4 : 6, Math.round(req.minutes / 7))) break;
    const block = toBlock(ex, req, "huvuddel");
    const cost = blockSeconds(block);
    if (cost > budget && main.length >= 2) continue;
    if (cost > budget && main.length < 2) {
      // Minsta rimliga pass: korta ner istället för att hoppa över.
      block.sets = Math.max(1, block.sets - 1);
    }
    main.push(block);
    used.add(ex.id);
    budget -= blockSeconds(block);
    if (budget <= 30) break;
  }

  const ordered = fitToMinutes(
    [
      ...blocks.filter((b) => b.section === "uppvärmning"),
      ...main,
      ...blocks.filter((b) => b.section === "nedvarvning"),
    ],
    targetMinutes(req),
  );

  const totalSeconds = ordered.reduce((sum, b) => sum + blockSeconds(b), 0);
  const realMinutes = Math.max(5, Math.round(totalSeconds / 60));
  const avgIntensity =
    ordered.reduce((sum, b) => sum + (exerciseById(b.exerciseId)?.intensity ?? 1), 0) /
    Math.max(1, ordered.length);
  const kcalLow = Math.round(realMinutes * (2.5 + avgIntensity));
  const kcalHigh = Math.round(realMinutes * (4 + avgIntensity * 1.5));

  const notes: string[] = [];
  if (req.energy === "låg")
    notes.push("Du har låg energi idag, så jag gjorde ett kortare och mjukare pass.");
  else if (req.energy === "mycket") notes.push("Du har gott om energi idag, så passet får lite mer.");
  else notes.push(`Ett lagom pass på cirka ${realMinutes} minuter.`);
  if (req.limitations.length)
    notes.push(`Jag valde bort övningar som ofta belastar ${req.limitations.join(" och ")}.`);
  notes.push("Gör det du orkar – ett halvt pass räknas också.");

  return {
    id: `w-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${TITLES[req.intent]} – ${focusLabel(req.focus)}`,
    note: notes.join(" "),
    createdAt: now,
    minutes: realMinutes,
    energy: req.energy,
    place: req.place,
    equipment: req.equipment,
    focus: req.focus,
    limitations: req.limitations,
    intent: req.intent,
    blocks: ordered,
    kcalLow,
    kcalHigh,
  };
}

/** Ett förslag från AI:n – samma form som passet, men bara det nödvändiga. */
export interface AiWorkoutPlan {
  title?: string;
  note?: string;
  blocks: {
    exerciseId: string;
    sets?: number;
    reps?: number;
    seconds?: number;
    restSeconds?: number;
    section?: WorkoutBlock["section"];
  }[];
}

const SECTION_ORDER: WorkoutBlock["section"][] = ["uppvärmning", "huvuddel", "nedvarvning"];

/**
 * Bygger ett riktigt `Workout` av AI:ns förslag. Allt valideras mot det
 * befintliga biblioteket: okända övningar och sådant som krockar med ömma
 * områden tas bort. Blir det för tunt returneras null och den lokala
 * generatorn får ta över.
 */
export function buildWorkoutFromPlan(
  plan: AiWorkoutPlan,
  input: WorkoutRequest,
  now = Date.now(),
): Workout | null {
  const req: WorkoutRequest = {
    ...input,
    equipment: input.equipment.length ? input.equipment : ["kroppsvikt"],
    focus: input.focus.length ? input.focus : ["helkropp"],
    minutes: Math.max(5, Math.min(90, input.minutes)),
  };

  const seen = new Set<string>();
  const blocks: WorkoutBlock[] = [];
  for (const item of plan.blocks) {
    const ex = exerciseById(item.exerciseId);
    if (!ex || seen.has(ex.id)) continue;
    if (ex.avoid?.some((a) => req.limitations.includes(a))) continue;
    seen.add(ex.id);
    const section = item.section ?? ex.role;
    const base = toBlock(ex, req, section);
    blocks.push({
      ...base,
      sets: clamp(item.sets ?? base.sets, 1, 5),
      ...(ex.measure === "tid"
        ? { seconds: clamp(item.seconds ?? base.seconds ?? 30, 15, 180) }
        : { reps: clamp(item.reps ?? base.reps ?? 10, 3, 30) }),
      restSeconds:
        section === "huvuddel" ? clamp(item.restSeconds ?? base.restSeconds, 10, 45) : 0,
      section,
    });
  }

  if (blocks.length < 3) return null;

  const ordered = fitToMinutes(
    SECTION_ORDER.flatMap((s) => blocks.filter((b) => b.section === s)),
    targetMinutes(req),
  );
  const totalSeconds = ordered.reduce((sum, b) => sum + blockSeconds(b), 0);
  const realMinutes = Math.max(5, Math.round(totalSeconds / 60));
  const avgIntensity =
    ordered.reduce((sum, b) => sum + (exerciseById(b.exerciseId)?.intensity ?? 1), 0) /
    Math.max(1, ordered.length);

  return {
    id: `w-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: plan.title?.trim() || `${TITLES[req.intent]} – ${focusLabel(req.focus)}`,
    note: plan.note?.trim() || "Ett pass anpassat efter hur du har det idag.",
    createdAt: now,
    minutes: realMinutes,
    energy: req.energy,
    place: req.place,
    equipment: req.equipment,
    focus: req.focus,
    limitations: req.limitations,
    intent: req.intent,
    blocks: ordered,
    kcalLow: Math.round(realMinutes * (2.5 + avgIntensity)),
    kcalHigh: Math.round(realMinutes * (4 + avgIntensity * 1.5)),
  };
}

/** Vald tid – lite kortare vid låg energi. */
function targetMinutes(req: WorkoutRequest): number {
  return req.energy === "låg" ? Math.max(10, Math.round(req.minutes * 0.8)) : req.minutes;
}

/**
 * Justerar huvuddelens set (och vid behov antal övningar) så att passet
 * hamnar nära vald tid, i stället för att tiden bara blir vad den blir.
 */
export function fitToMinutes(input: WorkoutBlock[], minutes: number): WorkoutBlock[] {
  const blocks = input.map((b) => ({ ...b }));
  const target = minutes * 60;
  const total = () => blocks.reduce((s, b) => s + blockSeconds(b), 0);
  const mains = () => blocks.filter((b) => b.section === "huvuddel");
  for (let guard = 0; guard < 60 && total() > target * 1.08; guard += 1) {
    const m = mains().sort((a, b) => b.sets - a.sets)[0];
    if (m && m.sets > 1) m.sets -= 1;
    else if (mains().length > 2) blocks.splice(blocks.lastIndexOf(mains().at(-1)!), 1);
    else break;
  }
  for (let guard = 0; guard < 60 && total() < target * 0.9; guard += 1) {
    const m = mains().sort((a, b) => a.sets - b.sets)[0];
    if (!m || m.sets >= 5) break;
    m.sets += 1;
  }
  return blocks;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Byter ut en övning mot närmaste rimliga alternativ. */
export function swapExercise(workout: Workout, index: number): Workout {
  const block = workout.blocks[index];
  if (!block) return workout;
  const current = exerciseById(block.exerciseId);
  if (!current) return workout;
  const usedIds = new Set(workout.blocks.map((b) => b.exerciseId));
  const req: WorkoutRequest = {
    intent: workout.intent,
    minutes: workout.minutes,
    energy: workout.energy,
    place: workout.place,
    equipment: workout.equipment,
    focus: workout.focus,
    limitations: workout.limitations,
  };
  const alternative =
    EXERCISES.filter(
      (e) => e.role === current.role && !usedIds.has(e.id) && suitable(e, req),
    ).sort((a, b) => {
      const sameFocus = (x: Exercise) => (x.focus === current.focus ? 1 : 0);
      return sameFocus(b) - sameFocus(a) || scoreExercise(b, req) - scoreExercise(a, req);
    })[0] ?? null;
  if (!alternative) return workout;
  const blocks = workout.blocks.map((b, i) =>
    i === index ? toBlock(alternative, req, b.section) : b,
  );
  return { ...workout, blocks };
}

/** Uppskattad total tid för ett pass i minuter. */
export function workoutMinutes(workout: Workout): number {
  return Math.max(1, Math.round(workout.blocks.reduce((s, b) => s + blockSeconds(b), 0) / 60));
}

/** Energinivå från FlowScore (0–100) till passets energisteg. */
export function energyFromScore(score: number | null | undefined): EnergyLevel {
  if (score == null) return "normal";
  if (score < 40) return "låg";
  if (score > 72) return "mycket";
  return "normal";
}

/**
 * Sparade återhämtningsövningar – del av det befintliga Återhämtningsbiblioteket.
 *
 * Flow kan skapa en övning (```flow-exercise-block```). Användaren väljer själv
 * om den ska sparas. Sparade övningar synkas via cloud sync och kan senare
 * föreslås av Flow (```flow-saved-block```) när de verkar relevanta.
 */

export const SAVED_EXERCISES_KEY = "myflove-saved-exercises";

export type ExerciseCategory = "mig" | "barn" | "favorit";

export const CATEGORY_META: Record<ExerciseCategory, { emoji: string; label: string }> = {
  mig: { emoji: "🌿", label: "För mig" },
  barn: { emoji: "👨‍👩‍👧", label: "Barn & familj" },
  favorit: { emoji: "⭐", label: "Favoriter" },
};

export interface SavedExercise {
  id: string;
  title: string;
  description?: string;
  steps: string[];
  category: ExerciseCategory;
  icon: string;
  /** Rekommenderad ålder om Flow angav det, t.ex. "3–6 år". */
  age?: string;
  /** Ungefärlig längd i minuter. */
  minutes?: number;
  /** Situationen övningen skapades för, t.ex. "läggdags". */
  situation?: string;
  /** Barnprofilens id, eller "all" för alla barn. */
  childId?: string;
  savedAt: string;
}

/** Övning som Flow har föreslagit i chatten, innan den sparats. */
export type ExerciseDraft = Omit<SavedExercise, "id" | "category" | "savedAt" | "childId"> & {
  forChild: boolean;
};

const EXERCISE_BLOCK = /```flow-exercise\s*([\s\S]*?)```/gi;
const SAVED_BLOCK = /```flow-saved\s*([\s\S]*?)```/gi;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

function toDraft(raw: unknown): ExerciseDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = str(o.title);
  const steps = Array.isArray(o.steps)
    ? o.steps.map((s) => str(s)).filter((s): s is string => !!s)
    : [];
  if (!title || steps.length === 0) return null;
  const minutes = typeof o.minutes === "number" && o.minutes > 0 && o.minutes <= 60 ? o.minutes : undefined;
  return {
    title: title.slice(0, 80),
    description: str(o.description)?.slice(0, 240),
    steps: steps.slice(0, 12).map((s) => s.slice(0, 200)),
    icon: str(o.icon)?.slice(0, 4) ?? "🌬️",
    age: str(o.age)?.slice(0, 30),
    minutes,
    situation: str(o.situation)?.slice(0, 60),
    forChild: o.forChild === true,
  };
}

export interface ParsedExerciseReply {
  text: string;
  exercises: ExerciseDraft[];
  savedIds: string[];
}

/** Plockar ut övningsblock och förslag på sparade övningar ur Flows svar. */
export function parseExerciseBlocks(content: string): ParsedExerciseReply {
  const exercises: ExerciseDraft[] = [];
  const savedIds: string[] = [];
  const text = content
    .replace(EXERCISE_BLOCK, (_m, body: string) => {
      try {
        const parsed: unknown = JSON.parse(body.trim());
        (Array.isArray(parsed) ? parsed : [parsed]).forEach((p) => {
          const d = toDraft(p);
          if (d) exercises.push(d);
        });
      } catch {
        /* ignoreras */
      }
      return "";
    })
    .replace(SAVED_BLOCK, (_m, body: string) => {
      try {
        const parsed: unknown = JSON.parse(body.trim());
        (Array.isArray(parsed) ? parsed : [parsed]).forEach((p) => {
          const id = p && typeof p === "object" ? str((p as Record<string, unknown>).id) : undefined;
          if (id) savedIds.push(id);
        });
      } catch {
        /* ignoreras */
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, exercises, savedIds };
}

export function draftToSaved(
  draft: ExerciseDraft,
  category: ExerciseCategory,
  childId?: string,
): SavedExercise {
  const { forChild: _f, ...rest } = draft;
  return {
    ...rest,
    id: `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    childId: category === "barn" ? childId : undefined,
    savedAt: new Date().toISOString(),
  };
}

export function durationLabel(minutes?: number): string | null {
  if (!minutes) return null;
  return `ca ${minutes} min`;
}

/** Personlig rubrikrad: "En övning ni sparat för Bianca." */
export function ownerLine(ex: SavedExercise, childName?: string): string {
  if (ex.category !== "barn") return ex.category === "favorit" ? "En av dina favoriter." : "En övning du sparat.";
  if (ex.childId === "all") return "En övning ni sparat för barnen.";
  return childName ? `En övning ni sparat för ${childName}.` : "En övning ni sparat.";
}

/**
 * Kort lista till Flows kontext. Flow får avgöra relevans – vi skickar bara
 * titel, för vem, situation och längd, aldrig hela instruktionerna.
 */
export function savedExercisesContext(
  list: SavedExercise[],
  childName: (id?: string) => string | undefined,
): string {
  if (list.length === 0) return "";
  const rows = list.slice(0, 12).map((e) => {
    const who = e.category === "barn" ? (e.childId === "all" ? "alla barn" : childName(e.childId) ?? "barn") : "användaren";
    return `- id=${e.id} | ${e.icon} ${e.title} | för: ${who}${e.situation ? ` | situation: ${e.situation}` : ""}${e.minutes ? ` | ca ${e.minutes} min` : ""}`;
  });
  return `Sparade övningar i Återhämtningsbiblioteket:\n${rows.join("\n")}`;
}

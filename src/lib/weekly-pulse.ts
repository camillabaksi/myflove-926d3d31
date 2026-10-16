import { z } from "zod";
import { pilotDate } from "@/lib/pilot-statistics";

export const PULSE_QUESTIONS = [
  {
    key: "overview",
    label: "Paceable hjälpte mig att få överblick denna vecka.",
    short: "Överblick",
  },
  {
    key: "relief",
    label: "Paceable minskade min upplevda mentala belastning.",
    short: "Upplevd avlastning",
  },
  {
    key: "burden",
    label: "Att använda Paceable kändes som ytterligare en uppgift.",
    short: "Appen som extra uppgift",
  },
] as const;
export type PulseQuestion = (typeof PULSE_QUESTIONS)[number]["key"];
export type PulseAnswers = Record<PulseQuestion, number>;

/** Monday in Swedish civil time, including Sunday/Monday and DST boundaries. */
export function pulseWeekStart(now: number | string = Date.now()): string {
  const date = new Date(`${pilotDate(now)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

const ownerInput = z.object({ expectedUserId: z.string().uuid() });
export const pulseReadInput = ownerInput;
const baseInput = ownerInput.extend({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const score = z.number().int().min(1).max(5);
export const pulseActionInput = z.discriminatedUnion("action", [
  baseInput.extend({ action: z.literal("open") }),
  baseInput.extend({ action: z.literal("dismiss") }),
  baseInput.extend({
    action: z.literal("submit"),
    revision: z.number().int().min(0),
    consent: z.literal(true),
    overview: score,
    relief: score,
    burden: score,
  }),
  baseInput.extend({ action: z.literal("withdraw"), revision: z.number().int().min(0) }),
]);
export type PulseAction = z.infer<typeof pulseActionInput>;
export type PulseEntry = {
  week_start: string;
  opened_at: string | null;
  dismissed_at: string | null;
  submitted_at: string | null;
  updated_at: string;
  revision: number;
  overview: number | null;
  relief: number | null;
  burden: number | null;
};
export type PulseState = { weekStart: string; entry: PulseEntry | null };

const counts = z.array(z.number().int().nonnegative()).length(5);
export const pulseStatsSchema = z.array(
  z
    .object({
      week_start: z.string(),
      opened: z.number().int().nonnegative(),
      answered: z.number().int().nonnegative(),
      overview_counts: counts,
      relief_counts: counts,
      burden_counts: counts,
    })
    .refine(
      (row) =>
        row.answered <= row.opened &&
        [row.overview_counts, row.relief_counts, row.burden_counts].every(
          (values) => values.reduce((sum, value) => sum + value, 0) === row.answered,
        ),
      "Ofullständigt enkätunderlag.",
    ),
);
export type PulseWeekStats = z.infer<typeof pulseStatsSchema>[number];

/** Median of ordinal answers. Empty evidence remains unknown, not zero. */
export function pulseMedian(distribution: number[]): number | null {
  const total = distribution.reduce((sum, value) => sum + value, 0);
  if (!total) return null;
  function at(position: number) {
    let seen = 0;
    for (let index = 0; index < distribution.length; index++) {
      seen += distribution[index];
      if (seen > position) return index + 1;
    }
    throw new Error("Ogiltig svarsfördelning.");
  }
  return (at(Math.floor((total - 1) / 2)) + at(Math.floor(total / 2))) / 2;
}

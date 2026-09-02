/**
 * Syntetisk exempeldata för investerar-/demokontot.
 *
 * Ren logik utan sidoeffekter: den bygger exakt de värden som redan finns i
 * MyFloves befintliga datamodeller (uppgifter, QuickFlow, rutiner, mående,
 * energi). Ingenting här är riktig användardata och inga hittepå-mått om
 * företaget eller antal användare förekommer.
 */

import type { Task } from "@/hooks/use-data";
import type { QuickflowItem } from "@/lib/quickflow";
import type { PriorityTask } from "@/lib/quickflow-priority";
import type { Routine } from "@/lib/recurrence";
import type { DailyCheckin } from "@/lib/daily-flow";
import type { DayPlan } from "@/lib/day-plan";

/** Nyckel i user_kv som markerar att kontot redan fyllts på. */
export const DEMO_SEED_KEY = "myflove-demo-seeded";

/** Versionsstämpel så att en framtida uppdatering kan köras om medvetet. */
export const DEMO_SEED_VERSION = 1;

export interface DemoSeed {
  /** Nyckel → värde som skrivs till user_kv för demoanvändaren. */
  kv: Record<string, unknown>;
  /** Rader till energy_logs (1–5-skalan, samma som riktiga loggar). */
  energy: Array<{ level: number; logged_at: string; note: string }>;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function at(base: Date, dayOffset: number, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/** Stabila id:n gör seedingen idempotent även om den körs om. */
const id = (slug: string) => `demo-${slug}`;

/**
 * Bygger hela demodagen. `now` skickas in så att data alltid hamnar på
 * "idag" när investeraren loggar in, och så att den går att testa.
 */
export function buildDemoSeed(now: Date = new Date()): DemoSeed {
  const today = iso(now);
  const created = at(now, 0, "07:30").getTime();

  /* QuickFlow – mental inkorg. Inget behöver tid, kategori eller prioritet. */
  const quickflow: QuickflowItem[] = [
    { id: id("qf-mejl"), text: "Svara på viktigt mejl", level: "viktigt", createdAt: created },
    { id: id("qf-tandlakare"), text: "Boka tandläkartid", level: "snabbt", createdAt: created + 1 },
    {
      id: id("qf-presentation"),
      text: "Förbereda presentation",
      level: "viktigt",
      createdAt: created + 2,
    },
    {
      id: id("qf-present"),
      text: "Köpa födelsedagspresent",
      level: "tanke",
      createdAt: created + 3,
    },
    {
      id: id("qf-forsakring"),
      text: "Ring försäkringsbolaget",
      level: "snabbt",
      createdAt: created + 4,
    },
  ];

  /* Prioriteringen Flow föreslår – lugna nivåer, aldrig påhittade deadlines. */
  const priority: PriorityTask[] = [
    {
      id: id("qf-mejl"),
      title: "Svara på viktigt mejl",
      bucket: "nu",
      order: 0,
      why: "Någon väntar på dig – det tar mindre kraft när det är ur vägen.",
      createdAt: created,
    },
    {
      id: id("qf-presentation"),
      title: "Förbereda presentation",
      bucket: "sedan",
      order: 1,
      why: "Kräver fokus. Bäst efter lunch när dagen satt sig.",
      createdAt: created + 2,
    },
    {
      id: id("qf-forsakring"),
      title: "Ring försäkringsbolaget",
      bucket: "om-du-orkar",
      order: 2,
      why: "Kort samtal, men bara om orken finns kvar.",
      createdAt: created + 4,
    },
    {
      id: id("qf-tandlakare"),
      title: "Boka tandläkartid",
      bucket: "kan-vanta",
      order: 3,
      why: "Ingen brådska. Den ligger kvar tills du vill ta den.",
      createdAt: created + 1,
    },
    {
      id: id("qf-present"),
      title: "Köpa födelsedagspresent",
      bucket: "kan-vanta",
      order: 4,
      why: "Fångad så att du slipper bära den i huvudet.",
      createdAt: created + 3,
    },
  ];

  /* Min dag – ett begränsat antal aktiviteter, inte en lång lista. */
  const day: Array<{
    slug: string;
    title: string;
    time: string;
    endTime?: string;
    quickflowId?: string;
    energyImpact?: Task["energyImpact"];
    friction?: Task["friction"];
  }> = [
    { slug: "frukost", title: "Frukost", time: "08:00", energyImpact: "gives" },
    {
      slug: "mejl",
      title: "Svara på viktigt mejl",
      time: "09:00",
      quickflowId: id("qf-mejl"),
      energyImpact: "drains",
      friction: "small",
    },
    { slug: "mote", title: "Möte", time: "10:30", endTime: "11:15", energyImpact: "both" },
    { slug: "lunch", title: "Lunch", time: "12:00", energyImpact: "gives" },
    {
      slug: "presentation",
      title: "Förbereda presentation",
      time: "14:00",
      quickflowId: id("qf-presentation"),
      energyImpact: "drains",
      friction: "medium",
    },
    { slug: "hamta", title: "Hämta barn", time: "17:00", energyImpact: "both" },
  ];

  const tasks: Task[] = day.map((item, index) => ({
    id: id(`task-${item.slug}`),
    title: item.title,
    completed: false,
    createdAt: created + index,
    dueDate: today,
    time: item.time,
    ...(item.endTime ? { endTime: item.endTime } : {}),
    kind: "uppgift" as Task["kind"],
    status: "pagar" as Task["status"],
    area: "vardag" as Task["area"],
    ...(item.quickflowId ? { quickflowId: item.quickflowId } : {}),
    ...(item.energyImpact ? { energyImpact: item.energyImpact } : {}),
    ...(item.friction ? { friction: item.friction } : {}),
  }));

  const dayPlan: DayPlan = {
    day: today,
    intro:
      "Du verkar ha ganska mycket på gång idag. Vi börjar med det viktigaste och tar resten steg för steg.",
    note: "Exempeldag i demokontot.",
    steps: [
      {
        taskId: id("task-mejl"),
        title: "Svara på viktigt mejl",
        estimatedMin: 15,
        why: "Kort och tydligt – bra start på dagen.",
      },
      {
        taskId: id("task-presentation"),
        title: "Förbereda presentation",
        estimatedMin: 45,
        why: "Dagens tyngsta sak. Vi lägger den när du har mest fokus.",
      },
      {
        taskId: id("task-hamta"),
        title: "Hämta barn",
        estimatedMin: 30,
        why: "Fast punkt att planera runt.",
      },
    ],
  };

  /* Hälsa – rutiner och check-ins så att området går att förstå. */
  const routines: Routine[] = [
    {
      id: id("routine-medicin"),
      title: "Ta medicinen",
      time: "07:00",
      enabled: true,
      createdAt: created,
      repeat: "daily",
      startDate: today,
    },
    {
      id: id("routine-vatten"),
      title: "Dricka vatten",
      time: "11:00",
      enabled: true,
      createdAt: created + 1,
      repeat: "daily",
      startDate: today,
    },
    {
      id: id("routine-promenad"),
      title: "Kort promenad",
      time: "16:30",
      enabled: true,
      createdAt: created + 2,
      repeat: "weekdays",
      startDate: today,
    },
    {
      id: id("routine-kvall"),
      title: "Kvällsrutin – lägga undan skärmen",
      time: "21:30",
      enabled: true,
      createdAt: created + 3,
      repeat: "daily",
      startDate: today,
    },
  ];

  /* Mående + energi – flera tidsstämplade observationer, aldrig överskrivning. */
  const moodPoints: Array<{ offset: number; hhmm: string; score: number }> = [
    { offset: -4, hhmm: "08:30", score: 3 },
    { offset: -3, hhmm: "09:00", score: 2 },
    { offset: -2, hhmm: "08:45", score: 4 },
    { offset: -1, hhmm: "09:15", score: 3 },
    { offset: 0, hhmm: "08:15", score: 3 },
  ];

  const moods = moodPoints.map((p, index) => ({
    id: id(`mood-${index}`),
    score: p.score,
    date: at(now, p.offset, p.hhmm).getTime(),
    note: "Exempeldata (demo)",
  }));

  const energyPoints: Array<{ offset: number; hhmm: string; level: number }> = [
    { offset: -4, hhmm: "08:30", level: 3 },
    { offset: -4, hhmm: "15:00", level: 2 },
    { offset: -3, hhmm: "08:30", level: 2 },
    { offset: -3, hhmm: "20:00", level: 3 },
    { offset: -2, hhmm: "09:00", level: 4 },
    { offset: -2, hhmm: "16:00", level: 3 },
    { offset: -1, hhmm: "08:30", level: 3 },
    { offset: -1, hhmm: "19:00", level: 2 },
    // Idag: 6/10 på visningsskalan → 3 på den kanoniska 1–5-skalan.
    { offset: 0, hhmm: "08:15", level: 3 },
  ];

  const energy = energyPoints.map((p) => ({
    level: p.level,
    logged_at: at(now, p.offset, p.hhmm).toISOString(),
    note: "Exempeldata (demo)",
  }));

  const checkins: DailyCheckin[] = [
    { date: today, energy: 3, load: 3, time: "normal", at: at(now, 0, "08:15").getTime() },
    {
      date: iso(at(now, -1, "00:00")),
      energy: 3,
      load: 4,
      time: "lite",
      at: at(now, -1, "08:30").getTime(),
    },
    {
      date: iso(at(now, -2, "00:00")),
      energy: 4,
      load: 2,
      time: "mycket",
      at: at(now, -2, "09:00").getTime(),
    },
  ];

  return {
    kv: {
      "myflove-quickflow": quickflow,
      "myflove-quickflow-priority": priority,
      "myflow-tasks": tasks,
      "myflove-day-plan": dayPlan,
      "myflove-routines": routines,
      "myflow-moods": moods,
      "myflove-daily-checkin": checkins,
    },
    energy,
  };
}

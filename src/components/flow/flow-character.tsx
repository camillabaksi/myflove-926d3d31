import { useMemo } from "react";
import { FlowMascot, type FlowMood } from "@/components/flow-mascot";
import { cn } from "@/lib/utils";
import {
  BedFrame,
  Battery,
  Bolt,
  BreathRing,
  Bus,
  Car,
  ChefHat,
  Confetti,
  Cushion,
  Glasses,
  Laptop,
  Mug,
  OpenBook,
  Pan,
  RainDrops,
  Stars,
  Steam,
  Umbrella,
  Vacuum,
  Zzz,
} from "@/components/flow/flow-props";

/**
 * Flow Character – ren presentationslogik.
 *
 * Väljer pose, rekvisita och animation utifrån den situation som
 * MyFloves befintliga Flow-motor redan räknat fram. Komponenten äger
 * ingen data och påverkar inte appens kärnlogik.
 *
 * Scenen är en kvadrat runt maskoten; all rekvisita placeras i procent
 * så att den skalar med Flow på alla skärmstorlekar.
 */

export type FlowScene =
  | "hello"
  | "rain"
  | "sleep"
  | "break"
  | "study"
  | "work"
  | "clean"
  | "cook"
  | "travel"
  | "shopping"
  | "walk"
  | "kids"
  | "energyHigh"
  | "energyLow"
  | "mood"
  | "done"
  | "rest"
  | "think";

type SceneContext = { energy: number };

type Variant = {
  mood: FlowMood;
  /** Extra klasser på själva maskoten, t.ex. lutning när Flow ligger ner. */
  mascotClass?: string;
  /** Rekvisita bakom Flow. */
  back?: (ctx: SceneContext) => React.ReactNode;
  /** Rekvisita framför Flow. */
  front?: (ctx: SceneContext) => React.ReactNode;
};

/* Genvägar för vanliga placeringar (procent av scenen). */
const p = (css: string) => cn("pointer-events-none absolute", css);

/** Två–tre varianter per situation – Flow gör inte exakt samma sak varje gång. */
const SCENES: Record<FlowScene, Variant[]> = {
  hello: [
    {
      mood: "wave",
      front: () => (
        <span className={p("right-[6%] top-[8%] text-3xl floaty")} aria-hidden>
          💜
        </span>
      ),
    },
    {
      mood: "bounce",
      front: () => (
        <span className={p("left-[8%] top-[12%] text-3xl floaty")} aria-hidden>
          ✨
        </span>
      ),
    },
  ],

  rain: [
    {
      mood: "sway",
      back: () => (
        <>
          <RainDrops />
          <Umbrella className={p("left-1/2 top-[0%] h-[42%] w-auto -translate-x-1/2 flow-sway")} />
        </>
      ),
    },
    {
      mood: "nod",
      back: () => (
        <>
          <RainDrops count={5} />
          <Umbrella className={p("left-[6%] top-[1%] h-[40%] w-auto -rotate-12 floaty")} />
        </>
      ),
    },
  ],

  sleep: [
    {
      mood: "calm",
      mascotClass: "rotate-[74deg] translate-y-[6%]",
      back: () => <BedFrame className={p("bottom-[4%] left-1/2 w-[96%] -translate-x-1/2")} />,
      front: () => <Zzz className="right-[14%] top-[14%] h-16 w-16" />,
    },
    {
      mood: "calm",
      mascotClass: "-rotate-[72deg] translate-y-[6%]",
      back: () => <BedFrame className={p("bottom-[4%] left-1/2 w-[96%] -translate-x-1/2 -scale-x-100")} />,
      front: () => (
        <>
          <Zzz className="left-[12%] top-[16%] h-16 w-16" />
          <span className={p("right-[10%] top-[8%] text-2xl floaty")} aria-hidden>
            🌙
          </span>
        </>
      ),
    },
  ],

  break: [
    {
      mood: "calm",
      front: () => (
        <>
          <Mug className={p("bottom-[8%] right-[0%] h-[26%] w-auto")} />
          <Steam className="bottom-[32%] right-[7%]" />
        </>
      ),
    },
    {
      mood: "float",
      front: () => (
        <>
          <Mug className={p("bottom-[8%] left-[0%] h-[26%] w-auto")} />
          <Steam className="bottom-[32%] left-[7%]" />
        </>
      ),
    },
  ],

  study: [
    {
      mood: "nod",
      front: () => <OpenBook className={p("bottom-[6%] left-1/2 w-[56%] -translate-x-1/2")} />,
    },
    {
      mood: "think",
      front: () => (
        <>
          <OpenBook className={p("bottom-[6%] left-1/2 w-[54%] -translate-x-1/2 -rotate-3")} />
          <Glasses className={p("left-1/2 top-[34%] w-[34%] -translate-x-1/2")} />
        </>
      ),
    },
  ],

  work: [
    {
      mood: "nod",
      front: () => <Laptop className={p("bottom-[6%] left-1/2 w-[54%] -translate-x-1/2")} />,
    },
    {
      mood: "think",
      front: () => (
        <>
          <Laptop className={p("bottom-[6%] left-1/2 w-[54%] -translate-x-1/2")} />
          <span className={p("right-[10%] top-[10%] text-2xl floaty")} aria-hidden>
            💭
          </span>
        </>
      ),
    },
  ],

  clean: [
    {
      mood: "sway",
      front: () => <Vacuum className={p("bottom-[6%] right-[-2%] h-[50%] w-auto flow-wiggle")} />,
    },
    {
      mood: "bounce",
      front: () => (
        <>
          <Vacuum className={p("bottom-[6%] left-[-2%] h-[48%] w-auto -scale-x-100 flow-wiggle")} />
          <span className={p("right-[12%] top-[16%] text-2xl floaty")} aria-hidden>
            ✨
          </span>
        </>
      ),
    },
  ],

  cook: [
    {
      mood: "sway",
      back: () => <ChefHat className={p("left-1/2 top-[6%] w-[36%] -translate-x-1/2")} />,
      front: () => (
        <>
          <Pan className={p("bottom-[8%] right-[-4%] w-[44%] flow-wiggle")} />
          <Steam className="bottom-[26%] right-[24%]" />
        </>
      ),
    },
    {
      mood: "nod",
      back: () => <ChefHat className={p("left-[32%] top-[7%] w-[34%] -rotate-6")} />,
      front: () => <Pan className={p("bottom-[8%] left-[-4%] w-[44%] -scale-x-100 flow-wiggle")} />,
    },
  ],

  travel: [
    {
      mood: "sway",
      front: () => <Car className={p("bottom-[2%] left-1/2 w-[92%] -translate-x-1/2 flow-drive")} />,
    },
    {
      mood: "float",
      front: () => <Bus className={p("bottom-[2%] left-1/2 w-[94%] -translate-x-1/2 flow-drive")} />,
    },
  ],

  shopping: [
    {
      mood: "sway",
      front: () => (
        <span className={p("bottom-[8%] right-[8%] text-6xl flow-wiggle")} aria-hidden>
          🛍️
        </span>
      ),
    },
    {
      mood: "bounce",
      front: () => (
        <span className={p("bottom-[6%] left-[6%] text-6xl flow-wiggle")} aria-hidden>
          🛒
        </span>
      ),
    },
  ],

  walk: [
    {
      mood: "sway",
      front: () => (
        <span className={p("bottom-[8%] right-[8%] text-5xl floaty")} aria-hidden>
          👟
        </span>
      ),
    },
    {
      mood: "bounce",
      front: () => (
        <span className={p("bottom-[8%] left-[8%] text-5xl floaty")} aria-hidden>
          🌳
        </span>
      ),
    },
  ],

  kids: [
    {
      mood: "wave",
      front: () => (
        <span className={p("bottom-[8%] right-[8%] text-5xl floaty")} aria-hidden>
          🎒
        </span>
      ),
    },
    {
      mood: "bounce",
      front: () => (
        <span className={p("bottom-[8%] left-[8%] text-5xl floaty")} aria-hidden>
          🧸
        </span>
      ),
    },
  ],

  energyHigh: [
    {
      mood: "cheer",
      back: () => <Stars />,
      front: ({ energy }) => (
        <>
          <Battery level={Math.max(70, energy)} className={p("bottom-[6%] right-[-2%] h-[52%] w-auto")} />
          <Bolt className={p("right-[7%] bottom-[30%] h-[18%] w-auto flow-pulse")} />
        </>
      ),
    },
    {
      mood: "bounce",
      back: () => <Confetti count={8} />,
      front: ({ energy }) => (
        <Battery level={Math.max(70, energy)} className={p("bottom-[6%] left-[-2%] h-[52%] w-auto")} />
      ),
    },
  ],

  energyLow: [
    {
      mood: "calm",
      mascotClass: "-rotate-6",
      front: ({ energy }) => (
        <>
          <Battery level={Math.min(30, energy)} className={p("bottom-[6%] right-[-2%] h-[52%] w-auto")} />
          <Zzz className="left-[14%] top-[18%] h-14 w-14" />
        </>
      ),
    },
    {
      mood: "calm",
      mascotClass: "rotate-6",
      front: ({ energy }) => (
        <>
          <Battery level={Math.min(30, energy)} className={p("bottom-[6%] left-[-2%] h-[50%] w-auto")} />
          <Mug className={p("bottom-[8%] right-[0%] h-[22%] w-auto")} />
        </>
      ),
    },
  ],

  mood: [
    {
      mood: "pulse",
      front: () => (
        <span className={p("right-[10%] top-[12%] text-3xl floaty")} aria-hidden>
          ❤️
        </span>
      ),
    },
    {
      mood: "float",
      front: () => (
        <span className={p("left-[10%] top-[14%] text-3xl floaty")} aria-hidden>
          💜
        </span>
      ),
    },
  ],

  done: [
    {
      mood: "cheer",
      back: () => (
        <>
          <Confetti />
          <Stars />
        </>
      ),
      front: () => <Stars className="scale-125" />,
    },
    {
      mood: "bounce",
      back: () => <Confetti count={16} />,
      front: () => (
        <span className={p("bottom-[8%] left-[8%] text-5xl flow-bounce")} aria-hidden>
          🏆
        </span>
      ),
    },
  ],

  rest: [
    {
      mood: "calm",
      back: () => (
        <>
          <BreathRing className="left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2" />
          <Cushion className={p("bottom-[2%] left-1/2 w-[90%] -translate-x-1/2")} />
        </>
      ),
    },
    {
      mood: "calm",
      back: () => (
        <>
          <BreathRing className="left-1/2 top-1/2 h-[100%] w-[100%] -translate-x-1/2 -translate-y-1/2" />
          <Cushion className={p("bottom-[2%] left-1/2 w-[84%] -translate-x-1/2")} />
        </>
      ),
      front: () => (
        <span className={p("right-[12%] top-[14%] text-2xl floaty")} aria-hidden>
          🌱
        </span>
      ),
    },
  ],

  think: [
    {
      mood: "think",
      front: () => (
        <span className={p("right-[12%] top-[10%] text-3xl floaty")} aria-hidden>
          💭
        </span>
      ),
    },
    {
      mood: "nod",
      front: () => (
        <span className={p("left-[12%] top-[12%] text-3xl floaty")} aria-hidden>
          🎯
        </span>
      ),
    },
  ],
};

export function FlowCharacter({
  scene,
  /** Byt värde för att välja variant (t.ex. slide-index) – deterministiskt. */
  seed = 0,
  /** Batterinivå 0–100, används av energiscenerna. */
  energy = 50,
  className,
}: {
  scene: FlowScene;
  seed?: number;
  energy?: number;
  className?: string;
}) {
  const list = SCENES[scene] ?? SCENES.hello;
  const index = Math.abs(Math.round(seed)) % list.length;
  const variant = useMemo(() => list[index], [list, index]);
  const ctx: SceneContext = { energy };

  return (
    <div
      data-flow-character
      data-flow-scene={scene}
      data-flow-variant={index}
      className={cn("flex w-full items-end justify-center", className)}
    >
      <div className="relative aspect-square h-[33svh] max-h-[300px] min-h-[170px]">
        {variant.back?.(ctx)}

        <FlowMascot
          size="xl"
          glow
          mood={variant.mood}
          className={cn("absolute inset-0 flex items-center justify-center", variant.mascotClass)}
          imgClassName="h-[126%] w-auto max-w-none"
        />

        {variant.front?.(ctx)}
      </div>
    </div>
  );
}

/** Väljer situation utifrån en uppgiftstitel – bara befintlig data. */
export function sceneForTask(title?: string | null): FlowScene {
  const t = (title ?? "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has("plugg", "läs", "studie", "tenta", "prov", "quiz")) return "study";
  if (has("jobb", "möte", "mail", "mejl", "rapport")) return "work";
  if (has("städ", "damms", "disk", "tvätt")) return "clean";
  if (has("laga", "mat", "middag", "frukost", "lunch")) return "cook";
  if (has("handla", "inköp", "affär", "shop")) return "shopping";
  if (has("promenad", "gå ut", "träna", "löp", "gym")) return "walk";
  if (has("barn", "lämna", "hämta", "förskola", "skolan")) return "kids";
  if (has("res", "buss", "tåg", "bil", "kör")) return "travel";
  if (has("sov", "vila", "lägg dig")) return "sleep";
  if (has("paus", "fika", "kaffe")) return "break";
  return "think";
}

/** Regn/snö-koder från väderdatan som redan finns i appen. */
export function isWetWeather(code: number | undefined | null): boolean {
  if (code == null) return false;
  return (
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 86) ||
    code >= 95
  );
}

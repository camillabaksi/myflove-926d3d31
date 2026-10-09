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
  LaundryBasket,
  PillBottle,
  RainDrops,
  Stars,
  Steam,
  Sun,
  Sunglasses,
  Umbrella,
  Vacuum,
  WaterGlass,
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
  | "sun"
  | "medicine"
  | "water"
  | "laundry"
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

type SceneContext = { energy: number; kids: number; rain: boolean };

/** Små Flow-kompisar bredvid Flow – ett per barn (max 3 i bild). */
function MiniFlows({ count, rain }: { count: number; rain?: boolean }) {
  const shown = Math.max(1, Math.min(3, count));
  return (
    <div
      data-flow-prop="miniFlows"
      data-flow-kids={shown}
      className="pointer-events-none absolute bottom-[2%] right-[-4%] flex items-end gap-1"
      aria-hidden
    >
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} className="relative">
          {rain && (
            <Umbrella className="absolute -top-[38%] left-1/2 h-6 w-auto -translate-x-1/2 flow-sway" />
          )}
          <FlowMascot size="xs" mood={i % 2 === 0 ? "bounce" : "sway"} imgClassName="h-10 w-auto" />
        </span>
      ))}
    </div>
  );
}

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

  sun: [
    {
      mood: "bounce",
      back: () => <Sun className={p("right-[4%] top-[2%] h-[26%] w-auto flow-pulse")} />,
      front: () => <Sunglasses className={p("left-1/2 top-[36%] w-[38%] -translate-x-1/2")} />,
    },
    {
      mood: "cheer",
      back: () => <Sun className={p("left-[4%] top-[2%] h-[24%] w-auto flow-pulse")} />,
      front: () => (
        <Sunglasses className={p("left-1/2 top-[35%] w-[36%] -translate-x-1/2 -rotate-3")} />
      ),
    },
  ],

  medicine: [
    {
      mood: "nod",
      front: () => <PillBottle className={p("bottom-[8%] right-[-2%] h-[42%] w-auto floaty")} />,
    },
    {
      mood: "calm",
      front: () => <PillBottle className={p("bottom-[8%] left-[-2%] h-[40%] w-auto floaty")} />,
    },
  ],

  water: [
    {
      mood: "nod",
      front: () => <WaterGlass className={p("bottom-[8%] right-[2%] h-[34%] w-auto floaty")} />,
    },
    {
      mood: "float",
      front: () => <WaterGlass className={p("bottom-[8%] left-[2%] h-[32%] w-auto floaty")} />,
    },
  ],

  laundry: [
    {
      mood: "sway",
      front: () => <LaundryBasket className={p("bottom-[4%] left-1/2 w-[58%] -translate-x-1/2")} />,
    },
    {
      mood: "nod",
      front: () => (
        <>
          <LaundryBasket className={p("bottom-[4%] right-[0%] w-[52%]")} />
          <span className={p("left-[10%] top-[16%] text-2xl floaty")} aria-hidden>
            🧺
          </span>
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
      back: () => (
        <BedFrame className={p("bottom-[4%] left-1/2 w-[96%] -translate-x-1/2 -scale-x-100")} />
      ),
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
      front: () => (
        <Car className={p("bottom-[2%] left-1/2 w-[92%] -translate-x-1/2 flow-drive")} />
      ),
    },
    {
      mood: "float",
      front: () => (
        <Bus className={p("bottom-[2%] left-1/2 w-[94%] -translate-x-1/2 flow-drive")} />
      ),
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
      back: ({ rain }) => (rain ? <RainDrops count={5} /> : null),
      front: ({ kids, rain }) => (
        <>
          {rain && (
            <Umbrella className={p("left-[6%] top-[0%] h-[38%] w-auto -rotate-12 flow-sway")} />
          )}
          <MiniFlows count={kids} rain={rain} />
        </>
      ),
    },
    {
      mood: "bounce",
      back: ({ rain }) => (rain ? <RainDrops count={5} /> : null),
      front: ({ kids, rain }) => (
        <>
          <span className={p("left-[6%] bottom-[10%] text-4xl floaty")} aria-hidden>
            🎒
          </span>
          <MiniFlows count={kids} rain={rain} />
        </>
      ),
    },
  ],

  energyHigh: [
    {
      mood: "cheer",
      back: () => <Stars />,
      front: ({ energy }) => (
        <>
          <Battery
            level={Math.max(70, energy)}
            className={p("bottom-[6%] right-[-2%] h-[52%] w-auto")}
          />
          <Bolt className={p("right-[7%] bottom-[30%] h-[18%] w-auto flow-pulse")} />
        </>
      ),
    },
    {
      mood: "bounce",
      back: () => <Confetti count={8} />,
      front: ({ energy }) => (
        <Battery
          level={Math.max(70, energy)}
          className={p("bottom-[6%] left-[-2%] h-[52%] w-auto")}
        />
      ),
    },
  ],

  energyLow: [
    {
      mood: "calm",
      mascotClass: "-rotate-6",
      front: ({ energy }) => (
        <>
          <Battery
            level={Math.min(30, energy)}
            className={p("bottom-[6%] right-[-2%] h-[52%] w-auto")}
          />
          <Zzz className="left-[14%] top-[18%] h-14 w-14" />
        </>
      ),
    },
    {
      mood: "calm",
      mascotClass: "rotate-6",
      front: ({ energy }) => (
        <>
          <Battery
            level={Math.min(30, energy)}
            className={p("bottom-[6%] left-[-2%] h-[50%] w-auto")}
          />
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

/** Scenens storlek: "hero" = Flow är huvudfokus (~25 % av skärmen), "inline" = del av ett kort, "compact" = balanserad för karusell. */
export type FlowStage = "hero" | "compact" | "inline" | "mini";

const STAGE_CLASS: Record<FlowStage, string> = {
  hero: "h-[27svh] max-h-[260px] min-h-[168px]",
  compact: "h-[18svh] max-h-[168px] min-h-[112px]",
  inline: "h-[15svh] max-h-[128px] min-h-[96px]",
  mini: "h-[80px] min-h-[80px] max-h-[80px]",
};

export function FlowCharacter({
  scene,
  /** Byt värde för att välja variant (t.ex. slide-index) – deterministiskt. */
  seed = 0,
  /** Batterinivå 0–100, används av energiscenerna. */
  energy = 50,
  /** Antal barn – används av barnscenen. */
  kids = 0,
  /** Regn just nu – kombineras med t.ex. barnscenen. */
  rain = false,
  stage = "hero",
  className,
  alt,
}: {
  scene: FlowScene;
  alt?: string;
  seed?: number;
  energy?: number;
  kids?: number;
  rain?: boolean;
  stage?: FlowStage;
  className?: string;
}) {
  const list = SCENES[scene] ?? SCENES.hello;
  const index = Math.abs(Math.round(seed)) % list.length;
  const variant = useMemo(() => list[index], [list, index]);
  const ctx: SceneContext = { energy, kids, rain };
  const isMini = stage === "mini";

  return (
    <div
      data-flow-character
      hidden
      aria-hidden="true"
      data-flow-scene={scene}
      data-flow-variant={index}
      data-flow-stage={stage}
      className={cn(
        "hidden",
        stage === "mini" ? "w-[80px] max-w-[80px] shrink-0" : "w-full",
        className,
      )}
    >
      <div className={cn("relative aspect-square shrink-0 overflow-hidden", STAGE_CLASS[stage])}>
        {!isMini && variant.back?.(ctx)}

        <FlowMascot
          alt={alt}
          size={isMini ? "sm" : stage === "compact" ? "md" : "xl"}
          glow
          mood={variant.mood}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            stage === "compact" && "p-1",
            variant.mascotClass,
          )}
          imgClassName={
            isMini
              ? "h-[68px] w-[68px] max-w-none object-contain"
              : stage === "inline" || stage === "compact"
                ? "h-full max-h-full w-full object-contain"
                : "h-[108%] w-auto max-w-none"
          }
        />

        {!isMini && variant.front?.(ctx)}
      </div>
    </div>
  );
}

// Scen- och väderlogiken bor i src/components/flow/scenes.ts (ren hjälpmodul).

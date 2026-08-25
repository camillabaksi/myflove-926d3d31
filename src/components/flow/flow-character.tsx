import { useMemo } from "react";
import { FlowMascot, type FlowMood } from "@/components/flow-mascot";
import { cn } from "@/lib/utils";

/**
 * Flow Character – ren presentationslogik.
 *
 * Väljer pose, rekvisita och animation utifrån den situation som
 * MyFloves befintliga Flow-motor redan räknat fram. Komponenten äger
 * ingen data och påverkar inte appens kärnlogik.
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

type Variant = {
  /** Liten rekvisita bredvid Flow. */
  prop: string;
  mood: FlowMood;
  /** Extra små tecken som svävar runt Flow. */
  sparkles?: string[];
};

/** Ett litet antal alternativ per situation – Flow ska kunna överraska. */
const SCENES: Record<FlowScene, Variant[]> = {
  hello: [
    { prop: "💜", mood: "wave", sparkles: ["✨", "✨"] },
    { prop: "👋", mood: "bounce", sparkles: ["✨"] },
  ],
  rain: [
    { prop: "☔", mood: "sway", sparkles: ["💧", "💧", "💧"] },
    { prop: "🧥", mood: "nod", sparkles: ["💧", "💧"] },
    { prop: "🌧️", mood: "bounce", sparkles: ["💧"] },
  ],
  sleep: [
    { prop: "🛏️", mood: "calm", sparkles: ["💤"] },
    { prop: "🌙", mood: "calm", sparkles: ["💤", "💤"] },
  ],
  break: [
    { prop: "☕", mood: "calm", sparkles: ["♨️"] },
    { prop: "🍵", mood: "float", sparkles: ["♨️"] },
  ],
  study: [
    { prop: "📚", mood: "nod" },
    { prop: "✏️", mood: "think" },
    { prop: "🤓", mood: "float" },
  ],
  work: [
    { prop: "💻", mood: "nod" },
    { prop: "🗂️", mood: "think" },
  ],
  clean: [
    { prop: "🧹", mood: "sway" },
    { prop: "🧽", mood: "bounce" },
  ],
  cook: [
    { prop: "🍳", mood: "sway", sparkles: ["♨️"] },
    { prop: "👨‍🍳", mood: "nod", sparkles: ["♨️"] },
  ],
  travel: [
    { prop: "🚗", mood: "sway" },
    { prop: "🚌", mood: "float" },
  ],
  shopping: [
    { prop: "🛍️", mood: "sway" },
    { prop: "🛒", mood: "bounce" },
  ],
  walk: [
    { prop: "🚶", mood: "sway" },
    { prop: "💧", mood: "bounce" },
  ],
  kids: [
    { prop: "🎒", mood: "wave" },
    { prop: "🧸", mood: "bounce" },
  ],
  energyHigh: [
    { prop: "⚡", mood: "bounce", sparkles: ["⭐", "✨", "⭐"] },
    { prop: "🎶", mood: "cheer", sparkles: ["✨", "⭐"] },
  ],
  energyLow: [
    { prop: "🔋", mood: "calm", sparkles: ["💤"] },
    { prop: "🫖", mood: "calm" },
  ],
  mood: [
    { prop: "❤️", mood: "pulse", sparkles: ["💜"] },
    { prop: "💜", mood: "float", sparkles: ["❤️"] },
  ],
  done: [
    { prop: "🎉", mood: "cheer", sparkles: ["⭐", "✨", "🎊"] },
    { prop: "🏆", mood: "bounce", sparkles: ["✨", "⭐"] },
  ],
  rest: [
    { prop: "🧘", mood: "calm", sparkles: ["✨"] },
    { prop: "🌱", mood: "calm" },
  ],
  think: [
    { prop: "💭", mood: "think" },
    { prop: "🎯", mood: "nod" },
  ],
};

/** Positioner för de små tecknen som svävar runt Flow. */
const SPARKLE_SPOTS = [
  "left-1 top-4",
  "right-2 top-8",
  "right-4 bottom-10",
  "left-3 bottom-6",
];

export function FlowCharacter({
  scene,
  /** Byt värde för att slumpa fram en ny pose (t.ex. slide-index). */
  seed = 0,
  className,
}: {
  scene: FlowScene;
  seed?: number;
  className?: string;
}) {
  const variant = useMemo(() => {
    const list = SCENES[scene] ?? SCENES.hello;
    const roll = Math.floor(Math.random() * list.length) + seed;
    return list[Math.abs(roll) % list.length];
  }, [scene, seed]);

  return (
    <div
      data-flow-character
      data-flow-scene={scene}
      className={cn(
        "relative flex h-[34svh] max-h-[300px] min-h-[150px] w-full items-center justify-center",
        className,
      )}
    >
      {variant.sparkles?.map((s, i) => (
        <span
          key={`${s}-${i}`}
          aria-hidden
          className={cn(
            "pointer-events-none absolute text-lg opacity-80 floaty",
            SPARKLE_SPOTS[i % SPARKLE_SPOTS.length],
          )}
          style={{ animationDelay: `${i * 0.6}s` }}
        >
          {s}
        </span>
      ))}

      <FlowMascot
        size="xl"
        glow
        mood={variant.mood}
        imgClassName="h-[34svh] max-h-[300px] min-h-[150px] w-auto"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute right-[18%] bottom-[10%] text-3xl drop-shadow-sm flow-bounce"
      >
        {variant.prop}
      </span>
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

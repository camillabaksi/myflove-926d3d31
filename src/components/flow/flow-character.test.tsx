import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FlowCharacter, sceneForTask, type FlowScene } from "@/components/flow/flow-character";

/**
 * Verifierar att Flow alltid visar EXAKT ett state åt gången
 * och att varje kontext får rätt rekvisita och pose – på mobilbredd.
 */

/** Rekvisita som måste finnas + tillåtna poser, per situation. */
const EXPECTED: Record<
  FlowScene,
  { props: string[][]; moods: string[] }
> = {
  hello: { props: [[], []], moods: ["wave", "bounce"] },
  rain: { props: [["umbrella", "rainDrops"], ["umbrella", "rainDrops"]], moods: ["sway", "nod"] },
  sleep: { props: [["bedFrame", "zzz"], ["bedFrame", "zzz"]], moods: ["calm"] },
  break: { props: [["mug", "steam"], ["mug", "steam"]], moods: ["calm", "float"] },
  study: { props: [["openBook"], ["openBook", "glasses"]], moods: ["nod", "think"] },
  work: { props: [["laptop"], ["laptop"]], moods: ["nod", "think"] },
  clean: { props: [["vacuum"], ["vacuum"]], moods: ["sway", "bounce"] },
  cook: { props: [["chefHat", "pan"], ["chefHat", "pan"]], moods: ["sway", "nod"] },
  travel: { props: [["car"], ["bus"]], moods: ["sway", "float"] },
  shopping: { props: [[], []], moods: ["sway", "bounce"] },
  walk: { props: [[], []], moods: ["sway", "bounce"] },
  kids: { props: [[], []], moods: ["wave", "bounce"] },
  energyHigh: { props: [["battery", "bolt", "stars"], ["battery", "confetti"]], moods: ["cheer", "bounce"] },
  energyLow: { props: [["battery", "zzz"], ["battery", "mug"]], moods: ["calm"] },
  mood: { props: [[], []], moods: ["pulse", "float"] },
  done: { props: [["confetti", "stars"], ["confetti"]], moods: ["cheer", "bounce"] },
  rest: { props: [["breathRing", "cushion"], ["breathRing", "cushion"]], moods: ["calm"] },
  think: { props: [[], []], moods: ["think", "nod"] },
};

const SCENES = Object.keys(EXPECTED) as FlowScene[];

describe("FlowCharacter – ett state i taget", () => {
  it.each(SCENES)("scen %s renderar exakt en karaktär och en maskot", (scene) => {
    const { container } = render(<FlowCharacter scene={scene} />);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-flow-mascot]")).toHaveLength(1);
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute("data-flow-scene", scene);
  });

  it("visar aldrig två scener samtidigt när scenen byts", () => {
    const { container, rerender } = render(<FlowCharacter scene="rain" />);
    rerender(<FlowCharacter scene="work" />);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute("data-flow-scene", "work");
    expect(container.querySelector('[data-flow-prop="umbrella"]')).toBeNull();
    expect(container.querySelector('[data-flow-prop="laptop"]')).not.toBeNull();
  });
});

describe("FlowCharacter – rätt rekvisita och pose per kontext", () => {
  for (const scene of SCENES) {
    const spec = EXPECTED[scene];
    for (const seed of [0, 1]) {
      it(`${scene} (variant ${seed}) visar rätt prop och pose`, () => {
        const { container } = render(<FlowCharacter scene={scene} seed={seed} energy={50} />);
        const root = container.querySelector("[data-flow-character]")!;
        expect(root.getAttribute("data-flow-variant")).toBe(String(seed % spec.props.length));

        for (const propName of spec.props[seed % spec.props.length]) {
          expect(
            root.querySelectorAll(`[data-flow-prop="${propName}"]`).length,
            `saknar rekvisita ${propName} i scen ${scene}`,
          ).toBeGreaterThan(0);
        }

        const mood = container.querySelector("[data-flow-mascot]")!.getAttribute("data-flow-mood");
        expect(spec.moods, `oväntad pose ${mood} i scen ${scene}`).toContain(mood);
      });
    }
  }

  it("håller sig inom mobilscenen (33svh, kvadratisk)", () => {
    const { container } = render(<FlowCharacter scene="rain" />);
    const stage = container.querySelector("[data-flow-character] > div")!;
    expect(stage.className).toContain("aspect-square");
    expect(stage.className).toContain("h-[33svh]");
  });
});

describe("sceneForTask", () => {
  it.each([
    ["Plugga inför tentan", "study"],
    ["Skicka mejl till chefen", "work"],
    ["Dammsuga vardagsrummet", "clean"],
    ["Laga middag", "cook"],
    ["Handla mjölk", "shopping"],
    ["Ta en promenad", "walk"],
    ["Hämta barnen", "kids"],
    ["Kör till stan", "travel"],
    ["Sova middag", "sleep"],
    ["Fika med Anna", "break"],
    ["Något helt annat", "think"],
  ])("%s → %s", (title, expected) => {
    expect(sceneForTask(title)).toBe(expected);
  });
});

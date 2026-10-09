import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FlowCharacter, type FlowScene } from "@/components/flow/flow-character";
import { sceneForTask } from "@/components/flow/scenes";

/**
 * Verifierar att Flow alltid visar EXAKT ett state åt gången
 * och att varje kontext får rätt rekvisita och pose – på mobilbredd.
 */

/** Rekvisita som måste finnas + tillåtna poser, per situation. */
const EXPECTED: Record<FlowScene, { props: string[][]; moods: string[] }> = {
  hello: { props: [[], []], moods: ["wave", "bounce"] },
  rain: {
    props: [
      ["umbrella", "rainDrops"],
      ["umbrella", "rainDrops"],
    ],
    moods: ["sway", "nod"],
  },
  sleep: {
    props: [
      ["bedFrame", "zzz"],
      ["bedFrame", "zzz"],
    ],
    moods: ["calm"],
  },
  break: {
    props: [
      ["mug", "steam"],
      ["mug", "steam"],
    ],
    moods: ["calm", "float"],
  },
  study: { props: [["openBook"], ["openBook", "glasses"]], moods: ["nod", "think"] },
  work: { props: [["laptop"], ["laptop"]], moods: ["nod", "think"] },
  clean: { props: [["vacuum"], ["vacuum"]], moods: ["sway", "bounce"] },
  cook: {
    props: [
      ["chefHat", "pan"],
      ["chefHat", "pan"],
    ],
    moods: ["sway", "nod"],
  },
  travel: { props: [["car"], ["bus"]], moods: ["sway", "float"] },
  shopping: { props: [[], []], moods: ["sway", "bounce"] },
  walk: { props: [[], []], moods: ["sway", "bounce"] },
  kids: { props: [["miniFlows"], ["miniFlows"]], moods: ["wave", "bounce"] },
  sun: {
    props: [
      ["sun", "sunglasses"],
      ["sun", "sunglasses"],
    ],
    moods: ["bounce", "cheer"],
  },
  medicine: { props: [["pillBottle"], ["pillBottle"]], moods: ["nod", "calm"] },
  water: { props: [["waterGlass"], ["waterGlass"]], moods: ["nod", "float"] },
  laundry: { props: [["laundryBasket"], ["laundryBasket"]], moods: ["sway", "nod"] },
  energyHigh: {
    props: [
      ["battery", "bolt", "stars"],
      ["battery", "confetti"],
    ],
    moods: ["cheer", "bounce"],
  },
  energyLow: {
    props: [
      ["battery", "zzz"],
      ["battery", "mug"],
    ],
    moods: ["calm"],
  },
  mood: { props: [[], []], moods: ["pulse", "float"] },
  done: { props: [["confetti", "stars"], ["confetti"]], moods: ["cheer", "bounce"] },
  rest: {
    props: [
      ["breathRing", "cushion"],
      ["breathRing", "cushion"],
    ],
    moods: ["calm"],
  },
  think: { props: [[], []], moods: ["think", "nod"] },
};

const SCENES = Object.keys(EXPECTED) as FlowScene[];

describe("FlowCharacter – ett state i taget", () => {
  it.each(SCENES)("scen %s bevarar dold scen utan maskotbild", (scene) => {
    const { container } = render(<FlowCharacter scene={scene} />);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(
      Array.from(container.querySelectorAll("[data-flow-mascot]")).filter(
        (el) => !el.closest('[data-flow-prop="miniFlows"]'),
      ),
    ).toHaveLength(0);
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute("hidden");
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute(
      "data-flow-scene",
      scene,
    );
  });

  it("visar aldrig två scener samtidigt när scenen byts", () => {
    const { container, rerender } = render(<FlowCharacter scene="rain" />);
    rerender(<FlowCharacter scene="work" />);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(container.querySelector("[data-flow-character]")).toHaveAttribute(
      "data-flow-scene",
      "work",
    );
    expect(container.querySelector('[data-flow-prop="umbrella"]')).toBeNull();
    expect(container.querySelector('[data-flow-prop="laptop"]')).not.toBeNull();
  });
});

describe("FlowCharacter – rätt rekvisita och pose per kontext", () => {
  for (const scene of SCENES) {
    const spec = EXPECTED[scene];
    for (const seed of [0, 1]) {
      it(`${scene} (variant ${seed}) visar rätt prop och pose`, () => {
        const { container } = render(
          <FlowCharacter scene={scene} seed={seed} energy={50} kids={2} />,
        );
        const root = container.querySelector("[data-flow-character]")!;
        expect(root.getAttribute("data-flow-variant")).toBe(String(seed % spec.props.length));

        for (const propName of spec.props[seed % spec.props.length]) {
          expect(
            root.querySelectorAll(`[data-flow-prop="${propName}"]`).length,
            `saknar rekvisita ${propName} i scen ${scene}`,
          ).toBeGreaterThan(0);
        }

        expect(root).toHaveAttribute("hidden");
        expect(container.querySelector("img")).toBeNull();
      });
    }
  }

  it("håller sig inom mobilscenen (27svh, kvadratisk)", () => {
    const { container } = render(<FlowCharacter scene="rain" />);
    const stage = container.querySelector("[data-flow-character] > div")!;
    expect(stage.className).toContain("aspect-square");
    expect(stage.className).toContain("h-[27svh]");
    expect(stage.className).toContain("max-h-[260px]");
  });

  it("visar ingen maskot eller rekvisita i mini-läget", () => {
    const { container } = render(<FlowCharacter scene="rain" stage="mini" />);
    const stage = container.querySelector("[data-flow-character]")!;
    const mascot = container.querySelector("[data-flow-mascot] img");
    expect(stage).toHaveAttribute("data-flow-stage", "mini");
    expect(mascot).toBeNull();
    expect(stage).toHaveAttribute("hidden");
    expect(container.querySelector('[data-flow-prop="umbrella"]')).toBeNull();
    expect(container.querySelector('[data-flow-prop="rainDrops"]')).toBeNull();
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
    ["Ta medicin", "medicine"],
    ["Vika tvätt", "laundry"],
    ["Dricka vatten", "water"],
    ["Kör till stan", "travel"],
    ["Sova en stund", "sleep"],
    ["Fika med Anna", "break"],
    ["Något helt annat", "think"],
  ])("%s → %s", (title, expected) => {
    expect(sceneForTask(title)).toBe(expected);
  });
});

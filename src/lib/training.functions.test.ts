import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown): unknown => value;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => {
        validate = fn;
        return builder;
      },
      handler: (fn: (args: { data: unknown }) => unknown) => (args: { data: unknown }) =>
        fn({ data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { generateTrainingProgram } from "./training.functions";
import { generateWorkout, DEFAULT_REQUEST } from "./workout-generator";

const input = {
  goal: "Träna hemma",
  focus: "styrka" as const,
  daysPerWeek: 1,
  minutesPerSession: 20,
  level: "nybörjare" as const,
  days: ["Fredag"],
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubEnv("LOVABLE_API_KEY", "test-only");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("weekly visual generation contract", () => {
  it("accepts catalog blocks from the AI response and returns a complete pass on the selected day", async () => {
    const workout = generateWorkout({ ...DEFAULT_REQUEST, minutes: 20 });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intro: "Ditt program",
                  note: "I din takt",
                  sessions: [
                    {
                      day: "Måndag",
                      title: "Hemma",
                      type: "styrka",
                      minutes: 20,
                      blocks: workout.blocks.map((block) => ({
                        ...block,
                        reps: block.reps ?? null,
                        seconds: block.seconds ?? null,
                      })),
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await generateTrainingProgram({ data: input });
    expect(result.sessions[0]?.day).toBe("Fredag");
    expect(result.sessions[0]?.workout?.blocks.length).toBeGreaterThanOrEqual(3);
    expect(result.sessions[0]?.exercises[0]).toContain("×");
    const request = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(request.messages[1].content).toContain("Bildbibliotek");
    expect(request.messages[1].content).toContain("sit-to-stand");
  });
  it("does not return a partial replacement when the number of days is wrong", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intro: "Vila",
                  note: "Vila",
                  sessions: [{ day: "Fredag", title: "Vila", type: "vila" }],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    await expect(
      generateTrainingProgram({ data: { ...input, daysPerWeek: 2, days: ["Måndag", "Fredag"] } }),
    ).rejects.toThrow(/rätt antal pass/);
  });
  it("propagates unavailable AI so the page preserves the existing program", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 402 }));
    await expect(generateTrainingProgram({ data: input })).rejects.toMatchObject({ status: 402 });
  });
});

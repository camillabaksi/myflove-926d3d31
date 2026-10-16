import { describe, expect, it, vi } from "vitest";
import { createMapStarter } from "./map-starter";

describe("map starter", () => {
  it("creates four blank thoughts and three links from the starting point in the same book", () => {
    const create = vi
      .fn()
      .mockReturnValueOnce("root")
      .mockReturnValueOnce("a")
      .mockReturnValueOnce("b")
      .mockReturnValueOnce("c")
      .mockReturnValue("edge");
    expect(createMapStarter({ create }, "map", "2026-10-16")).toEqual(["root", "a", "b", "c"]);
    expect(create.mock.calls.slice(0, 4).map(([kind, content]) => ({ kind, ...content }))).toEqual([
      {
        kind: "node",
        title: "Börja här",
        text: "",
        x: 240,
        y: 240,
        date: "2026-10-16",
        bookId: "map",
        order: 0,
      },
      {
        kind: "node",
        title: "En tanke",
        text: "",
        x: 40,
        y: 40,
        date: "2026-10-16",
        bookId: "map",
        order: 1,
      },
      {
        kind: "node",
        title: "En annan tanke",
        text: "",
        x: 440,
        y: 40,
        date: "2026-10-16",
        bookId: "map",
        order: 2,
      },
      {
        kind: "node",
        title: "En tanke till",
        text: "",
        x: 240,
        y: 440,
        date: "2026-10-16",
        bookId: "map",
        order: 3,
      },
    ]);
    expect(create.mock.calls.slice(4).map(([kind, content]) => ({ kind, ...content }))).toEqual(
      ["a", "b", "c"].map((to) => ({
        kind: "edge",
        title: "",
        text: "",
        date: "2026-10-16",
        bookId: "map",
        from: "root",
        to,
      })),
    );
  });
  it("stops when the guarded account store rejects a write", () => {
    const create = vi.fn().mockReturnValueOnce("root").mockReturnValue(null);
    expect(createMapStarter({ create }, "map")).toEqual(["root"]);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls.some(([kind]) => kind === "edge")).toBe(false);
  });
});

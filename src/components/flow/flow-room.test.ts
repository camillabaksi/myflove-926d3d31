import { describe, expect, it } from "vitest";
import { roomSceneImage, roomTimeAt } from "./flow-room";

describe("Flows dygnsrytm", () => {
  it("byter till dag klockan 07 och kväll klockan 18", () => {
    expect(roomTimeAt(6)).toBe("natt");
    expect(roomTimeAt(7)).toBe("dag");
    expect(roomTimeAt(17)).toBe("dag");
    expect(roomTimeAt(18)).toBe("kvall");
    expect(roomTimeAt(21)).toBe("kvall");
  });

  it("låter Flow vila från klockan 22 till före 07", () => {
    expect(roomTimeAt(22)).toBe("natt");
    expect(roomTimeAt(23)).toBe("natt");
    expect(roomTimeAt(0)).toBe("natt");
  });
});

describe("Flows sammanhängande rum", () => {
  const base = { theme: "lavendel", motion: "mjuk" } as const;
  it("visar samma grundscen för äldre kläder och inkompatibla tillbehör", () => {
    expect(roomSceneImage({ ...base, outfit: "hoodie", accessory: "glasogon" })).toBe(roomSceneImage(base));
  });
  it("visar samma godkända figur även för tidigare sparat hårspänne", () => {
    expect(roomSceneImage({ ...base, accessory: "harspanne" })).toBe(roomSceneImage(base));
  });
});
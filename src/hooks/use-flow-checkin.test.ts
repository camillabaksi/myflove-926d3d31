import { describe, expect, it } from "vitest";
import { slotForHour } from "./use-flow-checkin";

describe("Flow check-in windows", () => {
  it("uses the requested morning, day and evening boundaries", () => {
    expect(slotForHour(5)).toBeNull();
    expect(slotForHour(6)).toBe("morgon");
    expect(slotForHour(10)).toBe("morgon");
    expect(slotForHour(11)).toBe("dag");
    expect(slotForHour(16)).toBe("dag");
    expect(slotForHour(17)).toBe("kvall");
    expect(slotForHour(22)).toBe("kvall");
    expect(slotForHour(23)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { dayCapacity } from "./day-capacity";
describe("dayCapacity", () => {
  it("saknar värde utan egen incheckning", () => { expect(dayCapacity("2026-10-08", {}, []).percent).toBeNull(); });
  it("använder morgonens incheckning", () => { expect(dayCapacity("2026-10-07", { "2026-10-07": { morning: 10 } }, []).percent).toBe(100); });
  it("använder energiloggen samma dag", () => { expect(dayCapacity("2026-10-07", {}, [{ level: 3, logged_at: "2026-10-07T08:00:00" }]).percent).toBe(50); });
});

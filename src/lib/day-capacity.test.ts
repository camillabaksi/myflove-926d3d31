import { describe, expect, it } from "vitest";
import { dayCapacity } from "./day-capacity";
describe("dayCapacity", () => {
  it("saknar värde utan egen incheckning", () => { expect(dayCapacity("2026-10-07", {}, [], "2026-10-07").percent).toBeNull(); });
  it("prioriterar morgonens incheckning framför energiloggen", () => { expect(dayCapacity("2026-10-07", { "2026-10-07": { morning: 10 } }, [{ level: 1, logged_at: "2026-10-07T12:00:00" }], "2026-10-07").percent).toBe(100); });
  it("använder senaste energiloggen samma dag när morgonvärde saknas", () => { expect(dayCapacity("2026-10-07", {}, [{ level: 2, logged_at: "2026-10-07T08:00:00" }, { level: 4, logged_at: "2026-10-07T12:00:00" }], "2026-10-07").percent).toBe(75); });
  it("exponerar aldrig framtidsdaterad registrering", () => { expect(dayCapacity("2026-10-08", { "2026-10-08": { morning: 10 } }, [{ level: 5, logged_at: "2026-10-08T08:00:00" }], "2026-10-07").percent).toBeNull(); });
});

import { describe, expect, it } from "vitest";
import { countActiveAccounts, isActiveAccount, latestAccountActivity, type AccountActivity } from "./account-activity";
const now = Date.parse("2026-10-15T06:00:00Z");
describe("Observed account activity", () => {
  it("takes the latest actual use or sign-in without inferring activity from account creation", () => {
    expect(latestAccountActivity(null, null, now)).toBeNull();
    expect(latestAccountActivity("2026-10-14T06:00:00Z", "2026-09-01T06:00:00Z", now)).toBe("2026-10-14T06:00:00.000Z");
    expect(latestAccountActivity("invalid", "2026-10-01T06:00:00Z", now)).toBe("2026-10-01T06:00:00.000Z");
    expect(latestAccountActivity("2026-12-01T06:00:00Z", null, now)).toBeNull();
  });
  it("uses an inclusive rolling 30-day boundary and rejects missing/invalid/future activity", () => {
    expect(isActiveAccount("2026-09-15T06:00:00Z", 30, now)).toBe(true);
    for (const at of ["2026-09-15T05:59:59Z", null, undefined, "invalid", "2026-10-16T06:00:00Z"]) expect(isActiveAccount(at, 30, now)).toBe(false);
  });
  it("excludes demos from account statistics while counting an active non-demo account", () => {
    const accounts = [
      { user: { id: "one", email: "one@example.test", user_metadata: {} }, lastActiveAt: "2026-10-14T06:00:00Z" },
      { user: { id: "demo", email: "investor@myflove.se", user_metadata: {} }, lastActiveAt: "2026-10-14T06:00:00Z" },
      { user: { id: "demo2", email: "demo@example.test", user_metadata: { demo_account: true } }, lastActiveAt: "2026-10-14T06:00:00Z" },
      { user: { id: "old", email: "old@example.test", user_metadata: {} }, lastActiveAt: "2020-10-14T06:00:00Z" },
    ] as AccountActivity[];
    expect(countActiveAccounts(accounts, 30, now)).toBe(1);
  });
});

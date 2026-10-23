import { describe, expect, it } from "vitest";
import { notificationItemKeyForClientKey, supportsQuickActions } from "./notification-actions";

describe("notification action keys for recurring reminders", () => {
  it("preserves a recurrence date through web and native notification transforms", () => {
    expect(notificationItemKeyForClientKey("rem:walk:2026-10-22")).toBe("reminder:walk:2026-10-22");
    expect(notificationItemKeyForClientKey("rem:walk:2026-10-22:snooze:1234")).toBe("reminder:walk:2026-10-22");
    expect(supportsQuickActions(notificationItemKeyForClientKey("rem:walk:2026-10-22"))).toBe(true);
  });

  it("keeps legacy and unrelated client keys unchanged", () => {
    expect(notificationItemKeyForClientKey("rem:walk")).toBe("reminder:walk");
    expect(notificationItemKeyForClientKey("task:one")).toBe("task:one");
    expect(notificationItemKeyForClientKey("med:tablet:2026-10-22:09:00")).toBe("med:tablet:2026-10-22:09:00");
  });
});

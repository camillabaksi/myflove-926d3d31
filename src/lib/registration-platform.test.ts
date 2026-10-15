import { describe, expect, it } from "vitest";
import { countRegistrationPlatforms, registrationPlatform } from "./registration-platform";

describe("Account registration platforms", () => {
  it("keeps unrecorded history unknown instead of inferring it from current devices", () => {
    for (const metadata of [undefined, null, {}, { platform: "ios" }, { registration_platform: "TestFlight" }, { registration_platform: { os: "android" } }]) {
      expect(registrationPlatform(metadata)).toBe("unknown");
    }
    expect(registrationPlatform({ registration_platform: "ios", last_platform: "web" })).toBe("ios");
  });
  it("partitions accounts once, including admin/demo rows supplied by the user list", () => {
    const users = [
      { user_id: "ios", registration_platform: "ios" as const },
      { user_id: "android", registration_platform: "android" as const },
      { user_id: "owner", registration_platform: "web" as const },
      { user_id: "demo", registration_platform: "unknown" as const },
    ];
    expect(countRegistrationPlatforms([...users, users[0]])).toEqual({ all: 4, ios: 1, android: 1, web: 1, unknown: 1 });
    expect(countRegistrationPlatforms([])).toEqual({ all: 0, ios: 0, android: 0, web: 0, unknown: 0 });
  });
});

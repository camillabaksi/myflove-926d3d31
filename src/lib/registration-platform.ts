/** Platform reported when the account was created, never inferred from later logins. */
export type RegistrationPlatform = "ios" | "android" | "web" | "unknown";
export const REGISTRATION_PLATFORMS = ["ios", "android", "web", "unknown"] as const;
export const REGISTRATION_PLATFORM_LABELS: Record<RegistrationPlatform, string> = {
  ios: "iOS-appen", android: "Androidappen", web: "Webben", unknown: "Okänd",
};

export function registrationPlatform(metadata?: Record<string, unknown> | null): RegistrationPlatform {
  const value = metadata?.registration_platform;
  return value === "ios" || value === "android" || value === "web" ? value : "unknown";
}

export function countRegistrationPlatforms(users: Array<{ user_id: string; registration_platform: RegistrationPlatform }>): Record<RegistrationPlatform | "all", number> {
  const counts = { all: 0, ios: 0, android: 0, web: 0, unknown: 0 };
  const seen = new Set<string>();
  for (const user of users) {
    if (seen.has(user.user_id)) continue;
    seen.add(user.user_id);
    counts.all++;
    counts[registrationPlatform({ registration_platform: user.registration_platform })]++;
  }
  return counts;
}

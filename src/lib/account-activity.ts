import type { User } from "@supabase/supabase-js";

export const ACTIVE_ACCOUNT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Account edits/creation never establish activity. Ignore malformed/future observations. */
export function latestAccountActivity(usedAt?: string | null, signedInAt?: string | null, now = Date.now()): string | null {
  const times = [usedAt, signedInAt].map(value => value ? Date.parse(value) : NaN)
    .filter(time => Number.isFinite(time) && time <= now);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

export function isActiveAccount(at: string | null | undefined, days = ACTIVE_ACCOUNT_DAYS, now = Date.now()): boolean {
  const time = at ? Date.parse(at) : NaN;
  return Number.isFinite(time) && time >= now - days * DAY_MS && time <= now;
}

export type AccountActivity = { user: User; lastActiveAt: string | null };

/** Same demo exclusions as admin_user_stats; admin accounts otherwise remain included. */
export function isCountedAccount(user: User): boolean {
  return user.user_metadata?.demo_account !== true && user.user_metadata?.demo_account !== "true" &&
    user.email?.toLowerCase() !== "investor@myflove.se";
}

export function countActiveAccounts(accounts: AccountActivity[], days = ACTIVE_ACCOUNT_DAYS, now = Date.now()): number {
  return accounts.filter(({ user, lastActiveAt }) => isCountedAccount(user) && isActiveAccount(lastActiveAt, days, now)).length;
}

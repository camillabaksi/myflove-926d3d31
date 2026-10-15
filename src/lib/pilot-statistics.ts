import { isActiveAccount, isCountedAccount, type AccountActivity } from "@/lib/account-activity";
import { countRegistrationPlatforms, registrationPlatform } from "@/lib/registration-platform";

const DAY = 86_400_000;
export const PILOT_DAYS = 30;
export const PILOT_TIME_ZONE = "Europe/Stockholm";

export type PilotAccounts = {
  generatedAt: string;
  active30d: number;
  active7d: number;
  newActive7d: number;
  platforms: ReturnType<typeof countRegistrationPlatforms>;
  history: { registered: number; inactive: number; internal: number };
};

export function summarizePilotAccounts(accounts: AccountActivity[], adminIds: Set<string>, now: number): PilotAccounts {
  const unique = [...new Map(accounts.map(account => [account.user.id, account])).values()];
  const external = unique.filter(({ user }) => isCountedAccount(user) && !adminIds.has(user.id));
  const active = external.filter(({ lastActiveAt }) => isActiveAccount(lastActiveAt, PILOT_DAYS, now));
  return {
    generatedAt: new Date(now).toISOString(),
    active30d: active.length,
    active7d: active.filter(({ lastActiveAt }) => isActiveAccount(lastActiveAt, 7, now)).length,
    newActive7d: active.filter(({ user, lastActiveAt }) => isActiveAccount(user.created_at, 7, now) && isActiveAccount(lastActiveAt, 7, now)).length,
    platforms: countRegistrationPlatforms(active.map(({ user }) => ({
      user_id: user.id, registration_platform: registrationPlatform(user.user_metadata),
    }))),
    history: { registered: external.length, inactive: external.length - active.length, internal: unique.length - external.length },
  };
}

/** Explicit recorded actions only. Page views, opens and onboarding never establish core use. */
export const PILOT_FEATURES = [
  { id: "plan", label: "Fånga och planera", detail: "Skapat uppgift, anteckning eller påminnelse, sparat via Fånga eller godkänt en omplanering.",
    actions: ["task_created", "note_created", "reminder_created", "quickflow_created", "quickflow_planned", "plan_created", "plan_updated", "day_replanned"] },
  { id: "do", label: "Genomföra", detail: "Markerat en uppgift eller ett fokuspass som klart.",
    actions: ["task_completed", "focus_completed", "quickflow_completed"] },
  { id: "energy", label: "Checka in energi", detail: "Slutfört en energiincheckning. Själva energivärdet läses inte.",
    actions: ["battery_checkin_completed"] },
  { id: "recover", label: "Starta en paus", detail: "Startat paustimern. Att öppna återhämtning räknas inte.",
    actions: ["recovery_pause_started"] },
  { id: "support", label: "Välja ett nästa steg", detail: "Accepterat ett Flow-förslag eller valt ett föreslaget nästa steg. Visar ett val, inte att uppgiften blev gjord.",
    actions: ["flow_suggestion_accepted", "next_step_accepted"] },
] as const;

export type PilotEvent = { session_id: string; action: string; created_at: string };
export type BrowserClassification = { session_id: string; is_internal: boolean };
export type PilotUsage = {
  from: string; to: string; timeZone: string;
  browsers: number; meaningfulBrowsers: number; repeatedBrowsers: number; repeatRate: number | null;
  internalBrowsersExcluded: number; unknownBrowsers: number; unidentifiedEvents: number;
  features: Array<{ id: string; browsers: number }>;
  energyCheckin: { started: number; completedAfterStart: number; completionRate: number | null };
  daily: Array<{ date: string; browsers: number }>;
};

const dateFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: PILOT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
export function pilotDate(time: number | string): string { return dateFormatter.format(new Date(time)); }
export function metricPercent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round(numerator / denominator * 100) : null;
}

export function summarizePilotUsage(events: PilotEvent[], classifications: BrowserClassification[], now: number): PilotUsage {
  const since = now - PILOT_DAYS * DAY;
  const internal = new Set(classifications.filter(row => row.is_internal).map(row => row.session_id));
  const classified = new Set(classifications.map(row => row.session_id));
  const excluded = new Set<string>();
  const all = new Set<string>();
  const unknown = new Set<string>();
  const meaningfulDays = new Map<string, Set<string>>();
  const featureSets = PILOT_FEATURES.map(() => new Set<string>());
  const byDay = new Map<string, Set<string>>();
  const energyStarts = new Map<string, number>();
  const started = new Set<string>();
  const completed = new Set<string>();
  let unidentifiedEvents = 0;
  // Ascending order makes start → completion explicit, including unsorted DB input.
  const rows = events.filter(row => {
    const time = Date.parse(row.created_at);
    return row.session_id && Number.isFinite(time) && time >= since && time <= now;
  }).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  for (const row of rows) {
    // The client uses these shared sentinels when persistent browser storage is unavailable.
    if (row.session_id === "unknown" || row.session_id === "server") { unidentifiedEvents++; continue; }
    if (internal.has(row.session_id)) { excluded.add(row.session_id); continue; }
    all.add(row.session_id);
    if (!classified.has(row.session_id)) unknown.add(row.session_id);
    const time = Date.parse(row.created_at);
    if (row.action === "battery_checkin_started") { energyStarts.set(row.session_id, time); started.add(row.session_id); }
    const start = energyStarts.get(row.session_id);
    if (row.action === "battery_checkin_completed" && start !== undefined && time >= start && time - start <= 30 * 60_000) {
      completed.add(row.session_id);
    }
    let meaningful = false;
    PILOT_FEATURES.forEach((feature, i) => {
      if ((feature.actions as readonly string[]).includes(row.action)) {
        featureSets[i].add(row.session_id); meaningful = true;
      }
    });
    if (!meaningful) continue;
    const day = pilotDate(time);
    const days = meaningfulDays.get(row.session_id) ?? new Set<string>();
    days.add(day); meaningfulDays.set(row.session_id, days);
    const browsers = byDay.get(day) ?? new Set<string>();
    browsers.add(row.session_id); byDay.set(day, browsers);
  }
  const repeatedBrowsers = [...meaningfulDays.values()].filter(days => days.size >= 2).length;
  // Calendar stepping in UTC at noon avoids missing/duplicating a local date at DST changes.
  const today = pilotDate(now);
  const todayNoon = Date.parse(`${today}T12:00:00Z`);
  const daily = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(todayNoon - (13 - i) * DAY).toISOString().slice(0, 10);
    return { date, browsers: byDay.get(date)?.size ?? 0 };
  });
  return {
    from: new Date(since).toISOString(), to: new Date(now).toISOString(), timeZone: PILOT_TIME_ZONE,
    browsers: all.size, meaningfulBrowsers: meaningfulDays.size, repeatedBrowsers,
    repeatRate: metricPercent(repeatedBrowsers, meaningfulDays.size),
    internalBrowsersExcluded: excluded.size, unknownBrowsers: unknown.size, unidentifiedEvents,
    features: PILOT_FEATURES.map((feature, i) => ({ id: feature.id, browsers: featureSets[i].size })),
    energyCheckin: { started: started.size, completedAfterStart: completed.size, completionRate: metricPercent(completed.size, started.size) },
    daily,
  };
}

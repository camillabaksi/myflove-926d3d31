import { energyPercent } from "./energy-percent";
import type { ActivityInstance } from "@/lib/activity-history";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";

export const BATTERY_TREND_DAYS = 365;

export interface BatteryLoadDay {
  day: string;
  label: string;
  battery: number | null;
  loadCount: number;
  /** Faktiska minuter som gått åt (start/sluttid, annars uppskattat 30 min per sak). */
  loadMinutes: number;
}

export type BatteryLoadRange = "days" | "weeks" | "months";

export interface BatteryLoadPeriod {
  key: string;
  label: string;
  accessibleLabel: string;
  battery: number | null;
  loadCount: number;
  loadMinutes: number;
  observedDays: number;
}

export interface BatteryLoadTrend {
  days: BatteryLoadDay[];
  periods: Record<BatteryLoadRange, BatteryLoadPeriod[]>;
  energyLogs: number;
  loadOccasions: number;
  loadMinutes: number;
  observedDays: number;
  direction: "up" | "steady" | "down" | "learning";
  change: number | null;
  loadEffect: number | null;
  timeEffect: number | null;
  pairedOccasions: number;
  summary: string;
}

const DAY_MS = 86_400_000;

const dayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function mondayKey(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return dayKey(date);
}

function monthKey(day: string): string {
  return day.slice(0, 7);
}

function aggregatePeriods(
  days: BatteryLoadDay[],
  range: Exclude<BatteryLoadRange, "days">,
): BatteryLoadPeriod[] {
  const grouped = new Map<string, BatteryLoadDay[]>();
  for (const day of days) {
    const key = range === "weeks" ? mondayKey(day.day) : monthKey(day.day);
    grouped.set(key, [...(grouped.get(key) ?? []), day]);
  }

  return [...grouped.entries()].map(([key, entries]) => {
    const batteries = entries.flatMap((entry) => (entry.battery == null ? [] : [entry.battery]));
    const date = new Date(`${key}${range === "months" ? "-01" : ""}T12:00:00`);
    const label =
      range === "weeks"
        ? `v${weekNumber(date)}`
        : new Intl.DateTimeFormat("sv-SE", { month: "short" }).format(date).replace(".", "");
    const accessibleLabel =
      range === "weeks"
        ? `Vecka ${weekNumber(date)}`
        : new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" }).format(date);
    return {
      key,
      label,
      accessibleLabel,
      battery: batteries.length > 0 ? Math.round(mean(batteries)) : null,
      loadCount: entries.reduce((sum, entry) => sum + entry.loadCount, 0),
      loadMinutes: entries.reduce((sum, entry) => sum + entry.loadMinutes, 0),
      observedDays: batteries.length,
    };
  });
}

function weekNumber(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

function activityMoment(instance: ActivityInstance): number | null {
  if (instance.completedAt) return instance.completedAt;
  const time = instance.endTime ?? instance.startTime;
  if (!time) return null;
  const timestamp = new Date(`${instance.actualDate ?? instance.date}T${time}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

const DEFAULT_ACTIVITY_MINUTES = 30;

/**
 * Faktisk tid som gått åt: sluttid minus starttid. Saknas tider uppskattar vi
 * 30 minuter så att dagen inte felaktigt ser helt tidfri ut.
 */
function activityMinutes(instance: ActivityInstance): number {
  const toMinutes = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };
  const start = toMinutes(instance.startTime);
  const end = toMinutes(instance.endTime);
  if (start == null || end == null) return DEFAULT_ACTIVITY_MINUTES;
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60; // passerar midnatt
  return Math.min(diff, 16 * 60);
}

/**
 * Jämför verkliga batteriincheckningar med genomförda aktivitetstillfällen.
 * Planerade men inte genomförda saker räknas aldrig som faktisk belastning.
 */
export function buildBatteryLoadTrend(input: {
  energy: EnergyLogEntry[];
  instances: ActivityInstance[];
  now?: Date;
}): BatteryLoadTrend {
  const now = input.now ?? new Date();
  const days: BatteryLoadDay[] = [];
  const energyByDay = new Map<string, number[]>();

  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - (BATTERY_TREND_DAYS - 1));
  const startTime = start.getTime() - 12 * 60 * 60 * 1000;
  const endTime = now.getTime() + 12 * 60 * 60 * 1000;

  const validEnergy = input.energy
    .map((entry) => ({ ...entry, timestamp: new Date(entry.logged_at).getTime() }))
    .filter(
      (entry) =>
        Number.isFinite(entry.timestamp) &&
        entry.timestamp >= startTime &&
        entry.timestamp <= endTime &&
        entry.level >= 1 &&
        entry.level <= 5,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const entry of validEnergy) {
    const key = dayKey(new Date(entry.timestamp));
    const levels = energyByDay.get(key) ?? [];
    levels.push(energyPercent(entry));
    energyByDay.set(key, levels);
  }

  const actualInstances = input.instances.filter(
    (instance) => instance.status === "genomford" || Boolean(instance.energyImpact),
  );
  const loadsByDay = new Map<string, { count: number; minutes: number }>();
  for (const instance of actualInstances) {
    const key = instance.actualDate ?? instance.date;
    const entry = loadsByDay.get(key) ?? { count: 0, minutes: 0 };
    entry.count += 1;
    entry.minutes += activityMinutes(instance);
    loadsByDay.set(key, entry);
  }

  for (let index = 0; index < BATTERY_TREND_DAYS; index += 1) {
    const date = new Date(start.getTime() + index * DAY_MS);
    const key = dayKey(date);
    const levels = energyByDay.get(key) ?? [];
    const load = loadsByDay.get(key) ?? { count: 0, minutes: 0 };
    days.push({
      day: key,
      label: new Intl.DateTimeFormat("sv-SE", { weekday: "short" }).format(date).replace(".", ""),
      battery: levels.length > 0 ? Math.round(mean(levels)) : null,
      loadCount: load.count,
      loadMinutes: load.minutes,
    });
  }

  const recentDays = days.slice(-14);
  const observed = recentDays.filter((day) => day.battery != null);
  let change: number | null = null;
  let direction: BatteryLoadTrend["direction"] = "learning";
  if (observed.length >= 4) {
    const midpoint = Math.floor(observed.length / 2);
    const earlier = observed
      .slice(0, midpoint)
      .flatMap((day) => (day.battery == null ? [] : [day.battery]));
    const later = observed
      .slice(midpoint)
      .flatMap((day) => (day.battery == null ? [] : [day.battery]));
    change = Math.round(mean(later) - mean(earlier));
    direction = change >= 8 ? "up" : change <= -8 ? "down" : "steady";
  }

  const loadLevels = observed.map((day) => day.loadCount);
  const distinctLoads = new Set(loadLevels);
  let loadEffect: number | null = null;
  if (observed.length >= 5 && distinctLoads.size >= 2) {
    const averageLoad = mean(loadLevels);
    const lighter = observed.filter((day) => day.loadCount < averageLoad);
    const heavier = observed.filter((day) => day.loadCount >= averageLoad);
    if (lighter.length >= 2 && heavier.length >= 2) {
      const lightBattery = mean(
        lighter.flatMap((day) => (day.battery == null ? [] : [day.battery])),
      );
      const heavyBattery = mean(
        heavier.flatMap((day) => (day.battery == null ? [] : [day.battery])),
      );
      loadEffect = Math.round(heavyBattery - lightBattery);
    }
  }

  // Samma jämförelse, men mot faktisk tid som gått åt i stället för antal saker.
  let timeEffect: number | null = null;
  const timeLevels = observed.map((day) => day.loadMinutes);
  if (observed.length >= 5 && new Set(timeLevels).size >= 2) {
    const averageMinutes = mean(timeLevels);
    const shorter = observed.filter((day) => day.loadMinutes < averageMinutes);
    const longer = observed.filter((day) => day.loadMinutes >= averageMinutes);
    if (shorter.length >= 2 && longer.length >= 2) {
      const shortBattery = mean(
        shorter.flatMap((day) => (day.battery == null ? [] : [day.battery])),
      );
      const longBattery = mean(longer.flatMap((day) => (day.battery == null ? [] : [day.battery])));
      timeEffect = Math.round(longBattery - shortBattery);
    }
  }

  // Extra starkt underlag: en incheckning före och efter ett faktiskt tillfälle.
  const fourHours = 4 * 60 * 60 * 1000;
  const pairedChanges: number[] = [];
  for (const instance of actualInstances) {
    const moment = activityMoment(instance);
    if (moment == null) continue;
    const sameDay = validEnergy.filter(
      (entry) => dayKey(new Date(entry.timestamp)) === dayKey(new Date(moment)),
    );
    const before = [...sameDay]
      .reverse()
      .find((entry) => entry.timestamp <= moment && moment - entry.timestamp <= fourHours);
    const after = sameDay.find(
      (entry) => entry.timestamp > moment && entry.timestamp - moment <= fourHours,
    );
    if (before && after) pairedChanges.push(energyPercent(after) - energyPercent(before));
  }

  const pairedEffect = pairedChanges.length >= 2 ? Math.round(mean(pairedChanges)) : null;
  if (pairedEffect != null) loadEffect = pairedEffect;

  const summary =
    observed.length < 4
      ? "När batteriet är loggat för minst fyra dagar kan en första trend visas."
      : timeEffect != null
        ? timeEffect <= -8
          ? `Dagar med mer aktivitetstid har batteriet i snitt varit ${Math.abs(timeEffect)} procentenheter lägre.`
          : timeEffect >= 8
            ? `Dagar med mer aktivitetstid har batteriet i snitt varit ${timeEffect} procentenheter högre.`
            : "Batteriet har varit ungefär lika även när aktivitetstiden varierat."
        : loadEffect == null
          ? direction === "up"
            ? "Batteriet har stigit under den senaste delen av perioden."
            : direction === "down"
              ? "Batteriet har varit lägre under den senaste delen av perioden."
              : "Batteriet har legat ganska jämnt under perioden."
          : loadEffect <= -8
            ? `Vid högre faktisk belastning har batteriet i snitt varit ${Math.abs(loadEffect)} procentenheter lägre.`
            : loadEffect >= 8
              ? `Vid högre faktisk belastning har batteriet i snitt varit ${loadEffect} procentenheter högre.`
              : "Batteriet har varit ungefär lika även när den faktiska belastningen varierat.";

  return {
    days,
    periods: {
      days: days.slice(-28).map((day) => ({
        key: day.day,
        label: new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" })
          .format(new Date(`${day.day}T12:00:00`))
          .replace(".", ""),
        accessibleLabel: new Intl.DateTimeFormat("sv-SE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date(`${day.day}T12:00:00`)),
        battery: day.battery,
        loadCount: day.loadCount,
        loadMinutes: day.loadMinutes,
        observedDays: day.battery == null ? 0 : 1,
      })),
      weeks: aggregatePeriods(days, "weeks").slice(-12),
      months: aggregatePeriods(days, "months").slice(-12),
    },
    energyLogs: validEnergy.length,
    loadOccasions: actualInstances.filter((instance) =>
      days.some((day) => day.day === (instance.actualDate ?? instance.date)),
    ).length,
    loadMinutes: days.reduce((sum, day) => sum + day.loadMinutes, 0),
    observedDays: observed.length,
    direction,
    change,
    loadEffect,
    timeEffect,
    pairedOccasions: pairedChanges.length,
    summary,
  };
}

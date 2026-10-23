import { describe, expect, it } from "vitest";
import {
  buildNativeReminderPlan,
  nativeExtra,
  nativeAlarmChannel,
  nativeDeliveryTime,
  type DeviceReminder,
  type NativeReminderPreferences,
} from "./native-reminder-plan";

const now = Date.parse("2026-10-11T12:00:00Z");
const prefs: NativeReminderPreferences = {
  quiet: {
    pausedUntil: 0,
    scheduleEnabled: false,
    scheduleStart: "22:00",
    scheduleEnd: "07:00",
    timeZone: "Europe/Stockholm",
  },
  sound: "harpa",
  format: "bada",
  soundEnabled: true,
};
const row = (key: string, at = now + 60_000): DeviceReminder => ({
  clientKey: key,
  title: "Promenad",
  body: "Dags",
  deliverAt: new Date(at).toISOString(),
  url: "/idag",
});

describe("device reminder planning", () => {
  it("bounds the queue to the nearest 60 without disturbing other plugin notifications", () => {
    const rows = Array.from({ length: 90 }, (_, i) => row(`task:${i}`, now + (90 - i) * 60_000));
    const plan = buildNativeReminderPlan("A", rows, prefs, now, [{ id: 100 }]);
    expect(plan).toHaveLength(59);
    expect(plan[0].schedule?.at?.getTime()).toBe(now + 60_000);
    expect(plan[58].schedule?.at?.getTime()).toBe(now + 59 * 60_000);
    expect(new Set(plan.map((n) => n.id)).size).toBe(59);
    expect(plan.every((n) => n.id !== 100 && n.id > 0 && n.id < 2147483647)).toBe(true);
  });
  it("keeps IDs stable and changes fingerprints on time/title/audio changes", () => {
    const first = buildNativeReminderPlan("A", [row("task:one")], prefs, now);
    const second = buildNativeReminderPlan(
      "A",
      [row("task:earlier", now + 10_000), { ...row("task:one", now + 180_000), title: "Ny titel" }],
      { ...prefs, sound: "natur" },
      now,
      first,
    );
    expect(second[1].id).toBe(first[0].id);
    expect(nativeExtra(second[1])?.fingerprint).not.toBe(nativeExtra(first[0])?.fingerprint);
    expect(buildNativeReminderPlan("B", [row("task:one")], prefs, now)[0].id).not.toBe(first[0].id);
  });
  it("defers pauses/night in the saved IANA zone, including winter DST", () => {
    const quiet = {
      ...prefs.quiet,
      scheduleEnabled: true,
      pausedUntil: Date.parse("2026-10-24T22:30:00Z"),
    };
    expect(
      new Date(nativeDeliveryTime(Date.parse("2026-10-24T18:00:00Z"), quiet)).toISOString(),
    ).toBe("2026-10-25T06:00:00.000Z");
    expect(
      new Date(
        nativeDeliveryTime(Date.parse("2026-10-11T20:00:00Z"), {
          ...prefs.quiet,
          scheduleEnabled: true,
        }),
      ).toISOString(),
    ).toBe("2026-10-12T05:00:00.000Z");
  });
  it("never recreates past reminders on opening, even during a pause", () => {
    expect(
      buildNativeReminderPlan(
        "A",
        [row("task:old", now - 3600_000)],
        { ...prefs, quiet: { ...prefs.quiet, pausedUntil: now + 60_000 } },
        now,
      ),
    ).toEqual([]);
  });
  it("keeps an already queued quiet occurrence and delivers after early resume", () => {
    const reminder = row("task:one");
    const paused = { ...prefs, quiet: { ...prefs.quiet, pausedUntil: now + 3600_000 } };
    const queued = buildNativeReminderPlan("A", [reminder], paused, now);
    expect(
      buildNativeReminderPlan(
        "A",
        [reminder],
        paused,
        now + 120_000,
        queued,
      )[0].schedule?.at?.getTime(),
    ).toBe(now + 3600_000);
    expect(
      buildNativeReminderPlan(
        "A",
        [reminder],
        prefs,
        now + 120_000,
        queued,
      )[0].schedule?.at?.getTime(),
    ).toBe(now + 121_000);
    expect(
      buildNativeReminderPlan("A", [row("task:one", now - 1000)], paused, now + 120_000, queued),
    ).toEqual([]);
  });
  it("honors audio/vibration choices with distinct immutable Android channels", () => {
    expect(nativeAlarmChannel(prefs)).toMatchObject({
      sound: "paceable_harpa.wav",
      vibration: true,
      visibility: 0,
    });
    expect(nativeAlarmChannel({ ...prefs, format: "vibration" })).toMatchObject({
      vibration: true,
    });
    expect(nativeAlarmChannel({ ...prefs, format: "vibration" }).sound).toBeUndefined();
    expect(nativeAlarmChannel({ ...prefs, format: "tyst" })).toMatchObject({ vibration: false });
    expect(nativeAlarmChannel({ ...prefs, soundEnabled: false }).sound).toBeUndefined();
    const silent = buildNativeReminderPlan(
      "A",
      [row("task:x")],
      { ...prefs, format: "tyst" },
      now,
    )[0];
    expect(silent.sound).toBe("paceable_silent.wav");
    expect(silent.channelId).not.toBe(nativeAlarmChannel(prefs).id);
  });
  it("maps calendar keys for foreground deduplication and preserves medication occurrences", () => {
    const plan = buildNativeReminderPlan(
      "A",
      [row("rem:calendar:2026-10-11"), row("med:one:2026-10-11:14:00")],
      prefs,
      now,
    );
    expect(plan.map((n) => nativeExtra(n)?.itemKey).sort()).toEqual([
      "med:one:2026-10-11:14:00",
      "reminder:calendar:2026-10-11",
    ]);
  });
});

it("does not continually move the immediate reminder after early pause release", () => {
  const reminder = row("task:resume");
  const queued = buildNativeReminderPlan(
    "A",
    [reminder],
    { ...prefs, quiet: { ...prefs.quiet, pausedUntil: now + 3600_000 } },
    now,
  );
  const resumed = buildNativeReminderPlan("A", [reminder], prefs, now + 120_000, queued);
  const repeated = buildNativeReminderPlan("A", [reminder], prefs, now + 120_100, resumed);
  expect(nativeExtra(repeated[0])?.fingerprint).toBe(nativeExtra(resumed[0])?.fingerprint);
});

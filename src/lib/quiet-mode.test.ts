import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_QUIET_STATE,
  isQuietNow,
  isWithinSchedule,
  QUIET_MODE_KEY,
  setQuietMode,
  subscribeQuietMode,
} from "./quiet-mode";

afterEach(() => localStorage.clear());
const night = { ...DEFAULT_QUIET_STATE, scheduleEnabled: true, timeZone: "Europe/Stockholm" };

describe("samma tysta period på server och telefon", () => {
  it("använder svensk lokal tid även när servern kör UTC", () => {
    expect(isQuietNow(night, new Date("2026-10-11T20:30:00Z"))).toBe(true);
    expect(isQuietNow(night, new Date("2026-10-12T05:00:00Z"))).toBe(false);
  });
  it("följer vintertid och intervallets slut utan fasta UTC-offsets", () => {
    expect(isWithinSchedule(night, new Date("2026-10-25T05:59:00Z"))).toBe(true);
    expect(isWithinSchedule(night, new Date("2026-10-25T06:00:00Z"))).toBe(false);
  });
  it("pausar också dagtid och släpper precis när pausen tar slut", () => {
    const until = Date.parse("2026-10-11T12:10:00Z");
    const pause = { ...DEFAULT_QUIET_STATE, pausedUntil: until };
    expect(isQuietNow(pause, new Date(until - 1))).toBe(true);
    expect(isQuietNow(pause, new Date(until))).toBe(false);
  });
  it("ogiltiga tider och lika start/slut skapar ingen hel dygnspaus", () => {
    expect(isQuietNow({ ...night, scheduleStart: "99:99" })).toBe(false);
    expect(isQuietNow({ ...night, scheduleEnd: "22:00" })).toBe(false);
  });
  it("meddelar lyssnare om kontosynkade ändringar och bevarar nattinställningen", () => {
    localStorage.setItem(QUIET_MODE_KEY, JSON.stringify(night));
    const values: unknown[] = [];
    const stop = subscribeQuietMode((v) => values.push(v));
    setQuietMode({ pausedUntil: 123 });
    window.dispatchEvent(
      new CustomEvent("myflow-local-storage", { detail: { key: QUIET_MODE_KEY } }),
    );
    stop();
    expect(values).toHaveLength(2);
    expect(values[1]).toMatchObject({
      pausedUntil: 123,
      scheduleEnabled: true,
      scheduleStart: "22:00",
    });
  });
});

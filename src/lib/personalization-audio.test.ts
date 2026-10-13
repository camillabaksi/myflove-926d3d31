import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  format: "ljud",
  fail: false,
  build: vi.fn(() => new Blob(["sound"])),
}));
vi.mock("@/lib/personalization", () => ({
  getAlarmFormat: () => state.format,
  getAlarmSoundId: () => "myflove",
}));
vi.mock("@/lib/alarm-sounds", () => ({
  buildAlarmWav: state.build,
  buildSilentWav: () => new Blob(),
}));
vi.mock("@/lib/quiet-mode", () => ({ isQuietNow: () => false }));
import { playAlarmPreview, playAlarmSound, setAlarmSoundEnabled } from "./push-notifications";
const audio: FakeAudio[] = [];
class FakeAudio {
  src: string;
  preload = "";
  currentTime = 0;
  muted = false;
  volume = 1;
  pause = vi.fn();
  load = vi.fn();
  play = vi.fn(() => (state.fail ? Promise.reject(new Error("blocked")) : Promise.resolve()));
  constructor(src: string) {
    this.src = src;
    audio.push(this);
  }
}
beforeEach(() => {
  state.fail = false;
  state.format = "ljud";
  vi.stubGlobal("Audio", FakeAudio);
  URL.createObjectURL = vi.fn(() => `blob:${audio.length}`);
  URL.revokeObjectURL = vi.fn();
});
describe("alarmsignalens provlyssning", () => {
  it("spelar vald signal även med avstängt alarm och stoppar föregående signal vid byte", async () => {
    setAlarmSoundEnabled(false);
    expect(await playAlarmPreview("natur")).toBe(true);
    const previous = audio.at(-1)!;
    expect(state.build).toHaveBeenLastCalledWith("natur");
    expect(await playAlarmPreview("harpa")).toBe(true);
    expect(previous.pause).toHaveBeenCalledOnce();
    expect(state.build).toHaveBeenLastCalledWith("harpa");
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });
  it("signalerar när webbläsaren blockerar provljudet", async () => {
    state.fail = true;
    expect(await playAlarmPreview("litet-pling")).toBe(false);
  });
  it("tyst format hindrar automatisk uppspelning", () => {
    state.format = "tyst";
    setAlarmSoundEnabled(true);
    const before = audio.length;
    playAlarmSound();
    expect(audio).toHaveLength(before);
  });
});

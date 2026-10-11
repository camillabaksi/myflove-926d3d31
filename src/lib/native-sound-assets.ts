import type { AlarmSoundId } from "./personalization";

// Built from the same WAV generator as the web preview; bundled by native:prepare.
export const NATIVE_SOUND_IDS: readonly AlarmSoundId[] = [
  "myflove",
  "mjuk-klocka",
  "litet-pling",
  "mjuk-ton",
  "bubblig",
  "natur",
  "lugn-melodi",
  "klangskal",
  "regndroppe",
  "harpa",
];
export function nativeSoundFile(id: AlarmSoundId): string {
  return `paceable_${id.replaceAll("-", "_")}.wav`;
}
export const NATIVE_SILENT_FILE = "paceable_silent.wav";

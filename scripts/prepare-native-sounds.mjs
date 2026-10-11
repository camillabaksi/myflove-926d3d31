import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildAlarmWav, buildSilentWav } from "../src/lib/alarm-sounds.ts";
import {
  NATIVE_SOUND_IDS,
  nativeSoundFile,
  NATIVE_SILENT_FILE,
} from "../src/lib/native-sound-assets.ts";

const roots = ["../android/app/src/main/res/raw/", "../ios/App/App/Sounds/"];
// Identical build outputs even for the natural/noise signal.
let seed = 481516;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const sounds = await Promise.all([
  ...NATIVE_SOUND_IDS.map(async (id) => [
    nativeSoundFile(id),
    Buffer.from(await buildAlarmWav(id).arrayBuffer()),
  ]),
  Promise.resolve([NATIVE_SILENT_FILE, Buffer.from(await buildSilentWav().arrayBuffer())]),
]);
for (const relative of roots) {
  const root = new URL(relative, import.meta.url);
  await mkdir(root, { recursive: true });
  for (const [name, bytes] of sounds) await writeFile(new URL(name, root), bytes);
  process.stdout.write(`Prepared ${sounds.length} notification sounds in ${fileURLToPath(root)}\n`);
}

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "pitch",
  puppeteerInstance: browser,
});

console.log("Duration frames:", composition.durationInFrames);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/dev-server/public/pitch/myflove-pitch-4.1.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 4,
});

await browser.close({ silent: false });
console.log("Done");

import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

for (const item of [
  { id: "flow-ad-pitch", format: "pitch", output: "/mnt/documents/MyFlove_Flow_Reklam_30s_16x9.mp4" },
  { id: "flow-ad-social", format: "social", output: "/mnt/documents/MyFlove_Flow_Reklam_30s_9x16.mp4" },
]) {
  const inputProps = { format: item.format };
  const composition = await selectComposition({ serveUrl: bundled, id: item.id, inputProps, puppeteerInstance: browser });
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    crf: 18,
    outputLocation: item.output,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
    inputProps,
  });
  console.log(`Rendered ${item.output}`);
}

await browser.close({ silent: false });
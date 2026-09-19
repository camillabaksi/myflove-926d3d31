import {bundle} from "@remotion/bundler"; import {renderMedia,selectComposition,openBrowser} from "@remotion/renderer"; import path from "path"; import {fileURLToPath} from "url";
const dir=path.dirname(fileURLToPath(import.meta.url)); const serveUrl=await bundle({entryPoint:path.resolve(dir,"../src/index.ts"),webpackOverride:c=>c});
const browser=await openBrowser("chrome",{browserExecutable:process.env.PUPPETEER_EXECUTABLE_PATH??"/bin/chromium",chromiumOptions:{args:["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"]},chromeMode:"chrome-for-testing"});
const suffix=process.env.OUT_SUFFIX??"";
const jobs=[["marketing-90-landscape",`/mnt/documents/MyFlove_Marknadsforingsvideo_90s_16x9${suffix}.mp4`],["marketing-90-portrait",`/mnt/documents/MyFlove_Marknadsforingsvideo_90s_9x16${suffix}.mp4`]];
for(const [id,out] of jobs){const composition=await selectComposition({serveUrl,id,puppeteerInstance:browser}); await renderMedia({composition,serveUrl,codec:"h264",audioCodec:"aac",crf:21,outputLocation:out,puppeteerInstance:browser,concurrency:4}); console.log(out);}
await browser.close({silent:false});

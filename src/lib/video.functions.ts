import { createServerFn } from "@tanstack/react-start";
import path from "node:path";

const VIDEO_PATH = "/mnt/documents/myflow-preview.mp4";
const FALLBACK_PATH = path.resolve("public/myflow-preview.mp4");

export const downloadVideo = createServerFn({ method: "GET" })
  .handler(async () => {
    const { readFile, access } = await import("node:fs/promises");
    let filePath = VIDEO_PATH;
    try {
      await access(VIDEO_PATH);
    } catch {
      filePath = FALLBACK_PATH;
    }
    const file = await readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=\"myflow-preview.mp4\"",
      },
    });
  });

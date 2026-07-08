import { createServerFn } from "@tanstack/react-start";

export const downloadVideo = createServerFn({ method: "GET" })
  .handler(async () => {
    const { readFile } = await import("node:fs/promises");
    const file = await readFile("/mnt/documents/myflow-preview.mp4");
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=\"myflow-preview.mp4\"",
      },
    });
  });

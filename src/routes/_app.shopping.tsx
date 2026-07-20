import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/shopping";

export const Route = createFileRoute("/_app/shopping")({
  head: () => ({
    meta: [
      { title: "Inköp – MyFlove" },
      { name: "description", content: "Din inköpslista – dela med familjen eller använd själv." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

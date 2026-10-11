import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/shopping";

export const Route = createFileRoute("/_app/shopping")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Inköpslista – Paceable" },
      { property: "og:description", content: "Din inköpslista – dela med familjen eller använd själv." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Inköpslista – Paceable" },
      { name: "description", content: "Din inköpslista – dela med familjen eller använd själv." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

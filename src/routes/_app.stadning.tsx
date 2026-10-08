import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/cleaning";

export const Route = createFileRoute("/_app/stadning")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Städning – MyFlove" },
      { property: "og:description", content: "Vardagsstädning eller storstädning per rum – med tidsåtgång, avbockning och lista på vad du behöver." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Städning – MyFlove" },
      {
        name: "description",
        content:
          "Vardagsstädning eller storstädning per rum – med tidsåtgång, avbockning och lista på vad du behöver.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

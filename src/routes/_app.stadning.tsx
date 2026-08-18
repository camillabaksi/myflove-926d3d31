import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/cleaning";

export const Route = createFileRoute("/_app/stadning")({
  head: () => ({
    meta: [
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

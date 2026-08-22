import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowscore";

export const Route = createFileRoute("/_app/flowscore")({
  head: () => ({
    meta: [
      { title: "Dagens balans – din kapacitet just nu | MyFlove" },
      {
        name: "description",
        content:
          "Se dagens balans: energi, mående och tid kvar vägs samman till en realistisk bild av vad som är rimligt just nu.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

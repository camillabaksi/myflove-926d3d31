import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowscore";

export const Route = createFileRoute("/_app/flowscore")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Dagens balans – din kapacitet just nu | Paceable" },
      { property: "og:description", content: "Se dagens balans: energi, mående och tid kvar vägs samman till en realistisk bild av vad som är rimligt just nu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Dagens balans – din kapacitet just nu | Paceable" },
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

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/energy-flow";

export const Route = createFileRoute("/_app/energifloede")({
  head: () => ({
    meta: [
      { title: "Min energi – vad ger och tar energi | Paceable" },
      {
        name: "description",
        content:
          "Registrera vad som ger och tar energi under dagen. Energiflödet vägs in i dagens balans så att planen blir rimlig.",
      },
      { property: "og:title", content: "Min energi – vad ger och tar energi | Paceable" },
      {
        property: "og:description",
        content:
          "Registrera vad som ger och tar energi under dagen och låt planen anpassa sig efter din kapacitet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

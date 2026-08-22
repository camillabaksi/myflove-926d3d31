import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow";

export const Route = createFileRoute("/_app/flow")({
  head: () => ({
    meta: [
      { title: "Planera – vad är bäst att göra nu? | MyFlove" },
      {
        name: "description",
        content:
          "Planera ger ett tydligt svar på vad som är bäst att göra just nu, hur dagens belastning ser ut och hjälp när du behöver den.",
      },
      { property: "og:title", content: "Planera – vad är bäst att göra nu? | MyFlove" },
      {
        property: "og:description",
        content: "Ett svar, ett nästa steg och möjligheten att göra det direkt.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

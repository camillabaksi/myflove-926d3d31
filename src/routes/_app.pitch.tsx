import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pitch";

export const Route = createFileRoute("/_app/pitch")({
  head: () => ({
    meta: [
      { title: "Pitchdeck 4.0 – MyFlove" },
      {
        name: "description",
        content: "MyFloves investerarpitchdeck 4.0 med produkt, founder, validering, affärsmodell och roadmap.",
      },
      { property: "og:title", content: "Pitchdeck 4.0 – MyFlove" },
      {
        property: "og:description",
        content: "MyFloves investerarpitchdeck 4.0 med produkt, founder, validering, affärsmodell och roadmap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

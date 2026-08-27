import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/insight";

export const Route = createFileRoute("/_app/insight")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search["demo"] === "1" ? ("1" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "MyFlove Insight – behov till strategier | MyFlove" },
      {
        name: "description",
        content:
          "Insight omvandlar information om behov och styrkor till konkreta vardagsstrategier som kopplas till MyFlow. Demo med fiktiva testprofiler.",
      },
      { property: "og:title", content: "MyFlove Insight – förstå behov, hitta strategier" },
      {
        property: "og:description",
        content: "Från behovsområden till konkreta strategier och påminnelser i vardagen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

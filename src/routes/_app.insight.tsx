import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/insight";

export const Route = createFileRoute("/_app/insight")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search["demo"] === "1" ? ("1" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Insikter · Paceable" },
      {
        name: "description",
        content:
           "Insikter i Paceable hjälper dig förstå behov, upptäcka egna mönster och hitta konkreta strategier i vardagen.",
      },
      { property: "og:title", content: "Insikter · Paceable" },
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

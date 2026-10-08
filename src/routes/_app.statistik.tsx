import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/stats";

export const Route = createFileRoute("/_app/statistik")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Statistik – MyFlove" },
      { property: "og:description", content: "Se dina mönster i uppgifter, humör och energi över tid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Statistik – MyFlove" },
      { name: "description", content: "Se dina mönster i uppgifter, humör och energi över tid." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/stats";

export const Route = createFileRoute("/_app/statistik")({
  head: () => ({
    meta: [
      { title: "Statistik – MyFlove" },
      { name: "description", content: "Se dina mönster i uppgifter, humör och energi över tid." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

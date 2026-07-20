import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/wellness";

export const Route = createFileRoute("/_app/ma-bra")({
  head: () => ({
    meta: [
      { title: "Må bra – MyFlove" },
      { name: "description", content: "Logga humör och energi på ett ställe och se dina mönster över tid." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

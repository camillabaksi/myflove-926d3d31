import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home-customize";

export const Route = createFileRoute("/_app/anpassa-hem")({
  head: () => ({
    meta: [
      { title: "Anpassa hemskärmen – MyFlove" },
      {
        name: "description",
        content:
          "Välj vilka block som syns på din hemskärm i MyFlove, i vilken ordning, och dina fyra egna genvägar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

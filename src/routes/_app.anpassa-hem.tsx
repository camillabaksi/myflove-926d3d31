import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home-customize";

export const Route = createFileRoute("/_app/anpassa-hem")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Anpassa hemskärmen – Paceable" },
      { property: "og:description", content: "Välj vilka block som syns på din hemskärm i Paceable, i vilken ordning, och dina fyra egna genvägar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Anpassa hemskärmen – Paceable" },
      {
        name: "description",
        content:
          "Välj vilka block som syns på din hemskärm i Paceable, i vilken ordning, och dina fyra egna genvägar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

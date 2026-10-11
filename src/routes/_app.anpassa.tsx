import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/npf";

export const Route = createFileRoute("/_app/anpassa")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Anpassa appen – Paceable" },
      { property: "og:description", content: "Ställ in lugnare färger, färre saker på skärmen, enkla ord och större text i Paceable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Anpassa appen – Paceable" },
      {
        name: "description",
        content:
          "Ställ in lugnare färger, färre saker på skärmen, enkla ord och större text i Paceable.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

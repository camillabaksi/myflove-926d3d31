import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/npf";

export const Route = createFileRoute("/_app/anpassa")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Anpassa appen – MyFlove" },
      { property: "og:description", content: "Ställ in lugnare färger, färre saker på skärmen, enkla ord och större text i MyFlove." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Anpassa appen – MyFlove" },
      {
        name: "description",
        content:
          "Ställ in lugnare färger, färre saker på skärmen, enkla ord och större text i MyFlove.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

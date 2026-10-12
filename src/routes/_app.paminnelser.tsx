import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reminders";

export const Route = createFileRoute("/_app/paminnelser")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Påminnelser – Paceable" },
      {
        property: "og:description",
        content:
          "Aktiva påminnelser och historik med tydlig status. Lägg till, ändra, planera igen eller avboka.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Påminnelser – Paceable" },
      {
        name: "description",
        content:
          "Aktiva påminnelser och historik med tydlig status. Lägg till, ändra, planera igen eller avboka.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

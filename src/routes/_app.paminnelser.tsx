import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reminders";

export const Route = createFileRoute("/_app/paminnelser")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Påminnelser – Paceable" },
      { property: "og:description", content: "Lägg till, ändra och avboka påminnelser med datum, tid och tydlig status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Påminnelser – Paceable" },
      {
        name: "description",
        content: "Lägg till, ändra och avboka påminnelser med datum, tid och tydlig status.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/relations";

export const Route = createFileRoute("/_app/relationer")({
  head: () => ({
    meta: [
      { title: "Relationer – Paceable" },
      {
        name: "description",
        content:
          "Samla partner, barn, familj, vänner, anhöriga och husdjur på ett ställe – som kontext i Fånga, kalender och påminnelser.",
      },
      { property: "og:title", content: "Relationer – Paceable" },
      {
        property: "og:description",
        content:
          "Ditt eget relationssystem: du väljer vilka relationstyper och personer som finns med.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

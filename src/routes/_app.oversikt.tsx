import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/overview";

export const Route = createFileRoute("/_app/oversikt")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Så funkar Paceable – översikt" },
      { property: "og:description", content: "En enkel sammanfattning av allt som finns i Paceable: dagen, planering, mående, hemma, studier, jobb och anpassning – och vart du går för varje sak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Så funkar Paceable – översikt" },
      {
        name: "description",
        content:
          "En enkel sammanfattning av allt som finns i Paceable: dagen, planering, mående, hemma, studier, jobb och anpassning – och vart du går för varje sak.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

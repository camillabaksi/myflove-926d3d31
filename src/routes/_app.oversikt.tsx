import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/overview";

export const Route = createFileRoute("/_app/oversikt")({
  head: () => ({
    meta: [
      { title: "Så funkar MyFlove – översikt" },
      {
        name: "description",
        content:
          "En enkel sammanfattning av allt som finns i MyFlove: dagen, planering, mående, hemma, studier, jobb och anpassning – och vart du går för varje sak.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

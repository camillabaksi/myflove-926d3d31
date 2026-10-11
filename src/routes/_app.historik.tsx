import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/history";

export const Route = createFileRoute("/_app/historik")({
  head: () => ({
    meta: [
      { title: "Historik – Paceable" },
      {
        name: "description",
        content: "Se vad som faktiskt hände dina dagar och hur aktiviteterna påverkade din ork.",
      },
      { property: "og:title", content: "Historik – Paceable" },
      {
        property: "og:description",
        content: "Dag för dag: vad hände, och vad gav eller tog energi?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

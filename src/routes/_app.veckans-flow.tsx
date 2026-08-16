import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/week-flow";

export const Route = createFileRoute("/_app/veckans-flow")({
  head: () => ({
    meta: [
      { title: "Veckans Flow – MyFlove" },
      {
        name: "description",
        content: "En lugn tillbakablick på veckan – vad du hann med och vad som hjälpte dig mest.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

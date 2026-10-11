import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/meal-planner";

export const Route = createFileRoute("/_app/matlista")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Matlista – Paceable" },
      { property: "og:description", content: "Veckans matplanering och inköpslista – enkelt och lokalt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Matlista – Paceable" },
      { name: "description", content: "Veckans matplanering och inköpslista – enkelt och lokalt." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

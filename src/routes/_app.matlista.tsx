import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/meal-planner";

export const Route = createFileRoute("/_app/matlista")({
  head: () => ({
    meta: [
      { title: "Matlista – MyFlove" },
      { name: "description", content: "Veckans matplanering och inköpslista – enkelt och lokalt." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

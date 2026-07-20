import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { title: "Flow-assistent – MyFlove" },
      { name: "description", content: "Prata med Flow, din lugna AI-följeslagare som hjälper dig genom vardagen." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

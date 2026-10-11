import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/achievements";

export const Route = createFileRoute("/_app/beloningar")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Belöningar – Paceable" },
      { property: "og:description", content: "Se dina belöningar och små segrar i Paceable – varje avklarad sak räknas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Belöningar – Paceable" },
      {
        name: "description",
        content: "Se dina belöningar och små segrar i Paceable – varje avklarad sak räknas.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

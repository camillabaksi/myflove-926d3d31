import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/achievements";

export const Route = createFileRoute("/_app/beloningar")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Belöningar – MyFlove" },
      { property: "og:description", content: "Se dina belöningar och små segrar i MyFlove – varje avklarad sak räknas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Belöningar – MyFlove" },
      {
        name: "description",
        content: "Se dina belöningar och små segrar i MyFlove – varje avklarad sak räknas.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

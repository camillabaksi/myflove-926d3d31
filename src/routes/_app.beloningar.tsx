import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/achievements";

export const Route = createFileRoute("/_app/beloningar")({
  head: () => ({
    meta: [
      { title: "Belöningar – MyFlove" },
      { name: "description", content: "Se dina belöningar och små segrar i MyFlove – varje avklarad sak räknas." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

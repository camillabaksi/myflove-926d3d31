import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow";

export const Route = createFileRoute("/_app/flow")({
  head: () => ({
    meta: [
      { title: "Pace – Paceable" },
      {
        name: "description",
        content: "Prata med Pace – lugnt, empatiskt stöd i vardagen.",
      },
      { property: "og:title", content: "Pace – Paceable" },
      {
        property: "og:description",
        content: "Prata med Pace – lugnt, empatiskt stöd i vardagen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

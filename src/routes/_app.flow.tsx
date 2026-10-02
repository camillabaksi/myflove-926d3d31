import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow";

export const Route = createFileRoute("/_app/flow")({
  head: () => ({
    meta: [
      { title: "Flow – MyFlove" },
      {
        name: "description",
        content: "Prata med Flow – lugnt, empatiskt stöd i vardagen.",
      },
      { property: "og:title", content: "Flow – MyFlove" },
      {
        property: "og:description",
        content: "Prata med Flow – lugnt, empatiskt stöd i vardagen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

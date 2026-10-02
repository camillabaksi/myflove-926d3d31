import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow";

export const Route = createFileRoute("/_app/flow")({
  head: () => ({
    meta: [
      { title: "Min Flow – MyFlove" },
      {
        name: "description",
        content:
          "Min Flow är din plats för samtal, personliga val och lugnt stöd.",
      },
      { property: "og:title", content: "Min Flow – MyFlove" },
      {
        property: "og:description",
        content: "En plats för dig, med dig.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

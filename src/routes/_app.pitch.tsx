import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pitch";

export const Route = createFileRoute("/_app/pitch")({
  head: () => ({
    meta: [
      { title: "Investerare – MyFlove version 5.0" },
      {
        name: "description",
        content:
          "MyFloves investerarmaterial version 5.0: visuell investerarpitch, produktdemo, pitchdeck och Living Blueprint.",
      },
      { property: "og:title", content: "Investerare – MyFlove version 5.0" },
      {
        property: "og:description",
        content:
          "MyFloves investerarmaterial version 5.0: visuell investerarpitch, produktdemo, pitchdeck och Living Blueprint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

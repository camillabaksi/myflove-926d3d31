import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pitch";

export const Route = createFileRoute("/_app/pitch")({
  head: () => ({
    meta: [
      { title: "Investerare – MyFlove version 4.1" },
      {
        name: "description",
        content:
          "MyFloves investerarmaterial version 4.1: pitchvideo, pitchdeck och Living Blueprint – enkel start, adaptiv personalisering och energihistorik.",
      },
      { property: "og:title", content: "Investerare – MyFlove version 4.1" },
      {
        property: "og:description",
        content:
          "MyFloves investerarmaterial version 4.1: pitchvideo, pitchdeck och Living Blueprint – enkel start, adaptiv personalisering och energihistorik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

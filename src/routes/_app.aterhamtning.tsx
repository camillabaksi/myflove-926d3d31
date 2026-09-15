import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pause";

export const Route = createFileRoute("/_app/aterhamtning")({
  head: () => ({
    meta: [
      { title: "Återhämtning – lugn och paus i MyFlove" },
      {
        name: "description",
        content:
          "Samlad återhämtning i MyFlove: mikropaus, akut lugn, ljusboost och stopp-knappen när du behöver landa.",
      },
      { property: "og:title", content: "Återhämtning – lugn och paus i MyFlove" },
      {
        property: "og:description",
        content: "Mikropaus, akut lugn, ljusboost och stopp-knappen samlat på ett lugnt ställe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

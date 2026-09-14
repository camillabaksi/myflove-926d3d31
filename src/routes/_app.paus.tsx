import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pause";

export const Route = createFileRoute("/_app/paus")({
  head: () => ({
    meta: [
      { title: "Paus – lugn och återhämtning i MyFlove" },
      {
        name: "description",
        content:
          "Samlad paus i MyFlove: mikropaus, akut lugn och stopp-knappen när du behöver landa.",
      },
      { property: "og:title", content: "Paus – lugn och återhämtning i MyFlove" },
      {
        property: "og:description",
        content: "Mikropaus, akut lugn och stopp-knappen samlat på ett lugnt ställe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

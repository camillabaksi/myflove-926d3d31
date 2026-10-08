import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow-settings";

export const Route = createFileRoute("/_app/flow-installningar")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Flow-inställningar – MyFlove" },
      { property: "og:description", content: "Styr Flows hjälpnivå, när proaktiva meddelanden får komma och vilka tider Flow prioriterar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Flow-inställningar – MyFlove" },
      {
        name: "description",
        content:
          "Styr Flows hjälpnivå, när proaktiva meddelanden får komma och vilka tider Flow prioriterar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

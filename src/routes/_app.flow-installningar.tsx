import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow-settings";

export const Route = createFileRoute("/_app/flow-installningar")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Pace-inställningar – Paceable" },
      { property: "og:description", content: "Styr Paces hjälpnivå, när proaktiva meddelanden får komma och vilka tider Pace prioriterar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Pace-inställningar – Paceable" },
      {
        name: "description",
        content:
          "Styr Paces hjälpnivå, när proaktiva meddelanden får komma och vilka tider Pace prioriterar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

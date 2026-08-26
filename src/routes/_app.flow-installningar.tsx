import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow-settings";

export const Route = createFileRoute("/_app/flow-installningar")({
  head: () => ({
    meta: [
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

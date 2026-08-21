import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/today";

export const Route = createFileRoute("/_app/idag")({
  head: () => ({
    meta: [
      { title: "Idag – MyFlove" },
      {
        name: "description",
        content:
          "Dagens allt på ett ställe: batteri, tidslinje, energiflöde och dagens lista – i Flow-läge eller List-läge.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

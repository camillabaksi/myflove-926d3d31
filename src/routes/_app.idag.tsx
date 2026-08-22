import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/today";

export const Route = createFileRoute("/_app/idag")({
  head: () => ({
    meta: [
      { title: "Min dag – MyFlove" },
      {
        name: "description",
        content:
          "Dagens allt på ett ställe: energibatteri, tidslinje, energi och dagens lista – som flöde eller lista.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

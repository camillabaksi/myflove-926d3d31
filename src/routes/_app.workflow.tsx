import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/workflow";

export const Route = createFileRoute("/_app/workflow")({
  head: () => ({
    meta: [
      { title: "WorkFlow – vad ska jag göra nu? | MyFlove" },
      {
        name: "description",
        content:
          "WorkFlow visar vad du ska göra just nu utifrån deadline, tid, friktion och energi – och bygger om dagen när allt spårar ur.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

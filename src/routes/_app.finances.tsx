import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/finances";

export const Route = createFileRoute("/_app/finances")({
  head: () => ({
    meta: [
      { title: "Ekonomi – MyFlove" },
      {
        name: "description",
        content: "Håll koll på räkningar, autogiro och hushållsekonomin med lugn.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

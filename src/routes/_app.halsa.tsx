import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/health";

export const Route = createFileRoute("/_app/halsa")({
  head: () => ({
    meta: [
      { title: "Hälsa – energi, träning och medicin | MyFlove" },
      {
        name: "description",
        content:
          "Hälsa samlar energi och mående, träning, promenader, mediciner och vila på ett lugnt ställe i MyFlove.",
      },
      { property: "og:title", content: "Hälsa – energi, träning och medicin | MyFlove" },
      {
        property: "og:description",
        content: "Allt som handlar om hur du mår, samlat på ett ställe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

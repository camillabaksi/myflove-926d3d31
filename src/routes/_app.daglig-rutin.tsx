import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/daily-flow";

export const Route = createFileRoute("/_app/daglig-rutin")({
  head: () => ({
    meta: [
      { title: "Daglig rutin – MyFlove" },
      { name: "description", content: "Dina rutiner och mediciner samlade på ett lugnt ställe." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/wake-up";

export const Route = createFileRoute("/_app/morgonstart")({
  head: () => ({
    meta: [
      { title: "Morgonstart – MyFlove" },
      {
        name: "description",
        content: "Mjuk uppföljning på morgonen för dig som snoozar bort alarmet.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

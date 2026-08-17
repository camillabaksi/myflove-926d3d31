import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/my-day";

export const Route = createFileRoute("/_app/min-dag")({
  head: () => ({
    meta: [
      { title: "Min dag – MyFlove" },
      {
        name: "description",
        content: "Dagens plan i lugn ordning: hållpunkter, dagens viktigaste sak och det du orkar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

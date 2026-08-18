import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/calendar";

export const Route = createFileRoute("/_app/kalender")({
  head: () => ({
    meta: [
      { title: "Kalender – MyFlove" },
      {
        name: "description",
        content: "Din kalender med uppgifter, påminnelser och import/export till mobilen.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

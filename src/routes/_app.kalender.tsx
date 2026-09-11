import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";

export const Route = createFileRoute("/_app/kalender")({
  head: () => ({
    meta: [
      { title: "Kalender – MyFlove" },
      {
        name: "description",
        content: "Din kalender med uppgifter, påminnelser och synk mot Google Kalender/Outlook.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DayHub tab="kalender" />,
});

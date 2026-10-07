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
      { property: "og:title", content: "Visuell kalender – MyFlove" },
      { property: "og:description", content: "Månad, vecka och dag med visuell planering, kapacitet och plats för återhämtning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <DayHub tab="kalender" />,
});

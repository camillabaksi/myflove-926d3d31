import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";

export const Route = createFileRoute("/_app/lagg-till")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Lägg till – MyFlove" },
      { property: "og:description", content: "Den gemensamma vägen in: skapa aktivitet, påminnelse, rutin eller medicin – eller registrera något du redan gjort." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Lägg till – MyFlove" },
      {
        name: "description",
        content:
          "Den gemensamma vägen in: skapa aktivitet, påminnelse, rutin eller medicin – eller registrera något du redan gjort.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DayHub tab="lagg-till" />,
});

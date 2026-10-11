import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";

export const Route = createFileRoute("/_app/idag")({
  head: () => ({
    meta: [
      { title: "Idag – dagens planering | Paceable" },
      {
        name: "description",
        content:
          "Dagens faktiska kapacitet, din egen plan och en varsam Pace-tolkning på ett ställe.",
      },
      { property: "og:title", content: "Idag – dagens planering | Paceable" },
      { property: "og:description", content: "Se vad du har att röra dig med, vad dagen bär och hur planen passar din kapacitet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DayHub tab="idag" />,
});

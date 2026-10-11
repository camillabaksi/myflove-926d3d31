import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";

export const Route = createFileRoute("/_app/kalender")({
  head: () => ({
    meta: [
      { title: "Kalender – Paceable" },
      {
        name: "description",
        content: "Din egen dag främst: visuell kalender, kapacitet och diskret familjelager med val av barn och Behöver mig.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Visuell kalender – Paceable" },
      { property: "og:description", content: "Månad, vecka och dag med kapacitet, egna aktiviteter och familjen som ett lugnt lager av sammanhang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <DayHub tab="kalender" />,
});

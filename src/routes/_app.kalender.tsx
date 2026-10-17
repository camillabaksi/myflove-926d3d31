import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";
import type { CalendarView } from "@/lib/visual-calendar";

export const Route = createFileRoute("/_app/kalender")({
  validateSearch: (search: Record<string, unknown>): { view?: CalendarView } => ({
    view: search.view === "manad" || search.view === "vecka" || search.view === "dag"
      ? search.view
      : undefined,
  }),
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

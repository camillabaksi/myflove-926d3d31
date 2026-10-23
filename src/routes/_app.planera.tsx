import { createFileRoute } from "@tanstack/react-router";
import PlanningPage from "@/pages/planning";
import { validPlanDate, type PlanningPeriod } from "@/lib/planning";
import type { CalendarView } from "@/lib/visual-calendar";

export const Route = createFileRoute("/_app/planera")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { audience: "me" | "children"; period: PlanningPeriod; date?: string; supports?: "1"; from?: "kalender"; view?: CalendarView } => ({
    audience: search.audience === "children" ? "children" : "me",
    period: search.period === "tomorrow" || search.period === "week" ? search.period : "today",
    date: typeof search.date === "string" && validPlanDate(search.date) ? search.date : undefined,
    // A navigation hint, not permission to add anything to the plan.
    supports: search.supports === "1" ? "1" : undefined,
    // Only a return hint: lets "Till kalendern" reopen the same calendar day.
    from: search.from === "kalender" ? "kalender" : undefined,
    view: search.from === "kalender" && (search.view === "dag" || search.view === "vecka" || search.view === "manad") ? search.view : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planera din dag och vecka – Paceable" },
      { name: "description", content: "Planera din egen dag eller barnens schema och granska aktiviteterna innan du sparar." },
      { property: "og:title", content: "Planera din dag och vecka – Paceable" },
      { property: "og:description", content: "Planera din egen dag eller barnens schema och granska aktiviteterna innan du sparar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlanningPage,
});

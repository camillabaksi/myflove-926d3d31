import { createFileRoute } from "@tanstack/react-router";
import PlanningPage from "@/pages/planning";
import type { PlanningPeriod } from "@/lib/planning";

export const Route = createFileRoute("/_app/planera")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { audience: "me" | "children"; period: PlanningPeriod } => ({
    audience: search.audience === "children" ? "children" : "me",
    period: search.period === "tomorrow" || search.period === "week" ? search.period : "today",
  }),
  head: () => ({
    meta: [
      { title: "Planera din dag och vecka – Paceable" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlanningPage,
});
